import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { scoreLead } from '@/lib/claude'
import { z } from 'zod'

const CreateLeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  source: z.enum(['whatsapp', 'meta_lead_ads', 'form', 'email', 'manual']),
  message: z.string().optional(),
})

// GET /api/leads — lijst van leads voor de huidige tenant
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  let tenantId: string
  try {
    const tenant = await requireTenant()
    tenantId = tenant.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const labelFilter = searchParams.get('label')
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  let query = supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }
  if (labelFilter) {
    query = query.eq('ai_label', labelFilter)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/leads — handmatig lead aanmaken
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  let tenantId: string
  try {
    const tenant = await requireTenant()
    tenantId = tenant.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CreateLeadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, phone, source, message } = parsed.data

  // Lead aanmaken
  const { data: lead, error: insertError } = await supabase
    .from('leads')
    .insert({ tenant_id: tenantId, name, email, phone, source })
    .select()
    .single()

  if (insertError || !lead) {
    return NextResponse.json({ error: insertError?.message }, { status: 500 })
  }

  // Eerste bericht opslaan als die er is
  if (message) {
    await supabase.from('lead_messages').insert({
      lead_id: lead.id,
      tenant_id: tenantId,
      direction: 'inbound',
      channel: source,
      content: message,
    })
  }

  // AI scoring asynchroon uitvoeren
  try {
    const score = await scoreLead({
      name,
      source,
      messages: message ? [message] : [],
      email,
      phone,
    })

    await supabase
      .from('leads')
      .update({
        ai_score: score.score,
        ai_label: score.label,
        ai_summary: score.summary,
        budget_estimate: score.budget_estimate,
        urgency: score.urgency,
        intent: score.intent,
        status: score.label, // status synchroon met AI label
      })
      .eq('id', lead.id)

    await supabase.from('lead_events').insert({
      lead_id: lead.id,
      tenant_id: tenantId,
      event_type: 'ai_scored',
      payload: { score: score.score, label: score.label },
    })
  } catch (err) {
    // Scoring mislukt → lead bestaat wel, scoring later opnieuw proberen
    console.error('AI scoring mislukt:', err)
  }

  const { data: updatedLead } = await supabase
    .from('leads')
    .select()
    .eq('id', lead.id)
    .single()

  return NextResponse.json(updatedLead, { status: 201 })
}

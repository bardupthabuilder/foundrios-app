import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { enforceLimit } from '@/lib/limits'
import { channelForSource } from '@/lib/lead-channel'
import { notifyNewLead } from '@/lib/notify'
import { scoreLead } from '@/lib/ai'
import { z } from 'zod'

export const LEAD_SOURCES = [
  'facebook_organic', 'instagram_organic', 'facebook_ads', 'instagram_ads',
  'google_organic', 'personal_brand',
  'referral', 'bestaande_klant', 'whatsapp', 'meta_lead_ads', 'form', 'email', 'manual', 'overig',
] as const

// Alleen relevant wanneer source een content-kanaal is (facebook_organic/instagram_organic) —
// koppelt de aanvraag aan het Content-scorecard (zie app/api/content/scorecard).
const CONTENT_SOURCES = ['facebook_organic', 'instagram_organic'] as const

const CreateLeadSchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    street: z.string().optional().nullable(),
    house_number: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    source: z.enum(LEAD_SOURCES),
    profile_type: z.enum(['zakelijk', 'persoonlijk']).optional().nullable(),
    service: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    message: z.string().optional(),
    budget_amount_cents: z.number().int().optional().nullable(),
    project_value_estimate: z.number().optional().nullable(),
    urgency: z.enum(['low', 'medium', 'high']).optional().nullable(),
    assigned_to: z.string().uuid().optional().nullable(),
    client_id: z.string().uuid().optional().nullable(),
    referral_client_id: z.string().uuid().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if ((CONTENT_SOURCES as readonly string[]).includes(data.source) && !data.profile_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['profile_type'],
        message: 'profile_type is verplicht bij Facebook/Instagram Content als bron',
      })
    }
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
  const stageFilter = searchParams.get('stage')
  const labelFilter = searchParams.get('label')
  const sourceFilter = searchParams.get('source')
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  let query = supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (stageFilter) {
    query = query.eq('stage', stageFilter as any)
  }
  if (labelFilter) {
    query = query.eq('ai_label', labelFilter as any)
  }
  if (sourceFilter) {
    query = query.eq('source', sourceFilter as any)
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

  const limitResponse = await enforceLimit(tenantId, 'leads')
  if (limitResponse) return limitResponse

  const {
    name, email, phone, source, profile_type, message, street, house_number, city,
    service, description, budget_amount_cents, project_value_estimate,
    urgency, assigned_to, client_id, referral_client_id,
  } = parsed.data

  // Elke aanvraag krijgt meteen een volgende actie. Een open aanvraag zonder
  // volgende actie is precies het lek dat FoundriOS hoort te dichten.
  const { data: lead, error: insertError } = await supabase
    .from('leads')
    .insert({
      tenant_id: tenantId, name, email, phone, source, profile_type,
      street, house_number, city, service, description,
      budget_amount_cents, project_value_estimate, urgency,
      assigned_to, client_id, referral_client_id,
      stage: client_id ? 'gekwalificeerd' : 'nieuw',
      next_action: 'Eerste contact opnemen',
      next_action_at: new Date().toISOString(),
    } as any)
    .select()
    .single()

  if (insertError || !lead) {
    return NextResponse.json({ error: insertError?.message }, { status: 500 })
  }

  // Eerste bericht opslaan als die er is
  if (message) {
    const { error: messageError } = await supabase.from('lead_messages').insert({
      lead_id: lead.id,
      tenant_id: tenantId,
      direction: 'inbound',
      channel: channelForSource(source),
      content: message,
    })
    // De lead staat er al; een mislukt eerste bericht mag de aanvraag niet weggooien,
    // maar moet wel zichtbaar zijn in de logs in plaats van stil te verdwijnen.
    if (messageError) console.error('lead_messages insert mislukt:', messageError.message)
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
        urgency: urgency ?? score.urgency,
        intent: score.intent,
        // `stage` (niet `status`) stuurt de workflow — AI-label is alleen een signaal.
      } as any)
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

  // Direct melden, niet wachten op de nachtelijke cron. De reactietijd telt vanaf nu.
  await notifyNewLead(supabase, {
    tenantId,
    leadId: lead.id,
    name,
    source,
    aiLabel: (updatedLead as { ai_label?: string | null } | null)?.ai_label ?? null,
  })

  return NextResponse.json(updatedLead, { status: 201 })
}

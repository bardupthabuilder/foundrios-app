import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const MessageSchema = z.object({
  content: z.string().min(1, 'Bericht mag niet leeg zijn'),
  channel: z.enum(['manual', 'whatsapp', 'email']).default('manual'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { tenantId } = await requireTenant()
  const { id: leadId } = await params

  const body = await request.json()
  const parsed = MessageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createClient()

  // Verify lead belongs to tenant
  const { data: lead } = await supabase
    .from('leads')
    .select('id')
    .eq('id', leadId)
    .eq('tenant_id', tenantId)
    .single()

  if (!lead) {
    return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 })
  }

  const { data: message, error } = await supabase
    .from('lead_messages')
    .insert({
      lead_id: leadId,
      tenant_id: tenantId,
      direction: 'outbound',
      channel: parsed.data.channel,
      content: parsed.data.content,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(message, { status: 201 })
}

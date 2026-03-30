import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { scoreLead } from '@/lib/claude'

// WhatsApp Cloud API webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// WhatsApp Cloud API inkomende berichten
export async function POST(request: NextRequest) {
  const supabase = createServiceClient()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // WhatsApp stuurt berichten via entry[].changes[].value
  const entries = (body.entry as Array<Record<string, unknown>>) ?? []

  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) ?? []

    for (const change of changes) {
      if (change.field !== 'messages') continue

      const value = change.value as Record<string, unknown>
      const messages = (value.messages as Array<Record<string, unknown>>) ?? []
      const contacts = (value.contacts as Array<Record<string, unknown>>) ?? []
      const metadata = value.metadata as Record<string, unknown>

      // phone_number_id is de identifier waarmee we de tenant vinden
      const phoneNumberId = metadata?.phone_number_id as string

      if (!phoneNumberId) continue

      // Zoek tenant via integratie-config
      const { data: integration } = await supabase
        .from('integrations')
        .select('tenant_id')
        .eq('type', 'whatsapp')
        .eq('is_active', true)
        .contains('config', { phone_number_id: phoneNumberId })
        .single()

      if (!integration) continue

      const tenantId = integration.tenant_id

      for (const message of messages) {
        if (message.type !== 'text') continue

        const waId = message.from as string
        const text = (message.text as Record<string, string>)?.body ?? ''
        const contact = contacts.find((c) => c.wa_id === waId)
        const name = (contact?.profile as Record<string, string>)?.name ?? waId

        // Zoek of er al een lead bestaat voor dit WhatsApp-nummer
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('source', 'whatsapp')
          .eq('phone', waId)
          .single()

        if (existingLead) {
          // Voeg bericht toe aan bestaande lead
          await supabase.from('lead_messages').insert({
            lead_id: existingLead.id,
            tenant_id: tenantId,
            direction: 'inbound',
            channel: 'whatsapp',
            content: text,
            metadata: { wa_id: waId, message_id: String(message.id ?? '') },
          })
        } else {
          // Nieuwe lead aanmaken
          const { data: newLead } = await supabase
            .from('leads')
            .insert({
              tenant_id: tenantId,
              name,
              phone: waId,
              source: 'whatsapp',
            })
            .select()
            .single()

          if (!newLead) continue

          await supabase.from('lead_messages').insert({
            lead_id: newLead.id,
            tenant_id: tenantId,
            direction: 'inbound',
            channel: 'whatsapp',
            content: text,
            metadata: { wa_id: waId, message_id: String(message.id ?? '') },
          })

          // AI scoring
          try {
            const score = await scoreLead({
              name,
              source: 'whatsapp',
              messages: [text],
              phone: waId,
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
                status: score.label,
              } as any)
              .eq('id', newLead.id)
          } catch (err) {
            console.error('WhatsApp lead scoring mislukt:', err)
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}

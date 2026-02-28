import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { scoreLead } from '@/lib/claude'

// Meta webhook verificatie
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// Meta Lead Ads inkomende leads
export async function POST(request: NextRequest) {
  const supabase = createServiceClient()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return new NextResponse('Bad Request', { status: 400 })
  }

  const entries = (body.entry as Array<Record<string, unknown>>) ?? []

  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) ?? []

    for (const change of changes) {
      if (change.field !== 'leadgen') continue

      const value = change.value as Record<string, unknown>
      const formId = value.form_id as string
      const leadgenId = value.leadgen_id as string

      if (!formId || !leadgenId) continue

      // Zoek tenant via integratie-config (formId koppelt aan tenant)
      const { data: integration } = await supabase
        .from('integrations')
        .select('tenant_id, config')
        .eq('type', 'meta_lead_ads')
        .eq('is_active', true)
        .contains('config', { form_id: formId })
        .single()

      if (!integration) continue

      const tenantId = integration.tenant_id

      // Meta stuurt leadgen_id — normaal zou je hier de Graph API aanroepen
      // om de volledige lead data op te halen. Voor MVP slaan we de essentiële
      // velden op die in de webhook aanwezig zijn.
      const fieldData = (value.field_data as Array<Record<string, string>>) ?? []

      const getField = (name: string) =>
        fieldData.find((f) => f.name === name)?.values?.[0] ?? null

      const name =
        [getField('full_name'), getField('first_name'), getField('last_name')]
          .filter(Boolean)
          .join(' ')
          .trim() || `Meta Lead ${leadgenId.slice(-6)}`

      const email = getField('email')
      const phone = getField('phone_number')

      const { data: newLead } = await supabase
        .from('leads')
        .insert({
          tenant_id: tenantId,
          name,
          email,
          phone,
          source: 'meta_lead_ads',
        })
        .select()
        .single()

      if (!newLead) continue

      // Sla een systeem-notitie op met de raw field data
      await supabase.from('lead_messages').insert({
        lead_id: newLead.id,
        tenant_id: tenantId,
        direction: 'inbound',
        channel: 'system',
        content: `Lead binnengehaald via Meta Lead Ads (formulier ${formId})`,
        metadata: { field_data: fieldData, leadgen_id: leadgenId },
      })

      // AI scoring op basis van de beschikbare velden
      try {
        const notes = fieldData
          .filter((f) => !['email', 'phone_number', 'full_name', 'first_name', 'last_name'].includes(f.name))
          .map((f) => `${f.name}: ${f.values?.[0]}`)
          .join('\n')

        const score = await scoreLead({
          name,
          source: 'meta_lead_ads',
          messages: notes ? [notes] : [],
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
            status: score.label,
          })
          .eq('id', newLead.id)
      } catch (err) {
        console.error('Meta lead scoring mislukt:', err)
      }
    }
  }

  return NextResponse.json({ received: true })
}

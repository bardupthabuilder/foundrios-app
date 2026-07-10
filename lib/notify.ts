/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Directe meldingen.
 *
 * De heilige regel is "reageer binnen 5 minuten". Die haal je nooit met een cron
 * die één keer per dag draait — tegen de tijd dat hij vuurt, is de aanvraag al
 * uren oud. Een nieuwe aanvraag moet daarom melden op het moment dat hij
 * binnenkomt, niet achteraf.
 *
 * De cron blijft verantwoordelijk voor alles wat pas na verloop van tijd
 * interessant wordt: offertes die blijven liggen, facturen die te laat zijn.
 */

type NewLeadNotification = {
  tenantId: string
  leadId: string
  name: string
  source: string
  aiLabel?: string | null
}

const SOURCE_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  meta_lead_ads: 'Meta Ads',
  form: 'Website',
  email: 'E-mail',
  manual: 'Handmatig',
}

/**
 * Meldt een binnengekomen aanvraag. Mag nooit de aanmaak van de lead laten
 * mislukken: een lead zonder melding is vervelend, een verloren lead is erger.
 */
export async function notifyNewLead(supabase: any, lead: NewLeadNotification): Promise<void> {
  const bron = SOURCE_LABEL[lead.source] ?? lead.source
  const isHot = lead.aiLabel === 'hot'

  const { error } = await supabase.from('notifications').insert({
    tenant_id: lead.tenantId,
    title: isHot ? `Hete aanvraag: ${lead.name}` : `Nieuwe aanvraag: ${lead.name}`,
    message: isHot
      ? `Via ${bron}. Bel binnen 5 minuten.`
      : `Via ${bron}. Neem contact op.`,
    type: isHot ? 'urgent' : 'info',
    link: `/dashboard/leads/${lead.leadId}`,
  })

  if (error) console.error('notifyNewLead mislukt:', error.message)
}

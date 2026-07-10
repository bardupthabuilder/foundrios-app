/**
 * `leads.source` en `lead_messages.channel` zijn twee verschillende enums.
 *
 *   source  : whatsapp | meta_lead_ads | form | email | manual
 *   channel : whatsapp | email | manual | system
 *
 * De bron rechtstreeks als kanaal wegschrijven laat 'form' en 'meta_lead_ads'
 * tegen de CHECK-constraint aanlopen. Omdat die insert nergens op fouten werd
 * gecontroleerd, verdween het eerste bericht van een aanvraag stilletjes.
 */
export type LeadSource = 'whatsapp' | 'meta_lead_ads' | 'form' | 'email' | 'manual'
export type MessageChannel = 'whatsapp' | 'email' | 'manual' | 'system'

const SOURCE_TO_CHANNEL: Record<LeadSource, MessageChannel> = {
  whatsapp: 'whatsapp',
  email: 'email',
  manual: 'manual',
  // Binnenkomst via een formulier of advertentie heeft geen eigen kanaal;
  // het bericht is door het systeem vastgelegd.
  form: 'system',
  meta_lead_ads: 'system',
}

export function channelForSource(source: string): MessageChannel {
  return SOURCE_TO_CHANNEL[source as LeadSource] ?? 'manual'
}

import { Nango } from '@nangohq/node'

let _nango: Nango | null = null

export function getNango(): Nango | null {
  if (!_nango && process.env.NANGO_SECRET_KEY) {
    _nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY })
  }
  return _nango
}

// Supported integrations with their Nango provider config keys
export const INTEGRATIONS = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Afspraken synchroniseren met je Google agenda',
    icon: '📅',
    tier: 'pro' as const,
  },
  {
    id: 'google-mail',
    name: 'Gmail',
    description: 'E-mails versturen en ontvangen vanuit FoundriOS',
    icon: '✉️',
    tier: 'pro' as const,
  },
  {
    id: 'whatsapp-business',
    name: 'WhatsApp Business',
    description: 'WhatsApp berichten ontvangen en versturen',
    icon: '💬',
    tier: 'pro' as const,
  },
  {
    id: 'meta-marketing-api',
    name: 'Meta Lead Ads',
    description: 'Leads automatisch importeren vanuit Facebook/Instagram ads',
    icon: '📢',
    tier: 'free' as const,
  },
  {
    id: 'google-business-profile',
    name: 'Google Reviews',
    description: 'Reviews monitoren en reageren',
    icon: '⭐',
    tier: 'scale' as const,
  },
] as const

export type IntegrationId = typeof INTEGRATIONS[number]['id']

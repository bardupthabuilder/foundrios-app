import type { LeadSource } from '@/lib/types/lead'

const sourceConfig: Record<LeadSource, { icon: string; label: string }> = {
  whatsapp: { icon: '💬', label: 'WhatsApp' },
  meta_lead_ads: { icon: '📘', label: 'Meta Leads' },
  form: { icon: '📝', label: 'Formulier' },
  email: { icon: '✉️', label: 'E-mail' },
  manual: { icon: '✍️', label: 'Handmatig' },
}

interface LeadSourceIconProps {
  source: LeadSource
  showLabel?: boolean
}

export function LeadSourceIcon({ source, showLabel = false }: LeadSourceIconProps) {
  const config = sourceConfig[source]
  return (
    <span className="flex items-center gap-1 text-sm text-zinc-500">
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}

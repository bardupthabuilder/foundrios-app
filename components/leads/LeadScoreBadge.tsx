import { Badge } from '@/components/ui/badge'
import type { LeadLabel } from '@/lib/types/lead'

interface LeadScoreBadgeProps {
  label: LeadLabel | null
  score?: number | null
}

const labelConfig: Record<LeadLabel, { label: string; className: string }> = {
  hot: { label: 'Hot', className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100' },
  warm: { label: 'Warm', className: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100' },
  cold: { label: 'Cold', className: 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-100' },
}

export function LeadScoreBadge({ label, score }: LeadScoreBadgeProps) {
  if (!label) {
    return (
      <Badge variant="outline" className="text-zinc-400">
        Niet gescoord
      </Badge>
    )
  }

  const config = labelConfig[label]

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
      {score != null && <span className="ml-1 opacity-70">·{score}</span>}
    </Badge>
  )
}

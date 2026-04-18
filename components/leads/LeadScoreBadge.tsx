import { Badge } from '@/components/ui/badge'
import type { LeadLabel } from '@/lib/types/lead'

interface LeadScoreBadgeProps {
  label: LeadLabel | null
  score?: number | null
}

const labelConfig: Record<LeadLabel, { label: string; className: string }> = {
  hot: { label: 'Hot', className: 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/10' },
  warm: { label: 'Warm', className: 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/10' },
  cold: { label: 'Cold', className: 'bg-[#282A2E] text-zinc-300 border-white/10 hover:bg-white/10' },
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

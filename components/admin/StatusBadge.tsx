type Variant = 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'zinc' | 'yellow'

interface StatusBadgeProps {
  label: string
  variant?: Variant
  size?: 'sm' | 'md'
}

const VARIANT_STYLES: Record<Variant, string> = {
  green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  red: 'bg-red-500/15 text-red-300 border-red-500/20',
  blue: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  violet: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  yellow: 'bg-foundri-yellow/15 text-foundri-yellow border-foundri-yellow/20',
  zinc: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/20',
}

export function StatusBadge({ label, variant = 'zinc', size = 'sm' }: StatusBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
  return (
    <span className={`inline-flex items-center rounded font-medium border ${sizeClass} ${VARIANT_STYLES[variant]}`}>
      {label}
    </span>
  )
}

// Helper: subscription status → variant + label
export function subscriptionVariant(status: string): { variant: Variant; label: string } {
  switch (status) {
    case 'active': return { variant: 'green', label: 'Actief' }
    case 'trial': return { variant: 'yellow', label: 'Trial' }
    case 'past_due': return { variant: 'amber', label: 'Te laat' }
    case 'cancelled': return { variant: 'red', label: 'Opgezegd' }
    default: return { variant: 'zinc', label: status }
  }
}

// Helper: lead status → variant + label
export function leadStatusVariant(status: string): { variant: Variant; label: string } {
  switch (status) {
    case 'hot': return { variant: 'red', label: 'Hot' }
    case 'warm': return { variant: 'amber', label: 'Warm' }
    case 'cold': return { variant: 'blue', label: 'Cold' }
    case 'won': return { variant: 'green', label: 'Won' }
    case 'lost': return { variant: 'zinc', label: 'Lost' }
    case 'new': return { variant: 'violet', label: 'Nieuw' }
    default: return { variant: 'zinc', label: status }
  }
}

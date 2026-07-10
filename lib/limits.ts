import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Tier } from '@/lib/tier-client'

/**
 * Gebruikslimieten per abonnement.
 *
 * De gratis tier moet genoeg zijn om een klein vakbedrijf écht te draaien,
 * maar loopt vanzelf tegen een grens aan zodra het bedrijf groeit — dat is het
 * upgrade-moment. Pro en Scale zijn onbeperkt (null = geen limiet).
 *
 * Twee soorten limieten:
 *  - `total`      : telt alle rijen (bijv. klanten, actieve projecten)
 *  - `perMonth`   : telt rijen aangemaakt in de lopende kalendermaand
 */

export type LimitKey =
  | 'clients'
  | 'leads'
  | 'projects'
  | 'employees'
  | 'quotes'
  | 'invoices'
  | 'work_orders'

type LimitRule = {
  table: string
  /** Vergelijk binnen de lopende kalendermaand in plaats van over alles. */
  perMonth?: boolean
  /** Extra filter, bijv. alleen actieve projecten meetellen. */
  activeOnly?: { column: string; values: (string | boolean)[] }
  label: string
  /** Wat de gebruiker moet doen om weer ruimte te maken. */
  hint: string
}

const RULES: Record<LimitKey, LimitRule> = {
  clients: {
    table: 'clients',
    label: 'klanten',
    hint: 'Upgrade naar Pro voor onbeperkt klanten.',
  },
  leads: {
    table: 'leads',
    activeOnly: { column: 'status', values: ['new', 'hot', 'warm', 'cold'] },
    label: 'openstaande aanvragen',
    hint: 'Zet aanvragen op gewonnen of verloren, of upgrade naar Pro.',
  },
  projects: {
    table: 'projects',
    activeOnly: { column: 'status', values: ['gepland', 'actief', 'pauze'] },
    label: 'lopende klussen',
    hint: 'Rond klussen af, of upgrade naar Pro.',
  },
  employees: {
    table: 'employees',
    activeOnly: { column: 'is_active', values: [true] },
    label: 'medewerkers',
    hint: 'Upgrade naar Pro om je hele team toe te voegen.',
  },
  quotes: {
    table: 'quotes',
    perMonth: true,
    label: 'offertes deze maand',
    hint: 'Upgrade naar Pro voor onbeperkt offertes.',
  },
  invoices: {
    table: 'invoices',
    perMonth: true,
    label: 'facturen deze maand',
    hint: 'Upgrade naar Pro voor onbeperkt facturen.',
  },
  work_orders: {
    table: 'work_orders',
    perMonth: true,
    label: 'werkbonnen deze maand',
    hint: 'Upgrade naar Pro voor onbeperkt werkbonnen.',
  },
}

/** null = onbeperkt */
export const TIER_LIMITS: Record<Tier, Record<LimitKey, number | null>> = {
  free: {
    clients: 100,
    leads: 50,
    projects: 10,
    employees: 2, // eigenaar + 1 medewerker
    quotes: 10,
    invoices: 10,
    work_orders: 25,
  },
  pro: {
    clients: null, leads: null, projects: null, employees: null,
    quotes: null, invoices: null, work_orders: null,
  },
  scale: {
    clients: null, leads: null, projects: null, employees: null,
    quotes: null, invoices: null, work_orders: null,
  },
}

export type LimitResult = {
  allowed: boolean
  limit: number | null
  used: number
  label: string
  /** Kant-en-klare melding voor de UI. */
  message?: string
}

function startOfMonthISO(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

/**
 * Controleert of de tenant nog ruimte heeft voor één extra record van dit type.
 * Roep dit aan vóór een INSERT.
 */
export async function checkLimit(tenantId: string, key: LimitKey): Promise<LimitResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const rule = RULES[key]

  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', tenantId)
    .single()

  const tier = ((tenant?.plan as Tier) || 'free') satisfies Tier
  const limit = (TIER_LIMITS[tier] ?? TIER_LIMITS.free)[key]

  if (limit === null) {
    return { allowed: true, limit: null, used: 0, label: rule.label }
  }

  let query = supabase
    .from(rule.table)
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  if (rule.perMonth) query = query.gte('created_at', startOfMonthISO())
  if (rule.activeOnly) {
    const { column, values } = rule.activeOnly
    query = values.length === 1 ? query.eq(column, values[0]) : query.in(column, values)
  }

  const { count } = await query
  const used = count ?? 0

  if (used < limit) {
    return { allowed: true, limit, used, label: rule.label }
  }

  return {
    allowed: false,
    limit,
    used,
    label: rule.label,
    message: `Je gratis abonnement staat ${limit} ${rule.label} toe. ${rule.hint}`,
  }
}

/**
 * Gebruik dit in een POST-route vlak vóór de insert:
 *
 *   const limit = await enforceLimit(tenantId, 'quotes')
 *   if (limit) return limit
 *
 * Geeft `null` als er nog ruimte is, anders een 403 met een uitlegbare melding.
 */
export async function enforceLimit(tenantId: string, key: LimitKey): Promise<NextResponse | null> {
  const result = await checkLimit(tenantId, key)
  if (result.allowed) return null

  return NextResponse.json(
    {
      error: result.message,
      limit_reached: key,
      limit: result.limit,
      used: result.used,
      upgrade_url: '/dashboard/billing/upgrade',
    },
    { status: 403 }
  )
}

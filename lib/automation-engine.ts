/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Automation-engine.
 *
 * `automation_rules` bestond al met triggers, acties en een tier-kolom, maar
 * niets voerde de regels uit: de cron had één hardcoded check en `automation_log`
 * werd nergens geschreven. De regel-editor stuurde dus niets aan.
 *
 * Deze engine leest de regels, zoekt per trigger de doelen op, en voert de actie
 * uit. `automation_log` is tegelijk audit log én dedup-sleutel: een regel vuurt
 * hoogstens één keer per doel. Zonder dat kreeg je elke nacht opnieuw dezelfde
 * melding voor dezelfde lead.
 */

import { TIER_ORDER, type Tier } from '@/lib/tier-client'

export type TriggerType =
  | 'lead_new'
  | 'lead_stale'
  | 'quote_stale'
  | 'invoice_overdue'
  | 'project_delivered'
  | 'maintenance_due'

export type ActionType = 'notification' | 'email' | 'status_change' | 'task_create'

type Rule = {
  id: string
  tenant_id: string
  name: string
  trigger_type: TriggerType
  action_type: ActionType
  config: Record<string, unknown>
  delay_hours: number | null
  is_active: boolean
  tier: Tier
}

type Target = {
  id: string
  /** Wat de gebruiker in de melding leest. */
  label: string
  /** Waar de melding naartoe linkt. */
  link: string
  targetType: 'lead' | 'quote' | 'invoice' | 'project' | 'maintenance_contract'
}

export type AutomationRunResult = {
  rulesConsidered: number
  rulesRun: number
  actionsExecuted: number
  actionsSkipped: number
  errors: string[]
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

/** Zoekt de doelen die voldoen aan de trigger van deze regel. */
async function findTargets(svc: any, rule: Rule): Promise<Target[]> {
  const delay = rule.delay_hours ?? 0
  const cutoff = hoursAgo(delay)
  const today = new Date().toISOString().split('T')[0]

  switch (rule.trigger_type) {
    case 'lead_new': {
      const { data } = await svc
        .from('leads')
        .select('id, name')
        .eq('tenant_id', rule.tenant_id)
        .eq('status', 'new')
        .lte('created_at', cutoff)
      return (data ?? []).map((l: any) => ({
        id: l.id, label: l.name, link: `/dashboard/leads/${l.id}`, targetType: 'lead' as const,
      }))
    }

    case 'lead_stale': {
      // Open aanvraag die al langer dan de ingestelde tijd geen reactie kreeg.
      const { data } = await svc
        .from('leads')
        .select('id, name')
        .eq('tenant_id', rule.tenant_id)
        .in('status', ['new', 'hot', 'warm'])
        .is('followed_up_at', null)
        .lte('created_at', cutoff)
      return (data ?? []).map((l: any) => ({
        id: l.id, label: l.name, link: `/dashboard/leads/${l.id}`, targetType: 'lead' as const,
      }))
    }

    case 'quote_stale': {
      const { data } = await svc
        .from('quotes')
        .select('id, title, quote_number')
        .eq('tenant_id', rule.tenant_id)
        .eq('status', 'verstuurd')
        .not('sent_at', 'is', null)
        .lte('sent_at', cutoff)
      return (data ?? []).map((q: any) => ({
        id: q.id, label: q.quote_number ? `${q.quote_number} — ${q.title}` : q.title,
        link: `/dashboard/offertes/${q.id}`, targetType: 'quote' as const,
      }))
    }

    case 'invoice_overdue': {
      const { data } = await svc
        .from('invoices')
        .select('id, invoice_number, title, due_date')
        .eq('tenant_id', rule.tenant_id)
        .in('status', ['sent', 'overdue'])
        .not('due_date', 'is', null)
        .lt('due_date', today)
      return (data ?? []).map((i: any) => ({
        id: i.id, label: i.invoice_number ?? i.title ?? 'Factuur',
        link: `/dashboard/facturen/${i.id}`, targetType: 'invoice' as const,
      }))
    }

    case 'project_delivered': {
      const { data } = await svc
        .from('projects')
        .select('id, name')
        .eq('tenant_id', rule.tenant_id)
        .eq('status', 'opgeleverd')
        .is('review_requested_at', null)
      return (data ?? []).map((p: any) => ({
        id: p.id, label: p.name, link: `/dashboard/projecten/${p.id}`, targetType: 'project' as const,
      }))
    }

    case 'maintenance_due': {
      const { data } = await svc
        .from('maintenance_contracts')
        .select('id, title, next_visit')
        .eq('tenant_id', rule.tenant_id)
        .eq('status', 'active')
        .not('next_visit', 'is', null)
        .lte('next_visit', today)
      return (data ?? []).map((m: any) => ({
        id: m.id, label: m.title, link: `/dashboard/onderhoud`, targetType: 'maintenance_contract' as const,
      }))
    }
  }
}

/** Heeft deze regel al gevuurd voor dit doel? */
async function alreadyFired(svc: any, ruleId: string, targetId: string): Promise<boolean> {
  const { data } = await svc
    .from('automation_log')
    .select('id')
    .eq('rule_id', ruleId)
    .eq('target_id', targetId)
    .limit(1)
    .maybeSingle()
  return Boolean(data)
}

async function executeAction(svc: any, rule: Rule, target: Target): Promise<'success' | 'skipped'> {
  switch (rule.action_type) {
    case 'notification': {
      const title = (rule.config.title as string) || rule.name
      const message = (rule.config.message as string) || target.label
      await svc.from('notifications').insert({
        tenant_id: rule.tenant_id,
        title,
        message,
        type: (rule.config.type as string) || 'warning',
        link: target.link,
      })
      return 'success'
    }

    case 'status_change': {
      const table = {
        lead: 'leads', quote: 'quotes', invoice: 'invoices',
        project: 'projects', maintenance_contract: 'maintenance_contracts',
      }[target.targetType]
      const status = rule.config.status as string | undefined
      if (!table || !status) return 'skipped'
      await svc.from(table).update({ status }).eq('id', target.id).eq('tenant_id', rule.tenant_id)
      return 'success'
    }

    // E-mail versturen en taken aanmaken zitten nog niet in de engine. Ze worden
    // bewust als 'skipped' gelogd in plaats van stil overgeslagen, zodat de
    // gebruiker in het audit log ziet dat de regel niets deed.
    case 'email':
    case 'task_create':
      return 'skipped'
  }
}

/**
 * De drie regels die elk vakbedrijf gratis krijgt. Ze dekken de drie plekken waar
 * geld weglekt: een aanvraag die blijft liggen, een offerte die niemand nabelt,
 * en een factuur die niet betaald wordt.
 *
 * Migratie 038 zet ze klaar voor bestaande tenants; dit is het pad voor nieuwe.
 */
export const DEFAULT_FREE_RULES = [
  {
    name: 'Aanvraag blijft liggen',
    trigger_type: 'lead_stale' as const,
    action_type: 'notification' as const,
    delay_hours: 24,
    config: { title: 'Aanvraag wacht op reactie', message: 'Deze aanvraag ligt er al 24 uur. Bel of app de klant.', type: 'warning' },
  },
  {
    name: 'Offerte niet opgevolgd',
    trigger_type: 'quote_stale' as const,
    action_type: 'notification' as const,
    delay_hours: 48,
    config: { title: 'Offerte wacht op antwoord', message: 'Verstuurd, maar nog geen reactie. Bel de klant na.', type: 'warning' },
  },
  {
    name: 'Factuur te laat',
    trigger_type: 'invoice_overdue' as const,
    action_type: 'notification' as const,
    delay_hours: 0,
    config: { title: 'Factuur is vervallen', message: 'De vervaldatum is voorbij. Stuur een herinnering.', type: 'urgent' },
  },
]

/** Best effort: een nieuw account zonder regels is vervelend, geen blocker. */
export async function seedDefaultAutomations(svc: any, tenantId: string): Promise<void> {
  const rows = DEFAULT_FREE_RULES.map(r => ({ ...r, tenant_id: tenantId, is_active: true, tier: 'free' }))
  const { error } = await svc.from('automation_rules').insert(rows)
  if (error) console.error('seedDefaultAutomations mislukt:', error.message)
}

export async function runAutomations(svc: any): Promise<AutomationRunResult> {
  const result: AutomationRunResult = {
    rulesConsidered: 0, rulesRun: 0, actionsExecuted: 0, actionsSkipped: 0, errors: [],
  }

  const { data: rules } = await svc.from('automation_rules').select('*').eq('is_active', true)
  if (!rules?.length) return result

  // Een regel die boven het abonnement van de tenant ligt, mag niet draaien.
  const { data: tenants } = await svc.from('tenants').select('id, plan')
  const planByTenant = new Map<string, Tier>(
    (tenants ?? []).map((t: any) => [t.id, (t.plan || 'free') as Tier])
  )

  for (const rule of rules as Rule[]) {
    result.rulesConsidered++

    const plan = planByTenant.get(rule.tenant_id) ?? 'free'
    const required = (rule.tier || 'free') as Tier
    if ((TIER_ORDER[plan] ?? 0) < (TIER_ORDER[required] ?? 0)) continue

    result.rulesRun++

    try {
      const targets = await findTargets(svc, rule)

      for (const target of targets) {
        if (await alreadyFired(svc, rule.id, target.id)) continue

        const outcome = await executeAction(svc, rule, target)

        await svc.from('automation_log').insert({
          tenant_id: rule.tenant_id,
          rule_id: rule.id,
          trigger_type: rule.trigger_type,
          action_type: rule.action_type,
          target_type: target.targetType,
          target_id: target.id,
          result: outcome,
          details: { label: target.label },
        })

        if (outcome === 'success') result.actionsExecuted++
        else result.actionsSkipped++
      }
    } catch (err) {
      result.errors.push(`${rule.name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}

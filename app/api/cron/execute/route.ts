import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runAutomations } from '@/lib/automation-engine'

/**
 * GET /api/cron/execute — draait de automation-regels en schrijft de dagsnapshot.
 *
 * De oude versie had één hardcoded regel ("lead staat op new en is ouder dan 1 uur")
 * zonder dedup, waardoor dezelfde lead elke dag opnieuw dezelfde melding opleverde.
 * De regels uit `automation_rules` werden genegeerd en `automation_log` bleef leeg.
 * Beide zijn opgelost: de engine leest de regels, en het log voorkomt herhaling.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createServiceClient() as any
  const now = new Date()

  const { data: logEntry } = await service
    .from('cron_log')
    .insert({ job_name: 'daily_automations', status: 'running' })
    .select('id')
    .single()

  try {
    const automations = await runAutomations(service)
    const snapshotsCreated = await writeRevenueSnapshots(service, now)

    if (logEntry) {
      await service.from('cron_log').update({
        status: automations.errors.length > 0 ? 'failed' : 'success',
        finished_at: new Date().toISOString(),
        details: { ...automations, snapshotsCreated },
      }).eq('id', logEntry.id)
    }

    return NextResponse.json({ success: true, ...automations, snapshotsCreated })
  } catch (err) {
    if (logEntry) {
      await service.from('cron_log').update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        details: { error: String(err) },
      }).eq('id', logEntry.id)
    }
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** Dagelijkse momentopname per tenant. Basis voor trends en forecasting. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function writeRevenueSnapshots(service: any, now: Date): Promise<number> {
  const { data: tenants } = await service.from('tenants').select('id')
  const today = now.toISOString().split('T')[0]
  let snapshotsCreated = 0

  for (const tenant of (tenants ?? []) as { id: string }[]) {
    const [leadsR, hotR, wonR, invoicesR, quotesR] = await Promise.all([
      service.from('leads').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
      service.from('leads').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('ai_label', 'hot'),
      service.from('leads').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('status', 'won'),
      service.from('invoices').select('amount_excl_vat, status, due_date, paid_at').eq('tenant_id', tenant.id),
      service.from('quotes').select('amount_excl_vat, status').eq('tenant_id', tenant.id).in('status', ['concept', 'verstuurd']),
    ])

    const invoices = (invoicesR.data ?? []) as { amount_excl_vat: number | null; status: string; due_date: string | null }[]
    const revenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount_excl_vat || 0), 0)
    const outstanding = invoices.filter(i => i.status === 'sent').reduce((s, i) => s + (i.amount_excl_vat || 0), 0)
    const overdue = invoices
      .filter(i => (i.status === 'sent' || i.status === 'overdue') && i.due_date && new Date(i.due_date) < now)
      .reduce((s, i) => s + (i.amount_excl_vat || 0), 0)
    const pipeline = ((quotesR.data ?? []) as { amount_excl_vat: number | null }[])
      .reduce((s, q) => s + (q.amount_excl_vat || 0), 0)

    const leadCount = leadsR.count || 0
    const wonCount = wonR.count || 0
    const conversion = leadCount > 0 ? Math.round((wonCount / leadCount) * 100) : 0

    await service.from('revenue_snapshots').upsert({
      tenant_id: tenant.id,
      snapshot_date: today,
      revenue_cents: revenue,
      outstanding_cents: outstanding,
      overdue_cents: overdue,
      pipeline_cents: pipeline,
      lead_count: leadCount,
      hot_lead_count: hotR.count || 0,
      conversion_pct: conversion,
    }, { onConflict: 'tenant_id,snapshot_date' })

    snapshotsCreated++
  }

  return snapshotsCreated
}

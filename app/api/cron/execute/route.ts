import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Verify cron secret or admin auth
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createServiceClient() as any
  const now = new Date()

  // Log start
  const { data: logEntry } = await service
    .from('cron_log')
    .insert({ job_name: 'daily_automations', status: 'running' })
    .select('id')
    .single()

  try {
    // 1. Find stale leads (new, older than 1 hour) and create notifications
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const { data: staleLeads } = await service
      .from('leads')
      .select('id, name, tenant_id')
      .eq('status', 'new')
      .lt('created_at', oneHourAgo)

    let notificationsCreated = 0
    for (const lead of (staleLeads ?? []) as { id: string; name: string; tenant_id: string }[]) {
      await service.from('notifications').insert({
        tenant_id: lead.tenant_id,
        title: `Lead wacht: ${lead.name}`,
        message: 'Deze lead is nog niet beantwoord',
        type: 'warning',
        link: `/dashboard/leads/${lead.id}`,
      })
      notificationsCreated++
    }

    // 2. Create revenue snapshot for each tenant
    const { data: tenants } = await service.from('tenants').select('id')
    let snapshotsCreated = 0
    const today = now.toISOString().split('T')[0]

    for (const tenant of (tenants ?? []) as { id: string }[]) {
      const [leadsR, hotR, wonR, invoicesR, quotesR] = await Promise.all([
        service.from('leads').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        service.from('leads').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('ai_label', 'hot'),
        service.from('leads').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('status', 'won'),
        service.from('invoices').select('amount_excl_vat, status, due_date, paid_at').eq('tenant_id', tenant.id),
        service.from('quotes').select('amount_excl_vat, status').eq('tenant_id', tenant.id).in('status', ['concept', 'verstuurd']),
      ])

      const invoices = (invoicesR.data ?? []) as { amount_excl_vat: number | null; status: string; due_date: string | null; paid_at: string | null }[]
      const revenue = invoices.filter(i => i.status === 'paid').reduce((sum: number, i) => sum + (i.amount_excl_vat || 0), 0)
      const outstanding = invoices.filter(i => i.status === 'sent').reduce((sum: number, i) => sum + (i.amount_excl_vat || 0), 0)
      const overdue = invoices.filter(i => i.status === 'sent' && i.due_date && new Date(i.due_date) < now).reduce((sum: number, i) => sum + (i.amount_excl_vat || 0), 0)
      const pipeline = ((quotesR.data ?? []) as { amount_excl_vat: number | null }[]).reduce((sum: number, q) => sum + (q.amount_excl_vat || 0), 0)
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

    // Update log
    if (logEntry) {
      await service.from('cron_log').update({
        status: 'success',
        finished_at: new Date().toISOString(),
        details: { notificationsCreated, snapshotsCreated },
      }).eq('id', logEntry.id)
    }

    return NextResponse.json({ success: true, notificationsCreated, snapshotsCreated })
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

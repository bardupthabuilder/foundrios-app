import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { getPipelineStages, keysByKind } from '@/lib/pipeline-stages'

type Platform = 'facebook' | 'instagram'
type ProfileType = 'zakelijk' | 'persoonlijk'

const CHANNEL_LABELS: Record<string, string> = {
  'facebook:zakelijk': 'Facebook Zakelijk',
  'facebook:persoonlijk': 'Facebook Persoonlijk',
  'instagram:zakelijk': 'Instagram Zakelijk',
  'instagram:persoonlijk': 'Instagram Persoonlijk',
}

function isMonday(dateStr: string): boolean {
  const d = new Date(`${dateStr}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return false
  return d.getUTCDay() === 1
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

interface ChannelAgg {
  platform: Platform
  profile_type: ProfileType
  label: string
  posts_published: number
  reach: number
  interactions: number
  dms: number
  qualified_leads: number
  klanten: number
  omzet: number
}

async function loadWeek(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  weekStartDate: string,
  weekEndExclusive: string,
  enabledChannels: { platform: Platform; profile_type: ProfileType }[],
  qualifiedStageKeys: string[]
) {
  const channelKey = (platform: string, profile_type: string | null) => `${platform}:${profile_type ?? ''}`

  const metricsPromise = supabase
    .from('content_weekly_metrics')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('week_start_date', weekStartDate)

  const leadsPromise = supabase
    .from('leads')
    .select('id, source, profile_type, stage, client_id')
    .eq('tenant_id', tenantId)
    .in('source', ['facebook_organic', 'instagram_organic'])
    .not('profile_type', 'is', null)
    .gte('created_at', `${weekStartDate}T00:00:00.000Z`)
    .lt('created_at', `${weekEndExclusive}T00:00:00.000Z`)

  const [{ data: metricsRows }, { data: leadRows }] = await Promise.all([metricsPromise, leadsPromise])

  const byChannel = new Map<string, ChannelAgg>()
  for (const c of enabledChannels) {
    byChannel.set(channelKey(c.platform, c.profile_type), {
      platform: c.platform,
      profile_type: c.profile_type,
      label: CHANNEL_LABELS[channelKey(c.platform, c.profile_type)] ?? `${c.platform} ${c.profile_type}`,
      posts_published: 0,
      reach: 0,
      interactions: 0,
      dms: 0,
      qualified_leads: 0,
      klanten: 0,
      omzet: 0,
    })
  }

  for (const row of metricsRows ?? []) {
    const key = channelKey(row.platform, row.profile_type)
    const agg = byChannel.get(key)
    if (!agg) continue // kanaal staat uit, niet meetellen
    agg.posts_published += row.posts_published ?? 0
    agg.reach += row.reach ?? 0
    agg.interactions += row.interactions ?? 0
    agg.dms += row.dms ?? 0
  }

  const qualifiedLeadIdsByChannel = new Map<string, string[]>()
  for (const lead of leadRows ?? []) {
    const platform = lead.source === 'facebook_organic' ? 'facebook' : lead.source === 'instagram_organic' ? 'instagram' : null
    if (!platform || !lead.profile_type) continue
    const key = channelKey(platform, lead.profile_type)
    const agg = byChannel.get(key)
    if (!agg) continue // kanaal staat uit
    if (!qualifiedStageKeys.includes(lead.stage ?? '')) continue
    agg.qualified_leads += 1
    const list = qualifiedLeadIdsByChannel.get(key) ?? []
    if (lead.client_id) list.push(lead.client_id)
    qualifiedLeadIdsByChannel.set(key, list)
  }

  // Klanten + omzet per kanaal — cheap on-read join, geen nieuwe tabellen.
  const allClientIds = Array.from(new Set(Array.from(qualifiedLeadIdsByChannel.values()).flat()))
  let invoicesByClient = new Map<string, number>()
  if (allClientIds.length > 0) {
    const { data: invoiceRows } = await supabase
      .from('invoices')
      .select('client_id, amount_excl_vat')
      .eq('tenant_id', tenantId)
      .in('client_id', allClientIds)

    invoicesByClient = new Map()
    for (const inv of invoiceRows ?? []) {
      if (!inv.client_id) continue
      invoicesByClient.set(inv.client_id, (invoicesByClient.get(inv.client_id) ?? 0) + (inv.amount_excl_vat ?? 0))
    }
  }

  for (const [key, clientIds] of qualifiedLeadIdsByChannel.entries()) {
    const agg = byChannel.get(key)
    if (!agg) continue
    const uniqueClientIds = Array.from(new Set(clientIds))
    agg.klanten = uniqueClientIds.length
    agg.omzet = uniqueClientIds.reduce((sum, id) => sum + (invoicesByClient.get(id) ?? 0), 0)
  }

  return Array.from(byChannel.values()).sort((a, b) => a.platform.localeCompare(b.platform) || a.profile_type.localeCompare(b.profile_type))
}

function sumCurrent(channels: ChannelAgg[]) {
  return channels.reduce(
    (acc, c) => ({
      posts_published: acc.posts_published + c.posts_published,
      reach: acc.reach + c.reach,
      interactions: acc.interactions + c.interactions,
      dms: acc.dms + c.dms,
      qualified_leads: acc.qualified_leads + c.qualified_leads,
      klanten: acc.klanten + c.klanten,
      omzet: acc.omzet + c.omzet,
    }),
    { posts_published: 0, reach: 0, interactions: 0, dms: 0, qualified_leads: 0, klanten: 0, omzet: 0 }
  )
}

// GET /api/content/scorecard?week_start_date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const weekStartDate = searchParams.get('week_start_date')
  if (!weekStartDate || !isMonday(weekStartDate)) {
    return NextResponse.json({ error: 'week_start_date moet een maandag zijn (YYYY-MM-DD)' }, { status: 400 })
  }
  const previousWeekStartDate = addDays(weekStartDate, -7)
  const weekEndExclusive = addDays(weekStartDate, 7)
  const previousWeekEndExclusive = weekStartDate

  const { data: channelRows, error: channelsError } = await supabase
    .from('content_channels')
    .select('platform, profile_type')
    .eq('tenant_id', tenantId)
    .eq('enabled', true)

  if (channelsError) return NextResponse.json({ error: channelsError.message }, { status: 500 })

  const enabledChannels = (channelRows ?? []) as { platform: Platform; profile_type: ProfileType }[]

  const stages = await getPipelineStages(supabase, tenantId)
  const qualifiedStageKeys = keysByKind(stages, 'qualified')

  const [current, previous] = await Promise.all([
    loadWeek(supabase, tenantId, weekStartDate, weekEndExclusive, enabledChannels, qualifiedStageKeys),
    loadWeek(supabase, tenantId, previousWeekStartDate, previousWeekEndExclusive, enabledChannels, qualifiedStageKeys),
  ])

  const currentTotals = sumCurrent(current)
  const previousTotals = sumCurrent(previous)

  const deltas = {
    reach: currentTotals.reach - previousTotals.reach,
    interactions: currentTotals.interactions - previousTotals.interactions,
    dms: currentTotals.dms - previousTotals.dms,
    qualified_leads: currentTotals.qualified_leads - previousTotals.qualified_leads,
  }

  return NextResponse.json({
    week_start_date: weekStartDate,
    current: currentTotals,
    deltas,
    channels: current,
  })
}

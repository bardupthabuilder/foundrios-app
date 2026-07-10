import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { Activity } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { EmptyState } from '@/components/admin/EmptyState'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getActivity(filter?: string) {
  const sb = createServiceClient() as any

  let query = sb.from('telemetry_events')
    .select('id, event_name, tenant_id, user_id, created_at, properties')
    .order('created_at', { ascending: false })
    .limit(200)

  if (filter) query = query.eq('event_name', filter)
  const { data: events } = await query

  // Get tenant names
  const { data: tenants } = await sb.from('tenants').select('id, name')
  const tenantNameById = new Map((tenants ?? []).map((t: any) => [t.id, t.name]))

  return { events: events ?? [], tenantNameById }
}

async function getEventTypes() {
  const sb = createServiceClient() as any
  const { data } = await sb.rpc('admin_get_event_types').catch(() => ({ data: null }))
  if (!data) {
    // Fallback — just return common event types
    return ['signup_completed', 'lead_created', 'project_created', 'invoice_sent', 'feedback_submitted', 'login', 'onboarding_completed']
  }
  return data
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  try { await requireSuperadmin() } catch { redirect('/dashboard') }
  const params = await searchParams
  const { events, tenantNameById } = await getActivity(params.event)

  // Build unique event types from data
  const eventTypes = Array.from(new Set(events.map((e: any) => e.event_name as string))).sort() as string[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activiteit"
        description={`${events.length} events${params.event ? ` • type: ${params.event}` : ' (laatste 200)'}`}
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1">
        <FilterChip label="Alle" href="/admin/activity" active={!params.event} />
        {eventTypes.slice(0, 12).map(type => (
          <FilterChip
            key={type}
            label={type.replace(/_/g, ' ')}
            href={`/admin/activity?event=${type}`}
            active={params.event === type}
          />
        ))}
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Geen events"
          description="Geen events die aan dit filter voldoen."
        />
      ) : (
        <ActivityFeed
          items={events.map((e: any) => ({
            id: e.id,
            icon: Activity,
            title: e.event_name.replace(/_/g, ' '),
            subtitle: tenantNameById.get(e.tenant_id) ?? undefined,
            timestamp: e.created_at,
          }))}
        />
      )}
    </div>
  )
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <a
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active ? 'bg-white/10 text-white border border-white/20' : 'border border-white/5 bg-foundri-deep text-zinc-400 hover:bg-white/5'
      }`}
    >
      {label}
    </a>
  )
}

import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { BookOpenCheck } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { PlaybookRow } from '@/components/admin/PlaybookRow'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Audience = 'internal' | 'tier' | 'granted'
type Tier = 'free' | 'pro' | 'scale'

interface AdminPlaybook {
  id: string
  category_slug: string
  subcategory: string | null
  slug: string
  title: string
  purpose: string | null
  min_tier: Tier
  audience: Audience
  status: string
  updated_at: string
}

async function getPlaybooks(): Promise<AdminPlaybook[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  const { data } = await sb
    .from('playbooks')
    .select('id, category_slug, subcategory, slug, title, purpose, min_tier, audience, status, updated_at')
    .is('tenant_id', null)
    .order('category_slug', { ascending: true })
    .order('title', { ascending: true })
  return data ?? []
}

export default async function AdminPlaybooksPage() {
  try { await requireSuperadmin() } catch { redirect('/dashboard') }

  const playbooks = await getPlaybooks()

  const byCategory = playbooks.reduce<Record<string, AdminPlaybook[]>>((acc, p) => {
    if (!acc[p.category_slug]) acc[p.category_slug] = []
    acc[p.category_slug].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <PageHeader
        title="Playbooks"
        description={`${playbooks.length} system-wide playbooks. Beheer audience (intern / per tier / granted) en tier.`}
      />

      {playbooks.length === 0 ? (
        <EmptyState
          icon={BookOpenCheck}
          title="Nog geen playbooks"
          description="Voeg playbooks toe via SQL seed of admin SQL editor. Toon: /admin/playbooks na seed."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, list]) => (
            <div key={cat}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {cat}
              </h2>
              <div className="space-y-1.5">
                {list.map(p => (
                  <PlaybookRow key={p.id} playbook={p} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-foundri-yellow/20 bg-foundri-yellow/5 p-4 text-xs text-zinc-300">
        <p className="font-medium text-foundri-yellow">Audience model</p>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li><b>internal</b> — alleen jij/superadmins zien het playbook (standaard, voor delivery SOPs).</li>
          <li><b>tier</b> — automatisch zichtbaar voor alle tenants met minstens <code>min_tier</code>.</li>
          <li><b>granted</b> — alleen tenants die je expliciet hebt toegevoegd via <code>/admin/tenants/[id]</code>.</li>
        </ul>
      </div>
    </div>
  )
}

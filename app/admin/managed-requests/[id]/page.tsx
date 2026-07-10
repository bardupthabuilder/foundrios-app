import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { ManagedRequestActions } from '@/components/admin/ManagedRequestActions'

export const dynamic = 'force-dynamic'

type Status = 'new' | 'reviewing' | 'qualified' | 'rejected' | 'scheduled' | 'won' | 'lost'

interface ManagedRequest {
  id: string
  tenant_id: string
  status: Status
  preferred_package: 'light' | 'core' | 'premium' | 'unsure'
  bedrijfsnaam: string
  vakgebied: string | null
  regio: string | null
  website: string | null
  omzet_maand_eur: number | null
  gemiddelde_projectwaarde_eur: number | null
  aantal_medewerkers: number | null
  capaciteit_extra_werk: string | null
  huidige_leadbronnen: string[]
  grootste_probleem: string | null
  gewenste_groei: string | null
  budget_bereidheid: string | null
  internal_notes: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  tenant_name?: string
}

async function getRequest(id: string): Promise<ManagedRequest | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  const { data } = await sb.from('managed_requests').select('*').eq('id', id).single()
  if (!data) return null
  const { data: tenant } = await sb.from('tenants').select('name').eq('id', data.tenant_id).single()
  return { ...data, tenant_name: tenant?.name }
}

export default async function ManagedRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  try { await requireSuperadmin() } catch { redirect('/dashboard') }

  const { id } = await params
  const r = await getRequest(id)
  if (!r) notFound()

  return (
    <div className="space-y-6">
      <Link href="/admin/managed-requests" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> Alle aanvragen
      </Link>

      <PageHeader
        title={r.bedrijfsnaam}
        description={`Aanvraag via tenant ${r.tenant_name || r.tenant_id} • ${new Date(r.created_at).toLocaleDateString('nl-NL')}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Block title="Pakket">
            <div className="text-sm uppercase tracking-wider text-foundri-yellow">{r.preferred_package}</div>
          </Block>

          <Block title="Bedrijfsinfo">
            <Row label="Vakgebied" value={r.vakgebied} />
            <Row label="Regio" value={r.regio} />
            <Row label="Website" value={r.website ? <a href={r.website} target="_blank" rel="noreferrer" className="text-foundri-yellow hover:underline">{r.website}</a> : null} />
          </Block>

          <Block title="Cijfers">
            <Row label="Omzet/mnd" value={r.omzet_maand_eur ? `€${r.omzet_maand_eur.toLocaleString('nl-NL')}` : null} />
            <Row label="Projectwaarde" value={r.gemiddelde_projectwaarde_eur ? `€${r.gemiddelde_projectwaarde_eur.toLocaleString('nl-NL')}` : null} />
            <Row label="Medewerkers" value={r.aantal_medewerkers?.toString()} />
            <Row label="Capaciteit" value={r.capaciteit_extra_werk} />
          </Block>

          <Block title="Huidige situatie">
            <Row
              label="Leadbronnen"
              value={r.huidige_leadbronnen.length > 0 ? r.huidige_leadbronnen.join(', ') : null}
            />
            <Row label="Grootste probleem" value={r.grootste_probleem} multiline />
            <Row label="Gewenste groei" value={r.gewenste_groei} multiline />
            <Row label="Budget bereidheid" value={r.budget_bereidheid} />
          </Block>
        </div>

        <div>
          <ManagedRequestActions
            requestId={r.id}
            currentStatus={r.status}
            currentNotes={r.internal_notes}
          />
        </div>
      </div>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-foundri-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value, multiline }: { label: string; value: React.ReactNode; multiline?: boolean }) {
  return (
    <div className={multiline ? 'block' : 'flex justify-between gap-3'}>
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm text-zinc-200 ${multiline ? 'mt-1 block whitespace-pre-wrap' : ''}`}>{value || '—'}</span>
    </div>
  )
}

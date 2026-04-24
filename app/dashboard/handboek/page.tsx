import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { BookOpen, CheckCircle2 } from 'lucide-react'

interface SharedStep {
  step_number?: number
  title: string
  description?: string | null
}

interface SharedSop {
  id: string
  source_sop_id: string
  title: string
  description: string | null
  task_type: string | null
  steps: SharedStep[]
  shared_at: string
  updated_at: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function HandboekPage() {
  const supabase = await createClient()
  const { tenantId } = await requireTenant()

  // NOTE: `shared_sops` is toegevoegd in migration 015; typegen moet nog worden geregenereerd
  const { data: sops } = await (supabase as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          order: (col: string, opts: { ascending: boolean }) => Promise<{ data: SharedSop[] | null }>
        }
      }
    }
  })
    .from('shared_sops')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })

  const typedSops: SharedSop[] = sops ?? []

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">
            Handboek
          </h1>
          <p className="text-sm text-zinc-400">
            Werkwijzen en SOPs gedeeld door je agency
          </p>
        </div>
      </div>

      {/* Empty state */}
      {typedSops.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-16 flex flex-col items-center text-center">
          <BookOpen className="h-12 w-12 text-zinc-600 mb-4" />
          <p className="text-zinc-400 max-w-md">
            Nog geen SOPs gedeeld. Zodra je agency werkprocessen deelt, verschijnen ze hier.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {typedSops.map(sop => (
            <div
              key={sop.id}
              className="rounded-xl border border-white/5 bg-foundri-deep overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-white">{sop.title}</h2>
                    {sop.description && (
                      <p className="text-sm text-zinc-400 mt-1">{sop.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      {sop.task_type && (
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                          {sop.task_type}
                        </span>
                      )}
                      <span className="text-zinc-600">
                        Bijgewerkt {formatDate(sop.updated_at)}
                      </span>
                      <span className="text-zinc-600">· {sop.steps.length} stappen</span>
                    </div>
                  </div>
                </div>
              </div>

              {sop.steps.length > 0 && (
                <ol className="px-5 py-4 space-y-3">
                  {sop.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {step.step_number ?? i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-white">{step.title}</p>
                        {step.description && (
                          <p className="text-xs text-zinc-400 mt-0.5">{step.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

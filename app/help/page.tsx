import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Helpcentrum — FoundriOS',
  description: 'Alles wat je nodig hebt om FoundriOS te gebruiken. Handleidingen, tips en best practices.',
}

const CATEGORY_LABELS: Record<string, string> = {
  starten: 'Aan de slag',
  leads: 'Leads & Acquisitie',
  offertes: 'Offertes & Facturen',
  projecten: 'Projecten & Uitvoering',
  planning: 'Planning & Uren',
  financieel: 'Financieel',
  tips: 'Tips & Tricks',
}

export default async function HelpPage() {
  const service = createServiceClient() as any
  const { data: articles } = await service
    .from('knowledge_articles')
    .select('id, slug, title, content, category, icon, sort_order')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  const allArticles = (articles ?? []) as any[]

  const categories = Object.keys(CATEGORY_LABELS).filter(cat =>
    allArticles.some((a: any) => a.category === cat)
  )

  return (
    <div className="min-h-screen bg-foundri-graphite text-foundri-text">
      <nav className="sticky top-0 z-50 border-b border-foundri-border bg-foundri-graphite/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="FoundriOS" width={28} height={28} />
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">
              Foundri<span className="text-foundri-yellow">OS</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/help" className="px-3 py-2 text-sm font-medium text-foundri-yellow">Help</Link>
            <Link href="/blog" className="px-3 py-2 text-sm font-medium text-foundri-muted hover:text-white transition-colors">Blog</Link>
            <Link href="/register" className="rounded-md bg-gradient-to-br from-foundri-yellow to-foundri-yellow-dim px-4 py-2 text-sm font-semibold text-foundri-graphite">
              Gratis proberen
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-foundri-yellow/20 bg-foundri-yellow/10">
            <BookOpen className="h-6 w-6 text-foundri-yellow" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
            Helpcentrum
          </h1>
          <p className="mt-3 text-lg text-foundri-muted">
            Alles wat je nodig hebt om FoundriOS te gebruiken.
          </p>
        </div>

        {allArticles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-zinc-400">Het helpcentrum wordt binnenkort gevuld met artikelen.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map(cat => (
              <div key={cat}>
                <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-bold text-white">
                  {CATEGORY_LABELS[cat]}
                </h2>
                <div className="space-y-2">
                  {allArticles
                    .filter((a: any) => a.category === cat)
                    .map((article: any) => (
                      <Link
                        key={article.id}
                        href={`/help/${article.slug}`}
                        className="group flex items-center justify-between rounded-lg border border-white/5 bg-foundri-deep p-4 transition-colors hover:border-foundri-yellow/20"
                      >
                        <div>
                          <h3 className="text-sm font-medium text-white group-hover:text-foundri-yellow transition-colors">
                            {article.title}
                          </h3>
                          <p className="mt-1 text-xs text-zinc-500 line-clamp-1">
                            {article.content.replace(/<[^>]*>/g, '').slice(0, 120)}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 group-hover:text-foundri-yellow transition-colors" />
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-foundri-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="FoundriOS" width={20} height={20} />
            <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-white">
              Foundri<span className="text-foundri-yellow">OS</span>
            </span>
          </div>
          <p className="text-sm text-foundri-muted">&copy; {new Date().getFullYear()} FoundriOS</p>
        </div>
      </footer>
    </div>
  )
}

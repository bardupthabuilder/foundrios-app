import { createClient } from '@/lib/supabase/server'
import { BookOpen, TrendingUp, Wallet, Hammer, Layers, BarChart3, Users } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Article {
  id: string
  slug: string
  title: string
  category: string
  icon: string | null
  sort_order: number
  content: string
  status: string
  updated_at: string
}

const CATEGORIES = [
  { key: 'acquisitie', label: 'Acquisitie', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  { key: 'financieel', label: 'Financieel', icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  { key: 'delivery', label: 'Delivery', icon: Hammer, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  { key: 'systemen', label: 'Systemen', icon: Layers, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  { key: 'inzichten', label: 'Inzichten', icon: BarChart3, color: 'text-violet-400', bg: 'bg-violet-500/15' },
  { key: 'mensen', label: 'Mensen', icon: Users, color: 'text-rose-400', bg: 'bg-rose-500/15' },
] as const

export default async function HandboekPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; article?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const activeCategory = params.cat ?? 'acquisitie'
  const activeArticleSlug = params.article

  const { data: articles } = await (supabase as any)
    .from('knowledge_articles')
    .select('*')
    .eq('status', 'published')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })

  const allArticles = (articles ?? []) as Article[]
  const filtered = allArticles.filter(a => a.category === activeCategory)
  const activeArticle = activeArticleSlug
    ? allArticles.find(a => a.slug === activeArticleSlug)
    : null

  // Counts per category
  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = allArticles.filter(a => a.category === cat.key).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
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
            Frameworks, processen en beste praktijken voor je hoveniersbedrijf
          </p>
        </div>
      </div>

      {/* Category nav */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          const isActive = cat.key === activeCategory
          return (
            <Link
              key={cat.key}
              href={`/dashboard/handboek?cat=${cat.key}`}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors ${
                isActive
                  ? `border-white/20 ${cat.bg} text-white`
                  : 'border-white/5 bg-foundri-deep text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? cat.color : ''}`} />
              <span className="text-sm font-medium truncate flex-1">{cat.label}</span>
              <span className="text-xs text-zinc-500">{counts[cat.key] ?? 0}</span>
            </Link>
          )
        })}
      </div>

      {activeArticle ? (
        <ArticleView article={activeArticle} backHref={`/dashboard/handboek?cat=${activeCategory}`} />
      ) : (
        <ArticleList articles={filtered} categoryKey={activeCategory} />
      )}
    </div>
  )
}

function ArticleList({ articles, categoryKey }: { articles: Article[]; categoryKey: string }) {
  if (articles.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-foundri-deep p-12 text-center">
        <BookOpen className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-400">Nog geen artikelen in deze categorie.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {articles.map(a => {
        const summary = extractSummary(a.content)
        return (
          <Link
            key={a.id}
            href={`/dashboard/handboek?cat=${categoryKey}&article=${a.slug}`}
            className="group rounded-xl border border-white/5 bg-foundri-deep p-5 hover:border-foundri-yellow/30 transition-colors"
          >
            <h3 className="text-base font-semibold text-white group-hover:text-foundri-yellow transition-colors">
              {a.title}
            </h3>
            {summary && (
              <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{summary}</p>
            )}
            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-600">
              <span>{wordCount(a.content)} woorden</span>
              <span>·</span>
              <span>~{readingTime(a.content)} min lezen</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function ArticleView({ article, backHref }: { article: Article; backHref: string }) {
  const html = markdownToHtml(article.content)
  return (
    <article className="rounded-xl border border-white/5 bg-foundri-deep p-6 sm:p-8 lg:p-10">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-4"
      >
        ← Terug naar overzicht
      </Link>
      <div
        className="handbook-article text-zinc-200"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style>{`
        .handbook-article h1 { font-size: 1.875rem; font-weight: 700; color: white; margin-top: 0; margin-bottom: 1rem; letter-spacing: -0.02em; }
        .handbook-article h2 { font-size: 1.25rem; font-weight: 600; color: white; margin-top: 2rem; margin-bottom: 0.75rem; }
        .handbook-article h3 { font-size: 1rem; font-weight: 600; color: rgb(228 228 231); margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .handbook-article p { line-height: 1.7; margin-bottom: 1rem; }
        .handbook-article ul, .handbook-article ol { margin-bottom: 1rem; padding-left: 1.5rem; }
        .handbook-article ul { list-style: disc; }
        .handbook-article ol { list-style: decimal; }
        .handbook-article li { margin-bottom: 0.375rem; line-height: 1.6; }
        .handbook-article strong { color: white; font-weight: 600; }
        .handbook-article blockquote { border-left: 3px solid rgb(99 102 241); padding-left: 1rem; margin: 1.25rem 0; font-style: italic; color: rgb(212 212 216); }
        .handbook-article table { width: 100%; margin: 1rem 0; border-collapse: collapse; font-size: 0.875rem; }
        .handbook-article th { text-align: left; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.05); color: white; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .handbook-article td { padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .handbook-article tr:hover td { background: rgba(255,255,255,0.02); }
        .handbook-article code { background: rgba(255,255,255,0.06); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.85em; color: rgb(196 181 253); }
        .handbook-article hr { border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 2rem 0; }
      `}</style>
    </article>
  )
}

function extractSummary(content: string): string {
  const lines = content.split('\n').filter(l => l.trim())
  for (const line of lines) {
    if (line.startsWith('>')) return line.replace(/^>\s*/, '').trim()
  }
  for (const line of lines) {
    if (!line.startsWith('#') && !line.startsWith('|') && !line.startsWith('-')) {
      return line.trim()
    }
  }
  return ''
}

function wordCount(content: string): number {
  return content.split(/\s+/).filter(Boolean).length
}

function readingTime(content: string): number {
  return Math.max(1, Math.round(wordCount(content) / 230))
}

function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let inTable = false
  let tableRows: string[][] = []
  let inList = false
  let listType: 'ul' | 'ol' | null = null

  const flushList = () => {
    if (inList && listType) {
      out.push(`</${listType}>`)
      inList = false
      listType = null
    }
  }

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      out.push('<table>')
      out.push('<thead><tr>')
      for (const cell of tableRows[0]) out.push(`<th>${inline(cell)}</th>`)
      out.push('</tr></thead>')
      if (tableRows.length > 2) {
        out.push('<tbody>')
        for (let i = 2; i < tableRows.length; i++) {
          out.push('<tr>')
          for (const cell of tableRows[i]) out.push(`<td>${inline(cell)}</td>`)
          out.push('</tr>')
        }
        out.push('</tbody>')
      }
      out.push('</table>')
      tableRows = []
      inTable = false
    }
  }

  const inline = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
  }

  for (const raw of lines) {
    const line = raw

    // Table
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList()
      const cells = line.trim().slice(1, -1).split('|').map(c => c.trim())
      tableRows.push(cells)
      inTable = true
      continue
    } else if (inTable) {
      flushTable()
    }

    if (line.startsWith('# ')) {
      flushList()
      out.push(`<h1>${inline(line.slice(2))}</h1>`)
    } else if (line.startsWith('## ')) {
      flushList()
      out.push(`<h2>${inline(line.slice(3))}</h2>`)
    } else if (line.startsWith('### ')) {
      flushList()
      out.push(`<h3>${inline(line.slice(4))}</h3>`)
    } else if (line.startsWith('> ')) {
      flushList()
      out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`)
    } else if (/^\d+\.\s/.test(line)) {
      if (!inList || listType !== 'ol') {
        flushList()
        out.push('<ol>')
        inList = true
        listType = 'ol'
      }
      out.push(`<li>${inline(line.replace(/^\d+\.\s/, ''))}</li>`)
    } else if (line.startsWith('- ')) {
      if (!inList || listType !== 'ul') {
        flushList()
        out.push('<ul>')
        inList = true
        listType = 'ul'
      }
      out.push(`<li>${inline(line.slice(2))}</li>`)
    } else if (line.trim() === '---') {
      flushList()
      out.push('<hr/>')
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      out.push(`<p>${inline(line)}</p>`)
    }
  }
  flushList()
  flushTable()

  return out.join('\n')
}

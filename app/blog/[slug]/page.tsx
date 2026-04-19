import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import { BlogContent } from '@/components/BlogContent'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const service = createServiceClient()
  const { data: post } = await (service as any)
    .from('blog_posts')
    .select('title, meta_title, meta_description, excerpt')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) return { title: 'Niet gevonden — FoundriOS' }

  const p = post as any
  return {
    title: p.meta_title || `${p.title} — FoundriOS Blog`,
    description: p.meta_description || p.excerpt || '',
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const service = createServiceClient()

  const { data: post } = await (service as any)
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) notFound()

  const p = post as any

  return (
    <div className="min-h-screen bg-foundri-graphite text-foundri-text">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-foundri-border bg-foundri-graphite/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="FoundriOS" width={28} height={28} />
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">
              Foundri<span className="text-foundri-yellow">OS</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/blog" className="px-3 py-2 text-sm font-medium text-foundri-yellow">
              Blog
            </Link>
            <Link href="/register" className="rounded-md bg-gradient-to-br from-foundri-yellow to-foundri-yellow-dim px-4 py-2 text-sm font-semibold text-foundri-graphite">
              Gratis proberen
            </Link>
          </div>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/blog" className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Alle artikelen
        </Link>

        <header className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-foundri-card px-2.5 py-0.5 text-xs text-zinc-400">{p.category}</span>
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="h-3 w-3" />{p.reading_time_min} min leestijd
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            {p.title}
          </h1>
          {p.excerpt && (
            <p className="mt-4 text-lg text-zinc-400">{p.excerpt}</p>
          )}
          <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-6 text-sm text-zinc-500">
            <span>{p.author_name}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(p.published_at), 'd MMMM yyyy', { locale: nl })}
            </span>
            {p.word_count > 0 && (
              <>
                <span>·</span>
                <span>{p.word_count.toLocaleString()} woorden</span>
              </>
            )}
          </div>
        </header>

        {/* Article content — sanitized via DOMPurify */}
        <BlogContent html={p.content} />

        {/* Tags */}
        {p.tags && p.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2 border-t border-white/5 pt-6">
            {p.tags.map((tag: string) => (
              <span key={tag} className="rounded-full bg-foundri-card px-3 py-1 text-xs text-zinc-400">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-lg border border-foundri-yellow/20 bg-foundri-yellow/5 p-8 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
            Klaar om je bedrijf te organiseren?
          </h2>
          <p className="mt-2 text-zinc-400">14 dagen gratis. Geen creditcard nodig.</p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-md bg-gradient-to-br from-foundri-yellow to-foundri-yellow-dim px-6 py-3 text-base font-semibold text-foundri-graphite transition-all hover:shadow-[0_0_24px_rgba(246,201,69,0.35)]"
          >
            Start gratis trial
          </Link>
        </div>
      </article>

      <footer className="border-t border-foundri-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
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

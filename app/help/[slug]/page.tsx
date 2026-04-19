import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { BlogContent } from '@/components/BlogContent'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const service = createServiceClient() as any
  const { data } = await service.from('knowledge_articles').select('title').eq('slug', slug).eq('status', 'published').single()
  if (!data) return { title: 'Niet gevonden — FoundriOS' }
  return { title: `${data.title} — FoundriOS Help` }
}

export default async function HelpArticlePage({ params }: PageProps) {
  const { slug } = await params
  const service = createServiceClient() as any
  const { data: article } = await service.from('knowledge_articles').select('*').eq('slug', slug).eq('status', 'published').single()
  if (!article) notFound()
  const a = article as any

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
            <Link href="/register" className="rounded-md bg-gradient-to-br from-foundri-yellow to-foundri-yellow-dim px-4 py-2 text-sm font-semibold text-foundri-graphite">
              Gratis proberen
            </Link>
          </div>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/help" className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Alle artikelen
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-white">{a.title}</h1>
        <div className="mt-8">
          <BlogContent html={a.content} />
        </div>
      </article>
    </div>
  )
}

import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog — FoundriOS',
  description: 'Praktische tips, inzichten en strategieën voor vakbedrijven. Van leadgeneratie tot projectmanagement.',
}

export default async function BlogPage() {
  const service = createServiceClient()

  const { data: posts } = await (service as any)
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image_url, category, tags, reading_time_min, published_at, author_name')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(50)

  const allPosts = (posts ?? []) as any[]

  return (
    <div className="min-h-screen bg-foundri-graphite text-foundri-text">
      {/* Nav — same as landing page */}
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
            <Link href="/login" className="rounded-md px-4 py-2 text-sm font-medium text-foundri-muted transition-colors hover:text-white">
              Inloggen
            </Link>
            <Link href="/register" className="rounded-md bg-gradient-to-br from-foundri-yellow to-foundri-yellow-dim px-4 py-2 text-sm font-semibold text-foundri-graphite transition-all hover:shadow-[0_0_20px_rgba(246,201,69,0.3)]">
              Gratis proberen
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-12">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
            Blog
          </h1>
          <p className="mt-3 text-lg text-foundri-muted">
            Praktische tips en strategieën voor vakbedrijven die willen groeien.
          </p>
        </div>

        {allPosts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-zinc-400">Binnenkort verschijnen hier artikelen.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {allPosts.map((post: any) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block rounded-lg border border-white/5 bg-foundri-deep p-6 transition-colors hover:border-foundri-yellow/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="rounded-full bg-foundri-card px-2.5 py-0.5 text-xs text-zinc-400">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Clock className="h-3 w-3" />
                        {post.reading_time_min} min
                      </span>
                    </div>
                    <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white group-hover:text-foundri-yellow transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                      <span>{post.author_name}</span>
                      <span>·</span>
                      <span>{format(new Date(post.published_at), 'd MMMM yyyy', { locale: nl })}</span>
                    </div>
                  </div>
                  <ArrowRight className="mt-2 h-5 w-5 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-1 group-hover:text-foundri-yellow" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-foundri-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="FoundriOS" width={20} height={20} />
            <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-white">
              Foundri<span className="text-foundri-yellow">OS</span>
            </span>
          </div>
          <p className="text-sm text-foundri-muted">
            &copy; {new Date().getFullYear()} FoundriOS &middot; een product van Groeneveld Media
          </p>
        </div>
      </footer>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  cover_image_url?: string | null
  category: string
  tags: string[]
  meta_title?: string
  meta_description?: string
  status: 'draft' | 'published' | 'archived'
  author_name: string
  word_count: number
  reading_time_min: number
  published_at?: string | null
  created_at: string
}

function toSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const STATUS_BADGES: Record<string, string> = {
  draft: 'bg-zinc-700 text-zinc-300',
  published: 'bg-green-900/60 text-green-400',
  archived: 'bg-red-900/60 text-red-400',
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  category: 'algemeen',
  tags: '',
  meta_title: '',
  meta_description: '',
  author_name: 'FoundriOS',
  status: 'draft' as 'draft' | 'published' | 'archived',
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/blog')
      const data = await res.json()
      setPosts(data.posts ?? [])
    } catch {
      setError('Kon posts niet ophalen')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const wordCount = useMemo(() => {
    return form.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
  }, [form.content])

  const readingTime = useMemo(() => Math.max(1, Math.round(wordCount / 200)), [wordCount])

  function handleTitleChange(title: string) {
    setForm(f => ({
      ...f,
      title,
      slug: editingId ? f.slug : toSlug(title),
    }))
  }

  function startEdit(post: BlogPost) {
    setEditingId(post.id)
    setShowCreate(false)
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      content: post.content,
      cover_image_url: post.cover_image_url ?? '',
      category: post.category,
      tags: (post.tags ?? []).join(', '),
      meta_title: post.meta_title ?? '',
      meta_description: post.meta_description ?? '',
      author_name: post.author_name,
      status: post.status,
    })
    setError(null)
  }

  function startCreate() {
    setShowCreate(true)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      cover_image_url: form.cover_image_url || null,
    }

    try {
      const url = editingId ? `/api/admin/blog/${editingId}` : '/api/admin/blog'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Fout bij opslaan')
      }
      setShowCreate(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      await fetchPosts()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Weet je zeker dat je deze post wilt verwijderen?')) return
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
    if (editingId === id) { setEditingId(null); setForm(EMPTY_FORM) }
    await fetchPosts()
  }

  async function togglePublish(post: BlogPost) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/admin/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    await fetchPosts()
  }

  const formSection = (
    <div className="space-y-4 rounded-lg border border-white/5 bg-foundri-surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{editingId ? 'Post bewerken' : 'Nieuwe post'}</h3>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>{wordCount} woorden</span>
          <span>{readingTime} min leestijd</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Titel</label>
          <input
            type="text"
            value={form.title}
            onChange={e => handleTitleChange(e.target.value)}
            className="w-full rounded-md border border-white/5 bg-foundri-deep px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-foundri-yellow/50 focus:outline-none"
            placeholder="Titel van de post"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            className="w-full rounded-md border border-white/5 bg-foundri-deep px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-foundri-yellow/50 focus:outline-none font-mono"
            placeholder="url-slug"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-400">Excerpt</label>
        <textarea
          rows={2}
          value={form.excerpt}
          onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
          className="w-full rounded-md border border-white/5 bg-foundri-deep px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-foundri-yellow/50 focus:outline-none"
          placeholder="Korte samenvatting"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-400">Content (HTML / Markdown)</label>
        <textarea
          rows={15}
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          className="w-full rounded-md border border-white/5 bg-foundri-deep px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-foundri-yellow/50 focus:outline-none font-mono"
          placeholder="Schrijf je content hier..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Categorie</label>
          <input
            type="text"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full rounded-md border border-white/5 bg-foundri-deep px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-foundri-yellow/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Tags (komma-gescheiden)</label>
          <input
            type="text"
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            className="w-full rounded-md border border-white/5 bg-foundri-deep px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-foundri-yellow/50 focus:outline-none"
            placeholder="seo, marketing, ai"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Auteur</label>
          <input
            type="text"
            value={form.author_name}
            onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
            className="w-full rounded-md border border-white/5 bg-foundri-deep px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-foundri-yellow/50 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-400">Cover Image URL</label>
        <input
          type="text"
          value={form.cover_image_url}
          onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))}
          className="w-full rounded-md border border-white/5 bg-foundri-deep px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-foundri-yellow/50 focus:outline-none"
          placeholder="https://..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Meta Title</label>
          <input
            type="text"
            value={form.meta_title}
            onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
            className="w-full rounded-md border border-white/5 bg-foundri-deep px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-foundri-yellow/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Meta Description</label>
          <textarea
            rows={2}
            value={form.meta_description}
            onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
            className="w-full rounded-md border border-white/5 bg-foundri-deep px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-foundri-yellow/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Status</label>
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
            className="rounded-md border border-white/5 bg-foundri-deep px-3 py-2 text-sm text-white focus:border-foundri-yellow/50 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex flex-1 items-end justify-end gap-2">
          <button
            onClick={() => { setShowCreate(false); setEditingId(null); setForm(EMPTY_FORM) }}
            className="rounded-md border border-white/5 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title || !form.slug || !form.content}
            className="rounded-md bg-foundri-yellow px-4 py-2 text-sm font-semibold text-foundri-graphite transition-all hover:shadow-[0_0_16px_rgba(246,201,69,0.3)] disabled:opacity-40"
          >
            {saving ? 'Opslaan...' : editingId ? 'Bijwerken' : 'Aanmaken'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog</h1>
          <p className="mt-1 text-sm text-zinc-400">{posts.length} posts</p>
        </div>
        {!showCreate && !editingId && (
          <button
            onClick={startCreate}
            className="rounded-md bg-foundri-yellow px-4 py-2 text-sm font-semibold text-foundri-graphite transition-all hover:shadow-[0_0_16px_rgba(246,201,69,0.3)]"
          >
            + Nieuwe post
          </button>
        )}
      </div>

      {showCreate && formSection}

      {loading ? (
        <p className="text-sm text-zinc-500">Laden...</p>
      ) : posts.length === 0 && !showCreate ? (
        <p className="text-sm text-zinc-500">Nog geen blog posts. Maak er een aan.</p>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <div key={post.id}>
              <div
                onClick={() => editingId === post.id ? (setEditingId(null), setForm(EMPTY_FORM)) : startEdit(post)}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-white/5 bg-foundri-surface px-5 py-4 transition-colors hover:border-white/10"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[post.status]}`}>
                    {post.status}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{post.title}</p>
                    <p className="truncate text-xs text-zinc-500">/{post.slug} &middot; {post.category} &middot; {post.word_count} woorden &middot; {post.reading_time_min} min</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); togglePublish(post) }}
                    className="rounded border border-white/5 px-3 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
                  >
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(post.id) }}
                    className="rounded border border-white/5 px-3 py-1 text-xs text-red-400 hover:bg-red-900/30"
                  >
                    Verwijder
                  </button>
                </div>
              </div>
              {editingId === post.id && <div className="mt-2">{formSection}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

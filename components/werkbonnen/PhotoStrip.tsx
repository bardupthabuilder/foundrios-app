'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Trash2, Loader2 } from 'lucide-react'

/**
 * Foto's bij een werkbon.
 *
 * `capture="environment"` opent op mobiel direct de achtercamera. De vakman staat
 * in de tuin, niet achter een laptop.
 */

type Photo = { id: string; url: string | null; caption: string | null }

export function PhotoStrip({ workOrderId, readOnly = false }: { workOrderId: string; readOnly?: boolean }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/work-order-photos?work_order_id=${workOrderId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (!cancelled) setPhotos(Array.isArray(d) ? d : []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [workOrderId])

  // Na uploaden of verwijderen opnieuw ophalen; de signed URLs verlopen toch.
  const refresh = useCallback(async () => {
    const res = await fetch(`/api/work-order-photos?work_order_id=${workOrderId}`)
    if (res.ok) setPhotos(await res.json())
  }, [workOrderId])

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setError(null)

    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('work_order_id', workOrderId)
      form.append('file', file)

      const res = await fetch('/api/work-order-photos', { method: 'POST', body: form })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(typeof body?.error === 'string' ? body.error : 'Uploaden mislukt.')
        break
      }
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    refresh()
  }

  async function remove(id: string) {
    setPhotos(prev => prev.filter(p => p.id !== id))
    await fetch(`/api/work-order-photos?id=${id}`, { method: 'DELETE' })
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foundri-muted">
          Foto&apos;s {photos.length > 0 && `(${photos.length})`}
        </h2>
        {!readOnly && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-foundri-muted transition-colors hover:border-white/20 hover:text-foundri-text disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            {uploading ? 'Uploaden...' : 'Foto'}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={(e) => upload(e.target.files)}
      />

      {error && (
        <p className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
      )}

      {photos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-xs text-foundri-muted">
          Nog geen foto&apos;s. Leg vast wat je hebt gedaan — dat scheelt discussie achteraf.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-foundri-surface">
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt={photo.caption ?? 'Werkbonfoto'} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-600">Geen preview</div>
              )}
              {!readOnly && (
                <button
                  onClick={() => remove(photo.id)}
                  className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-zinc-300 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  title="Foto verwijderen"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

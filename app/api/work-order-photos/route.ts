/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { tenantOwnsParent, parentIdIfOwned } from '@/lib/ownership'

// `work_order_photos` staat nog niet in de gegenereerde types (migratie 037).
// Zelfde losgekoppelde client als de rest van de repo voor zulke tabellen.
type Db = any

const BUCKET = 'werkbon-fotos'
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB — een telefoonfoto past hier ruim in
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

/**
 * Foto's bij een werkbon.
 *
 * Foto's zijn het beste bewijs bij discussie over meerwerk, en tegelijk het beste
 * materiaal voor je eigen marketing. De werkbon had ze niet.
 *
 * Het eerste padsegment is de tenant_id; de storage-policy in migratie 037
 * dwingt af dat een tenant nooit in de map van een ander kan schrijven of lezen.
 */

// GET /api/work-order-photos?work_order_id=... — lijst met tijdelijke bekijk-URLs
export async function GET(request: NextRequest) {
  const supabase = (await createClient()) as Db
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const workOrderId = new URL(request.url).searchParams.get('work_order_id')
  if (!workOrderId) return NextResponse.json({ error: 'work_order_id verplicht' }, { status: 400 })

  if (!(await tenantOwnsParent(supabase, 'work_orders', workOrderId, tenantId))) {
    return NextResponse.json({ error: 'Werkbon niet gevonden' }, { status: 404 })
  }

  const { data: photos, error } = await supabase
    .from('work_order_photos')
    .select('*')
    .eq('work_order_id', workOrderId)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // De bucket is privé; zonder signed URL is er niets te zien.
  const withUrls = await Promise.all(
    (photos ?? []).map(async (p: { id: string; storage_path: string; caption: string | null }) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(p.storage_path, 3600)
      return { ...p, url: data?.signedUrl ?? null }
    })
  )

  return NextResponse.json(withUrls)
}

// POST /api/work-order-photos — multipart upload
export async function POST(request: NextRequest) {
  const supabase = (await createClient()) as Db
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const form = await request.formData()
  const workOrderId = form.get('work_order_id')
  const file = form.get('file')
  const caption = form.get('caption')

  if (typeof workOrderId !== 'string' || !(file instanceof File)) {
    return NextResponse.json({ error: 'work_order_id en file verplicht' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Foto is te groot (max 8 MB)' }, { status: 400 })
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Alleen JPG, PNG, WebP of HEIC' }, { status: 400 })
  }

  if (!(await tenantOwnsParent(supabase, 'work_orders', workOrderId, tenantId))) {
    return NextResponse.json({ error: 'Werkbon niet gevonden' }, { status: 404 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${tenantId}/${workOrderId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: `Upload mislukt: ${uploadError.message}` }, { status: 500 })
  }

  const { count } = await supabase
    .from('work_order_photos')
    .select('*', { count: 'exact', head: true })
    .eq('work_order_id', workOrderId)

  const { data, error } = await supabase
    .from('work_order_photos')
    .insert({
      work_order_id: workOrderId,
      storage_path: path,
      caption: typeof caption === 'string' && caption ? caption : null,
      sort_order: (count ?? 0) + 1,
    })
    .select()
    .single()

  if (error) {
    // Anders blijft er een wees-bestand in de bucket achter.
    await supabase.storage.from(BUCKET).remove([path])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)

  return NextResponse.json({ ...data, url: signed?.signedUrl ?? null }, { status: 201 })
}

// DELETE /api/work-order-photos?id=...
export async function DELETE(request: NextRequest) {
  const supabase = (await createClient()) as Db
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID verplicht' }, { status: 400 })

  if (!(await parentIdIfOwned(supabase, 'work_order_photos', id, tenantId))) {
    return NextResponse.json({ error: 'Foto niet gevonden' }, { status: 404 })
  }

  const { data: photo } = await supabase
    .from('work_order_photos')
    .select('storage_path')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('work_order_photos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (photo?.storage_path) {
    await supabase.storage.from(BUCKET).remove([photo.storage_path])
  }

  return NextResponse.json({ success: true })
}

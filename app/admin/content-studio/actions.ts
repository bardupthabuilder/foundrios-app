'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

export async function addNote(formData: FormData) {
  await requireSuperadmin()
  const sb = createServiceClient() as any

  const brand_id = (formData.get('brand_id') as string) || null
  const tool_id = (formData.get('tool_id') as string) || null
  const title = (formData.get('title') as string)?.trim()
  const body = ((formData.get('body') as string) ?? '').trim() || null
  const tagsRaw = ((formData.get('tags') as string) ?? '').trim()
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []

  if (!title) throw new Error('Titel is verplicht')

  await sb.from('content_notes').insert({
    brand_id,
    tool_id: tool_id || null,
    title,
    body,
    tags,
  })

  revalidatePath('/admin/content-studio')
  if (brand_id) {
    const { data: brand } = await sb.from('content_brands').select('slug').eq('id', brand_id).single()
    if (brand?.slug) revalidatePath(`/admin/content-studio/${brand.slug}`)
  }
}

export async function addTool(formData: FormData) {
  await requireSuperadmin()
  const sb = createServiceClient() as any

  const brand_id = formData.get('brand_id') as string
  const kind = formData.get('kind') as string
  const name = (formData.get('name') as string)?.trim()
  const url = ((formData.get('url') as string) ?? '').trim() || null
  const description = ((formData.get('description') as string) ?? '').trim() || null
  const notes = ((formData.get('notes') as string) ?? '').trim() || null

  if (!brand_id || !kind || !name) throw new Error('Brand, type en naam zijn verplicht')

  await sb.from('content_ai_tools').insert({
    brand_id,
    kind,
    name,
    url,
    description,
    notes,
  })

  revalidatePath('/admin/content-studio')
  const { data: brand } = await sb.from('content_brands').select('slug').eq('id', brand_id).single()
  if (brand?.slug) revalidatePath(`/admin/content-studio/${brand.slug}`)
}

export async function updateBrand(formData: FormData) {
  await requireSuperadmin()
  const sb = createServiceClient() as any

  const id = formData.get('id') as string
  const positioning = ((formData.get('positioning') as string) ?? '').trim() || null
  const tonality = ((formData.get('tonality') as string) ?? '').trim() || null
  const do_use = ((formData.get('do_use') as string) ?? '').trim() || null
  const do_not_use = ((formData.get('do_not_use') as string) ?? '').trim() || null

  if (!id) throw new Error('Brand ID ontbreekt')

  await sb.from('content_brands').update({
    positioning, tonality, do_use, do_not_use,
  }).eq('id', id)

  const { data: brand } = await sb.from('content_brands').select('slug').eq('id', id).single()
  revalidatePath('/admin/content-studio')
  if (brand?.slug) revalidatePath(`/admin/content-studio/${brand.slug}`)
}

export async function archiveTool(formData: FormData) {
  await requireSuperadmin()
  const sb = createServiceClient() as any
  const id = formData.get('id') as string
  if (!id) return
  await sb.from('content_ai_tools').update({ status: 'archived' }).eq('id', id)
  revalidatePath('/admin/content-studio', 'layout')
}

export async function deleteNote(formData: FormData) {
  await requireSuperadmin()
  const sb = createServiceClient() as any
  const id = formData.get('id') as string
  if (!id) return
  await sb.from('content_notes').delete().eq('id', id)
  revalidatePath('/admin/content-studio', 'layout')
}

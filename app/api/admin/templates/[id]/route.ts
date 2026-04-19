import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireSuperadmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }
  const { id } = await params
  const body = await request.json()
  const service = createServiceClient() as any
  const { data, error } = await service.from('templates').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireSuperadmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }
  const { id } = await params
  const service = createServiceClient() as any
  await service.from('templates').delete().eq('id', id)
  return new Response(null, { status: 204 })
}

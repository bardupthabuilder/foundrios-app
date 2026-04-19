import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // Use RPC which runs as SECURITY DEFINER (bypasses RLS)
  const { data, error } = await (supabase as any).rpc('list_my_tenants')

  if (error) {
    console.error('[tenants/list] RPC error:', error.message)
    // Return empty — the switcher won't show
    return NextResponse.json({ tenants: [] })
  }

  return NextResponse.json({ tenants: data ?? [] })
}

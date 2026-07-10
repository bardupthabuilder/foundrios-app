import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/demo-mode — return current toggle state for the logged-in user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { data, error } = await (supabase as any)
    .from('tenant_users')
    .select('role, demo_mode_active')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Geen tenant gevonden' }, { status: 404 })
  }

  const role = (data as { role?: string; demo_mode_active?: boolean }).role
  const demoActive = (data as { role?: string; demo_mode_active?: boolean }).demo_mode_active
  const isAdmin = role === 'owner' || role === 'admin'

  return NextResponse.json({
    active: demoActive === true,
    canToggle: isAdmin,
  })
}

// POST /api/demo-mode — flip toggle (admin-only, enforced via toggle_demo_mode RPC)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const newState: boolean = body?.active === true

  const { data, error } = await (supabase as any).rpc('toggle_demo_mode', {
    new_state: newState,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  return NextResponse.json({ active: data === true })
}

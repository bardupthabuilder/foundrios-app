import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Auto-register: creates user via GoTrue + confirms email via SQL
// Protected by a secret token (not public)
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password, secret } = body

  // Simple secret protection
  if (secret !== 'foundrios-admin-2026') {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  // Create a fresh Supabase client (no session)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )

  // Sign up via GoTrue (proper password hashing)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const userId = data.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }

  return NextResponse.json({
    userId,
    email,
    message: 'User created via GoTrue. Confirm email in DB if needed.',
  }, { status: 201 })
}

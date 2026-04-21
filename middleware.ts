import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // FoundriOS publieke routes
  const publicRoutes = ['/login', '/register', '/onboarding', '/invite', '/']
  const isPublicRoute = publicRoutes.some((route) => pathname === route) || pathname.startsWith('/blog') || pathname.startsWith('/help')

  // Workforce publieke routes
  const workforcePublicRoutes = ['/workforce', '/workforce/login', '/workforce/register', '/workforce/onboarding']
  const isWorkforcePublic = workforcePublicRoutes.some((route) => pathname === route)

  // Detect product context
  const isWorkforce = pathname.startsWith('/workforce')

  // API webhooks zijn altijd publiek (worden beveiligd via signature validation)
  const isWebhook =
    pathname.startsWith('/api/webhooks/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/workforce/api/webhook/')

  if (isWebhook) {
    return supabaseResponse
  }

  // Niet ingelogd → naar juiste login
  if (!user && !isPublicRoute && !isWorkforcePublic) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = isWorkforce ? '/workforce/login' : '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Ingelogd op register pagina → naar dashboard
  if (user && pathname === '/register') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  if (user && pathname === '/workforce/register') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/workforce/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

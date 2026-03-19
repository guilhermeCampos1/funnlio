import { NextRequest, NextResponse } from 'next/server'
import { betterFetch } from '@better-fetch/fetch'

type Session = {
  user: { id: string; email: string; name?: string | null }
  session: { id: string; userId: string }
}

const AUTH_PATHS = ['/login', '/signup']
const PUBLIC_PATHS = ['/login', '/signup', '/onboarding']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const { data: session } = await betterFetch<Session>('/api/auth/get-session', {
    baseURL: request.nextUrl.origin,
    headers: { cookie: request.headers.get('cookie') ?? '' },
  })

  const isAuthenticated = !!session
  const isAuthPath = AUTH_PATHS.some(p => pathname.startsWith(p))
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(isAuthenticated ? '/dashboard' : '/login', request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

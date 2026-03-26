import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  error?: string
  error_description?: string
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const error = request.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/integrations?oauth_error=${encodeURIComponent(error)}`, request.nextUrl.origin)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/integrations?oauth_error=missing_params', request.nextUrl.origin)
    )
  }

  // Decode state
  let provider: string
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString())
    provider = parsed.provider
  } catch {
    return NextResponse.redirect(
      new URL('/integrations?oauth_error=invalid_state', request.nextUrl.origin)
    )
  }

  // Exchange code for tokens
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/integrations?oauth_error=server_config', request.nextUrl.origin)
    )
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })

  const tokenData = (await tokenResp.json()) as TokenResponse

  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(
      new URL(
        `/integrations?oauth_error=${encodeURIComponent(tokenData.error_description ?? tokenData.error ?? 'token_exchange_failed')}`,
        request.nextUrl.origin
      )
    )
  }

  // Store tokens in a secure httpOnly cookie (5 min TTL)
  const tokenPayload = JSON.stringify({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? '',
    token_expires_at: String(Date.now() + tokenData.expires_in * 1000),
    provider,
  })

  const cookieStore = await cookies()
  cookieStore.set('google_oauth_tokens', tokenPayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 300, // 5 minutes
  })

  return NextResponse.redirect(
    new URL(`/integrations?oauth=${provider}&success=true`, request.nextUrl.origin)
  )
}

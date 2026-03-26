import { type NextRequest, NextResponse } from 'next/server'
import { SSO_CONFIG } from '@/lib/sso'

/**
 * SAML ACS (Assertion Consumer Service) callback.
 * The IdP posts the SAML assertion here after successful authentication.
 *
 * URL: POST /api/sso/callback
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!SSO_CONFIG.jacksonUrl) {
    return NextResponse.redirect(
      new URL('/login?error=sso_not_configured', request.url),
    )
  }

  const body = await request.formData()
  const samlResponse = body.get('SAMLResponse') as string | null
  const relayState = body.get('RelayState') as string | null

  if (!samlResponse) {
    return NextResponse.redirect(new URL('/login?error=invalid_saml_response', request.url))
  }

  // Exchange SAML assertion for user profile via Jackson
  const tokenResp = await fetch(`${SSO_CONFIG.jacksonUrl}/api/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: 'dummy',
      client_secret: 'dummy',
      code: samlResponse,
      redirect_uri: SSO_CONFIG.acsUrl,
    }),
  })

  if (!tokenResp.ok) {
    return NextResponse.redirect(new URL('/login?error=sso_token_exchange_failed', request.url))
  }

  const tokenData = (await tokenResp.json()) as { access_token?: string }
  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL('/login?error=sso_no_token', request.url))
  }

  // Get user profile from Jackson
  const profileResp = await fetch(`${SSO_CONFIG.jacksonUrl}/api/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!profileResp.ok) {
    return NextResponse.redirect(new URL('/login?error=sso_profile_failed', request.url))
  }

  const profile = (await profileResp.json()) as {
    email?: string
    firstName?: string
    lastName?: string
    id?: string
  }

  if (!profile.email) {
    return NextResponse.redirect(new URL('/login?error=sso_no_email', request.url))
  }

  // TODO: Find or create user from SSO profile, create session, redirect
  // For now redirect to login with email pre-filled
  const nextUrl = relayState ?? '/dashboard'
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('email', profile.email)
  loginUrl.searchParams.set('sso', '1')
  loginUrl.searchParams.set('next', nextUrl)

  return NextResponse.redirect(loginUrl)
}

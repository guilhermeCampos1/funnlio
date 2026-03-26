import { NextRequest, NextResponse } from 'next/server'

const SCOPES: Record<string, string> = {
  google_ads: 'openid email https://www.googleapis.com/auth/adwords',
  google_analytics: 'openid email https://www.googleapis.com/auth/analytics.readonly',
}

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider')

  if (!provider || !SCOPES[provider]) {
    return NextResponse.json({ error: 'Provider invalido' }, { status: 400 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth nao configurado. GOOGLE_CLIENT_ID ausente.' },
      { status: 500 }
    )
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`
  const state = Buffer.from(JSON.stringify({ provider })).toString('base64url')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES[provider],
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}

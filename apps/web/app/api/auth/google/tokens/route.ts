import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET: Read OAuth tokens from cookie (frontend calls this after OAuth redirect)
export async function GET() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('google_oauth_tokens')?.value

  if (!raw) {
    return NextResponse.json({ tokens: null })
  }

  try {
    const tokens = JSON.parse(raw) as {
      access_token: string
      refresh_token: string
      token_expires_at: string
      provider: string
    }
    return NextResponse.json({ tokens })
  } catch {
    return NextResponse.json({ tokens: null })
  }
}

// DELETE: Clear the OAuth tokens cookie after use
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('google_oauth_tokens')
  return NextResponse.json({ ok: true })
}

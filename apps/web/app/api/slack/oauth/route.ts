import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, alertSettings, organizations, eq } from '@funnlio/db'

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID ?? ''
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET ?? ''
const SLACK_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/oauth`
const SLACK_SCOPES = 'incoming-webhook,chat:write,channels:read'

/**
 * GET /api/slack/oauth  — Inicia o fluxo de OAuth do Slack
 * GET /api/slack/oauth?code=... — Callback após autorização
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  // ─── Callback do Slack ──────────────────────────────────────────────────────

  if (code) {
    const tokenResp = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code,
        redirect_uri: SLACK_REDIRECT_URI,
      }),
    })

    const data = (await tokenResp.json()) as {
      ok: boolean
      error?: string
      incoming_webhook?: {
        url: string
        channel: string
        channel_id: string
        configuration_url: string
      }
      team?: { name: string; id: string }
    }

    if (!data.ok || !data.incoming_webhook) {
      return NextResponse.redirect(
        new URL(`/settings/alerts?error=slack_${data.error ?? 'unknown'}`, request.url),
      )
    }

    const organizationId = (session.session as { activeOrganizationId?: string }).activeOrganizationId
      ?? (session.user as { organizationId?: string }).organizationId

    if (!organizationId) {
      return NextResponse.redirect(new URL('/settings/alerts?error=no_org', request.url))
    }

    // Salvar webhook URL nas configurações de alerta
    const webhookConfig = JSON.stringify({
      webhookUrl: data.incoming_webhook.url,
      channel: data.incoming_webhook.channel,
      channelId: data.incoming_webhook.channel_id,
      teamName: data.team?.name,
      teamId: data.team?.id,
    })

    // Upsert alert setting for Slack
    const existing = await db
      .select({ id: alertSettings.id })
      .from(alertSettings)
      .where(
        eq(alertSettings.organizationId, organizationId),
      )
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(alertSettings)
        .set({ slackEnabled: true, threshold: webhookConfig, updatedAt: new Date() })
        .where(eq(alertSettings.organizationId, organizationId))
    } else {
      await db.insert(alertSettings).values({
        organizationId,
        alertType: 'all',
        enabled: true,
        emailEnabled: false,
        slackEnabled: true,
        threshold: webhookConfig,
      })
    }

    return NextResponse.redirect(new URL('/settings/alerts?slack=connected', request.url))
  }

  // ─── Erro retornado pelo Slack ───────────────────────────────────────────────

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings/alerts?error=slack_${error}`, request.url),
    )
  }

  // ─── Iniciar OAuth ───────────────────────────────────────────────────────────

  const slackAuthUrl = new URL('https://slack.com/oauth/v2/authorize')
  slackAuthUrl.searchParams.set('client_id', SLACK_CLIENT_ID)
  slackAuthUrl.searchParams.set('scope', SLACK_SCOPES)
  slackAuthUrl.searchParams.set('redirect_uri', SLACK_REDIRECT_URI)

  return NextResponse.redirect(slackAuthUrl)
}

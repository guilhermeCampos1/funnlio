/**
 * SSO/SAML Configuration using BoxyHQ SAML Jackson
 *
 * To enable SSO:
 * 1. Add JACKSON_URL to .env.local (or use embedded mode with JACKSON_DB_PATH)
 * 2. For embedded: set JACKSON_ADMIN_PORTAL_PORT (default 5225)
 *
 * Docs: https://boxyhq.com/docs/jackson/
 */

export const SSO_CONFIG = {
  // External Jackson service URL (recommended for production)
  jacksonUrl: process.env.JACKSON_URL,

  // Embedded mode: SQLite DB path
  dbPath: process.env.JACKSON_DB_PATH ?? './data/jackson.db',

  // Your app's ACS (Assertion Consumer Service) URL
  acsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/sso/callback`,

  // Entity ID for your SP metadata
  entityId: process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.funnlio.com',

  // Admin API key for Jackson management
  adminApiKey: process.env.JACKSON_ADMIN_API_KEY,
}

export interface SSOConnection {
  clientID: string
  clientSecret: string
  idpMetadata: {
    issuer: string
    loginType?: string
  }
  defaultRedirectUrl: string
  redirectUrl: string[]
  tenant: string
  product: string
}

/**
 * Get SSO connections for a given tenant (organization).
 * Proxies to Jackson service if configured.
 */
export async function getSSOConnections(tenant: string): Promise<SSOConnection[]> {
  if (!SSO_CONFIG.jacksonUrl) return []

  const resp = await fetch(
    `${SSO_CONFIG.jacksonUrl}/api/v1/saml/config?tenant=${encodeURIComponent(tenant)}&product=funnlio`,
    {
      headers: {
        Authorization: `Api-Key ${SSO_CONFIG.adminApiKey ?? ''}`,
      },
    },
  )

  if (!resp.ok) return []
  return resp.json() as Promise<SSOConnection[]>
}

/**
 * Add SSO connection for a tenant from XML metadata.
 */
export async function addSSOConnection(params: {
  tenant: string
  rawMetadata: string
  defaultRedirectUrl?: string
}): Promise<{ clientID: string; clientSecret: string }> {
  if (!SSO_CONFIG.jacksonUrl) {
    throw new Error('Jackson não está configurado. Adicione JACKSON_URL ao .env.local.')
  }

  const body = new URLSearchParams({
    rawMetadata: params.rawMetadata,
    tenant: params.tenant,
    product: 'funnlio',
    defaultRedirectUrl: params.defaultRedirectUrl ?? `${SSO_CONFIG.acsUrl}?next=/dashboard`,
    redirectUrl: JSON.stringify([SSO_CONFIG.acsUrl]),
  })

  const resp = await fetch(`${SSO_CONFIG.jacksonUrl}/api/v1/saml/config`, {
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${SSO_CONFIG.adminApiKey ?? ''}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!resp.ok) {
    const err = await resp.json() as { message?: string }
    throw new Error(err.message ?? 'Falha ao adicionar conexão SSO')
  }

  return resp.json() as Promise<{ clientID: string; clientSecret: string }>
}

/**
 * Delete SSO connection.
 */
export async function deleteSSOConnection(params: {
  tenant: string
  clientID: string
}): Promise<void> {
  if (!SSO_CONFIG.jacksonUrl) return

  await fetch(
    `${SSO_CONFIG.jacksonUrl}/api/v1/saml/config?tenant=${params.tenant}&product=funnlio&clientID=${params.clientID}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Api-Key ${SSO_CONFIG.adminApiKey ?? ''}` },
    },
  )
}

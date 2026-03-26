import { type NextRequest, NextResponse } from 'next/server'
import { SSO_CONFIG } from '@/lib/sso'

/**
 * Returns the SP (Service Provider) SAML metadata XML.
 * IdPs (Okta, Google Workspace, Azure AD, etc.) need this to configure the integration.
 *
 * URL: GET /api/sso/metadata
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const entityId = SSO_CONFIG.entityId
  const acsUrl = SSO_CONFIG.acsUrl

  const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor
  xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${entityId}">
  <SPSSODescriptor
    AuthnRequestsSigned="false"
    WantAssertionsSigned="true"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${acsUrl}"
      index="0"
      isDefault="true"/>
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
  </SPSSODescriptor>
</EntityDescriptor>`

  return new NextResponse(metadata, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  })
}

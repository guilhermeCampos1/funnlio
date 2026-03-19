import type { IntegrationProvider } from './core/types.js'
import { MetaAdsProvider } from './providers/meta-ads/index.js'
import { GoogleAdsProvider } from './providers/google-ads/index.js'
import { PipedriveProvider } from './providers/pipedrive/index.js'
import { ClarityProvider } from './providers/clarity/index.js'
import { GoogleAnalyticsProvider } from './providers/google-analytics/index.js'

/**
 * Registry central de todos os providers de integração disponíveis.
 * Para adicionar um novo provider: criar a classe e registrar aqui.
 */
export const providerRegistry = new Map<string, IntegrationProvider>([
  ['meta_ads', new MetaAdsProvider()],
  ['google_ads', new GoogleAdsProvider()],
  ['pipedrive', new PipedriveProvider()],
  ['microsoft_clarity', new ClarityProvider()],
  ['google_analytics', new GoogleAnalyticsProvider()],
])

export function getProvider(slug: string): IntegrationProvider {
  const provider = providerRegistry.get(slug)
  if (!provider) {
    throw new Error(`Provider '${slug}' não encontrado no registry`)
  }
  return provider
}

export function getAllProviders(): IntegrationProvider[] {
  return Array.from(providerRegistry.values())
}

export function getProvidersByCategory(category: string): IntegrationProvider[] {
  return Array.from(providerRegistry.values()).filter((p) => p.category === category)
}

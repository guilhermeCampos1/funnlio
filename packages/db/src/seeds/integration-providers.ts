/**
 * Seed: popula a tabela integration_providers com os providers disponíveis.
 * Executar: npx tsx packages/db/src/seeds/integration-providers.ts
 */
import 'dotenv/config'
import { db, integrationProviders } from '../index.js'
import { getAllProviders } from '@funnlio/integrations'

async function seed() {
  console.log('Seeding integration_providers...')

  const providers = getAllProviders()

  for (const provider of providers) {
    await db
      .insert(integrationProviders)
      .values({
        slug: provider.slug,
        name: provider.name,
        description: provider.description,
        iconUrl: provider.iconUrl,
        category: provider.category,
        configSchema: provider.configSchema as Record<string, unknown>,
        metricsSchema: provider.availableMetrics as unknown as Record<string, unknown>[],
        isActive: true,
      })
      .onConflictDoUpdate({
        target: integrationProviders.slug,
        set: {
          name: provider.name,
          description: provider.description,
          configSchema: provider.configSchema as Record<string, unknown>,
          metricsSchema: provider.availableMetrics as unknown as Record<string, unknown>[],
        },
      })

    console.log(`  ✓ ${provider.name} (${provider.slug})`)
  }

  console.log(`\nSeed concluído: ${providers.length} providers inseridos/atualizados`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed falhou:', err)
  process.exit(1)
})

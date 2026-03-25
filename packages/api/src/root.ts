import { router } from './trpc.js'
import { funnelsRouter } from './routers/funnels.js'
import { stagesRouter } from './routers/stages.js'
import { integrationsRouter } from './routers/integrations.js'
import { metricsRouter } from './routers/metrics.js'
import { adminRouter } from './routers/admin.js'
import { organizationsRouter } from './routers/organizations.js'
import { reportsRouter } from './routers/reports.js'
import { commentsRouter } from './routers/comments.js'
import { comparisonRouter } from './routers/comparison.js'
import { publicLinksRouter } from './routers/public-links.js'
import { customerHealthRouter } from './routers/customer-health.js'
import { benchmarksRouter } from './routers/benchmarks.js'
import { apiKeysRouter } from './routers/api-keys.js'
import { webhooksConfigRouter } from './routers/webhooks-config.js'
import { permissionsRouter } from './routers/permissions.js'

export const appRouter = router({
  funnels: funnelsRouter,
  stages: stagesRouter,
  integrations: integrationsRouter,
  metrics: metricsRouter,
  admin: adminRouter,
  organizations: organizationsRouter,
  reports: reportsRouter,
  comments: commentsRouter,
  comparison: comparisonRouter,
  publicLinks: publicLinksRouter,
  customerHealth: customerHealthRouter,
  benchmarks: benchmarksRouter,
  apiKeys: apiKeysRouter,
  webhooksConfig: webhooksConfigRouter,
  permissions: permissionsRouter,
})

export type AppRouter = typeof appRouter

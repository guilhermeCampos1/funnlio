import { router } from './trpc.js'
import { funnelsRouter } from './routers/funnels.js'
import { stagesRouter } from './routers/stages.js'
import { integrationsRouter } from './routers/integrations.js'
import { metricsRouter } from './routers/metrics.js'
import { adminRouter } from './routers/admin.js'
import { organizationsRouter } from './routers/organizations.js'
import { billingRouter } from './routers/billing.js'
import { insightsRouter } from './routers/insights.js'
import { valueMetricsRouter } from './routers/value-metrics.js'
import { alertsRouter } from './routers/alerts.js'
import { exportsRouter } from './routers/exports.js'
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
  billing: billingRouter,
  insights: insightsRouter,
  valueMetrics: valueMetricsRouter,
  alerts: alertsRouter,
  exports: exportsRouter,
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

import { router } from './trpc.js'
import { funnelsRouter } from './routers/funnels.js'
import { stagesRouter } from './routers/stages.js'
import { integrationsRouter } from './routers/integrations.js'
import { metricsRouter } from './routers/metrics.js'
import { adminRouter } from './routers/admin.js'
import { organizationsRouter } from './routers/organizations.js'

export const appRouter = router({
  funnels: funnelsRouter,
  stages: stagesRouter,
  integrations: integrationsRouter,
  metrics: metricsRouter,
  admin: adminRouter,
  organizations: organizationsRouter,
})

export type AppRouter = typeof appRouter

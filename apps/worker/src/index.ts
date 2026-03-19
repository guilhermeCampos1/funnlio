import 'dotenv/config'
import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { collectMetrics, type CollectMetricsPayload } from './jobs/collect-metrics.js'
import { initScheduler } from './scheduler.js'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const QUEUE_NAME = 'collect-metrics'

// ─── Redis Connection ──────────────────────────────────────────────────────────

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // obrigatório para BullMQ
})

connection.on('connect', () => console.log('[worker] Redis conectado'))
connection.on('error', (err) => console.error('[worker] Redis erro:', err))

// ─── Queue ─────────────────────────────────────────────────────────────────────

const metricsQueue = new Queue<CollectMetricsPayload>(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
})

// ─── Worker ────────────────────────────────────────────────────────────────────

const worker = new Worker<CollectMetricsPayload>(
  QUEUE_NAME,
  async (job) => {
    await collectMetrics(job)
  },
  {
    connection,
    concurrency: 5, // processar até 5 jobs em paralelo
    limiter: {
      max: 30,
      duration: 60_000, // máx 30 requests/min (respeita rate limits das APIs)
    },
  }
)

worker.on('completed', (job) => {
  console.log(`[worker] Job ${job.id} concluído`)
})

worker.on('failed', (job, err) => {
  console.error(`[worker] Job ${job?.id} falhou (tentativa ${job?.attemptsMade}):`, err.message)
})

// ─── Scheduler ─────────────────────────────────────────────────────────────────

initScheduler(metricsQueue)

// ─── Graceful shutdown ──────────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  console.log('[worker] Encerrando...')
  await worker.close()
  await metricsQueue.close()
  await connection.quit()
  process.exit(0)
})

console.log('[worker] Funnlio Worker iniciado')

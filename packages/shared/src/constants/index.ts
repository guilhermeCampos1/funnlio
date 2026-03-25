import type { Plan } from '../types/index.js'

export * from './feature-gates.js'
export * from './plan-limits.js'
export * from './trial-emails.js'

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PLAN_SYNC_INTERVALS: Record<Plan, number> = {
  trial: 24 * 60 * 60 * 1000,   // 24h
  starter: 4 * 60 * 60 * 1000,  // 4h
  pro: 60 * 60 * 1000,           // 1h
  enterprise: 15 * 60 * 1000,   // 15min
}

export const PLAN_FUNNEL_LIMITS: Record<Plan, number> = {
  trial: 2,
  starter: 10,
  pro: 50,
  enterprise: Infinity,
}

export const PLAN_INTEGRATION_LIMITS: Record<Plan, number> = {
  trial: 2,
  starter: 5,
  pro: 20,
  enterprise: Infinity,
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const JOB_MAX_RETRIES = 3

export const JOB_BACKOFF_DELAY = 5000 // 5s inicial, exponencial

// ─── Cache ────────────────────────────────────────────────────────────────────

export const CACHE_TTL_RECENT_METRICS = 15 * 60        // 15min (segundos)
export const CACHE_TTL_HISTORICAL_METRICS = 24 * 60 * 60 // 24h (segundos)

import type { Plan } from '../types/index.js'

export interface PlanLimitConfig {
  maxFunnels: number
  maxIntegrations: number
  maxMembers: number
  maxWebhooks: number
  syncIntervalMinutes: number
  historyRetentionDays: number
  hasExport: boolean
  hasAlerts: boolean
  hasComparison: boolean
  hasPublicLink: boolean
  hasComments: boolean
  hasBenchmarks: boolean
  hasApi: boolean
  hasSso: boolean
  hasWhiteLabel: boolean
  price: { monthly: number; yearly: number } // in BRL cents
}

// Free plan — permanent, real plan (not post-trial degradation)
// FVM (taxa de conversao entre etapas) MUST be available on free
export const FREE_LIMITS: PlanLimitConfig = {
  maxFunnels: 2,
  maxIntegrations: 2,
  maxMembers: 1,
  maxWebhooks: 0,
  syncIntervalMinutes: 0, // manual only — nudge to upgrade for auto sync
  historyRetentionDays: 7,
  hasExport: false,
  hasAlerts: false,
  hasComparison: false,
  hasPublicLink: false,
  hasComments: false,
  hasBenchmarks: false,
  hasApi: false,
  hasSso: false,
  hasWhiteLabel: false,
  price: { monthly: 0, yearly: 0 },
}

export const PLAN_LIMITS: Record<Plan, PlanLimitConfig> = {
  free: FREE_LIMITS,
  trial: {
    // Legacy — kept for backwards compat, new users never get this plan
    ...FREE_LIMITS,
  },
  starter: {
    maxFunnels: 5,
    maxIntegrations: 3,
    maxMembers: 3,
    maxWebhooks: 1,
    syncIntervalMinutes: 240,
    historyRetentionDays: 30,
    hasExport: true,
    hasAlerts: true,
    hasComparison: false,
    hasPublicLink: false,
    hasComments: false,
    hasBenchmarks: false,
    hasApi: false,
    hasSso: false,
    hasWhiteLabel: false,
    price: { monthly: 9700, yearly: 7700 }, // R$97 / R$77
  },
  pro: {
    maxFunnels: 50,
    maxIntegrations: 20,
    maxMembers: 10,
    maxWebhooks: 4,
    syncIntervalMinutes: 60,
    historyRetentionDays: 730,
    hasExport: true,
    hasAlerts: true,
    hasComparison: true,
    hasPublicLink: true,
    hasComments: true,
    hasBenchmarks: true,
    hasApi: false,
    hasSso: false,
    hasWhiteLabel: false,
    price: { monthly: 24700, yearly: 19700 }, // R$247 / R$197
  },
  enterprise: {
    maxFunnels: Infinity,
    maxIntegrations: Infinity,
    maxMembers: Infinity,
    maxWebhooks: Infinity,
    syncIntervalMinutes: 15,
    historyRetentionDays: Infinity,
    hasExport: true,
    hasAlerts: true,
    hasComparison: true,
    hasPublicLink: true,
    hasComments: true,
    hasBenchmarks: true,
    hasApi: true,
    hasSso: true,
    hasWhiteLabel: true,
    price: { monthly: 69700, yearly: 55700 }, // R$697 / R$557
  },
}

// Helper to get effective limits
export function getEffectivePlanLimits(plan: Plan, trialExpired?: boolean): PlanLimitConfig {
  if (plan === 'free') return FREE_LIMITS
  // Legacy: treat expired trial as free
  if (plan === 'trial' && trialExpired) return FREE_LIMITS
  return PLAN_LIMITS[plan]
}

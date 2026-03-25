import type { Plan } from '../types/index.js'

export interface PlanLimitConfig {
  maxFunnels: number
  maxIntegrations: number
  maxMembers: number
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

// Free = post-trial state, not a separate plan enum but uses 'trial' plan with expired trial
export const FREE_LIMITS: PlanLimitConfig = {
  maxFunnels: 1,
  maxIntegrations: 1,
  maxMembers: 1,
  syncIntervalMinutes: 0, // paused
  historyRetentionDays: 30,
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
  trial: {
    // During trial = Pro access
    maxFunnels: 50,
    maxIntegrations: 20,
    maxMembers: 10,
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
    price: { monthly: 0, yearly: 0 },
  },
  starter: {
    maxFunnels: 10,
    maxIntegrations: 5,
    maxMembers: 3,
    syncIntervalMinutes: 240,
    historyRetentionDays: 180,
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

// Helper to get effective limits (handles free/expired trial)
export function getEffectivePlanLimits(plan: Plan, trialExpired: boolean): PlanLimitConfig {
  if (plan === 'trial' && trialExpired) return FREE_LIMITS
  return PLAN_LIMITS[plan]
}

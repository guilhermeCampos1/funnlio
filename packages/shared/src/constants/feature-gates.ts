import type { Plan } from '../types/index.js'

export interface FeatureGateConfig {
  requiredPlan: Plan
  label: string
  value: string // one-line copy explaining why this matters
}

export const FEATURE_GATES: Record<string, FeatureGateConfig> = {
  export_csv: {
    requiredPlan: 'starter',
    label: 'Exportação CSV',
    value: 'Exporte seus dados para análise em planilhas',
  },
  export_pdf: {
    requiredPlan: 'pro',
    label: 'Relatório PDF',
    value: 'Gere relatórios profissionais para seus clientes',
  },
  alerts_email: {
    requiredPlan: 'starter',
    label: 'Alertas por Email',
    value: 'Receba alertas quando suas conversões caírem',
  },
  alerts_slack: {
    requiredPlan: 'pro',
    label: 'Alertas Slack',
    value: 'Notificações em tempo real no canal do seu time',
  },
  comparison: {
    requiredPlan: 'pro',
    label: 'Comparação de Períodos',
    value: 'Compare resultados entre períodos para identificar tendências',
  },
  public_link: {
    requiredPlan: 'pro',
    label: 'Link Público',
    value: 'Compartilhe dashboards com clientes sem login',
  },
  comments: {
    requiredPlan: 'pro',
    label: 'Comentários',
    value: 'Colabore com seu time diretamente nas etapas do funil',
  },
  benchmarks: {
    requiredPlan: 'pro',
    label: 'Benchmarks',
    value: 'Compare seus resultados com médias do mercado',
  },
  weekly_report: {
    requiredPlan: 'starter',
    label: 'Relatório Semanal',
    value: 'Receba um resumo semanal por email automaticamente',
  },
  monthly_report: {
    requiredPlan: 'pro',
    label: 'Relatório Mensal Detalhado',
    value: 'Relatório completo com gráficos e tendências',
  },
  insights: {
    requiredPlan: 'starter',
    label: 'Insights Automáticos',
    value: 'Identifique gargalos e oportunidades automaticamente',
  },
  insights_advanced: {
    requiredPlan: 'pro',
    label: 'Insights Avançados',
    value: 'Todos os tipos de insight + alertas em tempo real',
  },
  api: {
    requiredPlan: 'enterprise',
    label: 'API Pública',
    value: 'Integre o Funnlio com seus sistemas internos',
  },
  sso: {
    requiredPlan: 'enterprise',
    label: 'SSO/SAML',
    value: 'Login único com Okta, Azure AD ou Google Workspace',
  },
  white_label: {
    requiredPlan: 'enterprise',
    label: 'White Label',
    value: 'Personalize com sua marca, cores e domínio',
  },
  webhooks: {
    requiredPlan: 'enterprise',
    label: 'Webhooks',
    value: 'Receba eventos em tempo real no seu sistema',
  },
  granular_permissions: {
    requiredPlan: 'pro',
    label: 'Permissoes Granulares',
    value: 'Defina niveis de acesso (Viewer, Editor, Admin) por membro',
  },
}

// Plan hierarchy for comparison
const PLAN_HIERARCHY: Record<Plan, number> = {
  trial: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
}

export function hasFeatureAccess(
  currentPlan: Plan,
  featureKey: string,
  trialExpired: boolean
): boolean {
  const gate = FEATURE_GATES[featureKey]
  if (!gate) return true // unknown feature = allow
  if (currentPlan === 'trial' && !trialExpired) {
    // During active trial, user has Pro access
    return PLAN_HIERARCHY.pro >= PLAN_HIERARCHY[gate.requiredPlan]
  }
  if (currentPlan === 'trial' && trialExpired) {
    // Expired trial = free, no features
    return false
  }
  return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[gate.requiredPlan]
}

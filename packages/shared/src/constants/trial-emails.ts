export interface TrialEmailConfig {
  day: number
  subject: string
  templateKey: string
  conditional?: string // condition that must be met to send
  description: string
}

export const TRIAL_EMAIL_SEQUENCE: TrialEmailConfig[] = [
  {
    day: 1,
    subject: 'Bem-vindo ao Funnlio! Veja seus dados em 3 minutos',
    templateKey: 'trial_welcome',
    description: 'Boas-vindas + guia para First Value (criar funil + ver métrica)',
  },
  {
    day: 3,
    subject: 'Você já viu suas conversões?',
    templateKey: 'trial_day3_conversions',
    conditional: 'has_integration',
    description: 'Condicional: só envia se conectou integração',
  },
  {
    day: 7,
    subject: 'Metade do trial — explore o que ainda não usou',
    templateKey: 'trial_day7_features',
    description: 'Features não usadas do trial Pro',
  },
  {
    day: 11,
    subject: '3 dias restantes — seus dados estão crescendo',
    templateKey: 'trial_day11_countdown',
    description: 'Urgência + dados acumulados',
  },
  {
    day: 13,
    subject: 'Último dia amanhã — 20% no primeiro mês',
    templateKey: 'trial_day13_lastchance',
    description: 'Desconto urgente + preview do que perde',
  },
  {
    day: 14,
    subject: 'Trial encerrado — seus dados estão congelados',
    templateKey: 'trial_day14_expired',
    description: 'Dados congelados, CTA para ativar',
  },
  {
    day: 21,
    subject: 'Sentimos sua falta no Funnlio',
    templateKey: 'trial_day21_winback',
    description: 'Winback + dados ainda disponíveis',
  },
  {
    day: 60,
    subject: 'Última chance: seus dados serão removidos em 30 dias',
    templateKey: 'trial_day60_final',
    description: 'Urgência final antes de deletar dados',
  },
]

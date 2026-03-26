interface MetricDefinition {
  label: string
  tooltip: string
}

const definitions: Record<string, MetricDefinition> = {
  // Meta Ads
  impressions: {
    label: 'Impressões',
    tooltip: 'Número de vezes que seu anúncio foi exibido na tela de alguém.',
  },
  reach: {
    label: 'Alcance',
    tooltip: 'Número de pessoas únicas que viram seu anúncio.',
  },
  clicks: {
    label: 'Cliques',
    tooltip: 'Total de cliques no anúncio (inclui curtidas, comentários e cliques no link).',
  },
  link_clicks: {
    label: 'Cliques no Link',
    tooltip: 'Cliques que levaram ao seu site ou landing page.',
  },
  spend: {
    label: 'Investimento',
    tooltip: 'Valor total gasto no período selecionado.',
  },
  cpl: {
    label: 'CPL',
    tooltip: 'Custo por Lead — quanto você paga em média por cada lead gerado.',
  },
  ctr: {
    label: 'CTR',
    tooltip: 'Click-Through Rate — percentual de pessoas que clicaram após ver o anúncio. CTR = Cliques / Impressões.',
  },
  cpc: {
    label: 'CPC',
    tooltip: 'Custo por Clique — valor médio pago por cada clique no anúncio.',
  },
  cpm: {
    label: 'CPM',
    tooltip: 'Custo por Mil Impressões — quanto custa exibir o anúncio 1.000 vezes.',
  },
  leads: {
    label: 'Leads',
    tooltip: 'Contatos que demonstraram interesse (preencheram formulário, clicaram em CTA, etc.).',
  },
  landing_page_views: {
    label: 'Visualizações da LP',
    tooltip: 'Vezes que a landing page carregou completamente após o clique no anúncio.',
  },

  // Pipedrive
  leads_count: {
    label: 'Leads',
    tooltip: 'Total de leads no pipeline selecionado.',
  },
  leads_in_stage: {
    label: 'Leads na Etapa',
    tooltip: 'Leads que estão atualmente na etapa selecionada do pipeline.',
  },
  deals_won: {
    label: 'Negócios Ganhos',
    tooltip: 'Número de deals marcados como "Ganho" no período.',
  },
  deals_lost: {
    label: 'Negócios Perdidos',
    tooltip: 'Número de deals marcados como "Perdido" no período.',
  },
  revenue_won: {
    label: 'Receita',
    tooltip: 'Receita total dos negócios ganhos no período.',
  },
  average_ticket: {
    label: 'Ticket Médio',
    tooltip: 'Valor médio dos negócios ganhos. Receita total / Número de negócios.',
  },
  conversion_rate: {
    label: 'Taxa de Conversão',
    tooltip: 'Percentual de leads que se tornaram negócios ganhos.',
  },

  // Google Ads
  cost: {
    label: 'Custo',
    tooltip: 'Valor total gasto no Google Ads no período.',
  },
  conversions: {
    label: 'Conversões',
    tooltip: 'Ações valiosas realizadas (compras, cadastros, etc.) rastreadas pelo Google Ads.',
  },
  cpa: {
    label: 'CPA',
    tooltip: 'Custo por Aquisição — quanto custa em média cada conversão.',
  },
  conversion_rate_gads: {
    label: 'Taxa de Conversão',
    tooltip: 'Percentual de cliques que resultaram em conversão.',
  },

  // Clarity
  sessions: {
    label: 'Sessões',
    tooltip: 'Número de visitas ao site. Uma sessão termina após 30 min de inatividade.',
  },
  users: {
    label: 'Usuários',
    tooltip: 'Número de visitantes únicos no período.',
  },
  scroll_depth: {
    label: 'Profundidade de Scroll',
    tooltip: 'Percentual médio da página que os visitantes rolam antes de sair.',
  },
  dead_clicks: {
    label: 'Dead Clicks',
    tooltip: 'Cliques em elementos não-clicáveis — indica confusão na interface.',
  },
  rage_clicks: {
    label: 'Rage Clicks',
    tooltip: 'Cliques repetidos e rápidos no mesmo lugar — indica frustração do usuário.',
  },
  bounce_rate: {
    label: 'Taxa de Rejeição',
    tooltip: 'Percentual de visitantes que saíram sem interagir com a página.',
  },

  // GA4
  pageviews: {
    label: 'Pageviews',
    tooltip: 'Total de páginas visualizadas (inclui visualizações repetidas).',
  },
  avg_session_duration: {
    label: 'Duração Média',
    tooltip: 'Tempo médio que os visitantes permanecem no site.',
  },
}

export function getMetricTooltip(metricKey: string): string | null {
  return definitions[metricKey]?.tooltip ?? null
}

export function getMetricDefinition(metricKey: string): MetricDefinition | null {
  return definitions[metricKey] ?? null
}

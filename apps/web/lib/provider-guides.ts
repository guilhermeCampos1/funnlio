interface FieldGuide {
  steps: Array<{ text: string }>
  link?: { url: string; label: string }
  note?: string
}

type ProviderGuides = Record<string, Record<string, FieldGuide>>

export const providerGuides: ProviderGuides = {
  meta_ads: {
    access_token: {
      steps: [
        { text: 'Acesse developers.facebook.com e faça login' },
        { text: 'Vá em "Minhas Apps" ou crie uma nova app do tipo "Business"' },
        { text: 'No painel da app, vá em Ferramentas > Graph API Explorer' },
        { text: 'Selecione sua app no dropdown' },
        { text: 'Em "Permissões", adicione: ads_read, ads_management' },
        { text: 'Clique em "Gerar Token de Acesso"' },
        { text: 'Copie o token gerado e cole aqui' },
      ],
      link: {
        url: 'https://developers.facebook.com/tools/explorer/',
        label: 'Abrir Graph API Explorer',
      },
      note: 'Tokens de curta duração expiram em 1 hora. Para um token de longa duração, vá em Ferramentas > Access Token Debugger e clique em "Estender Token".',
    },
    ad_account_id: {
      steps: [
        { text: 'Acesse business.facebook.com' },
        { text: 'Vá em Configurações do Negócio > Contas > Contas de Anúncio' },
        { text: 'Selecione a conta desejada' },
        { text: 'O ID aparece no topo (formato: act_XXXXXXXXXX)' },
        { text: 'Copie o ID completo (incluindo "act_") e cole aqui' },
      ],
      link: {
        url: 'https://business.facebook.com/settings/ad-accounts',
        label: 'Abrir Gerenciador de Negócios',
      },
    },
    campaign_ids: {
      steps: [
        { text: 'Acesse o Gerenciador de Anúncios do Facebook' },
        { text: 'Vá na aba "Campanhas"' },
        { text: 'O ID de cada campanha aparece na coluna de detalhes ou na URL ao clicar nela' },
        { text: 'Copie os IDs das campanhas que deseja monitorar' },
      ],
      link: {
        url: 'https://www.facebook.com/adsmanager/manage/campaigns',
        label: 'Abrir Gerenciador de Anúncios',
      },
      note: 'Opcional. Se não informar, o Funnlio buscará dados de todas as campanhas da conta.',
    },
  },

  pipedrive: {
    api_token: {
      steps: [
        { text: 'Faça login no seu Pipedrive' },
        { text: 'Clique no seu avatar (canto superior direito)' },
        { text: 'Vá em Configurações Pessoais > API' },
        { text: 'Seu token pessoal aparece na página' },
        { text: 'Copie e cole aqui' },
      ],
      link: {
        url: 'https://app.pipedrive.com/settings/api',
        label: 'Abrir Configurações do Pipedrive',
      },
    },
    company_domain: {
      steps: [
        { text: 'Olhe a URL quando você acessa o Pipedrive' },
        { text: 'Se você acessa "suaempresa.pipedrive.com"...' },
        { text: 'Seu domínio é "suaempresa"' },
        { text: 'Cole apenas o subdomínio, sem ".pipedrive.com"' },
      ],
    },
  },

  google_ads: {
    developer_token: {
      steps: [
        { text: 'Acesse ads.google.com e faça login' },
        { text: 'Vá em Ferramentas e Configurações > Centro de API' },
        { text: 'Seu Developer Token aparece na página' },
        { text: 'Se for a primeira vez, solicite acesso básico' },
      ],
      link: {
        url: 'https://ads.google.com/aw/apicenter',
        label: 'Abrir Google Ads API Center',
      },
      note: 'O nível "Test Account" já funciona para contas de teste.',
    },
    customer_id: {
      steps: [
        { text: 'Acesse ads.google.com' },
        { text: 'O Customer ID aparece no canto superior direito (formato: XXX-XXX-XXXX)' },
        { text: 'Copie sem os traços (apenas números) e cole aqui' },
      ],
      link: {
        url: 'https://ads.google.com',
        label: 'Abrir Google Ads',
      },
    },
  },

  microsoft_clarity: {
    project_id: {
      steps: [
        { text: 'Acesse clarity.microsoft.com e faça login' },
        { text: 'Selecione o projeto desejado' },
        { text: 'Vá em Configurações > Visão Geral' },
        { text: 'O Project ID aparece na URL e na página de configurações' },
        { text: 'Copie e cole aqui' },
      ],
      link: {
        url: 'https://clarity.microsoft.com',
        label: 'Abrir Clarity',
      },
    },
    api_key: {
      steps: [
        { text: 'No painel do Clarity, vá em Configurações > API' },
        { text: 'Gere uma nova API Key' },
        { text: 'Copie e cole aqui' },
      ],
      link: {
        url: 'https://learn.microsoft.com/en-us/clarity/',
        label: 'Documentação da API',
      },
      note: 'A API Key só é exibida uma vez ao ser criada. Salve em local seguro.',
    },
  },

  google_analytics: {
    property_id: {
      steps: [
        { text: 'Acesse analytics.google.com' },
        { text: 'Vá em Administração (engrenagem no canto inferior esquerdo)' },
        { text: 'Na coluna "Propriedade", clique em "Detalhes da Propriedade"' },
        { text: 'O Property ID é numérico (ex: 123456789)' },
        { text: 'Copie e cole aqui' },
      ],
      link: {
        url: 'https://analytics.google.com',
        label: 'Abrir Google Analytics',
      },
    },
  },
}

export function getFieldGuide(providerSlug: string, fieldKey: string): FieldGuide | null {
  return providerGuides[providerSlug]?.[fieldKey] ?? null
}

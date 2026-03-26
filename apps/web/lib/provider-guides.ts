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
        { text: 'Faca login no seu Pipedrive' },
        { text: 'Clique no seu avatar (canto superior direito)' },
        { text: 'Va em Configuracoes Pessoais > API' },
        { text: 'Seu token pessoal aparece na pagina' },
        { text: 'Copie e cole aqui' },
      ],
      link: {
        url: 'https://app.pipedrive.com/settings/api',
        label: 'Abrir Configuracoes do Pipedrive',
      },
    },
    company_domain: {
      steps: [
        { text: 'Olhe a URL quando voce acessa o Pipedrive' },
        { text: 'Se voce acessa "suaempresa.pipedrive.com"...' },
        { text: 'Seu dominio e "suaempresa"' },
        { text: 'Cole apenas o subdominio, sem ".pipedrive.com"' },
      ],
    },
    pipeline_id: {
      steps: [
        { text: 'No Pipedrive, va em "Negocios" no menu lateral' },
        { text: 'Selecione o pipeline desejado no dropdown' },
        { text: 'O ID do pipeline aparece na URL (ex: /pipeline/1)' },
        { text: 'Ou use o botao "Listar recursos" apos conectar para selecionar' },
      ],
      note: 'Apos conectar, voce podera selecionar o pipeline diretamente ao configurar a etapa do funil.',
    },
    stage_ids: {
      steps: [
        { text: 'Dentro do pipeline, cada coluna e um estagio (stage)' },
        { text: 'Ao configurar a etapa do funil, voce podera selecionar o estagio' },
        { text: 'Deixe vazio para considerar todos os estagios do pipeline' },
      ],
      note: 'Opcional. Se vazio, consideramos todos os estagios.',
    },
  },

  google_ads: {
    customer_id: {
      steps: [
        { text: 'Primeiro, clique em "Autenticar com Google" acima' },
        { text: 'Autorize o acesso a sua conta Google Ads' },
        { text: 'Depois, acesse ads.google.com' },
        { text: 'O Customer ID aparece no canto superior direito (formato: XXX-XXX-XXXX)' },
        { text: 'Cole com ou sem tracos — aceitamos ambos formatos' },
      ],
      link: {
        url: 'https://ads.google.com',
        label: 'Abrir Google Ads',
      },
      note: 'A autenticacao Google e feita automaticamente via OAuth. Voce so precisa do Customer ID.',
    },
    campaign_ids: {
      steps: [
        { text: 'No Google Ads, va na aba "Campanhas"' },
        { text: 'Clique na campanha desejada' },
        { text: 'O ID aparece na URL (ex: campaignId=123456)' },
        { text: 'Copie os IDs das campanhas que deseja monitorar' },
      ],
      link: {
        url: 'https://ads.google.com',
        label: 'Abrir Google Ads',
      },
      note: 'Opcional. Se nao informar, o Funnlio buscara dados de todas as campanhas.',
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
        { text: 'Primeiro, clique em "Autenticar com Google" acima' },
        { text: 'Autorize o acesso a sua conta Google Analytics' },
        { text: 'Depois, acesse analytics.google.com' },
        { text: 'Va em Administracao (engrenagem no canto inferior esquerdo)' },
        { text: 'Na coluna "Propriedade", clique em "Detalhes da Propriedade"' },
        { text: 'O Property ID e numerico (ex: 123456789)' },
        { text: 'Copie e cole aqui' },
      ],
      link: {
        url: 'https://analytics.google.com',
        label: 'Abrir Google Analytics',
      },
      note: 'A autenticacao Google e feita automaticamente via OAuth. Voce so precisa do Property ID.',
    },
    event_names: {
      steps: [
        { text: 'No GA4, va em Relatorios > Engajamento > Eventos' },
        { text: 'Voce vera todos os eventos rastreados' },
        { text: 'Copie os nomes dos eventos que deseja monitorar (ex: purchase, sign_up)' },
      ],
      note: 'Opcional. Se vazio, o Funnlio usa metricas agregadas.',
    },
  },

  slack: {
    bot_token: {
      steps: [
        { text: 'Acesse api.slack.com/apps e faca login' },
        { text: 'Crie uma nova app (From scratch)' },
        { text: 'Va em "OAuth & Permissions"' },
        { text: 'Em "Bot Token Scopes", adicione: chat:write, channels:read' },
        { text: 'Clique em "Install to Workspace" e autorize' },
        { text: 'Copie o "Bot User OAuth Token" (comeca com xoxb-)' },
      ],
      link: {
        url: 'https://api.slack.com/apps',
        label: 'Abrir Slack Apps',
      },
      note: 'O bot precisa ser convidado para o canal onde voce quer receber alertas (/invite @nomedoBot).',
    },
    channel_id: {
      steps: [
        { text: 'No Slack, clique com botao direito no canal desejado' },
        { text: 'Clique em "Ver detalhes do canal"' },
        { text: 'Role ate o final — o Channel ID aparece la (ex: C0123456789)' },
      ],
      note: 'Opcional. Se vazio, voce escolhe o canal ao configurar cada alerta.',
    },
  },
}

export function getFieldGuide(providerSlug: string, fieldKey: string): FieldGuide | null {
  return providerGuides[providerSlug]?.[fieldKey] ?? null
}

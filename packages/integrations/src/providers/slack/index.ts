import { BaseProvider } from '../../core/base-provider.js'
import type {
  Credentials,
  FetchMetricsOptions,
  FetchMetricsResult,
  ValidateCredentialsResult,
  ResourceItem,
} from '../../core/types.js'
import type { ProviderConfigSchema, ProviderMetric } from '@funnlio/shared'

interface SlackAuthTestResponse {
  ok: boolean
  team?: string
  team_id?: string
  user?: string
  user_id?: string
  error?: string
}

interface SlackChannel {
  id: string
  name: string
  is_channel: boolean
  is_private: boolean
}

interface SlackConversationsResponse {
  ok: boolean
  channels?: SlackChannel[]
  error?: string
}

export class SlackProvider extends BaseProvider {
  readonly slug = 'slack'
  readonly name = 'Slack'
  readonly description = 'Receba alertas e relatorios no Slack do seu time'
  readonly category = 'messaging' as const
  readonly iconUrl = '/icons/slack.svg'

  readonly configSchema: ProviderConfigSchema = {
    authType: 'oauth2',
    fields: [
      {
        key: 'bot_token',
        label: 'Bot Token',
        type: 'password',
        required: true,
        helpText: 'Token do bot Slack (xoxb-...). Crie um Slack App em api.slack.com/apps, instale no workspace e copie o Bot User OAuth Token.',
        placeholder: 'xoxb-...',
      },
      {
        key: 'channel_id',
        label: 'Canal padrao',
        type: 'select',
        required: false,
        helpText: 'Canal onde as notificacoes serao enviadas. Se vazio, voce pode escolher por alerta.',
      },
    ],
  }

  // Slack is a messaging provider — no metrics to fetch
  readonly availableMetrics: ProviderMetric[] = []

  async validateCredentials(credentials: Credentials): Promise<ValidateCredentialsResult> {
    const { bot_token } = credentials
    if (!bot_token) {
      return { valid: false, errorMessage: 'Bot token e obrigatorio' }
    }

    if (!bot_token.startsWith('xoxb-')) {
      return {
        valid: false,
        errorMessage: 'Token invalido. O Bot Token comeca com "xoxb-". Verifique se copiou o Bot User OAuth Token (nao o User Token).',
      }
    }

    try {
      const response = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bot_token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json() as SlackAuthTestResponse

      if (!data.ok) {
        return {
          valid: false,
          errorMessage: `Slack retornou erro: ${data.error ?? 'desconhecido'}. Verifique se o token ainda e valido.`,
        }
      }

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        errorMessage: `Erro ao validar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      }
    }
  }

  async fetchMetrics(_options: FetchMetricsOptions): Promise<FetchMetricsResult> {
    // Slack is not a metrics provider
    return { data: [], rawResponse: null, collectedAt: new Date() }
  }

  async listResources(credentials: Credentials, resourceType: string): Promise<ResourceItem[]> {
    const { bot_token } = credentials

    if (resourceType === 'channels') {
      try {
        const response = await fetch(
          'https://slack.com/api/conversations.list?types=public_channel&limit=200',
          {
            headers: { 'Authorization': `Bearer ${bot_token}` },
          }
        )
        const data = await response.json() as SlackConversationsResponse

        if (!data.ok || !data.channels) return []

        return data.channels
          .filter((ch) => !ch.is_private)
          .map((ch) => ({
            id: ch.id,
            label: `#${ch.name}`,
          }))
      } catch {
        return []
      }
    }

    return []
  }
}

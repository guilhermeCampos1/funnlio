# Plano — Fase 5 UX/Product Polish (Batch de Correções)

> Data: 2026-03-25
> Validado por: Reed Richards (pricing/growth), Guilherme (produto)

## Contexto

Revisão funcional completa do produto revelou ~20 problemas de UX, lógica e produto que impactam diretamente a qualidade percebida antes do lançamento. Este documento detalha todas as correções, novas features e decisões de produto.

---

## I. Revisão do Modelo de Negócio (validado pelo Reed Richards)

### Decisão: SEM trial — apenas plano Free permanente

O usuário entra direto no Free plan (via Google Login) e evolui organicamente dentro da plataforma. A ascensão acontece via tensão de features/limites conforme ele usa.

**Impacto técnico:**
- Remover toda lógica de `trialExpired`, `planExpiresAt`, `TrialBanner`, `TrialProgressCard`
- `PLAN_LIMITS.trial` → não mais usado (manter no enum mas nunca atribuir a novos users)
- `hasFeatureAccess`: simplificar — sem `trialExpired` como parâmetro
- `feature-gates.ts`: remover caso especial de trial
- Signup: criar organização com `plan: 'free'` direto

### ALERTA CRÍTICO do Reed Richards

**O FVM (taxa de conversão entre etapas) DEVE existir no free.** É o único valor diferencial do produto. Se o free não entrega o FVM, não é uma vitrine — é um formulário de cadastro.

### Estrutura revisada dos planos

| Feature | Free | Starter R$97 | Pro R$247 | Enterprise |
|---|---|---|---|---|
| Funis ativos | **2** | 5 | 50 | Ilimitado |
| Integrações | **2** | 3 | 20 | Ilimitado |
| Sync | Manual (nudge) | Auto 4h | Auto 1h | 15min |
| **Taxa de conversão (FVM)** | **SIM** | SIM | SIM | SIM |
| Gráfico histórico | 7 dias | 30 dias | 24 meses | Ilimitado |
| Alertas | Nenhum | 1/dia email | Email + Slack | Tudo |
| Webhooks | 0 | 1 | 4 | Ilimitado |
| Comparação de períodos | Não | Não | SIM | SIM |
| Relatórios automáticos | Não | Semanal email | PDF + link público | Custom |
| Insights avançados | Não | Não | SIM | SIM |
| Membros | 1 | 3 | 10 | Ilimitado |
| API, SSO, White-label | Não | Não | Não | SIM |

### Webhooks por plano — análise de custo

**Custo real: praticamente zero.** Webhooks são HTTP POSTs disparados do worker BullMQ (já rodando na Railway). Não há infrastructure nova.

- **Starter (1 webhook):** max 5 funis x sync 4h = ~30 eventos/dia/user. Com 100 users = 3.000 calls/dia. Custo negligível.
- **Pro (4 webhooks):** 50 funis x sync 1h = ~1.200 eventos/dia/user x 4 endpoints = 4.800 calls/dia/user. < R$1/mês no Railway.
- **Log storage:** < 10MB/mês. Custo: zero.

**Conclusão:** 1 webhook no Starter e 4 no Pro é 100% viável sem custo adicional.

### Nudge de sync no free

Quando o usuário faz sync manual: toast → _"Você acabou de fazer isso manualmente. No Starter, isso acontece automático a cada 4h."_

### Signup: Google Login ONLY

Apenas Google Login. Sem email/senha. 1 clique → Google OAuth → dentro da plataforma.

### Página de planos

- 3 cards lado a lado: **Free** | **Starter** | **Pro**
- Enterprise: seção separada abaixo com fundo distinto, "Fale conosco", sem preço exibido

---

## A. Alertas

**Arquivo:** `apps/web/components/settings/alerts-page-client.tsx`

### A1 — Visibilidade do toggle OFF

Toggle OFF usa `bg-muted` com thumb `bg-white` → invisível.
Fix: `checked ? 'bg-primary' : 'bg-zinc-300'`

### A2 — Confusão "Ativo mas sem canal"

Toggle "Ativo" = ON, Email = OFF, Slack = OFF → alerta não vai a lugar nenhum.
Fix: Texto explicativo inline: _"Alertas ativos sem canal configurado aparecem apenas nas notificações in-app."_

### A3 — Slack toggle ativa sem verificar integração

Fix:
- `handleToggle('slackEnabled', true)` → verificar se existe integração Slack conectada
- Se não: modal "Conecte sua workspace Slack primeiro" + botão → `/integrations`
- Se plano não tem acesso: `LockedFeatureOverlay` com CTA de upgrade

---

## B. Relatórios

**Arquivo:** `apps/web/components/settings/reports-page-client.tsx`

### B1 — Visibilidade toggle (mesmo fix de A1)

### B2 — Selector de funil por relatório

Adicionar campo `funnelScope: 'all' | 'selected'` + lista de funis via `trpc.funnels.list`.
Router: adicionar `funnelIds: z.array(z.string()).optional()` em `reports.upsertSetting`.

### B3 — Layout: accordion ao invés de 3 seções abertas

Mostrar apenas Diário expandido por padrão, os demais collapsed. Se já configurado: expandido.

### B4 — Canal Slack nos relatórios

Adicionar `channels: { email: boolean; slack: boolean }`. Slack: verificar integração conectada e gate de plano (Pro+).

### B5 — Ícone do header

Trocar `Bell` por `FileText` no título da página (conflito com Alertas).

---

## C. Integrações

**Arquivos:** `integrations-page-client.tsx` + `connect-integration-sheet.tsx`

### C1 — UX double-click eliminada

Clicar em card de provider abre sheet diretamente no step "configure":
- Adicionar `initialProviderId?: string` ao `ConnectIntegrationSheet`
- Se presente: `useEffect` chama `handleSelectProvider(initialProviderId)` → pula step "select"

### C2 — Cards conectados mais claros

- Connected: borda verde (`border-green-200 bg-green-50/30`), badge proeminente, sem opacidade baixa
- Adicionar cadeado para providers acima do limite do plano

### C3 — Ícones oficiais Google Ads, Clarity e Slack

`apps/web/components/ui/provider-icons.tsx`:
- GoogleAdsIcon: SVG oficial (triângulo + círculos coloridos)
- ClarityIcon: logo oficial Microsoft Clarity
- SlackIcon: hashmark colorido oficial

### C4 — Upgrade modal ao conectar integração além do limite

Verificar limite antes de abrir o sheet. Se atingido: `LimitReachedModal` com contexto e CTA.

---

## D. Billing/Planos

**Arquivo:** `apps/web/components/settings/billing-page-client.tsx`

### D1 — Default para anual

`useState<BillingCycle>('monthly')` → `useState<BillingCycle>('yearly')`

### D2 — BillingToggle: tabs ao invés de switch

Dois botões tab (mensal/anual). Badge verde "-20%" na opção anual sempre visível.

### D3 — Enterprise: "Fale conosco"

Seção separada abaixo dos 3 cards, sem preço, botão "Fale conosco" (email).

### D4 — Upgrade button error handling

`onError` no `createCheckout.useMutation` com mensagem amigável + contato.

### D5 — Free plan no billing

Adicionar card Free à lista de planos com limites do free. Mostrar "Plano Atual" se user é free.

### D6 — SSO/SAML tooltip

Tooltip: _"Single Sign-On — permita que sua equipe faça login com Okta, Azure AD ou Google Workspace."_

---

## E. Sidebar

**Arquivo:** `apps/web/components/layout/sidebar.tsx`

### E1 — Seção "Avançado" separada

Nova seção no nav com separador e label "AVANÇADO":
- API Keys, Webhooks, Auditoria (saem de Configurações)
- SSO com badge Enterprise

### E2 — Notification Bell

Componente `NotificationBell` no sidebar header:
- `trpc.insights.getUnreadCount` (router já existe)
- Badge vermelho com contagem
- Popover com últimos 5 insights/alertas + "Ver todos"

---

## F. Notification Bell — Novo componente

**Arquivo novo:** `apps/web/components/layout/notification-bell.tsx`

- Usa `trpc.insights.getUnreadCount` e `trpc.insights.list(limit=5)` (já existem)
- Radix Popover com lista de notificações
- Badge de contagem (vermelho, desaparece ao abrir)

---

## G. Meta Ads — Token Error

O erro "deve ter 64 caracteres hex" vem da API do Meta (localizada em PT-BR). Nosso `validateCredentials` passa o erro direto.

Fix: Mapear erros comuns para mensagens úteis. Atualizar helpText do campo access_token com instruções claras sobre tipo de token.

---

## H. Slack como Provider de Integração

### H1 — Slack OAuth Provider

**Novo provider:** `packages/integrations/src/providers/slack/index.ts`
- `authType: 'oauth2'`, `category: 'messaging'`
- `validateCredentials`: `https://slack.com/api/auth.test`
- `listResources`: lista canais (`conversations.list`)
- NÃO tem `fetchMetrics` (notificação, não dados)

**OAuth flow:**
- `SLACK_CLIENT_ID` + `SLACK_CLIENT_SECRET` nas env vars
- Rota: `apps/web/app/api/auth/slack/route.ts`
- Callback: `apps/web/app/api/auth/slack/callback/route.ts`
- Scopes: `chat:write`, `channels:read`, `channels:join`

### H2 — Relatórios In-Platform

**Página nova:** `apps/web/app/(app)/reports/page.tsx`

Layout:
- Tabs: Diário | Semanal | Mensal
- Seletor de funil (dropdown)
- ReportView: métricas do período + gráfico + top 3 insights
- Link "Configurar envio" → /reports/settings

tRPC: `reports.generatePreview({ frequency, funnelId? })` — renderiza dados existentes, sem nova tabela.

---

## Arquivos a modificar/criar

| Arquivo | Mudanças |
|---|---|
| `apps/web/components/settings/alerts-page-client.tsx` | Toggle visibility, Slack gate, canal explicação |
| `apps/web/components/settings/reports-page-client.tsx` | Toggle visibility, funnel selector, accordion, canal Slack |
| `apps/web/components/integrations/integrations-page-client.tsx` | Cards visuais, preselect provider, upgrade modal |
| `apps/web/components/integrations/connect-integration-sheet.tsx` | Accept `initialProviderId`, pular step select |
| `apps/web/components/ui/provider-icons.tsx` | Ícones Google Ads, Clarity e Slack oficiais |
| `apps/web/components/settings/billing-page-client.tsx` | Annual default, tab toggle, 3 cards + Enterprise, Free card, error handling |
| `apps/web/components/layout/sidebar.tsx` | Seção Avançado, NotificationBell, /reports no nav |
| `apps/web/components/layout/notification-bell.tsx` | **NOVO** — Bell + Popover |
| `apps/web/app/(app)/reports/page.tsx` | **NOVO** — Relatórios in-platform |
| `apps/web/app/(app)/reports/settings/page.tsx` | **NOVO** — Config de envio por email |
| `apps/web/app/api/auth/slack/route.ts` | **NOVO** — Inicia OAuth Slack |
| `apps/web/app/api/auth/slack/callback/route.ts` | **NOVO** — Callback OAuth |
| `packages/integrations/src/providers/slack/index.ts` | **NOVO** — SlackProvider |
| `packages/integrations/src/registry.ts` | Registrar SlackProvider |
| `packages/integrations/src/providers/meta-ads/index.ts` | Error mapping + helpText |
| `packages/api/src/routers/reports.ts` | funnelIds, slackChannelId, generatePreview |
| `packages/db/src/seeds/integration-providers.ts` | Seed do Slack |
| `packages/shared/src/constants/plan-limits.ts` | FREE_LIMITS, maxWebhooks por plano |
| `packages/shared/src/constants/feature-gates.ts` | webhooks → starter; remover lógica trial |
| `packages/api/src/routers/webhooks-config.ts` | Limit check por plano |
| `apps/web/app/(auth)/signup/page.tsx` | Google Login ONLY |

---

## Ordem de execução

1. Free plan: ajuste de limites + remover trial (I) — constants, feature-gates
2. Signup: Google Login ONLY (I)
3. Toggles visibility (A1, B1)
4. Double-click integrations UX (C1)
5. Billing: annual default + tab toggle + 3 cards + Enterprise CTA (D1-D6)
6. Provider icons: Google Ads, Clarity, Slack (C3)
7. Notification Bell (E2, F)
8. Sidebar: Avançado + /reports no nav (E1)
9. Slack provider + OAuth flow (H1)
10. Reports in-platform (H2)
11. Alerts: Slack gate + canal explicação (A2, A3)
12. Reports: funnel selector + Slack canal (B2-B4)
13. Integrations: cards visuais + upgrade modal (C2, C4)
14. Billing: error handling (D4)
15. Meta Ads: error mapping (G)
16. Webhooks: 1 no Starter, 4 no Pro (I)

---

## Verificação

- `pnpm type-check` sem erros
- Signup mostra apenas botão Google
- Página de planos: 3 cards (Free/Starter/Pro) + Enterprise abaixo
- Toggles OFF visíveis nos alertas e relatórios
- Clique direto no card Meta Ads abre sheet no step "configure"
- Relatório diário: campo de funis aparece
- Sidebar: seção Avançado visível com API Keys, Webhooks, Auditoria
- Sino com badge aparece ao ter insights
- Slack aparece em /integrations como provider
- Página /reports mostra relatório dinâmico

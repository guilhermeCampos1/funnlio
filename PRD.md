# PRD — Funnlio

**Versão:** 0.1
**Data:** 2026-03-18
**Status:** Em desenvolvimento — Fase 1 (MVP)

---

## 1. Visão do Produto

Funnlio é um SaaS B2B para análise complexa de funis de marketing. O produto permite que times de marketing visualizem, em um único dashboard, todos os seus funis ativos com as métricas de cada etapa — independentemente de qual ferramenta aquela etapa utiliza.

A grande diferença do Funnlio para ferramentas genéricas de BI é que o produto é construído **para funis de marketing** desde o início: ele entende que cada etapa da jornada pode viver em uma ferramenta diferente, e torna trivial conectar e comparar essas métricas em uma única visão.

### Exemplo real de funil (Webinário)

| Etapa | Ferramenta | Métricas |
|---|---|---|
| Captação | Meta Ads | Impressões, Cliques, CPL, Investimento |
| Landing Page | Microsoft Clarity | Sessões, Scroll depth, Taxa de rejeição |
| Entrada no grupo | Pipedrive | Leads no pipeline X |
| Participação na live | Pipedrive | Leads na etapa Y do pipeline |
| Vendas | Pipedrive | Deals won, Receita, Ticket médio |

O Funnlio calcula automaticamente a **taxa de conversão entre cada etapa**, mostrando onde o funil está perdendo pessoas.

---

## 2. Usuários e Personas

**Persona principal — Gestor de Marketing**
- Coordena campanhas em múltiplas ferramentas
- Quer visão consolidada do funil sem montar relatórios manuais
- Precisa identificar rapidamente qual etapa está com gargalo

**Persona secundária — Dono de agência / Consultor**
- Gerencia funis de vários clientes
- Precisa de múltiplas organizações isoladas
- Quer relatórios prontos para apresentar

**Persona admin — Dono do SaaS (Guilherme)**
- Monitora saúde da plataforma
- Acompanha crescimento, churn e MRR
- Tem visão de todas as organizações

---

## 3. Princípios de Design do Produto

1. **Configurabilidade total** — usuário escolhe qual ferramenta em cada etapa e quais métricas exibir
2. **Multi-tenant nativo** — cada organização é completamente isolada (RLS no banco)
3. **Dados sempre frescos** — coleta automática em background, sem o usuário precisar "atualizar"
4. **Zero lock-in de ferramenta** — adicionar nova integração = criar uma classe e registrar no registry
5. **Instantâneo no front** — dados servidos de cache (Redis), nunca esperar API externa

---

## 4. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript (strict) |
| Frontend | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| API | tRPC (type-safe end-to-end) |
| ORM | Drizzle ORM |
| Banco | PostgreSQL (Supabase) |
| Cache | Redis (Upstash) |
| Filas | BullMQ (Railway) |
| Auth | Better Auth |
| Monorepo | Turborepo + pnpm workspaces |
| Deploy web | Vercel |
| Deploy worker | Railway |
| Email | Resend + React Email |
| Monitoring | Sentry + PostHog |

---

## 5. Arquitetura do Projeto

```
funnlio/
├── apps/
│   ├── web/          → Next.js 15: frontend + API handlers
│   └── worker/       → Background jobs: coleta de métricas
└── packages/
    ├── db/           → Schema Drizzle + migrations + seeds
    ├── integrations/ → Adaptadores das ferramentas externas
    ├── api/          → Routers tRPC (contrato da API)
    └── shared/       → Types, utils e constants compartilhados
```

### Fluxo de coleta de dados

```
Scheduler (cron por plano)
  → Enfileira jobs no BullMQ
  → Worker busca stage + integration do DB
  → Decrypt credenciais → chama provider.fetchMetrics()
  → Salva em metric_snapshots
  → Invalida cache Redis
  → Dashboard serve do cache (< 1ms)
```

---

## 6. Schema do Banco de Dados

### Tabelas principais

| Tabela | Propósito |
|---|---|
| `organizations` | Tenants (clientes do SaaS) |
| `users` | Usuários globais |
| `organization_members` | Vínculo user ↔ org com role |
| `sessions` | Sessões do Better Auth |
| `funnels` | Funis de marketing por org |
| `funnel_stages` | Etapas ordenadas de cada funil |
| `integration_providers` | Catálogo global de ferramentas disponíveis |
| `integrations` | Conexões de uma org com uma ferramenta (credentials encrypted) |
| `stage_metric_configs` | Quais métricas exibir em cada etapa |
| `metric_snapshots` | Histórico de dados coletados por etapa |
| `sync_jobs` | Registro de cada execução de coleta |
| `usage_events` | Eventos de uso por org (para billing/admin) |
| `monthly_usage_summary` | Resumo mensal agregado por org |
| `audit_logs` | Log de ações para compliance e debugging |

### Multi-tenancy
Isolamento garantido via **Row Level Security (RLS)** do PostgreSQL. Toda query filtra automaticamente por `organization_id` via JWT da sessão.

---

## 7. Integrações Disponíveis

| Provider | Categoria | Status | Métricas disponíveis |
|---|---|---|---|
| Meta Ads | Ads | ✅ Implementado | Impressões, Alcance, Cliques, Gasto, CPL, CTR, CPC, Leads, Link Clicks, LP Views |
| Pipedrive | CRM | ✅ Implementado | Leads no pipeline, Leads na etapa, Deals won/lost, Receita, Ticket médio, Conversão |
| Google Ads | Ads | 🔜 Stub criado | Impressões, Cliques, Custo, Conversões, CTR, CPC, Taxa de conversão |
| Microsoft Clarity | Heatmap | 🔜 Stub criado | Sessões, Usuários, Scroll depth, Dead clicks, Rage clicks, Bounce rate |
| Google Analytics 4 | Analytics | 🔜 Stub criado | Sessões, Usuários, Pageviews, Bounce rate, Duração, Conversões |

**Como adicionar nova integração:**
1. Criar classe em `packages/integrations/src/providers/<slug>/index.ts` estendendo `BaseProvider`
2. Registrar em `packages/integrations/src/registry.ts`
3. Rodar seed para atualizar `integration_providers` no banco

---

## 8. Planos e Limites

| Plano | Sync interval | Funis | Integrações | Preço (referência) |
|---|---|---|---|---|
| Trial | 24h | 2 | 2 | Grátis |
| Starter | 4h | 10 | 5 | ~R$97/mês |
| Pro | 1h | 50 | 20 | ~R$297/mês |
| Enterprise | 15min | Ilimitado | Ilimitado | Sob consulta |

---

## 9. Painel de Admin do SaaS

Acessível apenas para usuários com `role = 'saas_admin'` via `/admin/*`.

| Página | Conteúdo |
|---|---|
| `/admin/overview` | MRR, churn, DAU/MAU, jobs executados/falhos nas últimas 24h, latência por provider |
| `/admin/organizations` | Lista de clientes com status de saúde (verde/amarelo/vermelho), plano, funnels, integrações. Ações: impersonar, alterar plano, suspender |
| `/admin/integrations` | Taxa de erro por provider, tempo médio de resposta, habilitar/desabilitar globalmente |
| `/admin/jobs` | Fila em tempo real, jobs em execução, jobs falhos com stack trace, retry manual |

---

## 10. Roadmap de Desenvolvimento

### FASE 1 — MVP ← **EM ANDAMENTO**

**Objetivo:** Produto funcional — cliente consegue criar funil, conectar Meta Ads ou Pipedrive, configurar etapas e ver métricas no dashboard.

#### ✅ Concluído

- [x] **Monorepo setup** — Turborepo + pnpm workspaces + TypeScript strict + Prettier
- [x] **`packages/shared`** — Types, utils (`formatMetricValue`, `calculateConversionRate`, `getDateRange`, `slugify`), constants (`PLAN_SYNC_INTERVALS`, limites por plano)
- [x] **`packages/db` — Schema completo**
  - [x] Tabelas: organizations, users, organization_members, sessions
  - [x] Tabelas: funnels, funnel_stages, stage_metric_configs, metric_snapshots
  - [x] Tabelas: integration_providers, integrations
  - [x] Tabelas: sync_jobs, usage_events, monthly_usage_summary, audit_logs
  - [x] Drizzle config + client
  - [x] Seed de integration_providers
- [x] **`packages/integrations` — Arquitetura de providers**
  - [x] Interface `IntegrationProvider` + classe `BaseProvider`
  - [x] Provider **Meta Ads** — completo (validate, fetchMetrics, listResources: ad_accounts + campaigns)
  - [x] Provider **Pipedrive** — completo (validate, fetchMetrics, listResources: pipelines + stages)
  - [x] Provider **Google Ads** — stub (interface definida, implementação pendente)
  - [x] Provider **Clarity** — stub (interface definida, implementação pendente)
  - [x] Provider **Google Analytics 4** — stub (interface definida, implementação pendente)
  - [x] Registry central com `getProvider()`, `getAllProviders()`, `getProvidersByCategory()`
- [x] **`packages/api` — tRPC routers**
  - [x] tRPC setup com contexto, middlewares (enforceAuth, enforceAdmin, enforceOrgOwnerOrAdmin)
  - [x] Router `funnels` — list, getById (com conversão calculada), create, update, delete
  - [x] Router `stages` — create, update, reorder, delete, setMetrics
  - [x] Router `integrations` — listProviders, list, connect (com validate), testConnection, listResources, disconnect
  - [x] Router `metrics` — getStageHistory, triggerSync (manual), getSyncStatus
  - [x] Router `admin` — overview, listOrganizations, getOrganization, updatePlan, listJobs
- [x] **`apps/worker` — Background jobs**
  - [x] BullMQ worker com concurrency 5 + rate limiting (30 req/min)
  - [x] Job `collect-metrics` — busca dados → salva snapshot → atualiza integration status
  - [x] Scheduler cron (a cada 15min) — verifica etapas com sync vencido por plano
  - [x] `enqueueSync()` — enfileira jobs manuais ou agendados
  - [x] Graceful shutdown
- [x] **`apps/web` — Next.js 15 base**
  - [x] Configuração Next.js + Tailwind + shadcn CSS variables
  - [x] Better Auth configurado (email+password + multi-org plugin)
  - [x] tRPC handler (`/api/trpc`) + auth handler (`/api/auth`)
  - [x] Sidebar de navegação
  - [x] Dashboard page (lista de funis)
  - [x] Detalhe do funil (etapas com métricas + taxas de conversão)
  - [x] `FunnelCard`, `FunnelHeader`, `FunnelStageList`, `CreateFunnelButton`
  - [x] tRPC client (browser + server components)

---

#### ✅ Pendente — Fase 1 (quase completo, resta OAuth2)

**Autenticação e onboarding**
- [x] Página de Login (`/login`)
- [x] Página de Signup (`/signup`) → redireciona para `/login` (apenas Google OAuth)
- [x] Middleware de proteção de rotas (redirecionar `/` → `/dashboard` ou `/login`)
- [x] Página de Onboarding (`/onboarding`) — criar organização no primeiro login
- [x] Router `organizations.create` + `organizations.hasOrg`
- [x] tRPC context busca org real via `organization_members` (não depende de `activeOrganizationId`)
- [x] Dashboard redireciona para `/onboarding` se usuário sem organização
- [x] Seletor de organização ativa (org switcher na sidebar)
- [x] Página de convidar membros (`/settings/members`)

**Configuração de etapas (UI)**
- [x] Sheet "Adicionar Etapa" (`AddStageSheet`) — nome + ferramenta + KPIs com pré-seleção
- [x] Empty state educativo no funil com CTA e exemplo (Captação → Landing Page → Vendas)
- [x] Botão "+ Adicionar etapa" no final da lista de etapas
- [x] UX aprovada via skill `/saas-audit` antes da implementação
- [x] UI para configurar `metricConfig` da etapa (qual campanha/pipeline específico observar)
- [x] Drag & drop para reordenar etapas

**Coleta e exibição de métricas**
- [x] Botão "Sincronizar" funcional na UI (chama `metrics.triggerSync`)
- [x] Polling de status do job após sync manual
- [x] Seletor de período (last 7d / 30d / 90d) no dashboard do funil
- [x] Gráfico de evolução temporal das métricas (Recharts)
- [x] Indicador visual de "última atualização" por etapa

**Página de Integrações**
- [x] `/integrations` — lista integrações conectadas com status
- [x] Formulário de conexão por provider (campos dinâmicos do `configSchema`)
- [x] Botão "Testar conexão" funcional
- [ ] OAuth2 flow para Google Ads e Google Analytics

**UX Guidance e Onboarding**
- [x] Componente `HelpTooltip` reutilizável (Radix Tooltip com ícone ?)
- [x] Componente `HelpDrawer` expansível para guias passo-a-passo
- [x] Guias de credenciais por provider — Meta Ads, Pipedrive, Google Ads, Clarity, GA4 (com links diretos)
- [x] Guias integrados no formulário de conexão ("Como obter?" por campo)
- [x] Dicionário de KPIs com tooltips para todas as métricas
- [x] Tooltips em KPIs no detalhe do funil e na seleção de métricas
- [x] Tooltip na taxa de conversão entre etapas
- [x] Inline help text em todos os formulários (etapas, config, membros)
- [x] Empty state inteligente no dashboard (com/sem integração)
- [x] Empty state com grid de providers na página de integrações
- [x] Progress bar de setup animada (4 passos até First Value Moment)
- [x] Ícones SVG oficiais de todos os providers
- [x] Seletor de período com calendário customizável (data início/fim)
- [x] Cards de integração com hover animations e status badges coloridos
- [x] Nota de segurança AES-256 no formulário de conexão

**Segurança**
- [x] **Encryption AES-256 das credentials** no banco (AES-256-GCM com iv:authTag:ciphertext)
- [x] Decrypt ao usar no worker e nos routers de integração

**Banco de dados**
- [x] Rodar `pnpm db:push` para criar tabelas no Supabase
- [x] Rodar seed de `integration_providers`

**Versionamento e CI/CD**
- [x] Git inicializado com estrutura develop / stage / main
- [x] Repositório no GitHub: https://github.com/guilhermeCampos1/funnlio
- [x] Branch protection rules configuradas nas 3 branches
- [x] GitHub Actions CI: ci-develop, ci-stage, ci-main
- [x] BRANCHING.md — lei de ambientes documentada
- [ ] GitHub Pro (aguardando primeiro cliente para assinar)

---

### FASE 2 — Expansão de Integrações

- [ ] Provider **Google Ads** — implementação completa (OAuth2 + Google Ads API v18)
- [ ] Provider **Google Analytics 4** — implementação completa (OAuth2 + Data API v1)
- [ ] Provider **Microsoft Clarity** — implementação completa (API v1)
- [ ] Alertas por email quando métrica cai abaixo de threshold configurado
- [ ] Exportação de relatório do funil em PDF
- [ ] Exportação de dados em CSV

---

### FASE 3 — Admin Panel e Growth

- [ ] Páginas do admin (`/admin/overview`, `/admin/organizations`, `/admin/jobs`)
- [ ] Gráficos de MRR / churn no admin
- [ ] Billing com Stripe (planos + checkout + webhooks)
- [ ] Comparação de períodos (este mês vs. mês anterior)
- [ ] Link público do funil (somente leitura, sem login)
- [ ] Comentários/notas por etapa
- [ ] Notificações via Slack webhook

---

### FASE 4 — Enterprise

- [ ] SSO (SAML 2.0 / OIDC)
- [ ] API pública REST com autenticação por API key
- [ ] Webhooks para clientes (receber atualizações de métricas)
- [ ] White-label (domínio customizado)
- [ ] Histórico de auditoria avançado na UI
- [ ] SLA garantido + suporte dedicado

---

## 11. Git, GitHub e Ambientes

### Repositório

- **URL:** https://github.com/guilhermeCampos1/funnlio
- **Visibilidade:** Público (muda para privado ao assinar GitHub Pro com o primeiro cliente)

### Os três ambientes — LEI

| Ambiente | Branch  | Quem usa      | O que é                          |
|----------|---------|---------------|----------------------------------|
| Produção | develop | Time de dev   | Desenvolvimento ativo e contínuo |
| Stage    | stage   | Time interno  | Validação antes do live          |
| Live     | main    | Clientes      | Somente código 100% validado     |

### Fluxo obrigatório

```
feature/xyz → develop → stage → main
             (Produção) (Stage) (Live)
```

**Nunca pule etapas.** `main` só recebe de `stage`. `stage` só recebe de `develop`.

### Como começar qualquer tarefa

```bash
git checkout develop
git pull origin develop
git checkout -b feat/nome-da-feature
```

### Como subir para Stage (validação)

```bash
# Abrir PR no GitHub: develop → stage
# CI deve passar + 1 aprovação de review
```

### Como subir para Live (clientes)

```bash
# Abrir PR no GitHub: stage → main
# CI deve passar + 1 aprovação de review
# Após merge: criar tag de versão
git tag -a v1.x.x -m "Release v1.x.x: descrição"
git push origin v1.x.x
```

### CI/CD (GitHub Actions)

| Workflow | Roda em | O que verifica |
|---|---|---|
| `ci-develop.yml` | push/PR em `develop` | type-check + build |
| `ci-stage.yml` | PR em `stage` | origem (só develop/hotfix) + type-check + build + secrets |
| `ci-main.yml` | PR em `main` | origem (só stage/hotfix) + type-check + build + secrets + .env |

### Branch protection ativa

- `main` — PR obrigatório + CI + 1 review + admin não pode bypassar
- `stage` — PR obrigatório + CI + 1 review
- `develop` — CI obrigatório

> **Detalhes completos:** ver `BRANCHING.md` na raiz do projeto.

---

## 12. Como Rodar Localmente

### Pré-requisitos
- Node.js >= 20
- pnpm >= 9
- PostgreSQL rodando (ou conta no Supabase)
- Redis rodando (ou conta no Upstash)

### Setup

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Preencher DATABASE_URL, BETTER_AUTH_SECRET, REDIS_URL

# 3. Criar tabelas no banco
pnpm db:push

# 4. Popular integration_providers
npx tsx packages/db/src/seeds/integration-providers.ts

# 5. Rodar em desenvolvimento
pnpm dev
# web: http://localhost:3000
# worker: processo separado na porta — ver apps/worker
```

### Comandos úteis

```bash
pnpm dev              # rodar tudo em paralelo (Turborepo)
pnpm build            # build de produção
pnpm type-check       # verificar tipos em todos os packages
pnpm db:push          # aplicar schema ao banco (sem migration files)
pnpm db:studio        # abrir Drizzle Studio (GUI do banco)
pnpm db:generate      # gerar migration files
```

---

## 12. Decisões Técnicas Importantes

| Decisão | Motivo |
|---|---|
| Snapshots em vez de busca ao vivo | Dashboard instantâneo, sem rate limit estourado, histórico consultável |
| `jsonb` para `data` em snapshots | Cada provider tem estrutura diferente; evita migrations por nova métrica |
| tRPC em vez de REST | Type-safety end-to-end sem code generation; frontend nunca desincroniza |
| Better Auth em vez de Clerk/Auth0 | Controle dos dados de usuário, sem custo por MAU, multi-tenant nativo |
| RLS no PostgreSQL | Isolamento de tenant garantido no banco, não depende do código da aplicação |
| BullMQ em vez de Cron puro | Retry automático, rate limiting, dead letter queue, visibilidade de jobs |
| Credentials criptografadas | API keys e tokens de cliente nunca expostos mesmo com acesso ao banco |

# Funnlio — Instruções para o Claude

## LEI DE AMBIENTES E GIT — LEIA ANTES DE QUALQUER COMMIT

**O arquivo `BRANCHING.md` é lei absoluta.** Antes de criar qualquer branch, PR ou commit, leia:

```
/Users/guilhermecampos/www/projetos/funnlio/BRANCHING.md
```

### Resumo das regras (nunca violar):

| Ambiente | Branch  | Recebe de          | Fluxo |
|----------|---------|--------------------|-------|
| Produção | develop | feature/* fix/*    | trabalho diário |
| Stage    | stage   | develop / hotfix/* | validação interna |
| Live     | main    | stage / hotfix/*   | clientes |

- **Nunca faça push direto em `stage` ou `main`** — use sempre PR
- **Nunca pule etapas** — `main` só recebe de `stage`, jamais de `develop` ou features direto
- **Nunca commite `.env` ou credenciais** — o CI bloqueia, mas não dependa disso
- **Mensagens de commit seguem Conventional Commits:** `feat(escopo): descrição`
- **Após merge em `main`**: crie sempre uma tag de versão `vX.Y.Z`

---

## AÇÃO OBRIGATÓRIA ANTES DE QUALQUER COISA

**Leia os seguintes arquivos antes de executar qualquer ação:**

1. `PRD.md` — fonte da verdade do projeto (status, roadmap, checklists)
2. `docs/reed-richards-growth-plan.md` — plano completo de growth/billing/retenção do Reed Richards

**O documento do Reed Richards é OBRIGATÓRIO** para qualquer trabalho nas Fases 2, 3 ou 4. Ele contém: estratégia de pricing, modelo de trial, feature fencing por plano, copies de banners de upsell, fluxo de cancelamento em 3 passos, sequência de emails de trial, métricas de valor, insights automáticos, e toda a lógica de retenção e dependência. **Não implemente billing, feature gates, upgrade flows, value dashboard, insights, alertas ou qualquer item das Fases 2-4 sem ler esse documento primeiro.**

Quando TODOS os itens das Fases 2, 3 e 4 estiverem concluídos (✅ no PRD), esta regra pode ser removida.

---

**Leia também o `PRD.md`:**

O PRD é a fonte da verdade do projeto: ele contém o que já foi implementado (checklist ✅) e o que ainda falta fazer (checklist 🔲). Sem ler o PRD, você não tem contexto do estado atual do desenvolvimento e vai repetir trabalho já feito ou pular dependências.

```
/Users/guilhermecampos/www/projetos/funnlio/PRD.md
```

---

## O que você vai encontrar no PRD

- **Seção 1** — Visão do produto e exemplo real de funil
- **Seção 3** — Princípios de design (guiam todas as decisões)
- **Seção 7** — Status de cada integração (✅ implementado / 🔜 stub)
- **Seção 10** — **Roadmap com checklists** — a parte mais importante para retomar o trabalho:
  - `✅ Concluído` — o que já existe no código
  - `🔲 Pendente — Fase 1` — o que deve ser feito agora
  - Fases 2, 3, 4 — futuro

---

## REGRA OBRIGATÓRIA — Consultar skill de SaaS antes de implementar UI

**Antes de implementar qualquer tela, fluxo ou componente de UI, você DEVE:**

1. Invocar a skill `/saas-audit` descrevendo o que vai construir e pedindo recomendação de UX/produto
2. Apresentar ao usuário a recomendação da skill
3. Aguardar aprovação explícita do usuário ("pode seguir", "ok", "aprovado")
4. Só então iniciar a implementação

**Isso se aplica a:** novas páginas, modais, wizards, formulários, empty states, onboarding flows, e qualquer decisão de UX não trivial.

**Não se aplica a:** correções de bug, ajustes de estilo pontuais, refatorações sem mudança de UX.

Essa regra garante que o produto seja construído com raciocínio de produto SaaS (First Value Moment, friction mínima, onboarding correto) e não apenas como exercício técnico.

---

## Regra de atualização do PRD

Ao concluir qualquer item do roadmap, **atualize o PRD.md imediatamente**:
- Mude `- [ ]` para `- [x]`
- Mude `🔲` para `✅` nos títulos de seção quando uma sub-tarefa for concluída

Isso garante que o PRD reflita sempre o estado real do projeto.

---

## Contexto do projeto

**Funnlio** é um SaaS B2B para análise de funis de marketing. Permite criar funis com etapas configuráveis, onde cada etapa conecta a uma ferramenta diferente (Meta Ads, Pipedrive, Google Ads, Clarity, etc.) e extrai métricas específicas. O dashboard mostra taxas de conversão entre etapas automaticamente.

**Status atual:** Fase 1 em andamento (~70% concluído). Backend completo, UI base criada, autenticação e configuração de etapas pendentes.

---

## Stack rápido

| O quê | Tecnologia |
|---|---|
| Frontend | Next.js 15 (App Router) |
| API | tRPC v11 |
| ORM + Banco | Drizzle ORM + PostgreSQL (Supabase) |
| Auth | Better Auth |
| Filas | BullMQ + Redis |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Monorepo | Turborepo + pnpm workspaces |
| Linguagem | TypeScript strict |

---

## Estrutura de pastas

```
funnlio/
├── PRD.md                          ← leia sempre primeiro
├── apps/
│   ├── web/                        ← Next.js 15
│   │   ├── app/(auth)/             ← login, signup (pendente)
│   │   ├── app/(app)/dashboard/    ← lista de funis ✅
│   │   ├── app/(app)/funnels/[id]/ ← detalhe do funil ✅
│   │   ├── app/(admin)/            ← painel do dono do SaaS (pendente)
│   │   ├── components/funnels/     ← FunnelCard, StageList, etc.
│   │   └── lib/                    ← trpc.ts, auth.ts, utils.ts
│   └── worker/                     ← BullMQ jobs ✅
│       └── src/jobs/collect-metrics.ts
├── packages/
│   ├── db/src/schema/              ← schema Drizzle completo ✅
│   ├── integrations/src/
│   │   ├── core/base-provider.ts   ← interface de todos os providers
│   │   ├── providers/meta-ads/     ← implementado ✅
│   │   ├── providers/pipedrive/    ← implementado ✅
│   │   ├── providers/google-ads/   ← stub 🔜
│   │   ├── providers/clarity/      ← stub 🔜
│   │   └── registry.ts             ← registro central de providers
│   ├── api/src/routers/            ← tRPC: funnels, stages, integrations, metrics, admin ✅
│   └── shared/src/                 ← types, utils, constants ✅
```

---

## Convenções de código

- **TypeScript strict** — sem `any`, sem `as unknown`
- **Exports nomeados** — nunca `export default` nos packages internos
- **Extensões `.js`** nos imports dentro de packages (`import from './foo.js'`) — exigência do NodeNext
- **Sem credenciais no frontend** — o campo `credentials` das integrações nunca deve ser retornado pela API
- **Providers** — sempre estender `BaseProvider` de `packages/integrations/src/core/base-provider.ts`
- **tRPC** — usar `protectedProcedure` para rotas autenticadas, `ownerAdminProcedure` para ações destrutivas, `adminProcedure` para o painel SaaS
- **Verificação de org** — toda query que acessa dados deve filtrar por `organizationId` da sessão
- **Sem plain text de credenciais** — ao implementar connect de integração, usar AES-256 encrypt antes de salvar
- **Crypto separado do frontend** — `encryptCredentials`/`decryptCredentials` vivem em `@funnlio/shared/crypto` (subpath export). NUNCA importar via `@funnlio/shared` direto, pois `node:crypto` não roda no browser

---

## Convenções de Billing e Feature Gating (Fase 2+)

- **Billing é por organização** — Stripe Customer = Organization (não User)
- **Planos:** free, starter, pro, enterprise (enum no schema)
- **Trial:** 14 dias com acesso Pro → expira para Free (dados congelados)
- **Plan limits** — centralizar em `packages/shared/src/constants/plan-limits.ts`
- **Feature gates** — centralizar em `packages/shared/src/constants/feature-gates.ts`
- **Enforcement** — middleware tRPC `enforcePlanLimits` intercepta mutations e retorna `PLAN_LIMIT_REACHED`
- **No frontend** — usar componente `FeatureGate` wrapper: se tem acesso renderiza children, se não renderiza `LockedFeatureOverlay` com blur + CTA
- **Upgrade flow** — sempre via Stripe Checkout hosted (não embedded)
- **Webhooks Stripe** — handler em `apps/web/app/api/webhooks/stripe/route.ts` com verificação de assinatura
- **Nunca bloquear sem contexto** — todo limite atingido deve mostrar VALOR do próximo plano, não erro genérico

---

## Comandos úteis

```bash
pnpm dev              # rodar tudo em paralelo
pnpm type-check       # verificar tipos em todos os packages
pnpm db:push          # aplicar schema ao banco
pnpm db:studio        # Drizzle Studio (GUI do banco)
npx tsx packages/db/src/seeds/integration-providers.ts  # popular providers no banco
```

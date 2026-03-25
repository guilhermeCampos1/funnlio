# PLANO REED RICHARDS — FUNNLIO GROWTH ENGINE COMPLETO

> Documento gerado em 2026-03-24 pelo agente Reed Richards (cientista-chefe de SaaS growth).
> Frameworks utilizados: Pricing Triangle, C.H.I., First Value Moment, Circle of Trust, SaaS Hourglass, 4-Number Formula.
> Fontes: Software as a Science, Martell.

---

# PARTE 1: ESTRATÉGIA DE PRICING

## 1.1 Pricing Triangle Aplicado ao Funnlio

O Pricing Triangle tem 3 dimensões: **Value Metric**, **Depth-of-Usage**, e **Feature Fencing**.

### Value Metric — O que escala com o sucesso do cliente

Para o Funnlio, a Value Metric primária é **número de funis ativos**. Quanto mais funis o cliente gerencia, mais valor extrai. Um gestor de tráfego com 1 cliente tem 1-2 funis. Com 10 clientes, tem 15-30. O crescimento do negócio do cliente = crescimento do uso do Funnlio = crescimento natural do ARPA.

Value Metric secundária: **frequência de sync**. Clientes maiores precisam de dados mais frescos. Sync de 24h é aceitável para quem testa. Sync de 1h ou 15min é necessidade operacional.

### Depth-of-Usage Drivers

- Funis ativos (primário)
- Integrações conectadas (secundário)
- Membros da organização (terciário)
- Histórico de dados retido (diferenciador de lock-in)
- Frequência de sync (percepção de valor)

### Feature Fencing — O que separa planos por capacidade

Features exclusivas de planos superiores (usadas por menos de 30% dos usuários iniciais mas de alto valor percebido):

- **Alertas automáticos** (email/Slack quando conversão cai) — Pro+
- **Exportação PDF/CSV** — Starter+ (com marca d'água no Starter)
- **Comparação de períodos** — Pro+
- **Link público de dashboard** — Pro+
- **Comentários em etapas** — Pro+
- **Relatórios automáticos semanais por email** — Starter+
- **Benchmarks e comparações** — Pro+
- **API pública** — Enterprise
- **SSO/SAML** — Enterprise
- **White-label** — Enterprise
- **Webhooks** — Enterprise

*— Fonte: Software as a Science, Martell — Pricing Triangle / Feature Fencing*

## 1.2 Modelo de Trial Recomendado: Híbrido — 14 dias + Free Limitado

**Por que não free trial puro (tempo)?** Porque um dev solo não tem equipe de vendas para converter no dia 14. O trial precisa se converter sozinho.

**Por que não freemium puro?** Porque com zero usuários, você precisa de urgência para converter. Freemium remove urgência.

**Modelo ideal:**

```
Trial: 14 dias grátis com acesso ao plano Pro completo
         | (dia 14)
Expira -> Downgrade automático para Free Limitado
         - 1 funil ativo (read-only dos demais)
         - Sync pausado (dados congelam)
         - Sem exportação, sem alertas
         - Banner permanente: "Seus dados continuam aqui. Ative o Starter para retomar."
```

**Por que Pro no trial?** O cliente precisa experimentar o valor máximo para entender o que perde. Se der trial do Starter, ele nunca vê alertas, comparações, link público — e não sabe o que está perdendo.

**Por que Free Limitado ao invés de bloquear?** Porque os dados históricos são o moat. Se o cliente sabe que seus 14 dias de dados estão lá, congelados, ele volta. Se você bloqueia tudo, ele vai embora sem âncora.

*— Fonte: Software as a Science, Martell — First Value Moment / Onboarding*

## 1.3 Estrutura de Preços Recomendada

### Análise do ICP

**ICP primário:** Gestores de tráfego (múltiplos clientes, cada um com funis próprios) e infoprodutores/lançadores (funis complexos, múltiplas fontes de tráfego).

**Willingness to pay:** Gestores de tráfego faturam R$3-15k/mês por cliente. Infoprodutores faturam R$10k-500k+ por lançamento. Ferramenta de R$97-297/mês é investimento trivial se economiza horas e evita decisões erradas.

### Preços

| Plano | Preço Mensal | Preço Anual (mensal) | Desconto |
|-------|-------------|---------------------|----------|
| Starter | R$ 97/mês | R$ 77/mês (R$ 924/ano) | 21% |
| Pro | R$ 247/mês | R$ 197/mês (R$ 2.364/ano) | 20% |
| Enterprise | R$ 697/mês | R$ 557/mês (R$ 6.684/ano) | 20% |

### Justificativa

**Starter R$97:** Abaixo de R$100, ponto de entrada psicológico. Acessível para gestor iniciante.

**Pro R$247:** Sweet spot para gestor com 5-10 clientes ou infoprodutor ativo. Valor de 1 hora economizada por semana já justifica. Benchmark 60-in-6: 60% dos Starter devem bater 10 funis em 6 meses.

**Enterprise R$697:** Agências e operações grandes. SSO, API, white-label justificam. Self-serve no início, sales-assisted depois.

### Limites por Plano (Atualizado)

| Recurso | Free (pós-trial) | Starter | Pro | Enterprise |
|---------|------------------|---------|-----|------------|
| Funis ativos | 1 (read-only) | 10 | 50 | Ilimitado |
| Integrações | 1 | 5 | 20 | Ilimitado |
| Sync | Pausado | 4h | 1h | 15min |
| Membros | 1 | 3 | 10 | Ilimitado |
| Histórico retido | 30 dias | 6 meses | 24 meses | Ilimitado |
| Exportação | Não | CSV (marca) | PDF + CSV | PDF + CSV + API |
| Alertas | Não | Email (3/dia) | Email+Slack (ilim) | Tudo |
| Comparação períodos | Não | Não | Sim | Sim |
| Link público | Não | Não | Sim | Sim |
| Comentários | Não | Não | Sim | Sim |
| Relatório semanal | Não | Email básico | Email detalhado | Customizado |
| Benchmarks | Não | Não | Sim | Sim |
| API pública | Não | Não | Não | Sim |
| SSO/SAML | Não | Não | Não | Sim |
| White-label | Não | Não | Não | Sim |

### Benchmarks de Escalada

- **60-in-6:** 60% dos Starter atingem limite de funis (10) em 6 meses — upgrade natural para Pro
- **40-in-8:** 40% dos Pro precisam de mais integrações ou membros em 8 meses — upgrade para Enterprise
- **20-in-12:** 20% chegam ao Enterprise em 12 meses

Se não atingir, ou o produto não gera valor suficiente ou os limites estão frouxos.

*— Fonte: Software as a Science, Martell — Pricing Triangle / Value Metric + Depth-of-Usage + Feature Fencing*

---

# PARTE 2: BILLING E PLANOS — IMPLEMENTAÇÃO

## 2.1 Integração Stripe — Arquitetura

### Modelo de Dados

```
Stripe Product    = Plano Funnlio (Starter, Pro, Enterprise)
Stripe Price      = Variante (mensal, anual) x moeda
Stripe Customer   = Organization (não User — billing é por org)
Stripe Subscription = Assinatura ativa da org
Stripe Checkout Session = Fluxo de upgrade/compra
Stripe Webhook    = Sincronização de estado
Stripe Customer Portal = Gerenciamento de faturas/cartão pelo cliente
```

### Tabelas Novas no Schema (Drizzle)

**subscriptions:** id, organizationId, stripeCustomerId, stripeSubscriptionId, stripePriceId, plan (enum: trial/free/starter/pro/enterprise), status (enum: active/trialing/past_due/canceled/unpaid/incomplete), billingCycle (monthly/yearly), currentPeriodStart, currentPeriodEnd, trialEndsAt, canceledAt, cancelAtPeriodEnd, createdAt, updatedAt.

**invoices:** id, organizationId, stripeInvoiceId, amountDue, amountPaid, currency, status (enum: draft/open/paid/void/uncollectible), invoiceUrl, pdfUrl, periodStart, periodEnd, createdAt.

**planLimits:** id, plan (enum), maxFunnels, maxIntegrations, maxMembers, syncIntervalMinutes, historyRetentionDays, hasExport, hasAlerts, hasComparison, hasPublicLink, hasComments, hasBenchmarks, hasApi, hasSso, hasWhiteLabel.

### Webhooks Stripe

```
checkout.session.completed     -> Criar/atualizar subscription
customer.subscription.created  -> Registrar nova subscription
customer.subscription.updated  -> Atualizar plan/status/período
customer.subscription.deleted  -> Cancelar, downgrade para Free
invoice.paid                   -> Registrar invoice, manter acesso
invoice.payment_failed         -> Marcar past_due, notificar
customer.subscription.trial_will_end -> Email "trial acaba em 3 dias"
```

### Routers tRPC Novos

```
billing.getSubscription      -> status atual da org
billing.createCheckout       -> gera Stripe Checkout Session
billing.createPortalSession  -> redireciona para Customer Portal
billing.getInvoices          -> lista faturas
billing.getPlanLimits        -> limites do plano atual
billing.getUsage             -> uso atual vs limites
```

### Middleware de Enforcement

Middleware que intercepta criação de recursos e verifica limites. Antes de criar funil, verificar maxFunnels. Antes de conectar integração, verificar maxIntegrations. Etc. Retorna erro estruturado com `code: 'PLAN_LIMIT_REACHED', resource, current, limit, upgradeTo`.

## 2.2 Página de Planos/Pricing

**Localização:** `apps/web/app/(app)/settings/billing/page.tsx`

**Componentes:** PlanComparisonTable (comparativo visual dos 4 planos), CurrentPlanCard (plano atual com uso), UsageMeters (barras de progresso: funis/limite, integrações, membros), BillingToggle (mensal/anual com desconto destacado), UpgradeButton (CTA contextual), InvoiceHistory (faturas com PDF).

**UX:** Plano atual com borda colorida. Planos inferiores: "Seu plano inclui tudo isso". Próximo plano superior: CTA primário + badge "Mais popular". Barras: verde (<60%), amarelo (60-80%), vermelho (>80%). Barra vermelha: "Você está próximo do limite."

## 2.3 Upgrade Flow

```
Clique "Upgrade para Pro"
  -> billing.createCheckout({ plan: 'pro', cycle: 'monthly' })
  -> Redirect Stripe Checkout (hosted)
  -> Stripe processa pagamento
  -> Webhook checkout.session.completed
  -> Backend atualiza subscription
  -> Redirect /settings/billing?success=true
  -> Toast: "Bem-vindo ao Pro! Novos limites ativos."
```

## 2.4 Downgrade e Cancelamento

### Downgrade (ex: Pro -> Starter)

Modal de confirmação: lista visual do que perde. "Funis acima do limite (10) serão pausados, não deletados." "Histórico limitado a 6 meses." Se confirma: billing.createPortalSession() -> Stripe Customer Portal. Aplica no final do período. Sistema desativa features e pausa funis excedentes (mais antigos primeiro).

### Cancelamento — 3 passos

1. "Por que está saindo?" (multiple choice + texto livre): "Muito caro", "Não uso o suficiente", "Falta feature X", "Mudei de ferramenta", "Outro"
2. Mostrar o que perde com dados reais: "Você tem 3 meses de dados históricos e 8 funis ativos. Ao cancelar, dados ficam congelados por 90 dias. Após isso, removidos permanentemente."
3. Oferta de retenção contextual:
   - Se "muito caro" -> "Que tal o Starter por R$77/mês (anual)?"
   - Se "não uso" -> "Quer pausar por 1 mês? Dados ficam intactos."
   - Se "falta feature" -> "Obrigado. Estamos construindo [feature]. Quer ser notificado?"

Se insiste: cancelAtPeriodEnd = true. Acesso continua até fim do período. Depois: Free (1 funil, sync pausado, dados congelados).

*— Fonte: Software as a Science, Martell — C.H.I. / Customer Engagement Elevator*

## 2.5 Trial Countdown e Expiração

### Banners Progressivos

```
Dias 1-7:   "Você tem X dias restantes no trial Pro. Explore tudo!"       [azul]
Dias 8-11:  "Restam X dias. Já viu [feature não usada]?"                  [amarelo]
Dias 12-13: "Último dia amanhã! Ative o Starter para manter seus dados."  [laranja]
Dia 14:     "Trial encerra hoje. Dados congelados à meia-noite."           [vermelho]
```

### TrialProgressCard (dashboard)

Dias usados/14. Features experimentadas (checklist). "Você ainda não experimentou: Alertas, Comparação, Link Público." CTA: "Experimente antes que o trial acabe."

### Pós-Trial (Free)

Banner fixo: "Trial expirou. Dados de X dias congelados. Ative para retomar." Dashboard mostra último snapshot com overlay "Dados pausados desde [data]". Funis além do limite com cadeado.

### Emails de Trial

```
Dia 1:   Boas-vindas + guia para First Value (criar funil + ver métrica)
Dia 3:   "Você já viu suas conversões?" (se conectou integração)
Dia 7:   Mid-trial: features não usadas
Dia 11:  "3 dias restantes. X dias de histórico. Não perca."
Dia 13:  "Amanhã é o último dia. Ative agora: 20% no primeiro mês."
Dia 14:  "Trial encerrado. Dados congelados. Reative quando quiser."
Dia 21:  "Sentimos sua falta. Dados aqui por mais 69 dias."
Dia 60:  "Última chance: dados removidos em 30 dias."
```

*— Fonte: Software as a Science, Martell — First Value Moment / Onboarding*

---

# PARTE 3: INCENTIVOS A UPGRADE

## 3.1 Soft Limits vs Hard Limits

### Soft Limits (avisar, não bloquear)

- **Uso em 80%:** Banner amarelo contextual. Ex: "Você usa 8 de 10 funis. Pro oferece 50."
- **Sync atrasado:** Toast no dashboard. Ex: "Dados de 4h atrás. No Pro, atualiza a cada hora."
- **Feature preview bloqueada:** Feature visível com blur/overlay.

### Hard Limits (bloquear com contexto)

- **Funil acima do limite:** Modal com lista dos funis atuais + "No Pro, até 50 funis. A partir de R$247/mês." Botão primário: "Upgrade" / Secundário: "Gerenciar existentes"
- **Integração acima do limite:** Mesmo padrão.
- **Feature bloqueada:** Modal IN-CONTEXT (não redireciona). Mostra valor: "Alertas detectam quando conversão cai e te avisam." + "Gestores que usam alertas identificam problemas 3x mais rápido." + CTA: "Ativar com o Pro"

**Regra:** Nunca erro genérico. Sempre VALOR do que está bloqueado.

*— Fonte: Software as a Science, Martell — Pricing Triangle / Feature Fencing*

## 3.2 Banners Contextuais de Upsell

| Localização | Trigger | Copy |
|------------|---------|------|
| Dashboard header | Trial ativo | "Restam X dias do trial Pro" + CTA |
| Dashboard header | Free/Starter | "Upgrade para desbloquear [feature]" |
| Página funil | Starter + >7 funis | "Usando 8/10 funis. Garanta espaço." |
| Detalhe funil | Dados >4h | "Dados de 4h atrás. Pro atualiza a cada hora." |
| Config integração | Limite atingido | "Mais integrações? Pro oferece 20." |
| Seção alertas | Starter | Visível com blur + "Alertas são Pro." |
| Exportação | Starter | Marca d'água + "Remova com Pro" |
| Membros | Limite | "Mais membros no Pro (10) ou Enterprise" |
| Relatório email | Starter | Footer: "Quer detalhados? Upgrade Pro" |

### Princípios de Copy

1. Ancorar no valor, não no limite
2. Usar dados do próprio usuário quando possível
3. Social proof quando disponível
4. Urgência real (trial countdown), não fabricada

## 3.3 Feature Gating Visual

Para cada feature bloqueada, 3 elementos:

1. **Preview visual** — O usuário VÊ como seria (blur dos dados ou mock)
2. **Explicação de valor** — Uma frase sobre por que importa
3. **CTA de upgrade** — Botão contextual

**Implementação:** Componente `FeatureGate` wrapper que verifica plano da org. Se tem acesso: renderiza children. Se não: renderiza `LockedFeatureOverlay` com preview blur, badge do plano, texto de valor, botão.

Constantes em `packages/shared/src/constants/feature-gates.ts` mapeando cada feature para: requiredPlan, label, value (copy de uma linha).

## 3.4 Momentos de Upgrade (Timing)

1. **Após First Value Moment** — Toast celebratório + "Imagine isso para todos seus funis"
2. **Ao atingir limite** — Modal contextual
3. **Ao descobrir feature bloqueada** — Preview + valor + CTA
4. **Na análise dos dados** — Tooltip sutil "Compare com período anterior" (Pro)
5. **Ao adicionar membro** — "Equipe crescendo! Pro suporta 10 membros."
6. **Trial dias 10-14** — Escalada de urgência

*— Fonte: Software as a Science, Martell — C.H.I. / Customer Engagement Elevator + Pricing Triangle*

---

# PARTE 4: VALOR VISÍVEL — DASHBOARD DE GANHOS

## 4.1 Métricas de Valor

### Card "Seu Mês em Números" no Dashboard

#### Métrica 1: Receita Rastreada
- Sum de métricas com tipo currency em todas etapas
- "R$ 127.450 em receita rastreada este mês"

#### Métrica 2: Horas Economizadas
- (etapas x funis x syncs/mês x 5min) / 60
- "~18 horas economizadas este mês"
- 5 min por etapa = login + navegar + anotar + comparar

#### Métrica 3: Gargalos Identificados
- Etapas com conversão <20% OU que caíram >15% vs período anterior
- "3 gargalos identificados nos seus funis"

#### Métrica 4: Dias de Dados
- Dias desde primeira coleta
- "87 dias de histórico acumulado"
- Reforça lock-in

### Layout

```
+-----------------------------------------------------+
|  Seu Mês em Números                                  |
|                                                      |
|  R$ 127.450       ~18h          3           87       |
|  receita           economizadas  gargalos    dias    |
|  rastreada                       encontrados dados   |
|                                                      |
|  [Starter] "Com Pro, receba alertas automáticos      |
|             quando gargalos aparecem"                 |
+-----------------------------------------------------+
```

## 4.2 Insights Automáticos

### 5 Tipos de Insight

1. **CONVERSION_DROP:** Conversão caiu >15% vs média 7 dias. "A conversão de [Etapa X] caiu 23%."
2. **CONVERSION_SPIKE:** Conversão subiu >15%. "Subiu 18%! O que você mudou?"
3. **FUNNEL_BOTTLENECK:** Etapa com conversão <20% e menor do funil. "[Etapa X] é o gargalo com 12%."
4. **SPEND_ANOMALY:** Spend mudou >25% vs média. "Investimento Meta Ads subiu 30%."
5. **MILESTONE:** Marcos de uso (primeiro funil, 1000 leads, 30 dias). "Marco: 10.000 leads rastreados!"

### Feature Gate

- Free: nenhum insight
- Starter: MILESTONE + FUNNEL_BOTTLENECK
- Pro: todos + alertas email/Slack
- Enterprise: tudo + thresholds customizados

### Onde Mostram

- Dashboard: Card "Insights da Semana" (max 3)
- Detalhe funil: insights daquele funil
- Email semanal: top 3
- Notificação in-app: apenas CONVERSION_DROP

## 4.3 Daily Engagement Hooks

1. **Morning Report (8h)** — Starter+ — Resumo 3 linhas + link dashboard
2. **Badge "Dados Atualizados"** — Notificação in-app quando sync completa
3. **Comparação Semanal (segunda)** — Email: semana vs anterior + gráfico inline
4. **Gargalo Detectado (real-time Pro+)** — Notificação imediata quando conversão cai >15%

*— Fonte: Software as a Science, Martell — C.H.I. / Customer Engagement Elevator + First Value Moment*

---

# PARTE 5: RETENÇÃO E DEPENDÊNCIA TOTAL

## 5.1 Dados Históricos como Moat

1. **Mostrar tempo acumulado:** Badge "87 dias de dados". Na tela de cancelamento: "Você perderá 87 dias de histórico."
2. **Gráficos de longo prazo:** Tendência 30/60/90 dias. Impossível recriar em outra ferramenta.
3. **Comparação temporal (Pro+):** "Compare janeiro com dezembro." Só funciona com dados de ambos meses.
4. **Retenção por plano:** Free 30 dias, Starter 6 meses, Pro 24 meses, Enterprise ilimitado. Aviso quando dados próximos de expirar: "Dados de março 2025 removidos em 15 dias. Upgrade Pro para reter 24 meses."

## 5.2 Relatórios Automáticos por Email

1. **Daily Digest** — Starter+ — 8h — Spend, leads, conversão, alertas
2. **Weekly Summary** — Starter+ — Segunda 8h — Semana vs anterior, top 3 insights
3. **Monthly Report** — Pro+ — Dia 1 — Completo com gráficos, tendências, exportável PDF
4. **Custom Scheduled** — Enterprise — Frequência e métricas configuráveis, destinatários externos

**Implementação:** Cron jobs no worker BullMQ. Templates React Email. Serviço Resend ou SES.

## 5.3 Integrações como Lock-in

1. Cada integração conectada aumenta custo de troca
2. Cross-integration insights (Pro+): "Spend Meta subiu 15% mas deals Pipedrive caíram 10%. Correlação?"
3. Na tela de cancelamento: "Você tem 5 integrações configuradas. Reconectar levaria ~30 minutos."

## 5.4 Colaboração como Stickiness

1. Facilitar convite: no onboarding e após First Value
2. Permissões por membro (Pro+): Viewer, Editor, Admin. Clientes do gestor como Viewers.
3. Atividade de equipe: "3 membros viram o dashboard esta semana." Comentários criam histórico.

## 5.5 Alertas e Notificações

**Prioridade 1 (Push imediato Pro+):** Conversão caiu >20%, integração desconectou, sync falhou 3x.
**Prioridade 2 (Daily digest Starter+):** Métricas do dia, insights novos, membro novo.
**Prioridade 3 (Semanal):** Relatório, features não usadas, dicas.

**Canais:** In-app (todos), Email (Starter+), Slack (Pro+), SMS (Enterprise — críticos).

## 5.6 Benchmarks (Pro+)

1. **Mercado:** Taxas médias por vertical (ecommerce, infoproduto, SaaS). Dados agregados anonimizados.
2. **Próprio:** "Funil X converte 40% melhor que funil Y."
3. **Temporal:** Selecionar dois períodos, comparar lado a lado, drill-down por etapa.

*— Fonte: Software as a Science, Martell — C.H.I. / Customer Engagement Elevator + Circle of Trust*

---

# PARTE 6: FASES 2, 3 E 4 REESCRITAS

## Princípio de Reordenação

Fases originais organizadas por complexidade técnica. Reordenadas por **impacto em retenção e revenue**.

Prioridade: **Retention > Revenue > Expansion > Nice-to-have**

---

## FASE 2 — "Revenue & Retention Engine" (4-6 semanas)

Objetivo: Monetizar, reter, criar loops.

### 2.1 Billing & Stripe (SEM ISSO NÃO HÁ NEGÓCIO)
- Schema subscriptions + invoices + planLimits (Drizzle)
- Criar Products/Prices no Stripe (Starter mensal/anual, Pro mensal/anual, Enterprise mensal/anual)
- Endpoint webhook `/api/webhooks/stripe` com verificação de assinatura
- Handlers: checkout.session.completed, subscription.created/updated/deleted, invoice.paid/failed, trial_will_end
- Router tRPC `billing` (getSubscription, createCheckout, createPortalSession, getInvoices, getPlanLimits, getUsage)
- Página `/settings/billing` com PlanComparisonTable, CurrentPlanCard, UsageMeters, BillingToggle, InvoiceHistory
- Upgrade flow: Checkout -> Stripe -> Webhook -> Atualiza banco -> Redirect com success
- Downgrade flow: Modal confirmação -> Customer Portal -> Webhook -> Desativa features + pausa funis excedentes
- Cancelamento flow: 3 passos (motivo, dados que perde, oferta retenção) -> cancelAtPeriodEnd
- Trial 14 dias: setar trialEndsAt no signup, countdown no header
- Downgrade automático para Free pós-trial (cron ou webhook trial_will_end)
- Seed: popular planLimits com limites de cada plano

### 2.2 Feature Gating & Upgrade Mechanics (SEM ISSO NÃO CONVERTE)
- Constantes `FEATURE_GATES` em shared (feature -> requiredPlan + label + value copy)
- Constantes `PLAN_LIMITS` em shared (plano -> limites numéricos + booleans de features)
- Componente `FeatureGate` wrapper (verifica plano, renderiza children ou LockedFeatureOverlay)
- Componente `LockedFeatureOverlay` (preview blur + badge plano + valor + CTA upgrade)
- Componente `UsageMeter` (barra com cores verde/amarelo/vermelho)
- Componente `LimitReachedModal` (contexto + valor do próximo plano + CTA)
- Componente `SoftLimitBanner` (80% do limite, amarelo, contextual)
- Middleware tRPC `enforcePlanLimits` (intercepta mutations, retorna PLAN_LIMIT_REACHED)
- Badge de plano no sidebar/header
- Upgrade prompts nos 9 pontos mapeados

### 2.3 Value Dashboard (MOSTRA VALOR PARA RETER)
- Service `calculateValueMetrics(orgId)`: receita rastreada, horas economizadas, gargalos, dias de dados
- Card "Seu Mês em Números" no dashboard principal
- Upsell contextual no card baseado no plano

### 2.4 Insights Automáticos (ENGAGEMENT)
- Service `detectInsights(orgId)` com 5 tipos
- Tabela `insights` no schema
- Card "Insights da Semana" no dashboard
- Feature gate por plano
- Badge de insights não lidos no sidebar

### 2.5 Alertas por Email (PUXA DE VOLTA)
- Tabela `alert_settings`
- Service `processAlerts(orgId)` após cada sync
- Templates de email com React Email
- Integração Resend para envio
- Configuração de alertas na UI (on/off por tipo)

### 2.6 Exportação
- CSV com marca d'água Starter
- PDF (Pro+) com layout profissional
- Feature gate

### 2.7 Providers Completos
- Google Ads, GA4, Clarity (estender BaseProvider)

### 2.8 Emails de Trial
- Sequência de 8 emails (dias 1, 3, 7, 11, 13, 14, 21, 60)
- Templates React Email
- Cron job no worker
- Lógica condicional

**Estimativa: 4-6 semanas dev solo**

---

## FASE 3 — "Engagement & Expansion" (4-6 semanas)

### 3.1 Relatórios Automáticos por Email
### 3.2 Comparação de Períodos (Pro+)
### 3.3 Comentários em Etapas (Pro+)
### 3.4 Link Público de Dashboard (Pro+)
### 3.5 Slack (Pro+)
### 3.6 Admin Panel (Dono do SaaS)
### 3.7 Customer Health Index — Backend

*— Fonte: Software as a Science, Martell — C.H.I. / Purple-Green-Yellow-Red*

**Estimativa: 4-6 semanas**

---

## FASE 4 — "Scale & Moat" (6-8 semanas)

### 4.1 Benchmarks (Pro+)
### 4.2 SSO/SAML (Enterprise)
### 4.3 API Pública (Enterprise)
### 4.4 Webhooks (Enterprise)
### 4.5 White Label (Enterprise)
### 4.6 Auditoria (Enterprise)
### 4.7 Retenção Avançada
### 4.8 Colaboração Avançada

*— Fonte: Software as a Science, Martell — Circle of Trust / Win-Ask Method + C.H.I.*

**Estimativa: 6-8 semanas**

---

# AUTO-REVISÃO — Reed Richards QC

```
[x] Growth Ceiling calculado? -> N/A pré-lançamento. Admin Panel (Fase 3) inclui calculator.
[x] 3 Alavancas avaliadas? -> Retention (Fases 2-3) > Expansion (3-4) > Acquisition (fora do escopo).
[x] First Value Moment definido? -> "Ver primeira métrica real no primeiro funil."
[x] C.H.I. avaliado? -> Fase 3 com segmentação. Fase 4 com processos proativos.
[x] Pricing Triangle verificado? -> Completo: Value Metric + Depth-of-Usage + Feature Fencing.
[x] Fontes citadas? -> Sim.
[x] Antecipação do que vai quebrar? -> Documentado abaixo.
```

## O Que Vai Quebrar Depois

1. **Sem analytics de conversão do trial na Fase 2:** Implementar billing sem saber ONDE trials desistem. AÇÃO: adicionar eventos de tracking desde o dia 1.
2. **Feature gating sem A/B test:** Copies dos modais são chutes educados. AÇÃO: rastrear CTR de cada modal.
3. **Emails sem deliverability testada:** 8 emails em 60 dias pode cair em spam. AÇÃO: usar Resend, começar com menos.
4. **Preços sem validação:** R$97/247/697 são estimativas. AÇÃO: lançar, medir conversão por 60 dias.
5. **Benchmarks dependem de volume:** Poucos usuários = dados irrelevantes. AÇÃO: começar com benchmarks públicos.

---

## SEQUÊNCIA DE EXECUÇÃO

```
PRIORIDADE MÁXIMA (antes de lançar):
  -> 2.1 Billing & Stripe
  -> 2.2 Feature Gating & Upgrade Mechanics
  -> 2.3 Value Dashboard

SEMANA 2-3:
  -> 2.4 Insights Automáticos
  -> 2.5 Alertas Email
  -> 2.8 Emails de Trial

SEMANA 4-6:
  -> 2.6 Exportação
  -> 2.7 Providers (Google Ads, GA4, Clarity)

MÊS 2-3:
  -> Fase 3 completa

MÊS 4-6:
  -> Fase 4 completa
```

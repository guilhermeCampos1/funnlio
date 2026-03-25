'use client'

import { useState } from 'react'
import {
  Check,
  X,
  CreditCard,
  Receipt,
  Crown,
  Zap,
  Building2,
  ArrowRight,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlanKey = 'starter' | 'pro' | 'enterprise'
type BillingCycle = 'monthly' | 'yearly'

interface PlanInfo {
  key: PlanKey
  name: string
  icon: typeof Zap
  monthlyPrice: number
  yearlyPrice: number
  limits: {
    funnels: number | null
    integrations: number | null
    members: number | null
    sync: string
    history: string
    export: string
    alerts: string
  }
  features: {
    comparison: boolean
    publicLink: boolean
    benchmarks: boolean
    sso: boolean
    api: boolean
  }
}

// ---------------------------------------------------------------------------
// Plan data (from Reed Richards growth plan)
// ---------------------------------------------------------------------------

const PLANS: PlanInfo[] = [
  {
    key: 'starter',
    name: 'Starter',
    icon: Zap,
    monthlyPrice: 97,
    yearlyPrice: 77,
    limits: {
      funnels: 10,
      integrations: 5,
      members: 3,
      sync: '4h',
      history: '6 meses',
      export: 'CSV',
      alerts: 'Email (3/dia)',
    },
    features: {
      comparison: false,
      publicLink: false,
      benchmarks: false,
      sso: false,
      api: false,
    },
  },
  {
    key: 'pro',
    name: 'Pro',
    icon: Crown,
    monthlyPrice: 247,
    yearlyPrice: 197,
    limits: {
      funnels: 50,
      integrations: 20,
      members: 10,
      sync: '1h',
      history: '24 meses',
      export: 'PDF + CSV',
      alerts: 'Email + Slack',
    },
    features: {
      comparison: true,
      publicLink: true,
      benchmarks: true,
      sso: false,
      api: false,
    },
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    monthlyPrice: 697,
    yearlyPrice: 557,
    limits: {
      funnels: null,
      integrations: null,
      members: null,
      sync: '15min',
      history: 'Ilimitado',
      export: 'PDF + CSV + API',
      alerts: 'Tudo',
    },
    features: {
      comparison: true,
      publicLink: true,
      benchmarks: true,
      sso: true,
      api: true,
    },
  },
]

function formatLimit(value: number | null): string {
  return value === null ? 'Ilimitado' : String(value)
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TrialBanner({ trialEndsAt }: { trialEndsAt: string }) {
  const now = new Date()
  const end = new Date(trialEndsAt)
  const diffMs = end.getTime() - now.getTime()
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  const colorClass =
    daysLeft <= 1
      ? 'bg-red-50 border-red-200 text-red-800'
      : daysLeft <= 3
        ? 'bg-orange-50 border-orange-200 text-orange-800'
        : daysLeft <= 7
          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
          : 'bg-blue-50 border-blue-200 text-blue-800'

  return (
    <div className={cn('rounded-lg border p-4 flex items-center justify-between', colorClass)}>
      <div>
        <p className="font-medium text-sm">
          {daysLeft === 0
            ? 'Seu trial expira hoje!'
            : daysLeft === 1
              ? 'Seu trial expira amanha!'
              : `Seu trial expira em ${daysLeft} dias`}
        </p>
        <p className="text-xs mt-0.5 opacity-80">
          Voce tem acesso ao plano Pro completo durante o trial.
        </p>
      </div>
      <a
        href="#plans"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
      >
        Escolha seu plano
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}

function CurrentPlanCard({
  planName,
  status,
  price,
  billingCycle,
  onManageBilling,
  isManaging,
}: {
  planName: string
  status: string
  price: number | null
  billingCycle: string | null
  onManageBilling: () => void
  isManaging: boolean
}) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: 'Ativo', className: 'bg-green-100 text-green-700' },
    trialing: { label: 'Trial', className: 'bg-blue-100 text-blue-700' },
    past_due: { label: 'Pagamento pendente', className: 'bg-yellow-100 text-yellow-700' },
    canceled: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
    free: { label: 'Free', className: 'bg-muted text-muted-foreground' },
  }

  const statusInfo = statusConfig[status] ?? statusConfig.free

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{planName}</h2>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                statusInfo.className,
              )}
            >
              {statusInfo.label}
            </span>
          </div>
          {price !== null && billingCycle && (
            <p className="text-sm text-muted-foreground">
              R${price}/mes{' '}
              {billingCycle === 'yearly' && (
                <span className="text-xs">(cobrado anualmente)</span>
              )}
            </p>
          )}
        </div>
        {status !== 'free' && (
          <button
            onClick={onManageBilling}
            disabled={isManaging}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isManaging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
            {isManaging ? 'Abrindo...' : 'Gerenciar pagamento'}
            {!isManaging && <ExternalLink className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  )
}

function UsageMeter({
  label,
  current,
  max,
}: {
  label: string
  current: number
  max: number | null
}) {
  const isUnlimited = max === null
  const percentage = isUnlimited ? 0 : max === 0 ? 100 : Math.min(100, (current / max) * 100)

  const fillColor =
    isUnlimited || percentage < 60
      ? 'bg-green-500'
      : percentage < 80
        ? 'bg-yellow-500'
        : 'bg-red-500'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {current} / {isUnlimited ? '\u221E' : max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={cn('h-2 rounded-full transition-all', fillColor)}
          style={{ width: isUnlimited ? '5%' : `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function UsageMeters({
  usage,
}: {
  usage: {
    funnels: { current: number; limit: number }
    integrations: { current: number; limit: number }
    members: { current: number; limit: number }
  }
}) {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <h2 className="font-medium text-sm">Uso atual</h2>
      <UsageMeter label="Funis" current={usage.funnels.current} max={isFinite(usage.funnels.limit) ? usage.funnels.limit : null} />
      <UsageMeter
        label="Integrações"
        current={usage.integrations.current}
        max={isFinite(usage.integrations.limit) ? usage.integrations.limit : null}
      />
      <UsageMeter label="Membros" current={usage.members.current} max={isFinite(usage.members.limit) ? usage.members.limit : null} />
    </div>
  )
}

function BillingToggle({
  billingCycle,
  onChange,
}: {
  billingCycle: BillingCycle
  onChange: (cycle: BillingCycle) => void
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={cn(
          'text-sm font-medium transition-colors',
          billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        Mensal
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={billingCycle === 'yearly'}
        onClick={() => onChange(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          billingCycle === 'yearly' ? 'bg-primary' : 'bg-muted',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-white transition-transform',
            billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
      <span
        className={cn(
          'text-sm font-medium transition-colors',
          billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        Anual
      </span>
      {billingCycle === 'yearly' && (
        <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
          Economize 20%
        </span>
      )}
    </div>
  )
}

function FeatureRow({ label, value }: { label: string; value: boolean | string }) {
  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-between py-1.5 text-sm">
        <span className="text-muted-foreground">{label}</span>
        {value ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <X className="w-4 h-4 text-muted-foreground/40" />
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-xs">{value}</span>
    </div>
  )
}

function PlanColumn({
  plan,
  billingCycle,
  isCurrent,
  isUpgrade,
  onSelect,
  isLoading,
}: {
  plan: PlanInfo
  billingCycle: BillingCycle
  isCurrent: boolean
  isUpgrade: boolean
  onSelect: () => void
  isLoading: boolean
}) {
  const PlanIcon = plan.icon
  const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
  const isPopular = plan.key === 'pro'

  return (
    <div
      className={cn(
        'rounded-lg border p-5 space-y-4 flex flex-col relative',
        isCurrent
          ? 'border-primary ring-1 ring-primary'
          : isPopular
            ? 'border-2 border-primary scale-[1.02]'
            : 'border-border',
      )}
    >
      {isPopular && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold whitespace-nowrap">
            Mais Popular
          </span>
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <PlanIcon className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">{plan.name}</h3>
          {isCurrent && (
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
              Atual
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">R${price}</span>
          <span className="text-sm text-muted-foreground">/mes</span>
        </div>
        {billingCycle === 'yearly' && (
          <p className="text-xs text-muted-foreground">
            R${plan.yearlyPrice * 12}/ano
          </p>
        )}
      </div>

      <div className="border-t pt-3 space-y-0.5 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Limites
        </p>
        <FeatureRow label="Funis" value={formatLimit(plan.limits.funnels)} />
        <FeatureRow label="Integracoes" value={formatLimit(plan.limits.integrations)} />
        <FeatureRow label="Membros" value={formatLimit(plan.limits.members)} />
        <FeatureRow label="Sync" value={plan.limits.sync} />
        <FeatureRow label="Historico" value={plan.limits.history} />
        <FeatureRow label="Exportacao" value={plan.limits.export} />
        <FeatureRow label="Alertas" value={plan.limits.alerts} />

        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 mt-3 pt-3 border-t">
          Recursos
        </p>
        <FeatureRow label="Comparacao de periodos" value={plan.features.comparison} />
        <FeatureRow label="Link publico" value={plan.features.publicLink} />
        <FeatureRow label="Benchmarks" value={plan.features.benchmarks} />
        <FeatureRow label="SSO / SAML" value={plan.features.sso} />
        <FeatureRow label="API" value={plan.features.api} />
      </div>

      <div className="pt-2">
        {isCurrent ? (
          <button
            disabled
            className="w-full px-4 py-2 rounded-md border border-input bg-muted text-muted-foreground text-sm font-medium cursor-default"
          >
            Plano Atual
          </button>
        ) : isUpgrade ? (
          <button
            onClick={onSelect}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                Upgrade
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onSelect}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Redirecionando...
              </>
            ) : (
              'Downgrade'
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function PlanComparisonTable({
  currentPlan,
  billingCycle,
  onBillingCycleChange,
  onSelectPlan,
  isCheckoutLoading,
  loadingPlan,
}: {
  currentPlan: PlanKey | 'free' | null
  billingCycle: BillingCycle
  onBillingCycleChange: (cycle: BillingCycle) => void
  onSelectPlan: (plan: PlanKey) => void
  isCheckoutLoading: boolean
  loadingPlan: PlanKey | null
}) {
  const planOrder: Array<PlanKey | 'free'> = ['free', 'starter', 'pro', 'enterprise']
  const currentIndex = planOrder.indexOf(currentPlan ?? 'free')

  return (
    <div id="plans" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Planos</h2>
        <BillingToggle billingCycle={billingCycle} onChange={onBillingCycleChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const planIndex = planOrder.indexOf(plan.key)
          return (
            <PlanColumn
              key={plan.key}
              plan={plan}
              billingCycle={billingCycle}
              isCurrent={currentPlan === plan.key}
              isUpgrade={planIndex > currentIndex}
              onSelect={() => onSelectPlan(plan.key)}
              isLoading={isCheckoutLoading && loadingPlan === plan.key}
            />
          )
        })}
      </div>
    </div>
  )
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    paid: { label: 'Pago', className: 'bg-green-100 text-green-700' },
    open: { label: 'Aberto', className: 'bg-yellow-100 text-yellow-700' },
    void: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
    uncollectible: { label: 'Falhou', className: 'bg-red-100 text-red-700' },
    draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  }

  const info = config[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }

  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', info.className)}>
      {info.label}
    </span>
  )
}

function InvoiceHistory({
  invoices,
  isLoading,
}: {
  invoices: Array<{
    id: string
    date: string
    amount: number
    status: string
    pdfUrl: string | null
  }>
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-medium text-sm">Historico de faturas</h2>
        <div className="h-20 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-medium text-sm">Historico de faturas</h2>
        <p className="text-sm text-muted-foreground">Nenhuma fatura encontrada.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      <h2 className="font-medium text-sm flex items-center gap-1.5">
        <Receipt className="w-4 h-4" />
        Historico de faturas
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium text-muted-foreground">Data</th>
              <th className="pb-2 font-medium text-muted-foreground">Valor</th>
              <th className="pb-2 font-medium text-muted-foreground">Status</th>
              <th className="pb-2 font-medium text-muted-foreground text-right">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="py-2.5">
                  {new Date(invoice.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-2.5">
                  R${(invoice.amount / 100).toFixed(2).replace('.', ',')}
                </td>
                <td className="py-2.5">
                  <InvoiceStatusBadge status={invoice.status} />
                </td>
                <td className="py-2.5 text-right">
                  {invoice.pdfUrl ? (
                    <a
                      href={invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Baixar
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function BillingPageSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="h-8 w-56 bg-muted animate-pulse rounded" />
      <div className="h-24 bg-muted animate-pulse rounded-lg" />
      <div className="h-32 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BillingPageClient() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null)

  const subscription = trpc.billing.getSubscription.useQuery()
  const usage = trpc.billing.getUsage.useQuery()
  const planLimits = trpc.billing.getPlanLimits.useQuery()
  const invoices = trpc.billing.getInvoices.useQuery()

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl
    },
    onSettled: () => {
      setLoadingPlan(null)
    },
  })

  const createPortal = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.portalUrl
    },
  })

  const isLoading =
    subscription.isLoading || usage.isLoading || planLimits.isLoading

  if (isLoading) {
    return <BillingPageSkeleton />
  }

  const sub = subscription.data
  const currentPlan = (sub?.plan as PlanKey | 'free' | undefined) ?? 'free'
  const currentPlanLabel =
    currentPlan === 'free'
      ? 'Free'
      : PLANS.find((p) => p.key === currentPlan)?.name ?? currentPlan

  const status = sub?.status ?? 'free'
  const price = sub?.price ?? null
  const cycle = sub?.billingCycle ?? null

  function handleSelectPlan(plan: PlanKey) {
    setLoadingPlan(plan)
    createCheckout.mutate({ plan, billingCycle })
  }

  function handleManageBilling() {
    createPortal.mutate()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Plano e Faturamento</h1>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              currentPlan === 'free'
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary/10 text-primary',
            )}
          >
            {currentPlanLabel}
          </span>
        </div>
        <p className="text-muted-foreground mt-1">
          Gerencie seu plano, uso e faturas.
        </p>
      </div>

      {/* Trial banner */}
      {sub?.trialEndsAt && status === 'trialing' && (
        <TrialBanner trialEndsAt={sub.trialEndsAt} />
      )}

      {/* Current plan */}
      <CurrentPlanCard
        planName={currentPlanLabel}
        status={status}
        price={price}
        billingCycle={cycle}
        onManageBilling={handleManageBilling}
        isManaging={createPortal.isPending}
      />

      {/* Usage meters */}
      {usage.data && (
        <UsageMeters usage={usage.data} />
      )}

      {/* Plan comparison */}
      <PlanComparisonTable
        currentPlan={currentPlan}
        billingCycle={billingCycle}
        onBillingCycleChange={setBillingCycle}
        onSelectPlan={handleSelectPlan}
        isCheckoutLoading={createCheckout.isPending}
        loadingPlan={loadingPlan}
      />

      {/* Invoice history */}
      <InvoiceHistory
        invoices={invoices.data ?? []}
        isLoading={invoices.isLoading}
      />
    </div>
  )
}

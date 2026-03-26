/**
 * Setup Stripe Products and Prices for Funnlio
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/setup-stripe.ts
 *
 * This script creates:
 *   - 3 products: Starter, Pro, Enterprise
 *   - 6 prices: monthly + yearly for each plan
 *
 * After running, copy the price IDs to your .env.local
 */

const STRIPE_API = 'https://api.stripe.com/v1'
const KEY = process.env.STRIPE_SECRET_KEY

if (!KEY) {
  console.error('ERROR: Set STRIPE_SECRET_KEY env var before running this script')
  process.exit(1)
}

async function stripe(path: string, body: Record<string, string>): Promise<Record<string, string>> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  })

  const json = await res.json() as Record<string, string>
  if (!res.ok) {
    throw new Error(`Stripe error on ${path}: ${JSON.stringify(json)}`)
  }
  return json
}

const plans = [
  {
    key: 'starter',
    name: 'Funnlio Starter',
    description: 'Até 10 funis, 5 integrações, 3 membros',
    monthlyBRL: 9700,  // R$97
    yearlyBRL: 7700,   // R$77/mês × 12 = R$924
  },
  {
    key: 'pro',
    name: 'Funnlio Pro',
    description: 'Até 50 funis, 20 integrações, 10 membros',
    monthlyBRL: 24700, // R$247
    yearlyBRL: 19700,  // R$197/mês × 12 = R$2.364
  },
  {
    key: 'enterprise',
    name: 'Funnlio Enterprise',
    description: 'Funis, integrações e membros ilimitados + SSO + API',
    monthlyBRL: 69700, // R$697
    yearlyBRL: 55700,  // R$557/mês × 12 = R$6.684
  },
]

async function main() {
  console.log('🚀 Setting up Stripe products and prices for Funnlio...\n')

  const envLines: string[] = [
    '',
    '# ─── Stripe ─────────────────────────────────────────────────────────────────',
    `STRIPE_SECRET_KEY="${KEY}"`,
    '# STRIPE_PUBLISHABLE_KEY="pk_test_..."  # Add your publishable key',
    '# STRIPE_WEBHOOK_SECRET="whsec_..."     # Run: stripe listen --print-secret',
    '',
  ]

  for (const plan of plans) {
    console.log(`Creating product: ${plan.name}`)
    const product = await stripe('/products', {
      name: plan.name,
      description: plan.description,
      'metadata[plan]': plan.key,
    })
    console.log(`  ✓ Product created: ${product['id']}`)

    console.log(`  Creating monthly price (R$${plan.monthlyBRL / 100}/mês)`)
    const monthlyPrice = await stripe('/prices', {
      product: product['id']!,
      unit_amount: String(plan.monthlyBRL),
      currency: 'brl',
      'recurring[interval]': 'month',
      'metadata[plan]': plan.key,
      'metadata[cycle]': 'monthly',
    })
    console.log(`  ✓ Monthly price: ${monthlyPrice['id']}`)

    console.log(`  Creating yearly price (R$${plan.yearlyBRL / 100}/mês × 12)`)
    const yearlyPrice = await stripe('/prices', {
      product: product['id']!,
      unit_amount: String(plan.yearlyBRL * 12),
      currency: 'brl',
      'recurring[interval]': 'year',
      'metadata[plan]': plan.key,
      'metadata[cycle]': 'yearly',
    })
    console.log(`  ✓ Yearly price: ${yearlyPrice['id']}\n`)

    const KEY_UPPER = plan.key.toUpperCase()
    envLines.push(`STRIPE_PRICE_${KEY_UPPER}_MONTHLY="${monthlyPrice['id']}"`)
    envLines.push(`STRIPE_PRICE_${KEY_UPPER}_YEARLY="${yearlyPrice['id']}"`)
  }

  console.log('─'.repeat(60))
  console.log('✅ Done! Add these lines to your .env.local:\n')
  console.log(envLines.join('\n'))
  console.log('\nTo set up webhooks locally:')
  console.log('  stripe login')
  console.log('  stripe listen --forward-to localhost:3001/api/webhooks/stripe')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

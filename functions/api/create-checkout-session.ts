/**
 * Cloudflare Pages Function for creating Stripe Checkout sessions
 *
 * Environment variables required:
 * - STRIPE_SECRET_KEY: Stripe secret key (set in Cloudflare dashboard)
 *
 * POST /api/create-checkout-session
 * Body: {
 *   bundleId: string,
 *   pageCount: number,
 *   includesEditing: boolean,
 *   successUrl: string,
 *   cancelUrl: string
 * }
 */

interface Env {
  STRIPE_SECRET_KEY: string
}

interface RequestBody {
  bundleId: string
  pageCount: number
  includesEditing: boolean
  successUrl: string
  cancelUrl: string
}

// Pricing constants (must match frontend)
const BASE_PRICING = {
  FREE_TIER_MAX: 25,
  TIER_2_MAX: 150,
  TIER_3_MAX: 300,
  RATE_TIER_2: 0.30,
  RATE_TIER_3: 0.22,
  RATE_TIER_4: 0.18,
}

const EDITING_TIERS = [
  { from: 1, to: 25, cost: 8, minutes: 30 },
  { from: 26, to: 100, cost: 8, minutes: 30 },
  { from: 101, to: 200, cost: 12, minutes: 60 },
  { from: 201, to: 300, cost: 15, minutes: 120 },
  { from: 301, to: Infinity, cost: 20, minutes: -1 },
]

function calculateBaseCost(pageCount: number): number {
  if (pageCount <= 0) return 0
  if (pageCount <= BASE_PRICING.FREE_TIER_MAX) return 0

  let totalCost = 0

  if (pageCount > BASE_PRICING.FREE_TIER_MAX) {
    const pagesAt30p = Math.min(pageCount, BASE_PRICING.TIER_2_MAX) - BASE_PRICING.FREE_TIER_MAX
    totalCost += pagesAt30p * BASE_PRICING.RATE_TIER_2
  }

  if (pageCount > BASE_PRICING.TIER_2_MAX) {
    const pagesAt22p = Math.min(pageCount, BASE_PRICING.TIER_3_MAX) - BASE_PRICING.TIER_2_MAX
    totalCost += pagesAt22p * BASE_PRICING.RATE_TIER_3
  }

  if (pageCount > BASE_PRICING.TIER_3_MAX) {
    const pagesAt18p = pageCount - BASE_PRICING.TIER_3_MAX
    totalCost += pagesAt18p * BASE_PRICING.RATE_TIER_4
  }

  return Math.round(totalCost * 100) / 100
}

function calculateEditingCost(pageCount: number): number {
  if (pageCount <= 0) return 0

  for (const tier of EDITING_TIERS) {
    if (pageCount >= tier.from && pageCount <= tier.to) {
      return tier.cost
    }
  }

  return EDITING_TIERS[EDITING_TIERS.length - 1].cost
}

function getEditingTimeString(pageCount: number): string {
  for (const tier of EDITING_TIERS) {
    if (pageCount >= tier.from && pageCount <= tier.to) {
      if (tier.minutes === -1) return 'Unlimited'
      if (tier.minutes < 60) return `${tier.minutes} minutes`
      if (tier.minutes === 60) return '1 hour'
      return `${tier.minutes / 60} hours`
    }
  }
  return 'Unlimited'
}

function toPence(amount: number): number {
  return Math.round(amount * 100)
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await context.request.json()
    const { bundleId, pageCount, includesEditing, successUrl, cancelUrl } = body

    // Validate inputs
    if (!bundleId || !pageCount || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Calculate prices
    const baseCost = calculateBaseCost(pageCount)
    const editingCost = includesEditing ? calculateEditingCost(pageCount) : 0
    const totalAmount = baseCost + editingCost

    // Free tier - no payment needed
    if (totalAmount === 0) {
      return new Response(JSON.stringify({
        free: true,
        bundleId,
        message: 'No payment required for free tier',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build line items
    const lineItems = []

    if (baseCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `Court Bundle - ${pageCount} pages`,
            description: 'Professional pagination, indexing, section dividers, and PDF download',
          },
          unit_amount: toPence(baseCost),
        },
        quantity: 1,
      })
    }

    if (includesEditing && editingCost > 0) {
      const timeString = getEditingTimeString(pageCount)
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Editing Tools Add-On',
            description: `Redaction, erasure, page manipulation (${timeString} editing time)`,
          },
          unit_amount: toPence(editingCost),
        },
        quantity: 1,
      })
    }

    // Create Stripe Checkout session
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'success_url': `${successUrl}?session_id={CHECKOUT_SESSION_ID}&bundle_id=${bundleId}&editing=${includesEditing}`,
        'cancel_url': cancelUrl,
        'metadata[bundle_id]': bundleId,
        'metadata[page_count]': pageCount.toString(),
        'metadata[includes_editing]': includesEditing.toString(),
        ...lineItems.reduce((acc, item, index) => ({
          ...acc,
          [`line_items[${index}][price_data][currency]`]: item.price_data.currency,
          [`line_items[${index}][price_data][product_data][name]`]: item.price_data.product_data.name,
          [`line_items[${index}][price_data][product_data][description]`]: item.price_data.product_data.description,
          [`line_items[${index}][price_data][unit_amount]`]: item.price_data.unit_amount.toString(),
          [`line_items[${index}][quantity]`]: item.quantity.toString(),
        }), {}),
      }),
    })

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text()
      console.error('Stripe error:', errorData)
      return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const session = await stripeResponse.json()

    return new Response(JSON.stringify({
      sessionId: session.id,
      url: session.url,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

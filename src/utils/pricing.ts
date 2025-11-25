/**
 * Court Bundle Builder - Pricing System
 *
 * Base Bundle Pricing (Cumulative/Tiered by PAGE count):
 * - 1-25 pages: FREE
 * - 26-150 pages: £0.30 per page
 * - 151-300 pages: £0.22 per page
 * - 301+ pages: £0.18 per page
 *
 * Editing Add-On (Time-Limited):
 * - 1-25 pages: £8, 30 minutes
 * - 26-100 pages: £8, 30 minutes
 * - 101-200 pages: £12, 1 hour
 * - 201-300 pages: £15, 2 hours
 * - 301+ pages: £20, unlimited
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface PricingBreakdown {
  pageCount: number
  baseCost: number
  editingCost: number
  editingTimeMinutes: number
  editingTimeString: string
  total: number
  isFree: boolean
  tierBreakdown: TierBreakdownItem[]
  formattedBaseCost: string
  formattedEditingCost: string
  formattedTotal: string
}

export interface TierBreakdownItem {
  range: string
  pages: number
  rate: string
  cost: number
}

export interface EditingTier {
  from: number
  to: number
  cost: number
  minutes: number // -1 = unlimited
}

// ============================================
// PRICING CONSTANTS
// ============================================

// Base pricing rates per page (cumulative tiers)
export const BASE_PRICING = {
  FREE_TIER_MAX: 25,
  TIER_2_MAX: 150,
  TIER_3_MAX: 300,
  RATE_TIER_2: 0.30, // £0.30 per page for pages 26-150
  RATE_TIER_3: 0.22, // £0.22 per page for pages 151-300
  RATE_TIER_4: 0.18, // £0.18 per page for pages 301+
}

// Editing add-on pricing and time limits
export const EDITING_TIERS: EditingTier[] = [
  { from: 1, to: 25, cost: 8, minutes: 30 },
  { from: 26, to: 100, cost: 8, minutes: 30 },
  { from: 101, to: 200, cost: 12, minutes: 60 },
  { from: 201, to: 300, cost: 15, minutes: 120 },
  { from: 301, to: Infinity, cost: 20, minutes: -1 }, // -1 = unlimited
]

// ============================================
// CORE PRICING FUNCTIONS
// ============================================

/**
 * Calculate base bundle cost based on page count (cumulative tiers)
 * @param pageCount Total number of pages in the bundle
 * @returns Cost in GBP (pounds)
 *
 * Examples:
 * - 25 pages = £0.00 (FREE)
 * - 50 pages = £7.50 (25 free + 25 × £0.30)
 * - 100 pages = £22.50 (25 free + 75 × £0.30)
 * - 200 pages = £48.50 (25 free + 125 × £0.30 + 50 × £0.22)
 * - 350 pages = £79.50 (25 free + 125 × £0.30 + 150 × £0.22 + 50 × £0.18)
 */
export function calculateBaseCost(pageCount: number): number {
  if (pageCount <= 0) return 0
  if (pageCount <= BASE_PRICING.FREE_TIER_MAX) return 0 // Free tier

  let totalCost = 0

  // First 25 pages are FREE - no charge

  // Pages 26-150 at £0.30 per page
  if (pageCount > BASE_PRICING.FREE_TIER_MAX) {
    const pagesAt30p = Math.min(pageCount, BASE_PRICING.TIER_2_MAX) - BASE_PRICING.FREE_TIER_MAX
    totalCost += pagesAt30p * BASE_PRICING.RATE_TIER_2
  }

  // Pages 151-300 at £0.22 per page
  if (pageCount > BASE_PRICING.TIER_2_MAX) {
    const pagesAt22p = Math.min(pageCount, BASE_PRICING.TIER_3_MAX) - BASE_PRICING.TIER_2_MAX
    totalCost += pagesAt22p * BASE_PRICING.RATE_TIER_3
  }

  // Pages 301+ at £0.18 per page
  if (pageCount > BASE_PRICING.TIER_3_MAX) {
    const pagesAt18p = pageCount - BASE_PRICING.TIER_3_MAX
    totalCost += pagesAt18p * BASE_PRICING.RATE_TIER_4
  }

  // Round to 2 decimal places to avoid floating point issues
  return Math.round(totalCost * 100) / 100
}

/**
 * Calculate editing add-on cost based on page count
 * @param pageCount Total number of pages in the bundle
 * @returns Cost in GBP (pounds)
 */
export function calculateEditingCost(pageCount: number): number {
  if (pageCount <= 0) return 0

  for (const tier of EDITING_TIERS) {
    if (pageCount >= tier.from && pageCount <= tier.to) {
      return tier.cost
    }
  }

  // Default to highest tier for very large bundles
  return EDITING_TIERS[EDITING_TIERS.length - 1].cost
}

/**
 * Get editing time limit in minutes
 * @param pageCount Total number of pages in the bundle
 * @returns Minutes of editing time (-1 for unlimited)
 */
export function getEditingTimeLimit(pageCount: number): number {
  if (pageCount <= 0) return 30 // Default minimum

  for (const tier of EDITING_TIERS) {
    if (pageCount >= tier.from && pageCount <= tier.to) {
      return tier.minutes
    }
  }

  // Default to unlimited for very large bundles
  return -1
}

/**
 * Get human-readable editing time limit string
 * @param pageCount Total number of pages in the bundle
 * @returns Formatted time string (e.g., "30 minutes", "1 hour", "Unlimited")
 */
export function getEditingTimeLimitString(pageCount: number): string {
  const minutes = getEditingTimeLimit(pageCount)

  if (minutes === -1) return 'Unlimited'
  if (minutes < 60) return `${minutes} minutes`
  if (minutes === 60) return '1 hour'
  return `${minutes / 60} hours`
}

/**
 * Calculate total cost (base + optional editing)
 * @param pageCount Total number of pages
 * @param includesEditing Whether editing add-on is included
 * @returns Total cost in GBP
 */
export function calculateTotal(pageCount: number, includesEditing: boolean): number {
  const baseCost = calculateBaseCost(pageCount)
  const editingCost = includesEditing ? calculateEditingCost(pageCount) : 0
  return Math.round((baseCost + editingCost) * 100) / 100
}

/**
 * Format price for display
 * @param amount Amount in GBP
 * @returns Formatted string (e.g., "£22.50" or "FREE")
 */
export function formatPrice(amount: number): string {
  if (amount === 0) return 'FREE'
  return `£${amount.toFixed(2)}`
}

/**
 * Check if bundle qualifies for free tier (base cost only)
 * @param pageCount Total number of pages
 * @returns True if base bundle is free (≤25 pages)
 */
export function isFreeTier(pageCount: number): boolean {
  return pageCount <= BASE_PRICING.FREE_TIER_MAX
}

/**
 * Check if payment is required
 * @param pageCount Total number of pages
 * @param includesEditing Whether editing is desired
 * @returns True if payment is required
 */
export function isPaymentRequired(pageCount: number, includesEditing: boolean = false): boolean {
  if (includesEditing) return true // Editing always costs money
  return pageCount > BASE_PRICING.FREE_TIER_MAX
}

/**
 * Check if editing time is unlimited
 * @param pageCount Total number of pages
 * @returns True if editing time is unlimited (301+ pages)
 */
export function isEditingUnlimited(pageCount: number): boolean {
  return getEditingTimeLimit(pageCount) === -1
}

// ============================================
// DETAILED BREAKDOWN FUNCTIONS
// ============================================

/**
 * Get detailed pricing breakdown for display
 * @param pageCount Total number of pages
 * @param includesEditing Whether editing is included
 * @returns Detailed breakdown object
 */
export function getPricingBreakdown(pageCount: number, includesEditing: boolean): PricingBreakdown {
  const baseCost = calculateBaseCost(pageCount)
  const editingCost = includesEditing ? calculateEditingCost(pageCount) : 0
  const editingTimeMinutes = includesEditing ? getEditingTimeLimit(pageCount) : 0
  const editingTimeString = includesEditing ? getEditingTimeLimitString(pageCount) : ''
  const total = Math.round((baseCost + editingCost) * 100) / 100
  const isFree = pageCount <= BASE_PRICING.FREE_TIER_MAX && !includesEditing

  // Calculate tier breakdown for base cost
  const tierBreakdown: TierBreakdownItem[] = []

  if (pageCount > 0) {
    // Free tier (1-25)
    const freeTierPages = Math.min(pageCount, BASE_PRICING.FREE_TIER_MAX)
    tierBreakdown.push({
      range: `1-${BASE_PRICING.FREE_TIER_MAX}`,
      pages: freeTierPages,
      rate: 'FREE',
      cost: 0,
    })

    // £0.30 tier (26-150)
    if (pageCount > BASE_PRICING.FREE_TIER_MAX) {
      const tier2Pages = Math.min(pageCount, BASE_PRICING.TIER_2_MAX) - BASE_PRICING.FREE_TIER_MAX
      tierBreakdown.push({
        range: `${BASE_PRICING.FREE_TIER_MAX + 1}-${BASE_PRICING.TIER_2_MAX}`,
        pages: tier2Pages,
        rate: `£${BASE_PRICING.RATE_TIER_2.toFixed(2)}/page`,
        cost: Math.round(tier2Pages * BASE_PRICING.RATE_TIER_2 * 100) / 100,
      })
    }

    // £0.22 tier (151-300)
    if (pageCount > BASE_PRICING.TIER_2_MAX) {
      const tier3Pages = Math.min(pageCount, BASE_PRICING.TIER_3_MAX) - BASE_PRICING.TIER_2_MAX
      tierBreakdown.push({
        range: `${BASE_PRICING.TIER_2_MAX + 1}-${BASE_PRICING.TIER_3_MAX}`,
        pages: tier3Pages,
        rate: `£${BASE_PRICING.RATE_TIER_3.toFixed(2)}/page`,
        cost: Math.round(tier3Pages * BASE_PRICING.RATE_TIER_3 * 100) / 100,
      })
    }

    // £0.18 tier (301+)
    if (pageCount > BASE_PRICING.TIER_3_MAX) {
      const tier4Pages = pageCount - BASE_PRICING.TIER_3_MAX
      tierBreakdown.push({
        range: `${BASE_PRICING.TIER_3_MAX + 1}+`,
        pages: tier4Pages,
        rate: `£${BASE_PRICING.RATE_TIER_4.toFixed(2)}/page`,
        cost: Math.round(tier4Pages * BASE_PRICING.RATE_TIER_4 * 100) / 100,
      })
    }
  }

  return {
    pageCount,
    baseCost,
    editingCost,
    editingTimeMinutes,
    editingTimeString,
    total,
    isFree,
    tierBreakdown,
    formattedBaseCost: formatPrice(baseCost),
    formattedEditingCost: formatPrice(editingCost),
    formattedTotal: formatPrice(total),
  }
}

// ============================================
// STRIPE HELPERS
// ============================================

/**
 * Get price in pence/cents for Stripe (Stripe uses smallest currency unit)
 * @param amount Amount in GBP
 * @returns Amount in pence
 */
export function toPence(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Create line items for Stripe checkout
 * @param pageCount Total number of pages
 * @param includesEditing Whether editing is included
 * @returns Array of line items for Stripe
 */
export function createStripeLineItems(pageCount: number, includesEditing: boolean) {
  const items = []

  const baseCost = calculateBaseCost(pageCount)
  if (baseCost > 0) {
    items.push({
      name: `Court Bundle - ${pageCount} pages`,
      description: 'Professional pagination, indexing, section dividers, and PDF download',
      amount: toPence(baseCost),
      currency: 'gbp',
      quantity: 1,
    })
  }

  if (includesEditing) {
    const editingCost = calculateEditingCost(pageCount)
    const timeString = getEditingTimeLimitString(pageCount)
    items.push({
      name: 'Editing Add-On',
      description: `Redaction, erasure, page manipulation (${timeString} editing time)`,
      amount: toPence(editingCost),
      currency: 'gbp',
      quantity: 1,
    })
  }

  return items
}

// ============================================
// VERIFICATION / TESTING
// ============================================

/**
 * Verify pricing calculations against expected values
 * Run this function to test the implementation
 * @returns True if all tests pass
 */
export function verifyPricingCalculations(): boolean {
  const testCases = [
    { pages: 25, expectedBase: 0, expectedWithEditing: 8, editTime: 30 },
    { pages: 50, expectedBase: 7.50, expectedWithEditing: 15.50, editTime: 30 },
    { pages: 100, expectedBase: 22.50, expectedWithEditing: 30.50, editTime: 30 },
    { pages: 150, expectedBase: 37.50, expectedWithEditing: 45.50, editTime: 30 },
    { pages: 200, expectedBase: 48.50, expectedWithEditing: 60.50, editTime: 60 },
    { pages: 300, expectedBase: 70.50, expectedWithEditing: 85.50, editTime: 120 },
    { pages: 350, expectedBase: 79.50, expectedWithEditing: 99.50, editTime: -1 },
    { pages: 700, expectedBase: 142.50, expectedWithEditing: 162.50, editTime: -1 },
  ]

  let allPassed = true

  console.log('=== Pricing Verification ===\n')

  for (const test of testCases) {
    const baseCost = calculateBaseCost(test.pages)
    const totalWithEditing = calculateTotal(test.pages, true)
    const editTime = getEditingTimeLimit(test.pages)

    const basePass = Math.abs(baseCost - test.expectedBase) < 0.01
    const editingPass = Math.abs(totalWithEditing - test.expectedWithEditing) < 0.01
    const timePass = editTime === test.editTime

    if (!basePass || !editingPass || !timePass) {
      allPassed = false
      console.error(`❌ FAILED: ${test.pages} pages`)
      if (!basePass) console.error(`   Base: Expected £${test.expectedBase}, Got £${baseCost}`)
      if (!editingPass) console.error(`   With Editing: Expected £${test.expectedWithEditing}, Got £${totalWithEditing}`)
      if (!timePass) console.error(`   Edit Time: Expected ${test.editTime} mins, Got ${editTime} mins`)
    } else {
      const timeStr = editTime === -1 ? 'Unlimited' : `${editTime} mins`
      console.log(`✅ PASSED: ${test.pages} pages = £${baseCost} base, £${totalWithEditing} with editing, ${timeStr}`)
    }
  }

  console.log('\n' + (allPassed ? '✅ All tests passed!' : '❌ Some tests failed!'))
  return allPassed
}

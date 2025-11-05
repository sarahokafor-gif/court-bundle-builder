export interface PricingTier {
  min: number
  max: number | null
  price: number // in pence
  label: string
  description: string
}

export const PRICING_TIERS: PricingTier[] = [
  {
    min: 1,
    max: 5,
    price: 0,
    label: 'Free',
    description: 'Up to 5 documents',
  },
  {
    min: 6,
    max: 15,
    price: 1499,
    label: '£14.99',
    description: '6-15 documents',
  },
  {
    min: 16,
    max: 30,
    price: 2999,
    label: '£29.99',
    description: '16-30 documents',
  },
  {
    min: 31,
    max: 60,
    price: 4999,
    label: '£49.99',
    description: '31-60 documents',
  },
  {
    min: 61,
    max: null,
    price: 7999,
    label: '£79.99',
    description: '61+ documents',
  },
]

/**
 * Get the pricing tier for a given document count
 */
export function getPricingTier(documentCount: number): PricingTier {
  for (const tier of PRICING_TIERS) {
    if (documentCount >= tier.min && (tier.max === null || documentCount <= tier.max)) {
      return tier
    }
  }
  // Default to the highest tier if somehow not found
  return PRICING_TIERS[PRICING_TIERS.length - 1]
}

/**
 * Format price in pence to GBP string
 */
export function formatPrice(priceInPence: number): string {
  if (priceInPence === 0) return 'FREE'
  return `£${(priceInPence / 100).toFixed(2)}`
}

/**
 * Check if payment is required for the given document count
 */
export function isPaymentRequired(documentCount: number): boolean {
  return documentCount > 5
}

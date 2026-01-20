/**
 * Stripe integration utilities for Court Bundle Builder
 */

interface CreateCheckoutParams {
  bundleId: string
  pageCount: number
  includesEditing: boolean
}

interface CheckoutResponse {
  free?: boolean
  sessionId?: string
  url?: string
  message?: string
  error?: string
}

/**
 * Get the API base URL (handles local dev vs production)
 * Cloudflare Pages Functions are at the same origin, so we use relative URLs
 */
function getApiBaseUrl(): string {
  return ''  // Relative URL works for both dev and production
}

/**
 * Create a Stripe Checkout session
 */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResponse> {
  const { bundleId, pageCount, includesEditing } = params

  const baseUrl = window.location.origin
  const successUrl = `${baseUrl}/payment-success`
  const cancelUrl = `${baseUrl}/payment-cancelled`

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bundleId,
        pageCount,
        includesEditing,
        successUrl,
        cancelUrl,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

/**
 * Redirect to Stripe Checkout
 */
export async function redirectToCheckout(params: CreateCheckoutParams): Promise<void> {
  const result = await createCheckoutSession(params)

  if (result.free) {
    // Free tier - no redirect needed
    console.log('Free tier - no payment required')
    return
  }

  if (result.url) {
    // Redirect to Stripe Checkout
    window.location.href = result.url
  } else {
    throw new Error('No checkout URL received')
  }
}

/**
 * Parse payment success URL parameters
 */
export function parsePaymentSuccessParams(): {
  sessionId: string | null
  bundleId: string | null
  includesEditing: boolean
} {
  const params = new URLSearchParams(window.location.search)

  return {
    sessionId: params.get('session_id'),
    bundleId: params.get('bundle_id'),
    includesEditing: params.get('editing') === 'true',
  }
}

/**
 * Verify payment success (call this after redirect back from Stripe)
 * In a production app, you'd verify the session on the backend
 */
export function verifyPaymentSuccess(): {
  success: boolean
  bundleId: string | null
  includesEditing: boolean
} {
  const { sessionId, bundleId, includesEditing } = parsePaymentSuccessParams()

  // Basic verification - in production, you'd verify the session with Stripe
  if (sessionId && bundleId) {
    return {
      success: true,
      bundleId,
      includesEditing,
    }
  }

  return {
    success: false,
    bundleId: null,
    includesEditing: false,
  }
}

/**
 * Create checkout for time extension purchase
 */
export async function createTimeExtensionCheckout(
  bundleId: string,
  extensionMinutes: number,
  cost: number
): Promise<CheckoutResponse> {
  // For now, use the same checkout flow with a special marker
  // In a full implementation, you'd have a separate endpoint for extensions

  const baseUrl = window.location.origin
  const successUrl = `${baseUrl}/time-extended?bundle_id=${bundleId}&minutes=${extensionMinutes}`
  const cancelUrl = `${baseUrl}/`

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bundleId: `${bundleId}_extension`,
        pageCount: 0,  // Not relevant for extension
        includesEditing: true,
        successUrl,
        cancelUrl,
        // Custom fields for extension
        isExtension: true,
        extensionMinutes,
        extensionCost: cost,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating time extension checkout:', error)
    throw error
  }
}

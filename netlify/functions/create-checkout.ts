import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

// Pricing tiers based on document count
const getPriceForDocumentCount = (docCount: number): number => {
  if (docCount <= 5) return 0 // FREE
  if (docCount <= 15) return 1499 // £14.99
  if (docCount <= 30) return 2999 // £29.99
  if (docCount <= 60) return 4999 // £49.99
  return 7999 // £79.99 for 61+
}

const getTierName = (docCount: number): string => {
  if (docCount <= 5) return 'Free Bundle'
  if (docCount <= 15) return 'Small Bundle (6-15 documents)'
  if (docCount <= 30) return 'Medium Bundle (16-30 documents)'
  if (docCount <= 60) return 'Large Bundle (31-60 documents)'
  return 'Extra Large Bundle (61+ documents)'
}

export const handler = async (event: any) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { documentCount, bundleName } = JSON.parse(event.body || '{}')

    if (!documentCount || documentCount <= 5) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Payment not required for 5 or fewer documents' }),
      }
    }

    const amount = getPriceForDocumentCount(documentCount)
    const tierName = getTierName(documentCount)

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Court Bundle Download',
              description: `${tierName} - ${bundleName || 'Unnamed Bundle'}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.URL || 'http://localhost:3000'}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || 'http://localhost:3000'}/?payment=cancelled`,
      metadata: {
        documentCount: documentCount.toString(),
        bundleName: bundleName || 'Unnamed Bundle',
      },
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    }
  } catch (error: any) {
    console.error('Stripe error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Payment processing failed' }),
    }
  }
}

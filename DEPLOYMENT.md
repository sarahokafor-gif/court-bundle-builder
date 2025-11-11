# Court Bundle Builder - Deployment Guide

## Deploying to Netlify with Stripe Payments

### Prerequisites
- Netlify account (free tier works!)
- Stripe account (free to start)
- This project built and ready

### Step 1: Install Netlify CLI (Optional but Recommended)

```bash
npm install -g netlify-cli
```

### Step 2: Deploy to Netlify

**Option A: Deploy via Netlify Website (Easiest)**

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "Deploy manually" or connect your Git repository
4. If deploying manually:
   - Build the project: `npm run build`
   - Drag the `dist` folder to Netlify

**Option B: Deploy via CLI**

```bash
# Login to Netlify
netlify login

# Initialize and deploy
netlify init

# Or deploy directly
netlify deploy --prod
```

### Step 3: Configure Environment Variables on Netlify

**CRITICAL: You must set these in Netlify Dashboard**

1. Go to your site in Netlify Dashboard
2. Click "Site configuration" → "Environment variables"
3. Add these variables:

```
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY
URL=https://your-site-name.netlify.app
```

**Important Notes:**
- Replace `YOUR_STRIPE_SECRET_KEY` with your actual Stripe secret key
- Replace `YOUR_STRIPE_PUBLISHABLE_KEY` with your actual Stripe publishable key
- Replace `https://your-site-name.netlify.app` with your actual Netlify URL
- For production, use `sk_live_` and `pk_live_` keys instead of test keys

### Step 4: Configure Netlify Functions

The payment function is already set up in `netlify/functions/create-checkout.ts`

**Verify it's deployed:**
1. After deployment, check: `https://your-site.netlify.app/.netlify/functions/create-checkout`
2. You should see a 405 error (Method Not Allowed) - this is correct! It means the function exists.

### Step 5: Update Stripe Webhook Settings (For Production)

When you go live with `sk_live_` keys:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`

### Step 6: Test Payment Flow

1. Visit your deployed site
2. Add 6+ documents to trigger paid tier
3. Click "Pay £14.99 & Download"
4. You'll be redirected to Stripe Checkout (test mode)
5. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

### Pricing Tiers (Reminder)

- **FREE**: 1-5 documents
- **£14.99**: 6-15 documents
- **£29.99**: 16-30 documents
- **£49.99**: 31-60 documents
- **£79.99**: 61+ documents

### Troubleshooting

**Payment button does nothing:**
- Check browser console for errors
- Verify environment variables are set in Netlify
- Ensure Netlify Functions are enabled

**Stripe checkout fails:**
- Verify your Stripe API keys are correct
- Check you're using test mode keys (`sk_test_` and `pk_test_`)
- Ensure your Stripe account is activated

**Function returns 500 error:**
- Check Netlify Functions logs in dashboard
- Verify `STRIPE_SECRET_KEY` environment variable is set
- Make sure you redeployed after adding env vars

### Going Live (Production)

When ready for real payments:

1. Activate your Stripe account fully
2. Get **live** API keys from Stripe:
   - `sk_live_...` (Secret key)
   - `pk_live_...` (Publishable key)
3. Update environment variables in Netlify with live keys
4. Set `URL` to your production domain
5. Redeploy the site
6. Test with a real card (you can refund it)

### Support

If you need help:
- Netlify Docs: https://docs.netlify.com
- Stripe Docs: https://stripe.com/docs
- This project's issues: Check the repository

---

**Security Notes:**
- NEVER commit `.env` file to Git (it's in `.gitignore`)
- NEVER share your secret keys
- Use test keys for development
- Use live keys only in production environment variables

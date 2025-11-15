# Stripe Payment Setup - Quick Checklist

## ✅ Step-by-Step Setup (10 minutes)

### 1. Get Stripe Account & Keys (5 min)
- [ ] Go to https://stripe.com and sign up
- [ ] Verify your email
- [ ] Go to https://dashboard.stripe.com/test/apikeys
- [ ] Copy your **Publishable key** (starts with `pk_test_`)
- [ ] Click "Reveal test key" and copy your **Secret key** (starts with `sk_test_`)

### 2. Configure Local Environment (1 min)
- [ ] Open `.env` file in your project root
- [ ] Replace `sk_test_YOUR_SECRET_KEY_HERE` with your actual secret key
- [ ] Replace `pk_test_YOUR_PUBLISHABLE_KEY_HERE` with your actual publishable key
- [ ] Save the file

### 3. Restart Dev Server (1 min)
```bash
# Stop current server (Ctrl+C)
# Restart it
npm run dev
```

### 4. Test Locally (2 min)
- [ ] Go to http://localhost:3000
- [ ] Add 6+ documents (to trigger paid tier)
- [ ] Click "Pay £14.99 & Download"
- [ ] Should redirect to Stripe Checkout
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete "payment" (no real money charged in test mode)

### 5. Deploy to Netlify (5 min)

**Option 1: Netlify Website (Easiest)**
- [ ] Build: `npm run build`
- [ ] Go to https://app.netlify.com
- [ ] Drag `dist` folder to deploy
- [ ] Go to Site Configuration → Environment Variables
- [ ] Add all three variables from your `.env` file
- [ ] Update `URL` variable to your Netlify URL (e.g., `https://your-site.netlify.app`)
- [ ] Redeploy if needed

**Option 2: Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### 6. Configure Netlify Environment (2 min)
In Netlify Dashboard:
- [ ] Site Configuration → Environment Variables
- [ ] Add `STRIPE_SECRET_KEY` = your secret key
- [ ] Add `VITE_STRIPE_PUBLISHABLE_KEY` = your publishable key
- [ ] Add `URL` = your Netlify site URL
- [ ] Redeploy if needed

### 7. Test Live Site (2 min)
- [ ] Visit your Netlify URL
- [ ] Add 6+ documents
- [ ] Click payment button
- [ ] Should redirect to Stripe Checkout
- [ ] Test with card `4242 4242 4242 4242`

## 🎉 You're Done!

Your site now accepts payments (in test mode).

## 🚀 Going Live Checklist

When ready for real money:
- [ ] Activate your Stripe account fully (Stripe will guide you)
- [ ] Get LIVE keys from https://dashboard.stripe.com/apikeys
- [ ] Update Netlify environment variables with live keys
- [ ] Test with a real card (refund it after)
- [ ] You're taking real payments! 💰

## 💳 Test Card Numbers

**Success:**
- `4242 4242 4242 4242` - Always succeeds

**Specific Scenarios:**
- `4000 0000 0000 9995` - Declined (insufficient funds)
- `4000 0027 6000 3184` - Requires authentication (3D Secure)

**Any future date for expiry, any 3 digits for CVC**

## ❓ Troubleshooting

**Payment button doesn't work:**
1. Check browser console (F12)
2. Verify env variables are set in Netlify
3. Check Netlify Functions are deployed

**Getting errors:**
1. Verify your Stripe keys are correct
2. Make sure you're using TEST keys locally
3. Check Netlify Functions logs in dashboard

## 📞 Need Help?

- Stripe Test Mode Docs: https://stripe.com/docs/testing
- Netlify Functions Docs: https://docs.netlify.com/functions/overview/
- Stripe Support: https://support.stripe.com

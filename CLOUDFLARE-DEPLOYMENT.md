# Deploying Court Bundle Builder to Cloudflare Pages

## Why Cloudflare Pages?

- **Generous Free Tier**: Unlimited bandwidth and requests
- **Fast Global CDN**: Better performance than Netlify
- **No Usage Limits**: Won't pause your site
- **Free SSL**: Automatic HTTPS
- **Easy CI/CD**: Direct GitHub integration

## Prerequisites

1. Cloudflare account (sign up at https://dash.cloudflare.com/sign-up)
2. GitHub repository with your code pushed
3. Environment variables from `.env` file

## Deployment Steps

### Step 1: Push Your Code to GitHub

Make sure all your latest changes are committed and pushed:

```bash
git add -A
git commit -m "Prepare for Cloudflare Pages deployment"
git push
```

### Step 2: Create Cloudflare Pages Project

**IMPORTANT**: Make sure you're creating a **Pages** project, NOT a Workers project!

1. Go to https://dash.cloudflare.com
2. Select **Workers & Pages** from the left sidebar
3. Click **Create application**
4. Select the **Pages** tab (NOT Workers!)
5. Click **Connect to Git**
6. Authorize Cloudflare to access your GitHub account
7. Select your **court-bundle-builder** repository
8. Click **Begin setup**

### Step 3: Configure Build Settings

On the setup page, enter these settings:

**Project name**: `court-bundle-builder` (or your preferred name)

**Production branch**: `main`

**Build settings**:
- **Framework preset**: `Vite`
- **Build command**: `npm run build`
- **Build output directory**: `dist`

**Environment variables** (click "Add variable"):
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
(Add your Stripe publishable key from .env file)
```

**Advanced settings**:
- **Node version**: `18` (or leave default)

### Step 4: Deploy

1. Click **Save and Deploy**
2. Wait 2-3 minutes for the build to complete
3. Your site will be live at `https://court-bundle-builder.pages.dev`

### Step 5: Custom Domain (Optional)

To use your own domain:

1. In your Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain name
4. Follow the DNS configuration instructions
5. Wait for SSL certificate provisioning (automatic)

## Environment Variables

After initial deployment, you can manage environment variables:

1. Go to your project in Cloudflare Pages
2. Click **Settings** → **Environment variables**
3. Add or update variables:
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - Any other environment variables from your `.env` file
4. Redeploy to apply changes

## Continuous Deployment

Every time you push to the `main` branch:
- Cloudflare automatically builds and deploys
- Build time: ~2-3 minutes
- Zero downtime deployment
- Automatic cache invalidation

## Troubleshooting

### Deployment Fails with "wrangler deploy" Error

**Problem**: You created a Workers project instead of a Pages project.

**Solution**:
1. Go to Cloudflare dashboard → Workers & Pages
2. Delete the current project
3. Click **Create application** → Select **Pages** tab
4. Reconnect to your GitHub repository
5. Follow the setup steps above

### Build Fails

Check the build logs in Cloudflare Pages dashboard:
- Ensure Node version is 18
- Verify all dependencies are in `package.json`
- Check for TypeScript errors

### Site Shows 404 Errors

The `public/_redirects` file ensures SPA routing works. If you see 404s:
1. Verify `public/_redirects` exists in your repository
2. Check it contains: `/* /index.html 200`
3. Redeploy the project

### Environment Variables Not Working

Remember:
- Vite requires `VITE_` prefix for client-side variables
- Redeploy after changing environment variables
- Variables are build-time, not runtime

## Comparing to Netlify

| Feature | Netlify Free | Cloudflare Pages Free |
|---------|-------------|---------------------|
| Bandwidth | 100 GB/month | Unlimited |
| Build minutes | 300/month | 500/month |
| Sites | 100 | Unlimited |
| Team members | 1 | Unlimited |
| Serverless | Limited | 100k req/day |

## Next Steps

Once deployed:
1. Test all features thoroughly
2. Update Stripe webhook URLs if using webhooks
3. Monitor usage in Cloudflare Analytics
4. Set up custom domain for professional look

## Support

- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- Community Discord: https://discord.gg/cloudflaredev
- Status Page: https://www.cloudflarestatus.com/

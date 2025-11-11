# Deploy to Cloudflare Pages via CLI (Alternative Method)

If the Git integration is causing issues, you can deploy directly using the Wrangler CLI.

## One-Time Setup

1. **Login to Cloudflare** (only needed once):
   ```bash
   npx wrangler login
   ```
   This will open a browser window to authorize the CLI.

2. **First Deployment**:
   ```bash
   npm run deploy
   ```

   This will:
   - Build your application
   - Upload to Cloudflare Pages
   - Create a new project automatically

## Subsequent Deployments

Just run:
```bash
npm run deploy
```

Every time you want to deploy changes!

## Advantages of CLI Deployment

✅ No Git integration issues
✅ Faster deployment (no waiting for Git webhooks)
✅ Works identically on any machine
✅ Full control over deployment process
✅ Can deploy from any branch/commit

## Your Site URL

After deployment, your site will be available at:
```
https://court-bundle-builder.pages.dev
```

## Environment Variables

To set environment variables:

```bash
npx wrangler pages secret put VITE_STRIPE_PUBLISHABLE_KEY
# Then paste your Stripe key when prompted
```

## Troubleshooting

### "Not logged in" error

Run:
```bash
npx wrangler login
```

### "Project already exists" error

The project was created via the dashboard. Either:
- Use the same project name in package.json
- Or delete the dashboard project and let CLI create it

### Build fails

Check that build works locally first:
```bash
npm run build
```

## Custom Domain

After deploying via CLI, you can still add a custom domain:
1. Go to Cloudflare dashboard
2. Find your project under "Workers & Pages"
3. Click on it → "Custom domains"
4. Add your domain

## Summary

**Quick deploy:**
```bash
npm run deploy
```

That's it! Much simpler than the Git integration when there are configuration issues.

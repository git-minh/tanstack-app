# Deployment Guide

This guide covers how to deploy the TanStack application to production environments.

## Architecture Overview

The application deploys to two main platforms:

1. **Frontend**: Cloudflare Workers/Pages (Edge computing)
2. **Backend**: Convex (Serverless database + functions)

## Prerequisites

- **Cloudflare Account** - For frontend deployment
- **Convex Account** - For backend deployment
- **Custom Domain** (optional) - For production URLs
- **Payment Method** - For both platforms (free tiers available)

## Frontend Deployment (Cloudflare)

### 1. Configure Cloudflare

**Setup Wrangler Configuration** (`apps/web/wrangler.jsonc`):
```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "your-app-name",
  "main": "@tanstack/react-start/server-entry",
  "compatibility_date": "2025-09-15",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".output/public"
  },
  "observability": {
    "enabled": true
  },
  "vars": {
    "VITE_CONVEX_URL": "",
    "VITE_CONVEX_SITE_URL": ""
  }
}
```

**Note:** The `vars` section declares environment variables. Values are passed during deployment via CLI flags or set per environment.

### 2. Deploy to Cloudflare

**Manual Deployment:**
```bash
# From apps/web directory
cd apps/web

# Deploy with environment variables
wrangler deploy \
  --var VITE_CONVEX_URL:"https://your-project.convex.cloud" \
  --var VITE_CONVEX_SITE_URL:"https://your-project.convex.site"
```

**CI/CD Deployment (CircleCI):**

The `.circleci/config.yml` automatically deploys on push to master:
```yaml
- run:
    name: Deploy frontend to Cloudflare
    command: |
      cd apps/web
      export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}"
      export VITE_CONVEX_URL="${VITE_CONVEX_URL}"
      export VITE_CONVEX_SITE_URL="${VITE_CONVEX_SITE_URL}"
      wrangler deploy --var VITE_CONVEX_URL:"${VITE_CONVEX_URL}" --var VITE_CONVEX_SITE_URL:"${VITE_CONVEX_SITE_URL}"
```

**Required CircleCI Environment Variables:**
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `VITE_CONVEX_URL` - Production Convex backend URL
- `VITE_CONVEX_SITE_URL` - Production site URL

### 3. Configure Custom Domain (Optional)

```bash
# Add custom domain to Cloudflare Worker
wrangler custom-domains add your-app.com

# Verify domain setup
wrangler custom-domains list
```

## Backend Deployment (Convex)

### 1. Create Production Deployment

```bash
# Create production project
npx convex deploy

# Choose production deployment
# This will create a new production Convex project
```

### 2. Set Production Environment Variables

```bash
# Set production variables
npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
npx convex env set SITE_URL https://your-app.com
npx convex env set CONVEX_SITE_URL https://your-project.convex.site

# Set third-party API keys
npx convex env set OPENAI_API_KEY=sk-prod-...
npx convex env set STRIPE_SECRET_KEY=sk_live_...

# Verify all variables
npx convex env list
```

### 3. Deploy Database Schema

```bash
# Deploy schema and functions
npx convex deploy
```

## Production Environment Setup

### 1. Frontend Production Variables

Create `apps/web/.env.production`:
```env
VITE_CONVEX_URL=https://prod-project.convex.cloud
VITE_CONVEX_SITE_URL=https://your-app.com
VITE_APP_NAME=Your App Name
VITE_ENABLE_DEBUG=false
VITE_API_URL=https://api.your-app.com
```

### 2. Backend Production Variables

Create `packages/backend/.env.production`:
```env
CONVEX_DEPLOYMENT=prod:production-project
CONVEX_URL=https://prod-project.convex.cloud
SITE_URL=https://your-app.com
CONVEX_SITE_URL=https://your-project.convex.site
BETTER_AUTH_SECRET=your-production-secret
NODE_ENV=production
LOG_LEVEL=info

# Third-party services
OPENAI_API_KEY=sk-prod-...
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG.prod-key...
```

## Deployment Pipeline

### 1. Build Process

```bash
# Build all packages
pnpm build

# Type checking
pnpm check-types

# Run tests
pnpm test
```

### 2. Deployment Commands

**Automated Deployment Script:**
```bash
#!/bin/bash
# deploy.sh

echo "🏗️  Building application..."
pnpm build

echo "📦 Deploying backend..."
cd packages/backend
npx convex deploy
cd ../..

echo "🌐 Deploying frontend..."
cd apps/web
pnpm deploy
cd ../..

echo "✅ Deployment complete!"
```

### 3. CI/CD Integration

**GitHub Actions Example** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Build application
      run: pnpm build
      
    - name: Deploy backend
      run: |
        cd packages/backend
        npx convex deploy --cmd 'npx convex env set CONVEX_DEPLOYMENT ${{ secrets.CONVEX_DEPLOYMENT }}'
        
    - name: Deploy frontend
      run: |
        cd apps/web
        echo "CLOUDFLARE_API_TOKEN=${{ secrets.CLOUDFLARE_API_TOKEN }}" > .dev.vars
        pnpm deploy
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Monitoring and Observability

### 1. Cloudflare Analytics

- Access via Cloudflare Dashboard
- Monitor requests, latency, errors
- Set up alerts for high error rates

### 2. Convex Dashboard

- Monitor function execution
- Database performance metrics
- Real-time connection status

### 3. Application Monitoring

Add monitoring to your application:

```typescript
// apps/web/src/lib/analytics.ts
export const trackEvent = (name: string, properties?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    // Send to analytics service
    gtag('event', name, properties);
  }
};

// packages/backend/convex/logging.ts
export const logEvent = async (event: string, data: any) => {
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service
    console.log(`[PROD] ${event}:`, data);
  }
};
```

## Rollback Procedures

### 1. Frontend Rollback

```bash
# View deployment history
wrangler deployments list

# Rollback to previous deployment
wrangler rollback --to-deployment-id <previous-deployment-id>
```

### 2. Backend Rollback

```bash
# View function history
npx convex deployment history

# Rollback schema (if needed)
npx convex deploy --schema <previous-schema-version>
```

## Security Considerations

### 1. Environment Variables

- Never commit secrets to version control
- Use different secrets for each environment
- Rotate secrets regularly

### 2. CORS Configuration

Configure CORS in your Convex functions:

```typescript
// packages/backend/convex/http.ts
import { httpRouter } from "convex/server";

const http = httpRouter();

http.route({
  path: "/api/*",
  method: "GET",
  handler: (ctx) => {
    // Set CORS headers
    return new Response(JSON.stringify({ hello: "world" }), {
      headers: {
        "Access-Control-Allow-Origin": process.env.SITE_URL!,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  },
});
```

### 3. Authentication

Ensure proper authentication configuration:

```typescript
// packages/backend/convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
};
```

## Performance Optimization

### 1. Frontend Optimization

```typescript
// apps/web/vite.config.ts
export default defineConfig({
  plugins: [cloudflare({ viteEnvironment: { name: 'ssr' } }), ...],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['@tanstack/react-router'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

### 2. Backend Optimization

```typescript
// packages/backend/convex/schema.ts
export default defineSchema({
  // Add indexes for frequently queried fields
  users: defineTable({
    email: v.string(),
    name: v.string(),
  })
    .index("by_email", ["email"])
    .searchIndex("by_name", { searchField: "name" }),
});
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify dependencies are installed
   - Run `pnpm check-types`

2. **Deployment Failures**
   - Check API keys and permissions
   - Verify build output exists
   - Review Cloudflare/Convex logs

3. **Runtime Errors**
   - Check environment variable access
   - Verify Convex function permissions
   - Review network requests

### Debug Commands

```bash
# Debug Cloudflare deployment
wrangler tail

# Debug Convex functions
npx convex dev --debug

# Check build output
ls -la apps/web/dist
ls -la apps/web/.output
```

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   pnpm update
   pnpm audit
   ```

2. **Monitor Usage**
   - Check Cloudflare analytics
   - Monitor Convex function execution
   - Review error logs

3. **Security Updates**
   - Rotate secrets quarterly
   - Update dependencies regularly
   - Review access permissions

### Backup Strategy

- Convex automatically handles data backups
- Export configuration for disaster recovery
- Document all environment variables and secrets

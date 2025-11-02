# Environment Variables Configuration

This document explains how environment variables are configured and used across the TanStack monorepo.

## Overview

The application uses a dual-environment system:
- **Frontend** (`apps/web`): Uses `VITE_*` prefixed variables (Vite convention)
- **Backend** (`packages/backend`): Uses standard `process.env.*` variables

## Environment Files Structure

```
tanstack-app/
├── apps/web/
│   └── .env.local              # Frontend environment variables
├── packages/backend/
│   └── .env.local              # Backend environment variables
└── .gitignore                  # Excludes .env files from version control
```

## Frontend Environment Variables (apps/web)

Create `apps/web/.env.local` for frontend configuration:

```env
# Convex Backend Connection
VITE_CONVEX_URL=https://your-project-id.convex.cloud
VITE_CONVEX_SITE_URL=https://your-project-id.convex.site

# Application Configuration
VITE_APP_NAME=Your App Name
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false

# Third-party Services
VITE_API_URL=https://api.example.com
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### How Frontend Variables Work

- **Prefix**: All variables must start with `VITE_`
- **Access**: Use `import.meta.env.VARIABLE_NAME` in code
- **Build-time**: Variables are embedded during build process
- **Type Safety**: Variables are available as string types

### Usage Example

```typescript
// apps/web/src/lib/config.ts
export const config = {
  convexUrl: import.meta.env.VITE_CONVEX_URL!,
  appName: import.meta.env.VITE_APP_NAME || 'TanStack App',
  isDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
}

// apps/web/src/convex-client.ts
import { ConvexReactClient } from 'convex/react';
import { config } from './lib/config';

export const convex = new ConvexReactClient(config.convexUrl);
```

## Backend Environment Variables (packages/backend)

Create `packages/backend/.env.local` for backend configuration:

```env
# Convex Configuration
CONVEX_DEPLOYMENT=dev:your-project-id
CONVEX_URL=https://your-project-id.convex.cloud

# Application URLs
SITE_URL=http://localhost:3001
CONVEX_SITE_URL=https://your-project-id.convex.site

# Authentication
BETTER_AUTH_SECRET=your-32-character-secret-key
AUTH_REDIRECT_URL=http://localhost:3001/auth/callback

# Third-party Services
DATABASE_URL=your-database-connection-string
REDIS_URL=redis://localhost:6379

# External APIs
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG.your-api-key

# Development
NODE_ENV=development
LOG_LEVEL=debug
```

### How Backend Variables Work

- **Runtime**: Variables are accessed via `process.env`
- **Convex**: Variables are set in Convex environment
- **Security**: Backend variables are never exposed to frontend

### Usage Example

```typescript
// packages/backend/convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};

// packages/backend/convex/auth.ts
const siteUrl = process.env.SITE_URL!;
const authSecret = process.env.BETTER_AUTH_SECRET!;

// packages/backend/convex/external-api.ts
export const callExternalAPI = async () => {
  const apiKey = process.env.OPENAI_API_KEY;
  // Use API key for external service calls
};
```

## Setting Up Convex Environment

### 1. Create Convex Project
```bash
npx convex dev --configure
```

### 2. Set Environment Variables
```bash
# Set authentication secret
npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)

# Set site URL
npx convex env set SITE_URL http://localhost:3001

# Set other required variables
npx convex env set CONVEX_SITE_URL https://your-project.convex.site
```

### 3. Verify Environment
```bash
npx convex env list
```

## Common Environment Variable Patterns

### Development Environment

**Frontend (.env.local):**
```env
VITE_CONVEX_URL=http://127.0.0.1:3210
VITE_CONVEX_SITE_URL=http://localhost:3001
VITE_ENABLE_DEBUG=true
VITE_API_URL=http://localhost:3000
```

**Backend (.env.local):**
```env
CONVEX_DEPLOYMENT=dev:local
CONVEX_URL=http://127.0.0.1:3210
SITE_URL=http://localhost:3001
NODE_ENV=development
LOG_LEVEL=debug
```

### Production Environment

**Frontend (.env.local):**
```env
VITE_CONVEX_URL=https://prod-project.convex.cloud
VITE_CONVEX_SITE_URL=https://your-app.com
VITE_ENABLE_DEBUG=false
VITE_API_URL=https://api.your-app.com
```

**Backend (.env.local):**
```env
CONVEX_DEPLOYMENT=prod:production-project
CONVEX_URL=https://prod-project.convex.cloud
SITE_URL=https://your-app.com
NODE_ENV=production
LOG_LEVEL=info
```

## Environment Variable Types

### Required Variables

**Frontend:**
- `VITE_CONVEX_URL` - Convex backend URL

**Backend:**
- `CONVEX_URL` - Convex backend URL
- `SITE_URL` - Frontend URL
- `BETTER_AUTH_SECRET` - Authentication secret

### Optional Variables

**Frontend:**
- `VITE_APP_NAME` - Application name
- `VITE_ENABLE_DEBUG` - Debug mode toggle

**Backend:**
- `LOG_LEVEL` - Logging verbosity
- `NODE_ENV` - Environment mode

### Secret Variables

These should never be committed or exposed:
- API keys (`*_API_KEY`)
- Database URLs (`DATABASE_URL`)
- Authentication secrets (`*_SECRET`)
- Payment keys (`STRIPE_*`)

## Best Practices

### 1. Security
- Never commit `.env.local` files to version control
- Use different secrets for development and production
- Rotate secrets regularly

### 2. Naming Conventions
- Frontend: `VITE_*` prefix
- Backend: Standard names, uppercase with underscores
- Use descriptive names (`CONVEX_URL` vs `API_URL`)

### 3. Type Safety
```typescript
// apps/web/src/env.ts
export const env = {
  VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
} as const;

// Runtime validation
if (!env.VITE_CONVEX_URL) {
  throw new Error('VITE_CONVEX_URL is required');
}
```

### 4. Environment Detection
```typescript
// apps/web/src/lib/env.ts
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const isTest = import.meta.env.MODE === 'test';
```

## Troubleshooting

### Variables Not Loading
1. Check file locations (apps/web/.env.local vs packages/backend/.env.local)
2. Restart development server after changes
3. Verify variable naming conventions

### Convex Connection Issues
1. Ensure `CONVEX_URL` and `VITE_CONVEX_URL` match
2. Run `npx convex env list` to verify backend variables
3. Check Convex deployment status

### Build Errors
1. Verify all required variables are set
2. Check for undefined variables in TypeScript
3. Run type checking: `pnpm check-types`

## Environment-Specific Configurations

For different environments (development, staging, production), create separate `.env` files:

```bash
# Development
.env.local

# Staging
.env.staging

# Production
.env.production
```

Load specific environment files using:
```bash
NODE_ENV=staging pnpm dev
```

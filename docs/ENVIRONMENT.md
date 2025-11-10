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

# Error Monitoring (Sentry)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
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

# Azure OpenAI Configuration (AI Project Generation)
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com
AZURE_OPENAI_KEY=your-azure-openai-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-5

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

## Setting Up Sentry Error Monitoring

The application uses Sentry for error tracking and performance monitoring. Configuration requires environment variables for both runtime and build-time.

### 1. Create a Sentry Project

1. Sign up at [sentry.io](https://sentry.io) or log in
2. Create a new project (select "React" as platform)
3. Copy the DSN from project settings

### 2. Configure Runtime Variables

**For Development** (`apps/web/.env.local`):
```env
# Sentry Error Monitoring (Required)
VITE_SENTRY_DSN=https://your-public-key@sentry.io/your-project-id
```

**For Production** (set in deployment environment):
```env
VITE_SENTRY_DSN=https://your-public-key@sentry.io/your-project-id
```

### 3. Configure Build-Time Variables (Optional)

For source map uploads during production builds:

```env
# Sentry Source Maps Upload (Optional - for better error tracking)
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token
```

**To get auth token:**
1. Go to Sentry → Settings → Account → API → Auth Tokens
2. Create new token with `project:releases` and `org:read` scopes
3. Copy the token

### 4. Verify Setup

**Check Sentry is initialized:**
```typescript
// In browser console after app loads
window.__SENTRY__
```

**Test error tracking:**
```typescript
// Trigger test error in browser console
throw new Error("Sentry test error");
```

**Check Sentry dashboard:**
- Navigate to Issues in Sentry dashboard
- Verify error appears with correct source maps
- Check session replay if available

### 5. Features Enabled

- **Error Tracking**: All unhandled errors and exceptions
- **Performance Monitoring**: 100% of transactions tracked
- **Session Replay**: 10% of sessions, 100% of error sessions
- **Source Maps**: Automatic upload during production builds (if auth token configured)
- **User Context**: Automatic user identification
- **Breadcrumbs**: User interactions and console logs

## Setting Up Azure OpenAI for AI Project Generation

The application uses Azure OpenAI GPT-5 for AI-powered project generation features. This requires three environment variables to be configured.

### 1. Obtain Azure OpenAI Credentials

Go to the Azure Portal (portal.azure.com) and navigate to your Azure OpenAI resource:

1. **AZURE_OPENAI_ENDPOINT**: Found in "Keys and Endpoint" section
   - Format: `https://YOUR-RESOURCE.openai.azure.com` or `https://YOUR-RESOURCE.cognitiveservices.azure.com`

2. **AZURE_OPENAI_KEY**: Found in "Keys and Endpoint" section
   - Use either "Key 1" or "Key 2"

3. **AZURE_OPENAI_DEPLOYMENT**: The deployment name you created
   - Example: `gpt-5`, `gpt-4`, `gpt-35-turbo`

### 2. Configure Environment Variables

**For Local Development** (`packages/backend/.env.local`):
```env
# Azure OpenAI Configuration for AI Project Generation
# These variables are used by the AI generation action (convex/ai.ts)
AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com
AZURE_OPENAI_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-5
```

**For Production** (set via Convex CLI):
```bash
npx convex env set AZURE_OPENAI_ENDPOINT "https://your-resource.cognitiveservices.azure.com"
npx convex env set AZURE_OPENAI_KEY "your-api-key-here"
npx convex env set AZURE_OPENAI_DEPLOYMENT "gpt-5"
```

### 3. Verify Configuration

**Check Convex environment:**
```bash
npx convex env list | grep AZURE
```

**Test the endpoint:**
```bash
curl -X POST "https://your-resource.cognitiveservices.azure.com/openai/deployments/gpt-5/chat/completions?api-version=2025-01-01-preview" \
  -H "Content-Type: application/json" \
  -H "api-key: your-api-key-here" \
  -d '{
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_completion_tokens": 10
  }'
```

**Successful response:**
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello!"
    }
  }],
  "model": "gpt-5-2025-08-07",
  "usage": {
    "prompt_tokens": 11,
    "completion_tokens": 3,
    "total_tokens": 14
  }
}
```

### 4. Important API Differences for GPT-5

Azure OpenAI GPT-5 has some API differences compared to GPT-4:

- **Token Parameter**: Use `max_completion_tokens` instead of `max_tokens`
- **API Version**: Use `2025-01-01-preview` or later
- **Reasoning Tokens**: GPT-5 includes `reasoning_tokens` in usage statistics

**Correct API Call Pattern:**
```typescript
// packages/backend/convex/ai.ts
const response = await fetch(
  `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2025-01-01-preview`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": AZURE_OPENAI_KEY,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      max_completion_tokens: 4000, // NOT max_tokens
    }),
  }
);
```

### 5. Usage in Convex Actions

```typescript
// packages/backend/convex/ai.ts
import { action } from "./_generated/server";
import { v } from "convex/values";

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY!;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT!;

export const generateProject = action({
  args: { prompt: v.string() },
  handler: async (ctx, args) => {
    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2025-01-01-preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_OPENAI_KEY,
        },
        body: JSON.stringify({
          messages: [
            { role: "user", content: args.prompt }
          ],
          max_completion_tokens: 4000,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status}`);
    }

    return await response.json();
  },
});
```

### 6. Security Notes

- **Never commit** Azure OpenAI credentials to version control
- **Rotate keys regularly** in Azure Portal
- **Use environment-specific keys** for development and production
- **Monitor usage** in Azure Portal to track costs
- **Set spending limits** in Azure to prevent unexpected charges

### 7. Troubleshooting

**Connection Issues:**
- Verify endpoint URL format (with or without `/openai` suffix)
- Check API key is valid in Azure Portal
- Ensure deployment name matches exactly

**API Errors:**
- `unsupported_parameter`: Check for `max_tokens` → use `max_completion_tokens`
- `model_not_found`: Verify deployment name is correct
- `401 Unauthorized`: Check API key is set correctly
- `429 Rate Limit`: Implement retry logic with exponential backoff

**Cost Management:**
- GPT-5 is more expensive than GPT-4
- Implement `max_completion_tokens` limits to control costs
- Cache responses when possible
- Monitor token usage in production

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

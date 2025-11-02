# CircleCI Configuration

This directory contains the CircleCI CI/CD pipeline configuration for automated testing and deployment.

## Overview

The pipeline automatically runs on every push to the `main` branch and performs:

1. **Install**: Install all dependencies using pnpm with caching
2. **Validate**: Run TypeScript type checking across all workspaces
3. **Test**: Run Vitest tests in the web application
4. **Build**: Build all packages using Turborepo
5. **Deploy Backend**: Deploy Convex backend (functions and schema)
6. **Deploy Frontend**: Deploy frontend to Cloudflare Workers

## Setup Instructions

### 1. Enable CircleCI for Your Repository

1. Go to [CircleCI](https://circleci.com/)
2. Sign in with your GitHub account
3. Click "Set Up Project" for your repository
4. CircleCI will automatically detect the `.circleci/config.yml` file

### 2. Configure Environment Variables

Add the following environment variables in your CircleCI project settings (Project Settings → Environment Variables):

#### Required Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `CONVEX_DEPLOY_KEY` | Convex production deployment key | Run `npx convex deploy --generate-key` in `packages/backend/` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Workers API token | Create in Cloudflare dashboard (Account → API Tokens) |
| `VITE_CONVEX_URL` | Production Convex backend URL | Get from Convex dashboard after creating production deployment |
| `BETTER_AUTH_SECRET` | Better-Auth secret key | Generate with `openssl rand -base64 32` |
| `SITE_URL` | Production frontend URL | Your production domain (e.g., `https://yourdomain.com`) |

#### Cloudflare API Token Permissions

When creating the Cloudflare API token, ensure it has:
- **Account** → Workers Scripts → Edit
- **Account** → Account Settings → Read
- **Zone** → Workers Routes → Edit (if using custom domains)

### 3. Generate Convex Deploy Key

```bash
cd packages/backend
npx convex deploy --generate-key
```

This command will output a deploy key. Add this to CircleCI as `CONVEX_DEPLOY_KEY`.

### 4. Set Up Convex Production Environment

Before the first deployment, ensure your Convex production environment variables are set:

```bash
# Set production environment variables in Convex
npx convex env set SITE_URL https://yourdomain.com --prod
npx convex env set BETTER_AUTH_SECRET <your-secret> --prod
```

### 5. Configure Cloudflare Deployment

Ensure your `apps/web/wrangler.toml` is properly configured:

```toml
name = "your-app-name"
compatibility_date = "2024-01-01"
main = ".output/server/index.mjs"

[site]
bucket = ".output/public"
```

## Pipeline Workflow

### Caching Strategy

The pipeline uses multiple caching layers for optimal performance:

1. **pnpm Store Cache**: Caches the global pnpm store (`~/.local/share/pnpm/store`)
   - Key: `pnpm-store-v1-{{ checksum "pnpm-lock.yaml" }}`
   - Speeds up dependency installation

2. **node_modules Cache**: Caches all workspace node_modules
   - Key: `node-modules-v1-{{ checksum "pnpm-lock.yaml" }}`
   - Avoids re-installing dependencies if lockfile hasn't changed

3. **Turborepo Cache**: Caches Turborepo build artifacts
   - Key: `turbo-v1-{{ .Branch }}-{{ .Revision }}`
   - Speeds up incremental builds

### Job Dependencies

```
install
  ├─> validate (type checking)
  └─> test (unit tests)
       └─> build
            └─> deploy-backend (Convex)
                 └─> deploy-frontend (Cloudflare)
```

- **Parallel Execution**: `validate` and `test` run in parallel after `install`
- **Sequential Deployment**: Backend deploys first, then frontend (ensures API compatibility)
- **Fail Fast**: Pipeline stops at first failure to save build time

## Local Testing

### Run Tests Locally

```bash
# Run all tests
pnpm test

# Run tests in watch mode
cd apps/web && pnpm test:watch

# Run tests with UI
cd apps/web && pnpm test:ui

# Run tests with coverage
cd apps/web && pnpm test:coverage
```

### Simulate CI Build Locally

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Type checking
pnpm check-types

# Run tests
pnpm test

# Build all packages
pnpm build
```

## Troubleshooting

### Build Fails on Type Checking

- Run `pnpm check-types` locally to identify type errors
- Ensure all workspace dependencies are properly installed
- Check that auto-generated files are up to date (`routeTree.gen.ts`, `_generated/`)

### Tests Fail in CI but Pass Locally

- Ensure test setup is environment-agnostic
- Check for timing issues or race conditions
- Verify that all test dependencies are in `devDependencies`

### Deployment Fails

**Convex Deployment Issues:**
- Verify `CONVEX_DEPLOY_KEY` is set correctly
- Ensure the deploy key has access to the production deployment
- Check Convex environment variables are set for production

**Cloudflare Deployment Issues:**
- Verify `CLOUDFLARE_API_TOKEN` has correct permissions
- Check `wrangler.toml` configuration
- Ensure `VITE_CONVEX_URL` points to production Convex backend

### Cache Issues

If you suspect cache corruption:

1. Go to CircleCI project settings
2. Navigate to "Advanced" → "Clear Cache"
3. Trigger a new build

Alternatively, bump the cache version in `.circleci/config.yml`:
```yaml
# Change v1 to v2
- pnpm-store-v2-{{ checksum "pnpm-lock.yaml" }}
```

## Adding New Jobs

To add a new job to the pipeline:

1. Define the job in the `jobs` section of `config.yml`
2. Add the job to the `workflows` section
3. Specify job dependencies using `requires`
4. Add appropriate caching if needed

Example:

```yaml
jobs:
  lint:
    executor: node-executor
    steps:
      - attach_workspace:
          at: ~/project
      - run:
          name: Install pnpm
          command: |
            sudo corepack enable
            corepack prepare pnpm@10.16.1 --activate
      - run:
          name: Run linter
          command: pnpm lint

workflows:
  build-test-deploy:
    jobs:
      - install
      - lint:
          requires:
            - install
      # ... other jobs
```

## Branch Protection

For production deployments, consider adding branch protection rules:

1. Require status checks to pass before merging
2. Require CircleCI build to succeed
3. Require at least one approval for pull requests

## Monitoring

- **Build Status**: Check CircleCI dashboard for build status
- **Deployment Logs**: View in CircleCI job output
- **Convex Logs**: Check Convex dashboard for function logs
- **Cloudflare Logs**: View in Cloudflare Workers dashboard

## Additional Resources

- [CircleCI Documentation](https://circleci.com/docs/)
- [Convex Deployment Guide](https://docs.convex.dev/production/deployment)
- [Cloudflare Workers Deployment](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Turborepo Caching](https://turbo.build/repo/docs/core-concepts/caching)

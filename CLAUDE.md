# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation

Comprehensive documentation is in the `docs/` directory:
- **docs/README.md** - Quick start and overview
- **docs/TECH_STACK.md** - Complete technology breakdown
- **docs/DEVELOPMENT.md** - Development setup and workflow
- **docs/ENVIRONMENT.md** - Environment variable configuration
- **docs/DEPLOYMENT.md** - Production deployment guide

## Project Overview

Full-stack TypeScript monorepo with:
- **Frontend**: TanStack Start (SSR) + React 19 + TailwindCSS v4
- **Backend**: Convex (reactive serverless database)
- **Auth**: Better-Auth integrated with Convex
- **Monorepo**: Turborepo + pnpm workspaces

## Essential Commands

```bash
# Initial setup
pnpm install                 # Install dependencies
pnpm dev:setup              # Configure Convex (first time only)

# Development
pnpm dev                    # Start all (web + backend)
pnpm dev:web                # Frontend only (port 3001)
pnpm dev:server             # Backend only

# Build & check
pnpm build                  # Build all packages
pnpm check-types            # TypeScript validation

# Deployment
cd apps/web && pnpm deploy  # Deploy to Cloudflare
```

## Architecture

### Workspace Structure
```
apps/web/          # Frontend - TanStack Start + React
  src/routes/      # File-based routing (auto-generates routeTree.gen.ts)
  src/components/  # UI components (shadcn/ui)
  src/lib/         # auth-client.ts, auth-server.ts, utils.ts
  src/router.tsx   # Router setup with context providers

packages/backend/  # Backend - Convex
  convex/          # Schema, queries, mutations, actions
    schema.ts      # Database schema
    auth.ts        # Better-Auth configuration
    http.ts        # HTTP routes (auth endpoints)
```

### Critical Integration Points

#### 1. Router Context (apps/web/src/router.tsx)
The router provides three critical context objects:
- `queryClient` - React Query client
- `convexClient` - Convex real-time client
- `convexQueryClient` - Bridge between Convex and React Query

**Usage in routes:**
```typescript
const context = useRouteContext({ from: Route.id });
context.convexQueryClient // Use for data fetching
```

#### 2. Authentication Flow

**IMPORTANT**: There are two authentication methods in the codebase:

**Method 1: Standard Convex Auth (RECOMMENDED)**
```typescript
// Use this pattern - it's more reliable
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new Error("Unauthorized");
}
const userId = identity.subject; // User ID for queries
```

**Method 2: Better-Auth Component (USE WITH CAUTION)**
```typescript
// authComponent.getAuthUser() throws errors instead of returning null
// Only use if you need Better-Auth user object specifically
const user = await authComponent.getAuthUser(ctx);
// Returns user object with _id, email, name, etc.
```

**Client-side** (`@/lib/auth-client.ts`):
- `authClient` with `convexClient()` plugin

**Server-side** (`@/lib/auth-server.ts`):
- `fetchQuery`, `fetchMutation`, `fetchAction` for server functions

**Session handling** (`apps/web/src/routes/__root.tsx`):
- `beforeLoad` hook fetches session and sets auth token on Convex client
- Returns `{ userId, token }` to route context

**Protected routes**:
- Use `beforeLoad` hook to check `context.userId`
- Redirect unauthenticated users to `/login` with redirect parameter

#### 3. Data Fetching Pattern

Convex integrates with React Query:
```typescript
// In routes - use React Query with Convex
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";

const todos = useSuspenseQuery(convexQuery(api.todos.getAll, {}));

// For mutations - use Convex directly
import { useMutation } from "convex/react";
const createTodo = useMutation(api.todos.create);
await createTodo({ text: "New todo" });
```

### Adding Features

#### New Route
1. Create `apps/web/src/routes/your-route.tsx`
2. Export component as default
3. Route tree auto-generates - do NOT edit `routeTree.gen.ts`
4. For protected routes, add `beforeLoad` hook:
   ```typescript
   export const Route = createFileRoute('/protected')({
     beforeLoad: async ({ context }) => {
       if (!context.userId) {
         throw redirect({ to: '/login', search: { redirect: '/protected' } });
       }
     },
     component: RouteComponent,
   });
   ```

#### New Backend Function
1. Create file in `packages/backend/convex/yourFunction.ts`
2. Import from `_generated/server`: `query`, `mutation`, `action`
3. For auth, use `ctx.auth.getUserIdentity()` (recommended):
   ```typescript
   export const myQuery = query({
     handler: async (ctx) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Unauthorized");
       // Use identity.subject as userId
     }
   });
   ```
4. Types auto-generate in `_generated/api.d.ts`

#### New UI Component
1. Use shadcn/ui components from `apps/web/src/components/ui/`
2. Follow existing patterns for dark mode compatibility
3. Import alias: `@/*` → `apps/web/src/*`

### Environment Variables

**Frontend** (apps/web/.env.local):
```env
VITE_CONVEX_URL=https://your-project.convex.cloud  # Required
```

**Backend** (set via Convex CLI):
```bash
npx convex env set SITE_URL http://localhost:3001
npx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)
```

See `docs/ENVIRONMENT.md` for complete reference.

### Important Files (Do Not Edit)

- `apps/web/src/routeTree.gen.ts` - Auto-generated by TanStack Router
- `packages/backend/convex/_generated/*` - Auto-generated by Convex
- Both directories should be committed to git

### Development Workflow

1. **Start dev servers**: `pnpm dev` (runs both frontend and backend)
2. **Frontend changes**: Hot reload automatic
3. **Backend changes**: Convex auto-deploys to dev environment
4. **Schema changes**: Edit `packages/backend/convex/schema.ts` - auto-applies
5. **Type checking**: `pnpm check-types` before committing

### Common Patterns

**Authenticated Query** (backend - RECOMMENDED PATTERN):
```typescript
// packages/backend/convex/yourFile.ts
export const myQuery = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userId = identity.subject;
    // Use userId for queries
    return await ctx.db
      .query("yourTable")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  }
});
```

**Server Function with Auth** (frontend):
```typescript
// apps/web/src/routes/your-route.tsx
import { fetchQuery } from '@/lib/auth-server';
import { api } from '@tanstack/backend/convex/_generated/api';

const serverFn = createServerFn({ method: 'GET' }).handler(async () => {
  return await fetchQuery(api.yourFile.myQuery);
});
```

**Protected Route** (frontend):
```typescript
// apps/web/src/routes/protected.tsx
export const Route = createFileRoute('/protected')({
  beforeLoad: async ({ context }) => {
    if (!context.userId) {
      throw redirect({
        to: '/login',
        search: { redirect: '/protected' }
      });
    }
  },
  component: RouteComponent,
});
```

**Auth Forms Integration**:
```typescript
// Pass redirectTo prop to auth forms
<SignInForm redirectTo={redirectPath} />
<SignUpForm redirectTo={redirectPath} />

// Forms use navigate with redirectTo in onSuccess
navigate({ to: redirectTo || "/dashboard" });
```

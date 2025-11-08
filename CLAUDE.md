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

# Testing
pnpm test                   # Run all tests (uses Vitest)
pnpm test:watch             # Run tests in watch mode
pnpm test:coverage          # Run tests with coverage

# Frontend-specific testing
cd apps/web && pnpm test           # Run web app tests
cd apps/web && pnpm test:watch     # Watch mode for web tests
cd apps/web && pnpm test:ui        # Interactive test UI

# Deployment
cd apps/web && pnpm deploy  # Deploy to Cloudflare

# Single test file
cd apps/web && pnpm test -- run src/path/to/test.test.ts
```

## Architecture

### Workspace Structure
```
apps/web/                    # Frontend - TanStack Start + React
  src/
    routes/                  # File-based routing (auto-generates routeTree.gen.ts)
      _authenticated/        # Protected routes (require authentication)
        dashboard.tsx
        todos.tsx
      _auth/                 # Auth routes (redirect if authenticated)
        login.tsx
      __root.tsx            # Root layout with auth setup
      index.tsx             # Home page
    components/
      ui/                   # shadcn/ui primitives (button, card, etc.)
      layouts/              # Reusable layout components
        app-shell.tsx       # Sidebar + content wrapper
        dashboard-layout.tsx
        auth-layout.tsx
      navigation/           # Navigation components
        app-sidebar.tsx     # Collapsible sidebar with user menu
      features/             # Feature-based components
        auth/               # Auth forms (sign-in, sign-up)
        todos/              # Todo components (list, item, form)
      loader.tsx
    lib/                    # Utilities and configuration
      auth-client.ts        # Better-Auth client
      auth-server.ts        # Server-side auth helpers
      utils.ts              # Utility functions (cn, etc.)
    hooks/                  # Custom React hooks
      use-mobile.ts
    router.tsx              # Router setup with context providers
    index.css               # Global styles (Tailwind CSS v4 with custom design tokens)

packages/backend/           # Backend - Convex
  convex/                   # Schema, queries, mutations, actions
    schema.ts               # Database schema
    auth.ts                 # Better-Auth configuration
    http.ts                 # HTTP routes (auth endpoints)
    _generated/             # Auto-generated types (DO NOT EDIT)
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
- Routes in `_authenticated/` folder are automatically protected via layout route
- Layout route (`_authenticated.tsx`) has `beforeLoad` hook that checks `context.userId`
- Automatically redirects unauthenticated users to `/login` with redirect parameter
- No need to add `beforeLoad` to individual route files within `_authenticated/`

**Error handling**:
- 404 pages: Styled component at `apps/web/src/components/error-pages/not-found.tsx`
- Authentication redirects: Unauthenticated users accessing protected routes are redirected to `/login?redirect=/original-path`
- Default not found component in router.tsx points to the styled 404 page

#### 3. Layout System & Route Groups

**Layout Architecture (shadcn-admin migration)**:
The layout system is based on shadcn-admin architecture with cookie persistence and modular components.

**Layout Components** (`apps/web/src/components/layouts/`):
- `app-shell.tsx` - Main app layout using new Header and Main components (supports fixed/fluid modes)
- `dashboard-layout.tsx` - Wraps content with app-shell for authenticated pages
- `auth-layout.tsx` - Centered container for login/signup pages

**New Layout Components** (`apps/web/src/components/layout/`):
- `layout-provider.tsx` - Layout state management with cookie persistence (7-day expiration)
  - Manages sidebar variants: `inset` | `sidebar` | `floating`
  - Manages collapsible modes: `offcanvas` | `icon` | `none`
  - Default settings: variant=`inset`, collapsible=`icon`
- `header.tsx` - Fixed header with scroll effects, shadow on scroll, backdrop blur
- `main.tsx` - Content area with container queries (`@container/content`)
- `nav-group.tsx` - Collapsible navigation groups with badges and active state detection
- `app-title.tsx` - App title with custom toggle button
- `nav-user.tsx` - Enhanced user dropdown with avatar and theme toggle
- `types.ts` - TypeScript definitions for layout system
- `data/sidebar-data.tsx` - Centralized navigation data structure

**Route Groups**:
- `_authenticated/` - Layout route that wraps all protected routes with LayoutProvider
  - Shared `beforeLoad` hook checks authentication
  - Integrates LayoutProvider with cookie-based sidebar state persistence
  - Automatically applies sidebar navigation to all child routes
  - Examples: `/dashboard`, `/todos`
- `_auth/` - Layout route for authentication pages with AuthLayout
  - Redirects to `/dashboard` if already authenticated
  - Examples: `/login`

**Sidebar Navigation** (`apps/web/src/components/navigation/app-sidebar.tsx`):
- Uses shadcn/ui Sidebar component with LayoutProvider integration
- **All sidebar variants supported**: Inset, Floating, Sidebar
- **All collapsible modes**: Offcanvas (mobile), Icon (collapsed), None
- Keyboard shortcut: Cmd/Ctrl + B to toggle
- Responsive behavior with cookie persistence
- User menu integrated in sidebar footer with avatar display
- Theme toggle integrated into user dropdown
- Modular navigation using NavGroup components

**Cookie Management** (`apps/web/src/lib/cookies.ts`):
- Manual cookie implementation without external dependencies
- 7-day default expiration for layout preferences
- Used by LayoutProvider for persistent user preferences
- Sidebar state cookie (existing): `sidebar_state`
- Layout variant cookie (new): `layout_variant`
- Collapsible mode cookie (new): `layout_collapsible`

**Accessibility**:
- `skip-to-main.tsx` - Skip link for keyboard navigation
- Proper ARIA attributes on sidebar components
- Focus management in dropdowns and modals

#### 4. Data Fetching Pattern

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

#### New Protected Route
1. Create file in `apps/web/src/routes/_authenticated/your-route.tsx`
2. Export route with `createFileRoute("/_authenticated/your-route")`
3. No need to add `beforeLoad` - authentication handled by layout route
4. Route automatically gets sidebar navigation with LayoutProvider integration
   ```typescript
   // apps/web/src/routes/_authenticated/your-route.tsx
   import { createFileRoute } from '@tanstack/react-router';

   export const Route = createFileRoute('/_authenticated/your-route')({
     component: YourRouteComponent,
   });

   function YourRouteComponent() {
     return <div>Your content</div>;
   }
   ```
5. Add navigation item to sidebar:
   ```typescript
   // apps/web/src/components/layout/data/sidebar-data.tsx
   import { YourIcon } from "lucide-react";

   export const sidebarData: SidebarData = {
     // ... existing data
     navGroups: [
       {
         title: "General",
         items: [
           // ... existing items
           { title: "Your Feature", url: "/your-route", icon: YourIcon },
         ],
       },
     ],
   };
   ```

#### New Public Route
1. Create file in `apps/web/src/routes/your-route.tsx` (not in _authenticated)
2. Route will not have sidebar - uses minimal layout from `__root.tsx`

#### New Auth Route
1. Create file in `apps/web/src/routes/_auth/your-route.tsx`
2. Automatically redirects to `/dashboard` if user is authenticated
3. Uses centered `AuthLayout` component

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
1. For shadcn/ui components: `npx shadcn@latest add <component-name>`
2. Components install to `apps/web/src/components/ui/`
3. Use `@/components/ui/*` imports (NOT relative paths)
4. All components support light/dark mode with ThemeProvider

#### New Feature Component
1. Create in `apps/web/src/components/features/<feature-name>/`
2. Group related components by feature (e.g., `features/todos/`, `features/auth/`)
3. Use absolute imports: `@/components/features/<feature-name>/<component>`
4. Extract reusable logic from route components into feature components
5. Example structure:
   ```
   components/features/todos/
     todo-list.tsx      # Main container component
     todo-item.tsx      # Individual item component
     todo-form.tsx      # Form for creating/editing
   ```

#### New Layout Component
1. Create in `apps/web/src/components/layouts/`
2. Layouts wrap route content and provide consistent structure
3. Use absolute imports: `@/components/layouts/<layout-name>`

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

### Testing Configuration

**Vitest Setup** (apps/web):
- Test files: `src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`
- Test setup: `src/tests/setup.ts` (includes DOM mocks and jest-dom)
- Configuration: `vitest.config.ts`
- Coverage: Excludes generated files, config files, node_modules

**Test Scripts**:
- `pnpm test` - Run all tests and exit
- `pnpm test:watch` - Watch mode for development
- `pnpm test:coverage` - Generate coverage report
- `pnpm test:ui` - Interactive test interface

### Important Files (Do Not Edit)

- `apps/web/src/routeTree.gen.ts` - Auto-generated by TanStack Router
- `packages/backend/convex/_generated/*` - Auto-generated by Convex
- Both auto-generated directories should be committed to git

**Recent Migration Files (Do Not Modify Without Understanding)**:
- `apps/web/src/context/layout-provider.tsx` - Layout state management with cookies
- `apps/web/src/components/layout/` - New shadcn-admin based layout components
- `apps/web/src/components/sign-out-dialog.tsx` - Sign-out confirmation dialog
- `apps/web/src/lib/cookies.ts` - Cookie utility functions

**Route Tree Regeneration:**
- Happens automatically on file changes in dev mode
- May cause "file modified by another process" warnings (safe to ignore)
- If routes not updating: restart dev server

### CI/CD Pipeline (CircleCI)

**Automated deployment on every push to master:**
- Uses CircleCI with `.circleci/config.yml`
- Sequential deployment: Backend (Convex) → Frontend (Cloudflare Workers)
- Full pipeline: Install → Validate → Test → Build → Deploy
- Environment variables configured in CircleCI project settings

**Key CI patterns:**
- Export environment variables inline in commands (not via environment block)
- Use `npx convex deploy --yes` for non-interactive CI deployment
- Use `pnpm run deploy` for frontend to avoid ambiguity
- Multi-layer caching: pnpm store, node_modules, Turborepo

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
// apps/web/src/routes/_authenticated/your-route.tsx
import { fetchQuery } from '@/lib/auth-server';
import { api } from '@tanstack/backend/convex/_generated/api';

const serverFn = createServerFn({ method: 'GET' }).handler(async () => {
  return await fetchQuery(api.yourFile.myQuery);
});
```

**Feature Component Pattern**:
```typescript
// components/features/todos/todo-item.tsx
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";

export function TodoItem({ id, text, completed }) {
  const toggleTodo = useMutation(api.todos.toggle);

  return (
    <li className="flex items-center gap-2">
      <Checkbox
        checked={completed}
        onCheckedChange={() => toggleTodo({ id, completed: !completed })}
      />
      <span>{text}</span>
    </li>
  );
}
```

**Route with Feature Component**:
```typescript
// routes/_authenticated/todos.tsx
import { createFileRoute } from '@tanstack/react-router';
import { TodoList } from '@/components/features/todos/todo-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/todos')({
  component: TodosRoute,
});

function TodosRoute() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos</CardTitle>
      </CardHeader>
      <CardContent>
        <TodoList />
      </CardContent>
    </Card>
  );
}
```

**Auth Forms Integration**:
```typescript
// Pass redirectTo prop to auth forms
<SignInForm redirectTo={redirectPath} />
<SignUpForm redirectTo={redirectPath} />

// Forms use navigate with redirectTo in onSuccess
navigate({ to: redirectTo || "/dashboard" });
```

### Import Patterns

**CRITICAL: Always use absolute imports with `@/` alias**

✅ **Correct:**
```typescript
import { Button } from "@/components/ui/button";
import { TodoList } from "@/components/features/todos/todo-list";
import { authClient } from "@/lib/auth-client";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
```

❌ **Incorrect (will break):**
```typescript
import { Button } from "./ui/button";              // Don't use relative paths
import { Button } from "../ui/button";             // Don't use relative paths
import { TodoList } from "../../features/todos";   // Don't use relative paths
```

**Path alias mapping:**
- `@/*` → `apps/web/src/*`
- Configured in `tsconfig.json` and Vite

**Exception:** Backend imports use generated API
```typescript
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
```

### Theme System

**Design Tokens**: App uses custom CSS design tokens in `apps/web/src/index.css`
- Light theme by default with professional theme toggle
- OKLCH color space with minimalist black-on-white aesthetic
- Geist font family throughout
- Custom shadow system (2xs to 2xl)
- shadcn/ui components integrated with the design system

**Theme Toggle**: Integrated into user dropdown in sidebar footer
- Uses next-themes for professional theme management
- Smooth transitions between light/dark modes
- Preserves user preference in localStorage

### Layout System Usage

**Accessing Layout State**:
```typescript
import { useLayout } from '@/context/layout-provider';

function Component() {
  const {
    variant,
    setVariant,
    collapsible,
    setCollapsible,
    resetLayout
  } = useLayout();

  // Use layout state
}
```

**Customizing Layout**:
```typescript
// For fixed layout with header scroll effects
<AppShell fixed={true} fluid={false}>
  <YourContent />
</AppShell>

// For fluid layout with responsive width
<AppShell fixed={false} fluid={true}>
  <YourContent />
</AppShell>
```

**Navigation Data Structure**:
```typescript
// apps/web/src/components/layout/data/sidebar-data.tsx
export function getSidebarData(user: User): SidebarData {
  return {
    user: { name: user.name, email: user.email, avatar: user.image },
    navGroups: [
      {
        title: "General",
        items: [
          { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
          { title: "Todos", url: "/todos", icon: ListTodo },
          // Add more navigation items
        ],
      },
    ],
  };
}
```

**Missing Components**: Ensure these shadcn/ui components are installed:
- `npx shadcn@latest add avatar` - For user profile pictures
- `npx shadcn@latest add alert-dialog` - For sign-out confirmation

### Global Search Integration

The app includes a global search component (`apps/web/src/components/global-search.tsx`) accessible via Cmd/Ctrl + K.

**Backend Requirements:**
- Implement `api.search.searchAll` query that searches across multiple tables
- Return results with `type` field for categorization (e.g., "task", "project", "contact")
- Include `displayId` for readable URLs (e.g., "TSK-001", "PRJ-042")

**Search Query Pattern** (`packages/backend/convex/search.ts`):
```typescript
export const searchAll = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const identity = await requireAuth(ctx);
    const searchTerm = query.toLowerCase();

    // Search tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.or(
        q.contains(q.field("title"), searchTerm),
        q.contains(q.field("displayId"), searchTerm)
      ))
      .collect();

    // Search projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.contains(q.field("name"), searchTerm))
      .collect();

    return {
      tasks: tasks.map(t => ({ ...t, type: "task" as const })),
      projects: projects.map(p => ({ ...p, type: "project" as const })),
    };
  },
});
```

**Adding Search to New Features:**
1. Add search logic to `convex/search.ts`
2. Include `displayId` in your schema for readable URLs
3. Map results with `type` field for categorization
4. Global search will automatically show results grouped by type

### Display IDs and Counters

The app uses human-readable IDs for entities (e.g., `TSK-000042`, `PRJ-000015`).

**Counter System** (`packages/backend/convex/counters.ts`):
- Atomic counter increments using internal mutations
- Global counters table with `by_name` index
- Format: `{PREFIX}-{6-digit-number}` (e.g., "TD-000001")

**Usage in Mutations:**
```typescript
import { generateDisplayId } from "./counters";

export const create = mutation({
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    // Generate unique display ID atomically
    const displayId = await generateDisplayId(ctx, "tasks");

    const taskId = await ctx.db.insert("tasks", {
      ...args,
      userId: identity.subject,
      displayId, // "TD-000042"
    });

    return taskId;
  },
});
```

**Adding to New Entity Types:**
1. Update `generateDisplayId` function to add prefix mapping:
   ```typescript
   const prefixes = {
     tasks: "TD",
     contacts: "CT",
     projects: "PR",
     yourEntity: "YE", // Add your prefix
   };
   ```
2. Add `displayId: v.string()` to your schema
3. Call `generateDisplayId(ctx, "yourEntity")` in create mutation
4. Use in URLs: `/your-entity/${displayId}`

### Hierarchical Data Patterns

This codebase implements hierarchical structures for both tasks and projects. The pattern is reusable for any parent-child data model.

**Core Concepts:**
- `level` - Numeric depth in hierarchy (0 = root)
- `sortPath` - Dot-separated path for ordering (e.g., "001.002.003")
- `subRows` - Array property for recursive tree structure
- Recursive queries with `by_parentId` indexes

**Hierarchy Utilities** (`packages/backend/convex/hierarchy.ts`):
```typescript
// Calculate level and sortPath for nested items
export async function calculateSortPath(
  ctx: MutationCtx | QueryCtx,
  userId: string,
  parentId?: Id<"items">
): Promise<{ level: number; sortPath: string }> {
  // Returns { level: 0-N, sortPath: "001" or "001.002" }
}

// Build tree structure from flat array
export function buildHierarchy<T>(items: T[]): T[] {
  // Returns array with subRows populated recursively
}
```

**Backend Schema Pattern:**
```typescript
items: defineTable({
  // ... other fields
  userId: v.string(),
  parentItemId: v.optional(v.id("items")),
  level: v.number(),           // 0, 1, 2, etc.
  sortPath: v.string(),        // "001", "001.002", etc.
})
  .index("by_userId", ["userId"])
  .index("by_userId_and_level", ["userId", "level"])
  .index("by_parentItemId", ["parentItemId"])
```

**Frontend Type Pattern:**
```typescript
export interface Item {
  _id: Id<"items">;
  // ... other fields
  parentItemId?: Id<"items">;
  level: number;
  sortPath: string;
  subRows?: Item[];  // Recursive tree structure
}
```

**Recursive Search in Hierarchy:**
```typescript
// Type-safe recursive search through tree
const findItem = (items: Item[]): Item | undefined => {
  for (const item of items) {
    if (item._id === targetId) return item;
    if (item.subRows) {
      const found = findItem(item.subRows);
      if (found) return found;
    }
  }
  return undefined;
};
```

### Reference Implementations

#### Tasks Page (Production-Ready Pattern)
Location: `apps/web/src/routes/_authenticated/tasks.tsx`

**Features:**
- Full CRUD with TanStack Table
- Advanced filtering (status, priority, label, date range)
- Bulk operations with row selection
- Real-time statistics dashboard
- Loading skeletons and empty states
- Parent-child task relationships (subtasks)

**Key Components:**
- `features/tasks/index.tsx` - Container with React Query
- `features/tasks/components/tasks-table.tsx` - Table with sorting/filtering/pagination
- `features/tasks/components/task-form-dialog.tsx` - Form with Zod validation
- `features/tasks/components/tasks-stats.tsx` - Statistics cards

#### Projects Page (Hierarchical Data Pattern)
Location: `apps/web/src/routes/_authenticated/projects.tsx`

**Features:**
- Hierarchical projects with unlimited nesting (subprojects)
- Tree view with expand/collapse
- Navigation via `displayId` (e.g., `/projects/PRJ-001`)
- Recursive status updates (affect all descendants)
- Bulk operations that respect hierarchy
- Route-based edit dialog (`?editProjectId=...`)

**Key Components:**
- `features/projects/index.tsx` - Container with hierarchical data
- `features/projects/components/projects-table.tsx` - Tree table with subRows
- `features/projects/components/project-form-dialog.tsx` - Parent selector dropdown
- Backend: `convex/projects.ts` + `convex/hierarchy.ts`

**Backend Authentication Pattern:**
```typescript
// Shared auth helper (recommended pattern)
async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: Must be logged in");
  }
  return identity;
}

// Use in queries/mutations
export const myQuery = query({
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    return await ctx.db
      .query("items")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});
```

**Frontend Data Fetching:**
```typescript
// React Query + Convex for queries
const { data: items } = useSuspenseQuery(convexQuery(api.items.getAll, {}));

// Convex directly for mutations
const createItem = useMutation(api.items.create);
const updateItem = useMutation(api.items.update);

// Multiple queries in parallel
const { data: hierarchical } = useSuspenseQuery(
  convexQuery(api.items.getHierarchy, {})
);
const { data: roots } = useSuspenseQuery(
  convexQuery(api.items.getRootItems, {})
);
```

These implementations serve as reference patterns for building production-ready features in this codebase.

# Next Steps for TanStack App Enhancement

This document outlines recommended enhancements to further improve your application following the frontend refactoring.

## 🎯 Priority Enhancements

### 1. Error Boundaries & Error Handling

**Why:** Graceful error handling improves user experience and helps with debugging.

**Implementation:**
```tsx
// components/error-boundary.tsx
import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card className="m-4">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>{this.state.error?.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => this.setState({ hasError: false })}>
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

**Usage:**
- Wrap route components in `__root.tsx`
- Add to layout components
- Use per-feature for isolated error handling

**Effort:** 2-3 hours
**Impact:** High

---

### 2. Loading States & Skeleton Screens

**Why:** Improves perceived performance and provides better UX during data fetching.

**Implementation:**
```tsx
// components/features/todos/todo-list-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function TodoListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-2 rounded-md border p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}
```

**Update routes to use Suspense:**
```tsx
// routes/_authenticated/todos.tsx
import { Suspense } from "react";
import { TodoListSkeleton } from "@/components/features/todos/todo-list-skeleton";

function TodosRoute() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Todo List</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<TodoListSkeleton />}>
          <TodoList />
        </Suspense>
      </CardContent>
    </Card>
  );
}
```

**Effort:** 3-4 hours
**Impact:** Medium-High

---

### 3. Custom Hooks Library

**Why:** Reduces code duplication and creates reusable logic patterns.

**Recommended hooks:**

```tsx
// hooks/use-auth.ts
import { useRouteContext } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";

export function useAuth() {
  const context = useRouteContext({ from: "/" });
  const user = useQuery(api.auth.getCurrentUser);

  return {
    userId: context.userId,
    user,
    isAuthenticated: !!context.userId,
    isLoading: user === undefined,
  };
}
```

```tsx
// hooks/use-convex-mutation.ts
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { FunctionReference } from "convex/server";

export function useConvexMutation<T extends FunctionReference<"mutation">>(
  mutation: T,
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const mutate = useMutation(mutation);

  return async (...args: Parameters<typeof mutate>) => {
    try {
      const result = await mutate(...args);
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.();
      return result;
    } catch (error) {
      const message = options?.errorMessage || "An error occurred";
      toast.error(message);
      options?.onError?.(error as Error);
      throw error;
    }
  };
}
```

```tsx
// hooks/use-sidebar-state.ts
import { useSidebar } from "@/components/ui/sidebar";

export function useSidebarState() {
  const { state, open, setOpen, toggleSidebar, isMobile } = useSidebar();

  return {
    isExpanded: state === "expanded",
    isCollapsed: state === "collapsed",
    isMobile,
    toggle: toggleSidebar,
    open,
    setOpen,
  };
}
```

**Effort:** 4-6 hours
**Impact:** Medium (grows over time)

---

### 4. Breadcrumb Navigation

**Why:** Helps users understand their location in the app hierarchy.

**Implementation:**
```tsx
// components/navigation/breadcrumbs.tsx
import { ChevronRight, Home } from "lucide-react";
import { Link, useMatches } from "@tanstack/react-router";

export function Breadcrumbs() {
  const matches = useMatches();

  const breadcrumbs = matches
    .filter((match) => match.pathname !== "/")
    .map((match) => ({
      path: match.pathname,
      label: match.pathname.split("/").pop() || "Home",
    }));

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Link to="/" className="flex items-center hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((crumb, i) => (
        <div key={crumb.path} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          <Link
            to={crumb.path}
            className="capitalize hover:text-foreground"
          >
            {crumb.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}
```

**Add to app-shell.tsx header:**
```tsx
<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
  <SidebarTrigger className="-ml-1" />
  <Separator orientation="vertical" className="mr-2 h-4" />
  <Breadcrumbs />
  <div className="flex-1" />
</header>
```

**Effort:** 2 hours
**Impact:** Medium

---

### 5. Settings/Preferences Page

**Why:** Allows users to customize their experience.

**Features to include:**
- Theme toggle (light/dark/system)
- User profile editing
- Notification preferences
- Account settings

**Implementation:**
```tsx
// routes/_authenticated/settings.tsx
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general preferences</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Settings form */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs... */}
      </Tabs>
    </div>
  );
}
```

**Don't forget to add to sidebar navigation:**
```tsx
// components/navigation/app-sidebar.tsx
import { Settings } from "lucide-react";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Todos", url: "/todos", icon: CheckSquare },
  { title: "Settings", url: "/settings", icon: Settings }, // NEW
];
```

**Effort:** 4-6 hours
**Impact:** Medium

---

### 6. Theme Toggle Implementation

**Why:** User preference for light/dark mode.

**Implementation:**
```tsx
// hooks/use-theme.ts
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem("theme") as Theme;

    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;

    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.toggle("dark", systemTheme === "dark");
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }
  };

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  return { theme, setTheme: updateTheme };
}
```

**Add theme toggle to sidebar:**
```tsx
// components/navigation/theme-toggle.tsx
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={theme === "light" ? "default" : "ghost"}
        size="icon"
        onClick={() => setTheme("light")}
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "ghost"}
        size="icon"
        onClick={() => setTheme("dark")}
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === "system" ? "default" : "ghost"}
        size="icon"
        onClick={() => setTheme("system")}
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

**Effort:** 2-3 hours
**Impact:** Medium

---

### 7. Additional Navigation Items

**Easy wins for sidebar navigation:**

```tsx
// Add to navigationItems in app-sidebar.tsx
import { LayoutDashboard, CheckSquare, Settings, FileText, Bell } from "lucide-react";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Todos", url: "/todos", icon: CheckSquare },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];
```

**Effort:** 1 hour per new page
**Impact:** Varies

---

## 🔧 Technical Improvements

### 8. TypeScript Strict Mode

**Enable stricter TypeScript:**
```json
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**Effort:** 4-8 hours
**Impact:** High (long-term code quality)

---

### 9. Testing Setup

**Add Vitest for unit tests:**
```bash
pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom
```

**Example test:**
```tsx
// components/features/todos/todo-item.test.tsx
import { render, screen } from "@testing-library/react";
import { TodoItem } from "./todo-item";

describe("TodoItem", () => {
  it("renders todo text", () => {
    render(<TodoItem id="123" text="Test todo" completed={false} />);
    expect(screen.getByText("Test todo")).toBeInTheDocument();
  });
});
```

**Effort:** 1 day for setup + ongoing
**Impact:** High (prevents regressions)

---

### 10. Performance Optimizations

**Recommendations:**
- Add `React.memo` to expensive components
- Use `useMemo` / `useCallback` for computed values
- Implement virtual scrolling for long lists (react-window)
- Add route-based code splitting

**Example:**
```tsx
// components/features/todos/todo-item.tsx
import { memo } from "react";

export const TodoItem = memo(function TodoItem({ id, text, completed }) {
  // ... component logic
});
```

**Effort:** Ongoing
**Impact:** Medium (depends on app size)

---

## 📱 Mobile Enhancements

### 11. PWA Support

**Make app installable:**
```bash
pnpm add vite-plugin-pwa -D
```

**Add to vite.config:**
```ts
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "TanStack App",
        short_name: "TanStack",
        theme_color: "#000000",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
```

**Effort:** 3-4 hours
**Impact:** Medium (for mobile users)

---

## 🎨 UI/UX Polish

### 12. Animations & Transitions

**Add smooth transitions:**
```tsx
// components/layouts/app-shell.tsx
import { motion } from "framer-motion";

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header>{/* ... */}</header>
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 p-4 md:p-6 lg:p-8"
        >
          {children}
        </motion.main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Effort:** 2-3 hours
**Impact:** Low-Medium (polish)

---

### 13. Empty States

**Add helpful empty states:**
```tsx
// components/empty-state.tsx
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
```

**Effort:** 1-2 hours
**Impact:** Medium

---

## 🚀 Deployment & DevOps

### 14. CI/CD Pipeline

**Add GitHub Actions:**
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm check-types
      - run: pnpm build
```

**Effort:** 2-3 hours
**Impact:** High (automation)

---

### 15. Environment Management

**Better env handling:**
```bash
# .env.example
VITE_CONVEX_URL=https://your-project.convex.cloud
SITE_URL=http://localhost:3001
BETTER_AUTH_SECRET=your-secret-here
```

**Add env validation:**
```ts
// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  VITE_CONVEX_URL: z.string().url(),
});

export const env = envSchema.parse(import.meta.env);
```

**Effort:** 1 hour
**Impact:** Medium

---

## 📊 Recommended Priority Order

### Phase 1: Core Functionality (Week 1)
1. ✅ Error Boundaries
2. ✅ Loading States & Skeletons
3. ✅ Custom Hooks Library

### Phase 2: User Experience (Week 2)
4. ✅ Breadcrumb Navigation
5. ✅ Theme Toggle
6. ✅ Settings Page

### Phase 3: Quality & Performance (Week 3)
7. ✅ TypeScript Strict Mode
8. ✅ Testing Setup
9. ✅ Performance Optimizations

### Phase 4: Polish & Deploy (Week 4)
10. ✅ Animations & Transitions
11. ✅ Empty States
12. ✅ CI/CD Pipeline
13. ✅ PWA Support

---

## 📚 Resources

- [TanStack Router Docs](https://tanstack.com/router)
- [Convex Documentation](https://docs.convex.dev)
- [shadcn/ui Components](https://ui.shadcn.com)
- [React Query Best Practices](https://tanstack.com/query/latest/docs/framework/react/guides/best-practices)
- [Better Auth Docs](https://www.better-auth.com)

---

## 💡 Quick Wins (< 1 hour each)

- [ ] Add keyboard shortcuts (Cmd+K for search)
- [ ] Add footer with links
- [ ] Add "copy to clipboard" to code blocks
- [ ] Add confirmation dialogs for destructive actions
- [ ] Add success/error toast notifications throughout
- [ ] Add loading spinners to buttons during async operations
- [ ] Add form validation with helpful error messages
- [ ] Add auto-save for forms (debounced)

---

**Last Updated:** 2025-11-02
**Version:** 1.0.0

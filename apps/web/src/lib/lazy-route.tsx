import { lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';

/**
 * Lazy load utility for route components with improved error handling
 *
 * Usage:
 * ```tsx
 * const Dashboard = lazyRoute(() => import('@/features/dashboard'));
 * ```
 */
export function lazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(() =>
    importFn().catch((error) => {
      // Log error for debugging
      console.error('Failed to load route:', error);

      // Re-throw to trigger error boundary
      throw error;
    })
  );
}

/**
 * Preload a route component for instant navigation
 *
 * Usage:
 * ```tsx
 * <Link onMouseEnter={() => preloadRoute(() => import('@/features/dashboard'))}>
 *   Dashboard
 * </Link>
 * ```
 */
export function preloadRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  return importFn();
}

/**
 * Create a route skeleton component
 * Useful for creating route-specific loading states
 */
export function createRouteSkeleton(config: {
  title?: string;
  description?: string;
  children?: ReactNode;
}): () => JSX.Element {
  return function RouteSkeleton() {
    return (
      <div className="space-y-6">
        {(config.title || config.description) && (
          <div className="space-y-2">
            {config.title && (
              <div className="h-9 w-48 animate-pulse rounded bg-muted" />
            )}
            {config.description && (
              <div className="h-5 w-96 animate-pulse rounded bg-muted/60" />
            )}
          </div>
        )}
        {config.children || (
          <div className="space-y-4">
            <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
            <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        )}
      </div>
    );
  };
}

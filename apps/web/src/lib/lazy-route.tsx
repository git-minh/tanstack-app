import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

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

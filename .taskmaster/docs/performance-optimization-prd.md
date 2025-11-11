# Performance Optimization PRD

## Executive Summary
Comprehensive performance optimization plan for the TanStack Start + Convex application. Current bundle analysis shows main.js at 1,066 KB (330 KB gzipped), which is significantly larger than optimal. This PRD outlines a systematic approach to improve page load times, reduce bundle sizes, and enhance user experience across all routes.

## Current Performance Baseline

### Bundle Analysis Results
- **main.js**: 1,066.88 KB (330.30 KB gzipped) ⚠️ CRITICAL
- **vendor-forms**: 258.43 KB (60.64 KB gzipped)
- **vendor-charts**: 243.32 KB (54.67 KB gzipped)
- **vendor-auth**: 185.87 KB (53.30 KB gzipped)
- **vendor-ui**: 99.60 KB (29.84 KB gzipped)
- **vendor-convex**: 72.25 KB (19.98 KB gzipped)
- **tasks.js**: 37.26 KB (9.38 KB gzipped)
- **contacts.js**: 23.57 KB (6.03 KB gzipped)
- **projects.js**: 18.69 KB (5.38 KB gzipped)

### Key Pages
1. Dashboard - Already optimized with lazy loading
2. Tasks - Heavy table component (37 KB)
3. Contacts - Heavy table component (24 KB)
4. Projects - Hierarchical tree table (19 KB)
5. Todos - Simple list (6 KB)
6. Login - Auth forms (5 KB)
7. Pricing - Static content (0.5 KB)

## Performance Goals

### Target Metrics
- **Main bundle**: < 150 KB gzipped (currently 330 KB) - 55% reduction
- **Initial page load**: < 2 seconds on 3G
- **Lighthouse Performance Score**: > 90
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Total Blocking Time (TBT)**: < 200ms

## Optimization Tasks

### 1. Route-Level Code Splitting
**Goal**: Split application into route-specific chunks to reduce initial bundle size

#### 1.1 Implement lazy loading for authenticated routes
- Convert all route components to lazy imports using React.lazy()
- Add Suspense boundaries with skeleton loaders
- Test that routes load progressively without blocking

#### 1.2 Extract shared components into separate chunks
- Identify components used across multiple routes (Button, Card, Dialog)
- Configure manual chunks in Vite for shared components
- Ensure shared chunk is loaded once and cached

#### 1.3 Implement route prefetching
- Add link hover prefetch for authenticated routes
- Prefetch critical routes on idle (dashboard, tasks)
- Use TanStack Router's preload functionality

### 2. Component-Level Code Splitting
**Goal**: Lazy load heavy components within routes

#### 2.1 Lazy load TanStack Table components
- Tasks table component (currently 37 KB)
- Contacts table component (currently 24 KB)
- Projects table component (currently 19 KB)
- Add loading skeletons for table loading states

#### 2.2 Lazy load form components
- Task form dialog (uses react-hook-form + zod)
- Contact form dialog
- Project form dialog
- Separate form validation schemas into code-split chunks

#### 2.3 Defer non-critical components
- AI generation dialog (only needed when button clicked)
- Search dialog (Cmd+K)
- Settings/profile components
- Export functionality

### 3. Vendor Bundle Optimization
**Goal**: Reduce vendor chunk sizes by 40%

#### 3.1 Analyze and optimize vendor-forms (258 KB)
- Tree shake unused Zod validators
- Consider lighter form library alternatives for simple forms
- Split react-hook-form into separate chunk
- Lazy load form schemas

#### 3.2 Optimize vendor-charts (243 KB)
- Already lazy loaded on dashboard - verify effectiveness
- Consider replacing Recharts with lighter alternative (Chart.js, visx)
- Only load chart components when dashboard is accessed
- Remove unused chart types

#### 3.3 Reduce vendor-auth (186 KB)
- Analyze Better-Auth bundle size
- Lazy load auth forms (only on /login route)
- Split Autumn billing SDK into separate chunk
- Consider code splitting auth provider

#### 3.4 Optimize vendor-ui (100 KB)
- Audit @radix-ui components for unused imports
- Split Radix components by usage frequency
- Consider removing rarely used UI components
- Optimize lucide-react icon imports (use dynamic imports)

### 4. Data Fetching Optimization
**Goal**: Reduce data over-fetching and improve query performance

#### 4.1 Optimize Convex queries with proper indexes
- Audit all queries for missing indexes
- Add compound indexes for common query patterns
- Verify by_userId indexes on all tables
- Test query performance with Convex dashboard

#### 4.2 Implement React Query stale-while-revalidate patterns
- Configure staleTime for infrequently changing data (5 min for projects)
- Set cacheTime to 10 minutes for expensive queries
- Implement background refetch on window focus
- Add query invalidation on mutations

#### 4.3 Reduce over-fetching with selective field queries
- Tasks: only fetch required fields for list view
- Contacts: defer loading of full details until detail view
- Projects: implement pagination for large lists
- Use Convex's field selection capabilities

#### 4.4 Add route-level data prefetching
- Prefetch dashboard data on app load for authenticated users
- Prefetch next page data on table navigation
- Implement optimistic updates for mutations
- Add loading skeletons for suspense boundaries

### 5. Asset Optimization
**Goal**: Optimize images, fonts, and icons

#### 5.1 Implement image optimization
- Set up next/image equivalent for TanStack Start
- Add lazy loading for images below the fold
- Implement responsive image sizes
- Convert images to WebP format

#### 5.2 Optimize font loading
- Preload critical Geist font files
- Use font-display: swap for non-critical fonts
- Subset fonts to include only used characters
- Self-host fonts instead of external CDN

#### 5.3 Optimize icon imports
- Replace lucide-react imports with dynamic imports
- Only import icons used in initial render
- Consider icon font or SVG sprite for frequently used icons
- Remove unused icons from bundle

### 6. React Rendering Optimization
**Goal**: Reduce unnecessary re-renders and improve runtime performance

#### 6.1 Memoize expensive components
- Wrap table components with React.memo
- Memoize table columns and data transformations
- Use useMemo for expensive calculations
- Profile components with React DevTools Profiler

#### 6.2 Implement virtual scrolling for large lists
- Add virtual scrolling to tasks table (when >50 items)
- Add virtual scrolling to contacts table
- Add virtual scrolling to projects tree table
- Use @tanstack/react-virtual for implementation

#### 6.3 Debounce and throttle expensive operations
- Debounce search inputs (300ms)
- Throttle table filter updates (150ms)
- Debounce form validation (200ms)
- Throttle scroll events for lazy loading

#### 6.4 Optimize context providers
- Memoize context values to prevent cascading re-renders
- Split large contexts into smaller, focused contexts
- Use context selectors to subscribe to specific values
- Profile LayoutProvider and ThemeProvider re-renders

### 7. Build Configuration Optimization
**Goal**: Improve Vite build output and compression

#### 7.1 Enhance Vite manual chunking strategy
- Create separate chunks for heavy features (AI generation, tables)
- Split date-fns into separate chunk (used in multiple places)
- Extract TanStack Router/Query into core chunk
- Optimize chunk sizes to be between 20-50 KB

#### 7.2 Enable build-time optimizations
- Enable CSS minification and tree shaking
- Configure terser for better compression
- Add preload/prefetch hints for critical chunks
- Optimize source map generation (production: hidden)

#### 7.3 Implement compression strategy
- Enable Brotli compression on Cloudflare Workers
- Configure Gzip fallback for older browsers
- Add Cache-Control headers for immutable assets
- Set up asset CDN caching strategy

### 8. CSS and Style Optimization
**Goal**: Reduce CSS bundle size and improve style loading

#### 8.1 Optimize TailwindCSS configuration
- Audit used Tailwind classes and purge unused
- Disable unused Tailwind features and plugins
- Optimize tailwind.config.js for minimal output
- Consider extracting critical CSS for above-the-fold content

#### 8.2 Reduce CSS bundle size
- Analyze index.css for unused styles
- Remove duplicate Tailwind utilities
- Inline critical CSS for first paint
- Defer loading of non-critical styles

### 9. Performance Monitoring
**Goal**: Track performance metrics and identify regressions

#### 9.1 Implement Web Vitals tracking
- Add web-vitals package to track Core Web Vitals
- Send metrics to Sentry performance monitoring
- Track FCP, LCP, FID, CLS, TTFB for all routes
- Set up alerts for performance degradation

#### 9.2 Add Lighthouse CI to CircleCI pipeline
- Install @lhci/cli in CI environment
- Configure Lighthouse CI for performance budgets
- Fail builds if performance score < 85
- Track performance trends over time

#### 9.3 Implement bundle size monitoring
- Add bundlesize or size-limit to package.json
- Set size budgets for main bundle (< 150 KB gzipped)
- Set size budgets for route chunks (< 50 KB each)
- Fail CI if budgets exceeded

#### 9.4 Add performance dashboard
- Create docs/PERFORMANCE.md with current metrics
- Document performance optimization decisions
- Track performance improvements over time
- Add performance section to CLAUDE.md

### 10. Advanced Optimizations
**Goal**: Implement advanced techniques for edge performance

#### 10.1 Implement service worker caching
- Add Workbox for service worker generation
- Cache static assets (CSS, JS, fonts, images)
- Implement runtime caching for API responses
- Add offline fallback for network errors

#### 10.2 Optimize SSR/SSG strategy
- Identify pages that can be statically generated
- Implement SSG for marketing pages (pricing, landing)
- Optimize SSR hydration performance
- Consider partial hydration for heavy components

#### 10.3 Database query optimization
- Add compound indexes for complex queries
- Implement query result pagination (limit 50 items)
- Cache expensive aggregation queries (dashboard stats)
- Profile slow queries in Convex dashboard

#### 10.4 Implement progressive enhancement
- Ensure core functionality works without JavaScript
- Load JavaScript progressively (critical → important → nice-to-have)
- Add loading states for all async operations
- Implement skeleton screens for better perceived performance

## Implementation Strategy

### Phase 1: Quick Wins (Week 1)
- Route-level code splitting (Task 1)
- Component-level code splitting (Task 2)
- Icon optimization (Task 5.3)
- Vite configuration improvements (Task 7.1, 7.2)

**Expected Impact**: 30-40% bundle size reduction, 1-2s faster initial load

### Phase 2: Data and Rendering (Week 2)
- Data fetching optimization (Task 4)
- React rendering optimization (Task 6)
- Convex query optimization (Task 10.3)

**Expected Impact**: 40-50% faster page transitions, smoother interactions

### Phase 3: Advanced Optimizations (Week 3)
- Vendor bundle optimization (Task 3)
- Asset optimization (Task 5.1, 5.2)
- CSS optimization (Task 8)

**Expected Impact**: Additional 20% bundle reduction, faster asset loading

### Phase 4: Monitoring and Refinement (Week 4)
- Performance monitoring (Task 9)
- Service worker caching (Task 10.1)
- SSR/SSG optimization (Task 10.2)
- Progressive enhancement (Task 10.4)

**Expected Impact**: Continuous performance tracking, offline support

## Success Criteria

### Primary Metrics
- ✅ Main bundle < 150 KB gzipped (55% reduction from 330 KB)
- ✅ Lighthouse Performance Score > 90 (currently unknown)
- ✅ LCP < 2.5s on 3G connection
- ✅ FID < 100ms for all interactions
- ✅ CLS < 0.1 for visual stability

### Secondary Metrics
- ✅ Route chunks < 50 KB each
- ✅ Initial page load < 2s on 3G
- ✅ Time to Interactive < 3.5s
- ✅ Total Blocking Time < 200ms
- ✅ All routes have loading skeletons

### Developer Experience
- ✅ CI performance checks prevent regressions
- ✅ Performance dashboard tracks trends
- ✅ Documentation updated with optimization patterns
- ✅ No performance-related bug reports post-launch

## Risk Mitigation

### Technical Risks
- **Over-eager code splitting**: May increase number of requests
  - *Mitigation*: Use HTTP/2 multiplexing, implement prefetching
- **Complex lazy loading logic**: May introduce bugs
  - *Mitigation*: Comprehensive testing, gradual rollout
- **Breaking changes from dependency updates**: May cause regressions
  - *Mitigation*: Lock dependency versions, thorough QA

### Business Risks
- **Increased development time**: Optimization work may delay features
  - *Mitigation*: Prioritize quick wins, parallel workstreams
- **Degraded UX during optimization**: Users may see loading states
  - *Mitigation*: Add beautiful skeleton loaders, maintain fast perceived performance

## Testing Strategy

### Performance Testing
1. **Lighthouse audits** - Run on all routes before/after optimization
2. **WebPageTest** - Test on real 3G/4G connections from multiple locations
3. **Chrome DevTools** - Profile component render times and bundle sizes
4. **Real user monitoring** - Track Core Web Vitals in production with Sentry

### Functional Testing
1. **Unit tests** - Ensure lazy loading doesn't break components
2. **Integration tests** - Test route navigation with code splitting
3. **E2E tests** - Verify all user flows work with optimizations
4. **Regression tests** - Ensure no functionality broken by optimizations

## Documentation Updates

### Required Documentation
1. **docs/PERFORMANCE.md** - Performance optimization guide
2. **CLAUDE.md** - Update with lazy loading patterns and optimization strategies
3. **vite.config.ts comments** - Document chunking decisions
4. **README.md** - Add performance badge and metrics

## Appendix

### Tools and Libraries
- **Vite** - Build tool with code splitting
- **React.lazy()** - Component lazy loading
- **@tanstack/react-virtual** - Virtual scrolling
- **web-vitals** - Performance monitoring
- **@lhci/cli** - Lighthouse CI
- **Workbox** - Service worker generation
- **bundlesize** - Bundle size monitoring

### Reference Documentation
- [Vite Performance Best Practices](https://vitejs.dev/guide/performance.html)
- [React Optimization Patterns](https://react.dev/learn/render-and-commit#optimizing-performance)
- [Web.dev Performance Guides](https://web.dev/performance/)
- [TanStack Router Code Splitting](https://tanstack.com/router/latest/docs/framework/react/guide/code-splitting)

### Benchmark Data
Current performance baseline recorded on 2025-11-11:
- Main bundle: 330 KB gzipped
- Total bundle: ~500 KB gzipped (all chunks)
- Route chunks: 37 KB (tasks), 24 KB (contacts), 19 KB (projects)
- Lighthouse score: Not yet measured
- LCP: Not yet measured
- FID: Not yet measured

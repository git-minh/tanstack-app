import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { lazyRoute } from "@/lib/lazy-route";
import { ErrorBoundary } from "@/components/error-boundary";
import { DesignReferencesSkeleton } from "@/features/design-references/components/design-references-skeleton";

// Lazy load DesignReferences feature
const DesignReferences = lazyRoute(() =>
  import("@/features/design-references").then((m) => ({
    default: m.DesignReferences,
  }))
);

export const Route = createFileRoute("/_authenticated/design-references")({
  component: DesignReferencesRoute,
});

function DesignReferencesRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<DesignReferencesSkeleton />}>
        <DesignReferences />
      </Suspense>
    </ErrorBoundary>
  );
}

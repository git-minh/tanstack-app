import { createFileRoute } from "@tanstack/react-router";
import { PricingTable } from "autumn-js/react";

export const Route = createFileRoute("/_authenticated/pricing")({
  component: PricingRoute,
});

function PricingRoute() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="text-muted-foreground">
          Choose the plan that's right for you
        </p>
      </div>

      <PricingTable />
    </div>
  );
}

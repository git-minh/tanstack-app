import { createFileRoute } from "@tanstack/react-router";
import { PricingTable } from "autumn-js/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

      <Card>
        <CardHeader>
          <CardTitle>AI Project Generation</CardTitle>
          <CardDescription>
            Select a plan to unlock powerful AI-driven project generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PricingTable />
        </CardContent>
      </Card>
    </div>
  );
}

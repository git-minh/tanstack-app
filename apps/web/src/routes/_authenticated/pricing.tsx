import { createFileRoute } from "@tanstack/react-router";
import { PricingTable } from "autumn-js/react";
import { PurchaseCreditsDialog } from "@/components/features/credits/purchase-credits-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/pricing")({
  component: PricingRoute,
});

/**
 * Credit packages configuration
 *
 * IMPORTANT: Update priceId values with actual Autumn price IDs from your Autumn dashboard
 *
 * To configure:
 * 1. Log in to your Autumn dashboard
 * 2. Navigate to Products > Credit Packages
 * 3. Create or find products for 500, 1000, and 5000 credits
 * 4. Copy each product's price ID (format: price_xxxxxxxxxxxxx)
 * 5. Replace the placeholder priceId values below with the actual IDs
 *
 * Example:
 *   priceId: "price_1PQR2sAbCdEfGhIjKlMn" // Actual Autumn price ID
 */
const CREDIT_PACKAGES = [
  {
    id: "credits_500",
    credits: 500,
    price: 5,
    priceId: "price_credits_500", // TODO: Replace with actual Autumn price ID
    popular: false,
  },
  {
    id: "credits_1000",
    credits: 1000,
    price: 9,
    priceId: "price_credits_1000", // TODO: Replace with actual Autumn price ID
    popular: true,
  },
  {
    id: "credits_5000",
    credits: 5000,
    price: 40,
    priceId: "price_credits_5000", // TODO: Replace with actual Autumn price ID
    popular: false,
  },
] as const;

function PricingRoute() {
  const [selectedPackage, setSelectedPackage] = useState<typeof CREDIT_PACKAGES[number] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePurchaseClick = (pkg: typeof CREDIT_PACKAGES[number]) => {
    setSelectedPackage(pkg);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="text-muted-foreground">
          Choose the plan that's right for you
        </p>
      </div>

      {/* Subscription Plans */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Subscription Plans</h2>
        <PricingTable />
      </div>

      {/* Credit Packages */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Credit Packages</h2>
        <p className="text-muted-foreground mb-6">
          Need more credits? Purchase additional credits without a subscription.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card key={pkg.id} className={pkg.popular ? "border-primary shadow-lg" : ""}>
              {pkg.popular && (
                <div className="bg-primary text-primary-foreground text-xs font-semibold py-1 text-center rounded-t-lg">
                  MOST POPULAR
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">
                  {pkg.credits.toLocaleString()} Credits
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">${pkg.price}</span>
                  <span className="text-muted-foreground ml-1">one-time</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>{Math.floor(pkg.credits / 3)} chat messages</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>{Math.floor(pkg.credits / 15)} AI generations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>{Math.floor(pkg.credits / 5)} URL scrapes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>Never expires</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={pkg.popular ? "default" : "outline"}
                  onClick={() => handlePurchaseClick(pkg)}
                >
                  Purchase Credits
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {selectedPackage && (
        <PurchaseCreditsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          package={selectedPackage}
        />
      )}
    </div>
  );
}

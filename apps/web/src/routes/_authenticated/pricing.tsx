import { createFileRoute } from "@tanstack/react-router";
import { PurchaseCreditsDialog } from "@/components/features/credits/purchase-credits-dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pricing")({
  component: PricingRoute,
});

/**
 * Credit packages configuration
 */
const CREDIT_PACKAGES = [
  {
    id: "credits_500",
    credits: 500,
    price: 5,
    priceId: "price_credits_500",
    popular: false,
  },
  {
    id: "credits_1000",
    credits: 1000,
    price: 9,
    priceId: "price_credits_1000",
    popular: true,
  },
  {
    id: "credits_5000",
    credits: 5000,
    price: 40,
    priceId: "price_credits_5000",
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

  // Calculate value metrics
  const getMetrics = (credits: number, price: number) => ({
    chatMessages: Math.floor(credits / 3),
    aiGenerations: Math.floor(credits / 15),
    urlScrapes: Math.floor(credits / 5),
    pricePerCredit: (price / credits).toFixed(3),
  });

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col">
      {/* Hero Section - Massive Typography */}
      <div className="border-b-2 border-foreground p-12 md:p-20">
        <div className="max-w-4xl">
          <h1 className="text-[clamp(3rem,12vw,10rem)] font-light leading-[0.85] tracking-tighter mb-6">
            Pay for
            <br />
            <span className="inline-block border-b-8 border-foreground pb-2">
              What
            </span>
            <br />
            You Use
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl">
            Credits power AI features. Buy once, use forever.
            <br />
            No subscriptions. No expiration.
          </p>
        </div>
      </div>

      {/* Credit Packages - Brutalist Grid */}
      <div className="flex-1 p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-light tracking-tight mb-2">Credit Packages</h2>
            <p className="text-sm text-muted-foreground">
              One-time purchase. Credits never expire.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-foreground border-2 border-foreground">
            {CREDIT_PACKAGES.map((pkg) => {
              const metrics = getMetrics(pkg.credits, pkg.price);
              return (
                <div
                  key={pkg.id}
                  className={cn(
                    "bg-background p-8 md:p-12 flex flex-col",
                    pkg.popular && "md:scale-105 md:shadow-2xl md:z-10 md:border-2 md:border-foreground"
                  )}
                >
                  {/* Credits - Hero Number */}
                  <div className="mb-6">
                    <div className="text-[clamp(3rem,8vw,7rem)] font-light leading-none tabular-nums tracking-tighter">
                      {pkg.credits.toLocaleString()}
                    </div>
                    <div className="text-xs uppercase tracking-widest font-medium mt-2">
                      Credits
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-8 pb-8 border-b border-border">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-light tabular-nums tracking-tighter">
                        ${pkg.price}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase tracking-widest">
                        One-Time
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
                      ${metrics.pricePerCredit} per credit
                    </div>
                  </div>

                  {/* Usage Estimates */}
                  <div className="flex-1 space-y-3 mb-8">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                      What You Get
                    </div>
                    <div className="space-y-2 text-sm font-light">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Chat messages</span>
                        <span className="tabular-nums">{metrics.chatMessages}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AI generations</span>
                        <span className="tabular-nums">{metrics.aiGenerations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">URL scrapes</span>
                        <span className="tabular-nums">{metrics.urlScrapes}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={() => handlePurchaseClick(pkg)}
                    className={cn(
                      "w-full rounded-none font-light group h-12",
                      pkg.popular
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-background text-foreground border-2 border-foreground hover:bg-foreground hover:text-background"
                    )}
                  >
                    Purchase
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>

                  {pkg.popular && (
                    <div className="text-center mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                      Best Value
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Feature Comparison - Text Only */}
          <div className="mt-20 pt-12 border-t-2 border-foreground">
            <div className="max-w-3xl">
              <h3 className="text-xl font-light tracking-tight mb-8">Credit Usage</h3>
              <div className="space-y-4 text-sm font-light">
                <div className="flex justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">AI Chat Message</span>
                  <span className="tabular-nums">3 credits</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">AI Project Generation</span>
                  <span className="tabular-nums">15 credits</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Website Analysis (URL Scrape)</span>
                  <span className="tabular-nums">5 credits</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Credits Expiration</span>
                  <span className="uppercase tracking-widest text-[10px]">Never</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Refund Policy</span>
                  <span className="uppercase tracking-widest text-[10px]">30 Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 pt-12 border-t-2 border-foreground">
            <div className="max-w-3xl">
              <h3 className="text-xl font-light tracking-tight mb-8">Questions</h3>
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-medium uppercase tracking-widest mb-2">
                    Do credits expire?
                  </h4>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    No. Credits never expire. Use them at your own pace.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium uppercase tracking-widest mb-2">
                    Can I get a refund?
                  </h4>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    Yes. Full refund within 30 days if you haven't used any credits.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium uppercase tracking-widest mb-2">
                    What if I run out?
                  </h4>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    Simply purchase another package. Credits stack automatically.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium uppercase tracking-widest mb-2">
                    Which package should I choose?
                  </h4>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    Start with 500 credits to test features. Upgrade to 1000 for better value.
                    Power users love the 5000 package.
                  </p>
                </div>
              </div>
            </div>
          </div>
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

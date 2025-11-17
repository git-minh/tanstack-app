import { Suspense, useState, lazy } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { DesignReference } from "./data/schema";
import { cn } from "@/lib/utils";

// Lazy load dialogs
const DesignReferenceDetailDialog = lazy(() =>
  import("./components/design-reference-detail-dialog").then((m) => ({
    default: m.DesignReferenceDetailDialog,
  }))
);

const AnalyzeWebsiteDialog = lazy(() =>
  import("./components/analyze-website-dialog").then((m) => ({
    default: m.AnalyzeWebsiteDialog,
  }))
);

export function DesignReferences() {
  const { data: references } = useSuspenseQuery(
    convexQuery(api.designReferences.getDesignReferences, {})
  );

  const deleteReference = useMutation(api.designReferences.deleteDesignReference);

  const [selectedReference, setSelectedReference] = useState<DesignReference | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);

  const handleViewReference = (reference: DesignReference) => {
    setSelectedReference(reference);
    setDetailDialogOpen(true);
  };

  const handleDeleteReference = async (id: string) => {
    try {
      await deleteReference({ id: id as Id<"designReferences"> });
      toast.success("Design reference deleted");
    } catch (error) {
      toast.error("Failed to delete design reference");
      console.error(error);
    }
  };

  const handleCopyPrompt = async (prompt: string) => {
    if (!navigator.clipboard) {
      toast.error("Clipboard not supported");
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copied");
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  const handleAnalyzeWebsite = () => {
    setAnalyzeDialogOpen(true);
  };

  // Calculate stats
  const totalReferences = references.length;
  const minimalCount = references.filter((r) => r.style === "minimal").length;
  const corporateCount = references.filter((r) => r.style === "corporate").length;
  const creativeCount = references.filter((r) => r.style === "creative").length;

  return (
    <>
      <div className="min-h-[calc(100vh-8rem)] flex flex-col">
        {/* Hero Stats - Ultra Minimal */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-foreground border-y-2 border-foreground">
          <div className="bg-background p-8 md:p-12 border-r-2 border-foreground">
            <div className="space-y-2">
              <div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
                {totalReferences}
              </div>
              <div className="text-xs uppercase tracking-widest font-medium">
                Total
              </div>
            </div>
          </div>

          <div className="bg-background p-8 md:p-12 border-r-0 md:border-r-2 border-foreground">
            <div className="space-y-2">
              <div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
                {minimalCount}
              </div>
              <div className="text-xs uppercase tracking-widest font-medium">
                Minimal
              </div>
            </div>
          </div>

          <div className="bg-background p-8 md:p-12 border-r-2 border-foreground">
            <div className="space-y-2">
              <div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
                {corporateCount}
              </div>
              <div className="text-xs uppercase tracking-widest font-medium">
                Corporate
              </div>
            </div>
          </div>

          <div className="bg-background p-8 md:p-12">
            <div className="space-y-2">
              <div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
                {creativeCount}
              </div>
              <div className="text-xs uppercase tracking-widest font-medium">
                Creative
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="border-b-2 border-foreground bg-background">
          <div className="p-4 flex items-center justify-end">
            <Button
              onClick={handleAnalyzeWebsite}
              size="sm"
              className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-light group h-7"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Analyze
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>

        {/* References List - Text Only */}
        <div className="flex-1 p-6 md:p-12">
          <div className="max-w-5xl">
            {references.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-border">
                <p className="text-sm text-muted-foreground mb-4">
                  No design references yet
                </p>
                <Button
                  onClick={handleAnalyzeWebsite}
                  variant="outline"
                  size="sm"
                  className="rounded-none font-light"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Analyze your first website
                </Button>
              </div>
            ) : (
              <div className="space-y-px">
                {references.map((reference) => (
                  <div
                    key={reference._id}
                    className="group py-4 border-b border-border/30 last:border-0 hover:pl-4 transition-all duration-200 flex items-start gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 flex-wrap mb-2">
                        <button
                          onClick={() => handleViewReference(reference)}
                          className="text-base font-light hover:underline text-left"
                        >
                          {reference.url}
                        </button>
                      </div>

                      {reference.summary && (
                        <p className="text-sm text-muted-foreground font-light mb-3 line-clamp-2">
                          {reference.summary}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span>{reference.style}</span>
                        {reference.primaryColors && reference.primaryColors.length > 0 && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                            <div className="flex items-center gap-1">
                              {reference.primaryColors.slice(0, 5).map((color, idx) => (
                                <div
                                  key={idx}
                                  className="h-3 w-3 border border-border"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </>
                        )}
                        <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                        <span>
                          {new Date(reference._creationTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleViewReference(reference)}
                        className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-muted transition-colors"
                      >
                        View
                      </button>
                      {reference.clonePrompt && (
                        <button
                          onClick={() => handleCopyPrompt(reference.clonePrompt!)}
                          className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-muted transition-colors"
                        >
                          Copy Prompt
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReference(reference._id)}
                        className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <DesignReferenceDetailDialog
          reference={selectedReference}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      </Suspense>

      <Suspense fallback={null}>
        <AnalyzeWebsiteDialog
          open={analyzeDialogOpen}
          onOpenChange={setAnalyzeDialogOpen}
        />
      </Suspense>
    </>
  );
}

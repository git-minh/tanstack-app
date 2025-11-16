import { Suspense, useState, lazy } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DesignReferencesTable } from "./components/design-references-table";
import { columns } from "./components/design-references-columns";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Palette from "lucide-react/dist/esm/icons/palette";
import { toast } from "sonner";
import type { DesignReference } from "./data/schema";

// Type for the query result (matches backend return type)
type DesignReferenceData = DesignReference;

// Lazy load the detail dialog
const DesignReferenceDetailDialog = lazy(() =>
  import("./components/design-reference-detail-dialog").then((m) => ({
    default: m.DesignReferenceDetailDialog,
  }))
);

export function DesignReferences() {
  // Main query - get all design references
  const { data: references } = useSuspenseQuery(
    convexQuery(api.designReferences.getDesignReferences, {})
  );

  const deleteReference = useMutation(api.designReferences.deleteDesignReference);
  const deleteMany = useMutation(api.designReferences.deleteMany);

  const [selectedReference, setSelectedReference] =
    useState<DesignReference | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleViewReference = (reference: DesignReference) => {
    setSelectedReference(reference);
    setDetailDialogOpen(true);
  };

  const handleDeleteReference = async (id: string) => {
    try {
      await deleteReference({ id: id as Id<"designReferences"> });
      toast.success("Design reference deleted successfully");
    } catch (error) {
      toast.error("Failed to delete design reference");
      console.error(error);
    }
  };

  const handleDeleteMany = async (ids: string[]) => {
    try {
      await deleteMany({ ids: ids as Id<"designReferences">[] });
      toast.success(`${ids.length} design references deleted successfully`);
    } catch (error) {
      toast.error("Failed to delete design references");
      console.error(error);
    }
  };

  const handleCopyPrompt = async (prompt: string) => {
    if (!navigator.clipboard) {
      toast.error("Clipboard API not supported in this browser");
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copied to clipboard");
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  const handleAnalyzeWebsite = () => {
    // TODO: Open analyze website dialog (Task 47)
    toast.info("Analyze website feature coming soon");
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Design References
            </h2>
            <p className="text-muted-foreground">
              Analyzed websites with UI/UX patterns and clone prompts
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleAnalyzeWebsite}>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Website
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total References
              </CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{references.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minimal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {references.filter((r: DesignReferenceData) => r.style === "minimal").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corporate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {references.filter((r: DesignReferenceData) => r.style === "corporate").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Creative</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {references.filter((r: DesignReferenceData) => r.style === "creative").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Design References</CardTitle>
              <Badge variant="outline">{references.length} references</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <DesignReferencesTable
              data={references}
              columns={columns}
              onViewReference={handleViewReference}
              onDeleteReference={handleDeleteReference}
              onDeleteMany={handleDeleteMany}
              onAnalyzeWebsite={handleAnalyzeWebsite}
              onCopyPrompt={handleCopyPrompt}
            />
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={null}>
        <DesignReferenceDetailDialog
          reference={selectedReference}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      </Suspense>
    </>
  );
}

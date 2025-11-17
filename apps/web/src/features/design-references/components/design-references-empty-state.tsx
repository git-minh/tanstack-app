import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DesignReferencesEmptyStateProps {
  onAnalyzeWebsite: () => void;
  isFiltered?: boolean;
}

export function DesignReferencesEmptyState({
  onAnalyzeWebsite,
  isFiltered = false,
}: DesignReferencesEmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          No results found
        </p>
      </div>
    );
  }

  return (
    <div className="py-20 text-center border-2 border-dashed border-border">
      <p className="text-sm text-muted-foreground mb-4">
        No design references yet
      </p>
      <Button
        onClick={onAnalyzeWebsite}
        variant="outline"
        size="sm"
        className="rounded-none font-light"
      >
        <Plus className="mr-2 h-4 w-4" />
        Analyze your first website
      </Button>
    </div>
  );
}

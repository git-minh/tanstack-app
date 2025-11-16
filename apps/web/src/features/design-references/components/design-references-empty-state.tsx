import { Button } from "@/components/ui/button";
import Palette from "lucide-react/dist/esm/icons/palette";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import SearchX from "lucide-react/dist/esm/icons/search-x";

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
      <div className="flex h-[450px] flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
        <div className="rounded-full bg-muted p-4">
          <SearchX className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">No results found</h3>
          <p className="text-muted-foreground">
            No design references match your current filters.
            <br />
            Try adjusting your search criteria or clear filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[450px] flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
      <div className="rounded-full bg-muted p-4">
        <Palette className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">No design references yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Analyze websites to extract UI/UX patterns, color palettes, typography,
          and generate actionable clone prompts for your projects.
        </p>
      </div>
      <Button onClick={onAnalyzeWebsite} size="lg">
        <Sparkles className="mr-2 h-4 w-4" />
        Analyze Your First Website
      </Button>
    </div>
  );
}

import type { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import X from "lucide-react/dist/esm/icons/x";
import Search from "lucide-react/dist/esm/icons/search";
import type { DesignReference } from "../data/schema";
import { styleOptions } from "../data/schema";

interface DesignReferencesToolbarProps {
  table: Table<DesignReference>;
}

export function DesignReferencesToolbar({
  table,
}: DesignReferencesToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const styleFilter = table.getColumn("style")?.getFilterValue() as
    | string[]
    | undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by site name..."
          value={
            (table.getColumn("siteName")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("siteName")?.setFilterValue(event.target.value)
          }
          className="pl-9"
        />
      </div>

      <Select
        value={styleFilter?.[0] || "all"}
        onValueChange={(value) => {
          if (value === "all") {
            table.getColumn("style")?.setFilterValue(undefined);
          } else {
            table.getColumn("style")?.setFilterValue([value]);
          }
        }}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Style" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Styles</SelectItem>
          {styleOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => table.resetColumnFilters()}
          className="h-9 px-2 lg:px-3"
        >
          Reset
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

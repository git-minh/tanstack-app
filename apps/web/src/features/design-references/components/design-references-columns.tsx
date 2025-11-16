import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import ArrowUpDown from "lucide-react/dist/esm/icons/arrow-up-down";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Eye from "lucide-react/dist/esm/icons/eye";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Copy from "lucide-react/dist/esm/icons/copy";
import type { DesignReference } from "../data/schema";
import { ColorPaletteDisplay } from "./color-palette-display";
import { format } from "date-fns";

export const columns: ColumnDef<DesignReference>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "siteName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Site Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const siteName = row.getValue("siteName") as string;
      const displayId = row.original.displayId;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{siteName}</span>
          <span className="text-xs text-muted-foreground">{displayId}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "url",
    header: "URL",
    cell: ({ row }) => {
      const url = row.getValue("url") as string;
      let hostname: string;
      let isValidUrl = false;

      try {
        hostname = new URL(url).hostname;
        isValidUrl = true;
      } catch {
        hostname = url;
      }

      if (isValidUrl) {
        return (
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {hostname}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{hostname}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "style",
    header: "Style",
    cell: ({ row }) => {
      const style = row.getValue("style") as string;
      return (
        <Badge variant="outline" className="capitalize">
          {style}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "analysis.colorPalette",
    header: "Colors",
    cell: ({ row }) => {
      const colorPalette = row.original.analysis.colorPalette;
      return <ColorPaletteDisplay colorPalette={colorPalette} compact />;
    },
    enableSorting: false,
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const tags = row.getValue(id) as string[];
      return value.some((tag: string) =>
        tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as number;
      return (
        <span className="text-sm text-muted-foreground">
          {format(new Date(createdAt), "MMM d, yyyy")}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const reference = row.original;
      const meta = table.options.meta as {
        viewReference?: (reference: DesignReference) => void;
        deleteReference?: (id: string) => void;
        copyPrompt?: (prompt: string) => void;
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => meta.viewReference?.(reference)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta.copyPrompt?.(reference.clonePrompts.fullPage)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Full Page Prompt
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => meta.deleteReference?.(reference._id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Globe from "lucide-react/dist/esm/icons/globe";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Code from "lucide-react/dist/esm/icons/code";
import Layers from "lucide-react/dist/esm/icons/layers";
import type { DesignReference } from "../data/schema";
import { ColorPaletteDisplay } from "./color-palette-display";
import { TypographySample } from "./typography-sample";
import { ClonePromptViewer } from "./clone-prompt-viewer";
import { format } from "date-fns";

interface DesignReferenceDetailDialogProps {
  reference: DesignReference | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DesignReferenceDetailDialog({
  reference,
  open,
  onOpenChange,
}: DesignReferenceDetailDialogProps) {
  if (!reference) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-light tracking-tight">
                {reference.siteName}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-3">
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-light hover:underline flex items-center gap-1"
                >
                  {reference.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>{format(new Date(reference.createdAt), "PPP")}</span>
                <span>•</span>
                <span>{reference.displayId}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 border border-foreground text-xs uppercase tracking-widest font-light">
                {reference.style}
              </span>
              {reference.industry && (
                <span className="px-2 py-1 border border-foreground text-xs uppercase tracking-widest font-light">
                  {reference.industry}
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-8">
            {/* Tags */}
            {reference.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {reference.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 border border-foreground text-xs uppercase tracking-widest font-light">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {reference.description && (
              <div className="border-2 border-foreground p-4">
                <h3 className="text-[10px] uppercase tracking-widest font-medium mb-3">
                  Description
                </h3>
                <p className="text-sm font-light text-muted-foreground">
                  {reference.description}
                </p>
              </div>
            )}

            <div className="h-px bg-border" />

            {/* UI Patterns */}
            <div className="border-2 border-foreground p-4">
              <h3 className="text-[10px] uppercase tracking-widest font-medium mb-3">
                UI/UX Patterns
              </h3>
              <div className="flex flex-wrap gap-2">
                {reference.analysis.uiPatterns.map((pattern) => (
                  <span key={pattern} className="px-2 py-1 border border-border text-xs font-light">
                    {pattern}
                  </span>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div className="border-2 border-foreground p-4">
              <h3 className="text-[10px] uppercase tracking-widest font-medium mb-3">
                Color Palette
              </h3>
              <ColorPaletteDisplay
                colorPalette={reference.analysis.colorPalette}
              />
            </div>

            {/* Typography */}
            <div className="border-2 border-foreground p-4">
              <h3 className="text-[10px] uppercase tracking-widest font-medium mb-3">
                Typography
              </h3>
              <TypographySample typography={reference.analysis.typography} />
            </div>

            {/* Tech Stack */}
            <div className="border-2 border-foreground p-4">
              <h3 className="text-[10px] uppercase tracking-widest font-medium mb-3">
                Technology Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {reference.analysis.techStack.map((tech) => (
                  <span key={tech} className="px-2 py-1 border border-border text-xs font-light">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Components */}
            <div className="border-2 border-foreground p-4">
              <h3 className="text-[10px] uppercase tracking-widest font-medium mb-3">
                Component Inventory
              </h3>
              <div className="space-y-3">
                {reference.analysis.components.map((component, index) => (
                  <div key={index} className="border-l-2 border-foreground pl-4">
                    <h4 className="text-sm font-light">{component.name}</h4>
                    <p className="text-xs text-muted-foreground font-light">
                      {component.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Clone Prompts */}
            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-medium mb-4">
                Clone Prompts
              </h3>
              <ClonePromptViewer clonePrompts={reference.clonePrompts} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {reference.siteName}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                >
                  {reference.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  Analyzed on {format(new Date(reference.createdAt), "PPP")}
                </span>
                <span className="text-muted-foreground/60">|</span>
                <span>{reference.displayId}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="capitalize">
                {reference.style}
              </Badge>
              {reference.industry && (
                <Badge variant="secondary">{reference.industry}</Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-180px)] pr-4">
          <div className="space-y-6">
            {/* Tags */}
            {reference.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {reference.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            {reference.description && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {reference.description}
                  </p>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* UI Patterns */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  UI/UX Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {reference.analysis.uiPatterns.map((pattern) => (
                    <Badge key={pattern} variant="outline">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Color Palette */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Color Palette</CardTitle>
              </CardHeader>
              <CardContent>
                <ColorPaletteDisplay
                  colorPalette={reference.analysis.colorPalette}
                />
              </CardContent>
            </Card>

            {/* Typography */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Typography</CardTitle>
              </CardHeader>
              <CardContent>
                <TypographySample typography={reference.analysis.typography} />
              </CardContent>
            </Card>

            {/* Tech Stack */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Technology Stack
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {reference.analysis.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Components */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Component Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reference.analysis.components.map((component, index) => (
                    <div key={index} className="border-l-2 border-muted pl-4">
                      <h4 className="font-medium text-sm">{component.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {component.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Clone Prompts */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Clone Prompts</h3>
              <ClonePromptViewer clonePrompts={reference.clonePrompts} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

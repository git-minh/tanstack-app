import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import Copy from "lucide-react/dist/esm/icons/copy";
import Check from "lucide-react/dist/esm/icons/check";
import FileCode from "lucide-react/dist/esm/icons/file-code";
import Layers from "lucide-react/dist/esm/icons/layers";
import Palette from "lucide-react/dist/esm/icons/palette";

interface ClonePromptViewerProps {
  clonePrompts: {
    fullPage: string;
    components: {
      name: string;
      prompt: string;
    }[];
    designSystem: string;
  };
  compact?: boolean;
}

export function ClonePromptViewer({
  clonePrompts,
  compact = false,
}: ClonePromptViewerProps) {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const handleCopyPrompt = async (prompt: string, label: string) => {
    if (!navigator.clipboard) {
      toast.error("Clipboard API not supported in this browser");
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(label);
      toast.success(`Copied ${label} prompt`);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  const PromptBlock = ({
    prompt,
    label,
    icon: Icon,
  }: {
    prompt: string;
    label: string;
    icon: React.ElementType;
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4" />
            {label}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyPrompt(prompt, label)}
          >
            {copiedPrompt === label ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/50 p-4">
          <pre className="whitespace-pre-wrap text-sm font-mono">
            {prompt}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCopyPrompt(clonePrompts.fullPage, "Full Page")}
          className="h-7 text-xs"
        >
          {copiedPrompt === "Full Page" ? (
            <Check className="mr-1 h-3 w-3" />
          ) : (
            <Copy className="mr-1 h-3 w-3" />
          )}
          Copy Prompt
        </Button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="fullPage" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="fullPage" className="flex items-center gap-2">
          <FileCode className="h-4 w-4" />
          Full Page
        </TabsTrigger>
        <TabsTrigger value="components" className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Components
        </TabsTrigger>
        <TabsTrigger value="designSystem" className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Design System
        </TabsTrigger>
      </TabsList>

      <TabsContent value="fullPage" className="mt-4">
        <PromptBlock
          prompt={clonePrompts.fullPage}
          label="Full Page"
          icon={FileCode}
        />
      </TabsContent>

      <TabsContent value="components" className="mt-4">
        <div className="space-y-4">
          {clonePrompts.components.length > 0 ? (
            clonePrompts.components.map((component, index) => (
              <PromptBlock
                key={index}
                prompt={component.prompt}
                label={component.name}
                icon={Layers}
              />
            ))
          ) : (
            <Card>
              <CardContent className="flex h-[200px] items-center justify-center">
                <p className="text-muted-foreground">
                  No component prompts available
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="designSystem" className="mt-4">
        <PromptBlock
          prompt={clonePrompts.designSystem}
          label="Design System"
          icon={Palette}
        />
      </TabsContent>
    </Tabs>
  );
}

import { useState } from "react";
import { toast } from "sonner";
import Copy from "lucide-react/dist/esm/icons/copy";
import Check from "lucide-react/dist/esm/icons/check";

interface ColorPaletteDisplayProps {
  colorPalette: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  compact?: boolean;
}

export function ColorPaletteDisplay({
  colorPalette,
  compact = false,
}: ColorPaletteDisplayProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleCopyColor = async (color: string) => {
    if (!navigator.clipboard) {
      toast.error("Clipboard API not supported in this browser");
      return;
    }

    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(color);
      toast.success(`Copied ${color}`);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch {
      toast.error("Failed to copy color");
    }
  };

  const ColorSwatch = ({ color }: { color: string; label?: string }) => (
    <div className="group relative">
      <button
        onClick={() => handleCopyColor(color)}
        className="flex flex-col items-center space-y-1 transition-transform hover:scale-105"
        title={`Click to copy ${color}`}
      >
        <div
          className="rounded-md border shadow-sm transition-shadow hover:shadow-md"
          style={{
            backgroundColor: color,
            width: compact ? "2rem" : "3rem",
            height: compact ? "2rem" : "3rem",
          }}
        >
          <div className="flex h-full w-full items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            {copiedColor === color ? (
              <Check className="h-4 w-4 text-white drop-shadow" />
            ) : (
              <Copy className="h-4 w-4 text-white drop-shadow" />
            )}
          </div>
        </div>
        {!compact && (
          <span className="text-xs font-mono text-muted-foreground">
            {color}
          </span>
        )}
      </button>
    </div>
  );

  const ColorGroup = ({
    title,
    colors,
  }: {
    title: string;
    colors: string[];
  }) => (
    <div className="space-y-2">
      {!compact && (
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      )}
      <div className="flex flex-wrap gap-2">
        {colors.length > 0 ? (
          colors.map((color, index) => (
            <ColorSwatch key={`${title}-${index}`} color={color} />
          ))
        ) : (
          <span className="text-xs text-muted-foreground">
            No {title.toLowerCase()} colors
          </span>
        )}
      </div>
    </div>
  );

  if (compact) {
    // Compact view - just show color swatches in a single row
    const allColors = [
      ...colorPalette.primary.slice(0, 2),
      ...colorPalette.secondary.slice(0, 1),
      ...colorPalette.accent.slice(0, 1),
    ];

    return (
      <div className="flex gap-1">
        {allColors.map((color, index) => (
          <ColorSwatch key={index} color={color} />
        ))}
        {allColors.length === 0 && (
          <span className="text-xs text-muted-foreground">No colors</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ColorGroup title="Primary Colors" colors={colorPalette.primary} />
      <ColorGroup title="Secondary Colors" colors={colorPalette.secondary} />
      <ColorGroup title="Accent Colors" colors={colorPalette.accent} />
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TypographySampleProps {
  typography: {
    headingFont?: string;
    bodyFont?: string;
    sizes?: {
      h1?: string;
      h2?: string;
      h3?: string;
      body?: string;
    };
  };
  compact?: boolean;
}

export function TypographySample({
  typography,
  compact = false,
}: TypographySampleProps) {
  const { headingFont, bodyFont, sizes } = typography;

  if (compact) {
    return (
      <div className="space-y-1">
        {headingFont && (
          <div className="text-xs">
            <span className="text-muted-foreground">Heading:</span>{" "}
            <span className="font-medium">{headingFont}</span>
          </div>
        )}
        {bodyFont && (
          <div className="text-xs">
            <span className="text-muted-foreground">Body:</span>{" "}
            <span className="font-medium">{bodyFont}</span>
          </div>
        )}
        {!headingFont && !bodyFont && (
          <span className="text-xs text-muted-foreground">No typography data</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Font Families</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Headings:</span>
              <span className="font-medium">
                {headingFont || "Not specified"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Body:</span>
              <span className="font-medium">{bodyFont || "Not specified"}</span>
            </div>
          </CardContent>
        </Card>

        {sizes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Type Scale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sizes.h1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">H1:</span>
                  <span className="font-mono">{sizes.h1}</span>
                </div>
              )}
              {sizes.h2 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">H2:</span>
                  <span className="font-mono">{sizes.h2}</span>
                </div>
              )}
              {sizes.h3 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">H3:</span>
                  <span className="font-mono">{sizes.h3}</span>
                </div>
              )}
              {sizes.body && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Body:</span>
                  <span className="font-mono">{sizes.body}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {headingFont && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: headingFont }}
            >
              Heading Sample
            </h1>
            <h2
              className="text-2xl font-semibold"
              style={{ fontFamily: headingFont }}
            >
              Subheading Sample
            </h2>
            <p
              className="text-base leading-relaxed"
              style={{ fontFamily: bodyFont || "inherit" }}
            >
              This is a sample body text to demonstrate the typography. The quick
              brown fox jumps over the lazy dog. Typography is the art and
              technique of arranging type to make written language legible,
              readable, and appealing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import type { Id } from "@tanstack/backend/convex/_generated/dataModel";

export interface DesignReference {
  _id: Id<"designReferences">;
  _creationTime: number;
  userId: string;
  displayId: string;
  url: string;
  siteName: string;
  description?: string;
  analysis: {
    uiPatterns: string[];
    colorPalette: {
      primary: string[];
      secondary: string[];
      accent: string[];
    };
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
    techStack: string[];
    components: {
      name: string;
      description: string;
    }[];
  };
  clonePrompts: {
    fullPage: string;
    components: {
      name: string;
      prompt: string;
    }[];
    designSystem: string;
  };
  tags: string[];
  style: string;
  industry?: string;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

export const styleOptions = [
  { value: "minimal", label: "Minimal" },
  { value: "corporate", label: "Corporate" },
  { value: "creative", label: "Creative" },
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classic" },
] as const;

export type StyleOption = (typeof styleOptions)[number]["value"];

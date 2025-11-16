import { z } from "zod";

/**
 * Zod schema for website analysis response from AI
 *
 * Validates the structure of the AI-generated analysis to ensure
 * it matches our database schema for designReferences.
 */
export const analysisResponseSchema = z.object({
  uiPatterns: z.array(z.string()),
  colorPalette: z.object({
    primary: z.array(z.string()),
    secondary: z.array(z.string()),
    accent: z.array(z.string()),
  }),
  typography: z.object({
    headingFont: z.string().optional(),
    bodyFont: z.string().optional(),
    sizes: z.object({
      h1: z.string().optional(),
      h2: z.string().optional(),
      h3: z.string().optional(),
      body: z.string().optional(),
    }).optional(),
  }),
  techStack: z.array(z.string()),
  components: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    })
  ),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

/**
 * Zod schema for clone prompts response from AI
 *
 * Validates the structure of AI-generated clone prompts to ensure
 * they are actionable and comprehensive.
 */
export const clonePromptsSchema = z.object({
  fullPage: z.string().min(200),
  components: z.array(
    z.object({
      name: z.string(),
      prompt: z.string().min(50),
    })
  ),
  designSystem: z.string().min(200),
});

/**
 * TypeScript type for clone prompts
 */
export type ClonePrompts = z.infer<typeof clonePromptsSchema>;

/**
 * System prompt for website analysis
 *
 * Guides the AI to extract comprehensive design information from crawled pages.
 */
export const WEBSITE_ANALYSIS_SYSTEM_PROMPT = `You are a professional UI/UX designer and front-end architect. Analyze the provided website pages and extract comprehensive design information.

## Your Task

Analyze the website content and extract the following information in structured JSON format:

### 1. UI/UX Patterns (uiPatterns)
Identify specific design patterns used. Be specific and descriptive. Examples:
- Layout structures: "Full-width hero with centered text", "3-column grid layout", "Sidebar navigation with main content", "Masonry card grid"
- Component types: "Gradient buttons with rounded corners", "Floating label input fields", "Slide-in modals", "Sticky top navigation"
- Interaction patterns: "Hover scale effect on cards", "Smooth scroll to sections", "Parallax background images", "Animated page transitions"

Return as an array of strings describing observed patterns.

### 2. Color Palette (colorPalette)
Extract colors with hex codes. Look for patterns in the content and CSS:
- **primary**: 2-3 main brand colors (e.g., ["#1a1a2e", "#16213e"])
- **secondary**: 2-4 supporting colors (e.g., ["#0f3460", "#533483", "#f0f0f0"])
- **accent**: 1-2 CTA and highlight colors (e.g., ["#e94560"])

If exact hex codes aren't visible, infer likely colors from common design patterns. Return as hex codes (e.g., #1a1a2e) or named colors (e.g., navy, crimson).

### 3. Typography (typography)
Identify font characteristics:
- **headingFont**: Font family for headings (e.g., "Inter", "Roboto", "Playfair Display", "Sans-serif")
- **bodyFont**: Font family for body text (e.g., "Arial", "Open Sans", "Georgia")
- **sizes**: Common font sizes used
  - **h1**: Largest heading size (e.g., "48px", "3rem", "clamp(2rem, 5vw, 3rem)")
  - **h2**: Second level heading (e.g., "36px", "2.25rem")
  - **h3**: Third level heading (e.g., "24px", "1.5rem")
  - **body**: Base body text size (e.g., "16px", "1rem")

### 4. Tech Stack (techStack)
Detect technologies from code patterns and metadata:
- **Frameworks**: React (className, hooks), Vue (v-if, v-for), Angular (ng-), Next.js (Link, Image components), Svelte
- **CSS**: Tailwind (utility classes like flex, grid, bg-), Bootstrap (container, row, col-), Material UI, styled-components, Emotion
- **Build tools**: Webpack, Vite, Parcel (may be in meta tags or comments)
- **Other**: TypeScript (type annotations), GraphQL, REST APIs

Return as array of detected technologies.

### 5. Component Inventory (components)
List major reusable UI components with descriptions:
- **name**: Component type (e.g., "Hero Section", "Pricing Card", "Feature Grid", "Testimonial Carousel")
- **description**: Brief description of the component and its features (e.g., "Full-width hero with gradient background, centered heading, and CTA buttons")

Return array of 5-10 major components.

## Output Format

Return ONLY valid JSON matching this exact structure:

\`\`\`json
{
  "uiPatterns": ["pattern 1", "pattern 2", ...],
  "colorPalette": {
    "primary": ["#hex1", "#hex2"],
    "secondary": ["#hex3", "#hex4"],
    "accent": ["#hex5"]
  },
  "typography": {
    "headingFont": "Font Name",
    "bodyFont": "Font Name",
    "sizes": {
      "h1": "48px",
      "h2": "36px",
      "h3": "24px",
      "body": "16px"
    }
  },
  "techStack": ["React", "Tailwind CSS", ...],
  "components": [
    { "name": "Component Name", "description": "Description..." },
    ...
  ]
}
\`\`\`

## Important Guidelines

- Be specific and actionable in your analysis
- Provide actual values when possible (hex codes, px sizes, font names)
- Focus on observable patterns, not assumptions
- If information is unclear, make educated inferences based on common design patterns
- Ensure all fields are present in the JSON response
- Return ONLY the JSON object, no additional text or markdown formatting`;

/**
 * System prompt for clone prompt generation
 *
 * Guides the AI to create actionable prompts for cloning websites.
 */
export const CLONE_PROMPT_GENERATION_SYSTEM_PROMPT = `You are a professional web developer and UI/UX designer. Generate comprehensive, actionable prompts for cloning a website based on the provided analysis.

## Your Task

Create THREE types of prompts based on the website analysis:

### 1. Full-Page Clone Prompt (fullPage)
A comprehensive prompt for recreating the entire website from top to bottom. Include:
- Overall layout structure and grid system
- Exact color values (hex codes) for all elements
- Typography specifications (font families, sizes, weights, line heights)
- Spacing and padding details (in px or rem)
- Component arrangement and hierarchy
- Interaction patterns and animations
- Responsive breakpoints

**Example:**
"Create a modern SaaS landing page with a full-width hero section featuring a navy gradient background (#1a1a2e to #16213e). The hero contains a centered heading in Inter font (48px, weight 700), white color (#ffffff), with a subheading below (18px, weight 400, #e0e0e0). Add two CTA buttons: primary (background #e94560, padding 16px 32px, border-radius 8px) and secondary (border 2px solid #ffffff, transparent background). Below the hero, implement a 3-column features grid with 48px gap, each card having white background, 24px padding, 8px border-radius, and subtle shadow (0 4px 6px rgba(0,0,0,0.1)). Use Inter font throughout, with body text at 16px. Implement smooth scroll behavior and hover scale effects (transform: scale(1.05)) on cards."

### 2. Component-Specific Prompts (components)
Generate 5-8 individual prompts for major UI components. Each should be standalone and implementable. Include:
- Component name (e.g., "Hero Section", "Pricing Card", "Navigation Bar")
- Exact dimensions and spacing
- Color specifications with hex codes
- Typography details
- Layout structure (flex, grid, etc.)
- Interactive states (hover, focus, active)

**Example Component:**
{
  "name": "Hero Section",
  "prompt": "Create a hero section with height 600px, flex container with centered content. Background: linear gradient from #667eea to #764ba2. Center a heading (font: Poppins, 56px, weight 800, color #ffffff, letter-spacing -0.5px) and description (font: Inter, 20px, weight 400, color rgba(255,255,255,0.9), max-width 600px, margin-top 24px). Add a CTA button below (background #ffffff, color #667eea, padding 18px 40px, border-radius 50px, font-weight 600, shadow: 0 10px 25px rgba(0,0,0,0.2)). On hover: scale(1.05) and shadow: 0 15px 35px rgba(0,0,0,0.3)."
}

### 3. Design System Prompt (designSystem)
A comprehensive guide to the website's design system. Include:
- Complete color palette with variable names and hex codes
- Typography scale with all font families, sizes, weights, and usage
- Spacing system (margins, paddings, gaps)
- Border radius values
- Shadow definitions
- Common component patterns

**Example:**
"Design System: Colors - Primary: #667eea (brand), #5568d3 (hover), #4451b8 (active); Secondary: #764ba2; Neutral: #1a202c (text), #4a5568 (secondary-text), #e2e8f0 (border), #f7fafc (background). Typography - Headings: Poppins (700-800 weight); Body: Inter (400-600 weight). Scale: h1(56px/1.2), h2(40px/1.3), h3(32px/1.4), h4(24px/1.5), body(16px/1.6), small(14px/1.5). Spacing: base 8px scale (8, 16, 24, 32, 40, 48, 64, 80, 96). Border radius: sm(4px), md(8px), lg(12px), xl(16px), full(9999px). Shadows: sm(0 2px 4px rgba(0,0,0,0.1)), md(0 4px 6px rgba(0,0,0,0.1)), lg(0 10px 25px rgba(0,0,0,0.2)), xl(0 20px 40px rgba(0,0,0,0.3))."

## Output Format

Return ONLY valid JSON matching this exact structure:

\`\`\`json
{
  "fullPage": "Comprehensive full-page clone prompt with exact values...",
  "components": [
    { "name": "Component Name", "prompt": "Specific component prompt with exact values..." },
    { "name": "Component Name 2", "prompt": "Another component prompt..." }
  ],
  "designSystem": "Complete design system guide with all tokens and values..."
}
\`\`\`

## Important Guidelines

- Be extremely specific with ALL values (no vague terms like "large" or "dark blue")
- Include exact hex codes for every color mentioned
- Specify font sizes in px, rem, or em with actual numbers
- Provide spacing values in px or rem
- Include hover/active states for interactive elements
- Make each prompt standalone and implementable without additional context
- Ensure fullPage prompt is 200+ characters
- Ensure designSystem prompt is 200+ characters
- Generate at least 5 component-specific prompts
- Return ONLY the JSON object, no additional text or markdown formatting`;

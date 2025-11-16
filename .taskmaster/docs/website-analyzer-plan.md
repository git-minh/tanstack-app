# Website Analysis & Cloning System - Implementation Plan

## Overview
Transform Firecrawl from basic page scraping into a comprehensive website analyzer that extracts UI/UX patterns, tech stacks, and generates actionable clone prompts.

## Task Breakdown

### Task 1: Database Schema for Design References
**Priority:** High | **Estimated Time:** 1 hour

**Subtasks:**
1. Update `packages/backend/convex/schema.ts`
   - Add `designReferences` table with fields:
     - `userId`, `displayId`, `url`, `siteName`, `description`
     - `analysis` object (uiPatterns, colorPalette, typography, techStack, components)
     - `clonePrompts` object (fullPage, components[], designSystem)
     - `tags[]`, `style`, `industry`, `thumbnail`
     - `createdAt`, `updatedAt`
   - Add indexes: `by_userId`, `by_displayId`, `by_userId_and_style`

2. Update `packages/backend/convex/counters.ts`
   - Add `'designReferences': 'DR'` prefix mapping

3. Test schema compilation
   - Run `pnpm dev` and verify no errors
   - Check Convex dashboard for new table

**Dependencies:** None

**Acceptance Criteria:**
- Schema compiles without errors
- Table appears in Convex dashboard
- Display ID generation works (DR-000001)

---

### Task 2: Enhance Firecrawl for Multi-Page Crawling
**Priority:** High | **Estimated Time:** 2 hours

**Subtasks:**
1. Update Firecrawl API usage in `packages/backend/convex/ai.ts`
   - Replace single page `scrapeUrl` with `crawlUrl`
   - Configure crawl options:
     ```typescript
     const crawl = await firecrawl.crawlUrl(url, {
       limit: 10, // Crawl up to 10 pages
       scrapeOptions: {
         formats: ['markdown', 'html'],
         onlyMainContent: true,
       },
     });
     ```

2. Implement intelligent page selection
   - Prioritize: home, about, pricing, product, features pages
   - Filter out: privacy, terms, cookies, 404 pages
   - Use URL pattern matching

3. Add rate limiting
   - Track crawls per user in `userUsage` table
   - Add `websiteCrawlsThisHour` field
   - Enforce max 5 crawls per hour

4. Error handling
   - Handle timeout errors (30s max)
   - Skip failed pages gracefully
   - Return partial results if some pages fail

**Dependencies:** Task 1 (schema for usage tracking)

**Acceptance Criteria:**
- Can crawl 10 pages from a website
- Rate limiting works (max 5/hour)
- Handles errors gracefully
- Returns both markdown and HTML

---

### Task 3: Build AI Website Analysis Action
**Priority:** High | **Estimated Time:** 2.5 hours

**Subtasks:**
1. Create analysis prompt template
   ```typescript
   const ANALYSIS_SYSTEM_PROMPT = `
   You are a professional UI/UX designer and front-end architect.

   Analyze the provided website pages and extract:

   1. UI/UX Patterns: Layout types, component types, interaction patterns
   2. Color Palette: Primary, secondary, accent colors (hex codes)
   3. Typography: Font families, sizes, weights, line heights
   4. Tech Stack: Framework, CSS library, build tools
   5. Component Inventory: Reusable components with descriptions

   Return structured JSON matching this schema:
   {
     "uiPatterns": string[],
     "colorPalette": {
       "primary": string[],
       "secondary": string[],
       "accent": string[]
     },
     "typography": {
       "headingFont": string,
       "bodyFont": string,
       "sizes": string[]
     },
     "techStack": string[],
     "components": [
       { "type": string, "description": string }
     ]
   }
   `;
   ```

2. Create `analyzeWebsite` action in `convex/ai.ts`
   - Input: URL, optional tags/style/industry
   - Check credits (10 credits required)
   - Call crawlWebsite to get pages
   - Call Azure OpenAI with analysis prompt
   - Parse and validate response with Zod
   - Deduct 10 credits
   - Return analysis results

3. Implement Zod validation schema
   - Define `analysisResponseSchema`
   - Validate all required fields
   - Handle validation errors

**Dependencies:** Task 2 (crawling)

**Acceptance Criteria:**
- Analysis completes in <60 seconds
- Returns structured JSON
- Deducts 10 credits correctly
- Handles API errors gracefully

---

### Task 4: Implement Clone Prompt Generation
**Priority:** High | **Estimated Time:** 2 hours

**Subtasks:**
1. Create prompt generation template
   ```typescript
   const PROMPT_GENERATION_SYSTEM = `
   Generate 3 types of clone prompts based on this website analysis:

   1. Full-Page Clone: Comprehensive prompt to recreate entire page
   2. Component Prompts: Individual prompts for major components
   3. Design System: Color palette, typography, spacing extraction

   Each prompt should:
   - Be actionable and specific
   - Include exact values (colors, sizes, weights)
   - Describe layout and positioning
   - Mention interactions/animations

   Return JSON:
   {
     "fullPage": string,
     "components": [
       { "name": string, "prompt": string }
     ],
     "designSystem": string
   }
   `;
   ```

2. Create `generateClonePrompts` helper function
   - Takes analysis results as input
   - Calls Azure OpenAI with prompt template
   - Returns structured prompts

3. Integrate into `analyzeWebsite` action
   - Call after analysis completes
   - Save prompts to designReferences table

4. Add examples for quality
   - Provide 2-3 example prompts in system message
   - Show format: "Create a hero with: gradient #xxx → #yyy..."

**Dependencies:** Task 3 (analysis)

**Acceptance Criteria:**
- Generates all 3 prompt types
- Prompts are specific and actionable
- Includes exact color/size values
- Takes <15 seconds to generate

---

### Task 5: Create Design Reference CRUD Operations
**Priority:** Medium | **Estimated Time:** 1.5 hours

**Subtasks:**
1. Create `packages/backend/convex/designReferences.ts`

2. Implement queries:
   ```typescript
   export const getDesignReferences = query({
     args: {
       limit: v.optional(v.number()),
       style: v.optional(v.string()),
       tag: v.optional(v.string()),
     },
     handler: async (ctx, { limit = 50, style, tag }) => {
       const identity = await requireAuth(ctx);
       let query = ctx.db
         .query("designReferences")
         .withIndex("by_userId", q => q.eq("userId", identity.subject));

       if (style) {
         query = ctx.db
           .query("designReferences")
           .withIndex("by_userId_and_style", q =>
             q.eq("userId", identity.subject).eq("style", style)
           );
       }

       const references = await query.take(limit);

       if (tag) {
         return references.filter(r => r.tags.includes(tag));
       }

       return references;
     },
   });

   export const getDesignReference = query({
     args: { id: v.id("designReferences") },
     handler: async (ctx, { id }) => {
       const identity = await requireAuth(ctx);
       const reference = await ctx.db.get(id);

       if (!reference || reference.userId !== identity.subject) {
         throw new Error("Design reference not found");
       }

       return reference;
     },
   });
   ```

3. Implement mutations:
   ```typescript
   export const createDesignReference = mutation({
     args: {
       url: v.string(),
       siteName: v.string(),
       analysis: v.object({
         uiPatterns: v.array(v.string()),
         colorPalette: v.object({
           primary: v.array(v.string()),
           secondary: v.array(v.string()),
           accent: v.array(v.string()),
         }),
         typography: v.object({
           headingFont: v.optional(v.string()),
           bodyFont: v.optional(v.string()),
           sizes: v.optional(v.object({
             h1: v.optional(v.string()),
             h2: v.optional(v.string()),
             h3: v.optional(v.string()),
             body: v.optional(v.string()),
           })),
         }),
         techStack: v.array(v.string()),
         components: v.array(v.object({
           name: v.string(),
           description: v.string(),
         })),
       }),
       clonePrompts: v.object({
         fullPage: v.string(),
         components: v.array(v.object({
           name: v.string(),
           prompt: v.string(),
         })),
         designSystem: v.string(),
       }),
       tags: v.array(v.string()),
       style: v.string(),
     },
     handler: async (ctx, args) => {
       const identity = await requireAuth(ctx);
       const displayId = await generateDisplayId(ctx, "designReferences");

       return await ctx.db.insert("designReferences", {
         ...args,
         userId: identity.subject,
         displayId,
         createdAt: Date.now(),
         updatedAt: Date.now(),
       });
     },
   });

   export const updateDesignReference = mutation({
     args: {
       id: v.id("designReferences"),
       tags: v.optional(v.array(v.string())),
       description: v.optional(v.string()),
       style: v.optional(v.string()),
     },
     handler: async (ctx, { id, ...updates }) => {
       const identity = await requireAuth(ctx);
       const reference = await ctx.db.get(id);

       if (!reference || reference.userId !== identity.subject) {
         throw new Error("Unauthorized");
       }

       await ctx.db.patch(id, {
         ...updates,
         updatedAt: Date.now(),
       });
     },
   });

   export const deleteDesignReference = mutation({
     args: { id: v.id("designReferences") },
     handler: async (ctx, { id }) => {
       const identity = await requireAuth(ctx);
       const reference = await ctx.db.get(id);

       if (!reference || reference.userId !== identity.subject) {
         throw new Error("Unauthorized");
       }

       await ctx.db.delete(id);
     },
   });
   ```

4. Implement search:
   ```typescript
   export const searchDesignReferences = query({
     args: { searchTerm: v.string() },
     handler: async (ctx, { searchTerm }) => {
       const identity = await requireAuth(ctx);
       const term = searchTerm.toLowerCase();

       const references = await ctx.db
         .query("designReferences")
         .withIndex("by_userId", q => q.eq("userId", identity.subject))
         .collect();

       return references.filter(r =>
         r.url.toLowerCase().includes(term) ||
         r.siteName.toLowerCase().includes(term) ||
         r.tags.some(tag => tag.toLowerCase().includes(term))
       );
     },
   });
   ```

**Dependencies:** Task 1 (schema), Task 4 (prompts to save)

**Acceptance Criteria:**
- All CRUD operations work correctly
- Authentication enforced on all operations
- Search returns relevant results
- Pagination works for large lists

---

### Task 6: Build Design References Library Page
**Priority:** High | **Estimated Time:** 3 hours

**Subtasks:**
1. Create route `apps/web/src/routes/_authenticated/design-references.tsx`
   ```typescript
   export const Route = createFileRoute('/_authenticated/design-references')({
     component: DesignReferencesRoute,
   });

   function DesignReferencesRoute() {
     return (
       <div className="flex flex-col gap-6">
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-3xl font-bold">Design References</h1>
             <p className="text-muted-foreground">
               Analyzed websites with clone prompts
             </p>
           </div>
           <Button onClick={() => setAnalyzeDialogOpen(true)}>
             <Sparkles className="mr-2 h-4 w-4" />
             Analyze Website
           </Button>
         </div>

         <DesignReferencesTable />
         <AnalyzeWebsiteDialog
           open={analyzeDialogOpen}
           onOpenChange={setAnalyzeDialogOpen}
         />
       </div>
     );
   }
   ```

2. Create `features/design-references/components/design-references-table.tsx`
   - Use TanStack Table with columns: thumbnail, site name, URL, style, tags, created date
   - Implement filtering by style (minimal, corporate, creative)
   - Add tag filter chips
   - Add search input
   - Row actions: View, Edit, Delete, Copy Prompt

3. Create `design-reference-card.tsx`
   - Card layout with thumbnail at top
   - Site name and URL
   - Tags as badges
   - Style indicator
   - Quick actions (view, delete)

4. Create detail view components:
   - `design-reference-detail.tsx` - Full analysis display
   - `color-palette-display.tsx` - Color swatches with hex codes
   - `typography-sample.tsx` - Font preview with sizes
   - `clone-prompt-viewer.tsx` - Code block with copy button

5. Add responsive design
   - Desktop: Table view
   - Mobile: Card grid view
   - Tablet: 2-column cards

**Dependencies:** Task 5 (CRUD operations)

**Acceptance Criteria:**
- Library displays all saved references
- Filtering and search work correctly
- Responsive on all screen sizes
- Delete confirmation dialog works
- Color palettes display correctly

---

### Task 7: Create Website Analysis Dialog
**Priority:** High | **Estimated Time:** 2 hours

**Subtasks:**
1. Create `features/design-references/components/analyze-website-dialog.tsx`
   ```typescript
   export function AnalyzeWebsiteDialog({ open, onOpenChange }) {
     const [url, setUrl] = useState("");
     const [tags, setTags] = useState<string[]>([]);
     const [style, setStyle] = useState<string>("minimal");
     const [isAnalyzing, setIsAnalyzing] = useState(false);

     const analyzeWebsite = useAction(api.ai.analyzeWebsite);
     const { hasEnoughCredits } = useCreditsCheck();

     const handleAnalyze = async () => {
       if (!hasEnoughCredits(10)) {
         // Show insufficient credits dialog
         return;
       }

       setIsAnalyzing(true);
       try {
         const result = await analyzeWebsite({ url, tags, style });
         toast.success("Website analyzed successfully!");
         navigate({ to: `/design-references/${result.displayId}` });
       } catch (error) {
         toast.error(error.message);
       } finally {
         setIsAnalyzing(false);
       }
     };

     return (
       <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent>
           {!isAnalyzing ? (
             <form onSubmit={handleAnalyze}>
               <Input
                 placeholder="https://example.com"
                 value={url}
                 onChange={(e) => setUrl(e.target.value)}
               />

               <TagInput value={tags} onChange={setTags} />

               <Select value={style} onValueChange={setStyle}>
                 <SelectItem value="minimal">Minimal</SelectItem>
                 <SelectItem value="corporate">Corporate</SelectItem>
                 <SelectItem value="creative">Creative</SelectItem>
               </Select>

               <div className="text-sm text-muted-foreground">
                 Cost: 10 credits
               </div>

               <Button type="submit">Analyze Website</Button>
             </form>
           ) : (
             <AnalysisProgress />
           )}
         </DialogContent>
       </Dialog>
     );
   }
   ```

2. Create `analysis-progress.tsx`
   - Multi-step progress indicator
   - Steps: Crawling → Analyzing → Generating Prompts
   - Show estimated time for each step
   - Animated loader

3. Add validation
   - URL format validation (must be valid HTTP/HTTPS)
   - Credit check before starting
   - Rate limit check (max 5/hour)

4. Add to dashboard
   - "Analyze Website" button in header
   - Quick access card

**Dependencies:** Task 3 (analysis action), Task 5 (save results)

**Acceptance Criteria:**
- Dialog validates URL correctly
- Progress UI shows real-time status
- Credit check prevents analysis if insufficient
- Rate limiting enforced
- Success navigates to detail view

---

### Task 8: Integrate with AI Generation Feature
**Priority:** Medium | **Estimated Time:** 1.5 hours

**Subtasks:**
1. Update `features/ai-generation/components/generate-dialog.tsx`
   - Add "Import Design Reference" section
   - Add dropdown to select saved reference
   - Add radio group for prompt type (full-page, component, design system)
   - Button to insert selected prompt into textarea

2. Create prompt insertion logic
   ```typescript
   const handleInsertPrompt = (referenceId: Id<"designReferences">, type: string) => {
     const reference = references.find(r => r._id === referenceId);
     if (!reference) return;

     let promptText = "";
     if (type === "fullPage") {
       promptText = reference.clonePrompts.fullPage;
     } else if (type === "designSystem") {
       promptText = reference.clonePrompts.designSystem;
     } else {
       // Show component selection dialog
       return;
     }

     setPrompt(prev => prev + "\n\n" + promptText);
   };
   ```

3. Update global search
   - Add design references to search results
   - Type: "design-reference"
   - Show site name and URL in results

4. Update sidebar navigation
   - Add "Design References" item with Palette icon
   - Position after Projects

5. Update dashboard
   - Add "Recent Design References" card
   - Show last 3 analyzed sites
   - Quick action to analyze new site

**Dependencies:** Task 6 (library page), Task 7 (analysis dialog)

**Acceptance Criteria:**
- Can import prompts into AI generation
- Global search finds design references
- Navigation item works correctly
- Dashboard card displays recent references

---

### Task 9: Testing and Documentation
**Priority:** Medium | **Estimated Time:** 2 hours

**Subtasks:**
1. Write unit tests
   - Test analysis response parsing
   - Test prompt generation
   - Test CRUD operations
   - Test credit deduction

2. Write component tests
   - Test analyze dialog form validation
   - Test table filtering and search
   - Test prompt insertion

3. Manual testing
   - Test with 5 different websites
   - Verify color extraction accuracy
   - Test mobile responsiveness
   - Test error scenarios

4. Update documentation
   - Add to `CLAUDE.md`:
     - Design References section
     - Usage patterns
     - Credit costs
   - Update `docs/ENVIRONMENT.md` if needed
   - Add examples to README

**Dependencies:** All previous tasks

**Acceptance Criteria:**
- All tests pass
- Documentation is complete
- Manual testing reveals no major bugs
- Feature is production-ready

---

## Timeline Summary

| Task | Time | Priority |
|------|------|----------|
| 1. Database Schema | 1h | High |
| 2. Multi-Page Crawling | 2h | High |
| 3. AI Analysis Action | 2.5h | High |
| 4. Clone Prompt Generation | 2h | High |
| 5. CRUD Operations | 1.5h | Medium |
| 6. Library Page | 3h | High |
| 7. Analysis Dialog | 2h | High |
| 8. Integration | 1.5h | Medium |
| 9. Testing & Docs | 2h | Medium |
| **Total** | **17.5 hours** | |

## Dependencies Graph

```text
Task 1 (Schema)
  ↓
Task 2 (Crawling) → Task 3 (Analysis) → Task 4 (Prompts)
  ↓                                         ↓
Task 5 (CRUD) ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
  ↓
Task 6 (Library Page) → Task 7 (Dialog) → Task 8 (Integration)
  ↓                        ↓                  ↓
Task 9 (Testing & Docs) ← ← ← ← ← ← ← ← ← ← ←
```

## Credit Costs
- **Analyze Website:** 10 credits (includes crawling + analysis + prompt generation)
- **View References:** Free
- **Use Clone Prompts:** Free

## Success Metrics
- User can analyze any public website
- Analysis completes in <60 seconds
- Clone prompts are specific and actionable
- Design library is searchable and filterable
- Integration with AI generation works seamlessly

## Next Steps
1. Review plan and adjust estimates if needed
2. Begin with Task 1 (Database Schema)
3. Work sequentially through high-priority tasks
4. Test thoroughly before moving to next task
5. Update this plan if scope changes

# AI-Powered Project Generation - Product Requirements Document

## Executive Summary

### Overview
An AI-powered feature that allows users to generate complete project structures from natural language descriptions. Users input a project description via a dashboard modal, and the system uses Azure OpenAI GPT-5 to automatically create projects, tasks (with subtasks), and contacts with proper relationships.

### Business Value
- **Accelerated Project Setup**: Reduce project initialization time from hours to seconds
- **Consistency**: AI generates well-structured projects following best practices
- **User Productivity**: Eliminate manual data entry for standard project types
- **Competitive Advantage**: Differentiate from traditional project management tools

### Success Metrics
- **Adoption Rate**: 30% of new projects created via AI generation within 3 months
- **Time Savings**: Average 45 minutes saved per project setup
- **User Satisfaction**: NPS score of 8+ for AI generation feature
- **Accuracy**: 85%+ of generated projects require minimal manual adjustments

---

## User Stories & Use Cases

### Primary User Personas

**1. Project Manager (Sarah)**
- Needs to quickly set up new client projects
- Values standardized project structures
- Limited time for manual setup

**2. Solo Entrepreneur (Mike)**
- Manages multiple side projects
- Not familiar with detailed project planning
- Wants AI to suggest best practices

**3. Team Lead (Alex)**
- Onboards new team members frequently
- Needs consistent project templates
- Wants AI to identify required stakeholders

### User Stories

**US-001: Generate Project from Description**
```
As a project manager
I want to describe my project in natural language
So that the system automatically creates the complete project structure
```

**US-002: Automatic Task Breakdown**
```
As a user
I want the AI to break down my project into logical tasks and subtasks
So that I don't have to manually decompose the work
```

**US-003: Stakeholder Identification**
```
As a team lead
I want the AI to identify relevant contacts and their roles
So that I can quickly build the project team
```

**US-004: Immediate Creation**
```
As a busy entrepreneur
I want projects created immediately without manual review
So that I can start working on tasks right away
```

### Example Use Cases

#### Use Case 1: Software Development Project
**Input:**
```
Build a mobile app for task management with user authentication,
offline sync, push notifications, and analytics dashboard.
Target iOS and Android. 4-month timeline.
```

**Expected Output:**
- 1 Project: "Task Management Mobile App"
- 15-20 Tasks organized in phases:
  - Design Phase (3 tasks: User research, UI/UX design, Prototype)
  - Development Phase (8 tasks: Auth, Offline sync, Push notifications, etc.)
  - Testing Phase (4 tasks: Unit testing, Integration testing, etc.)
  - Launch Phase (3 tasks: App store submission, Marketing, etc.)
- 5-7 Contacts:
  - Product Manager
  - UI/UX Designer
  - iOS Developer
  - Android Developer
  - QA Engineer
  - DevOps Engineer

#### Use Case 2: Marketing Campaign
**Input:**
```
Launch a new product marketing campaign including social media,
email marketing, content creation, and influencer partnerships.
Budget $50k, 2-month timeline.
```

**Expected Output:**
- 1 Project: "Product Launch Marketing Campaign"
- 12-15 Tasks organized by channel:
  - Strategy (3 tasks)
  - Content Creation (4 tasks)
  - Social Media (3 tasks)
  - Email Marketing (3 tasks)
  - Influencer Outreach (3 tasks)
- 4-6 Contacts:
  - Marketing Manager
  - Content Writer
  - Social Media Manager
  - Email Marketing Specialist
  - Influencer Relations

---

## Technical Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Dashboard (/dashboard)                               │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  "Generate Project with AI" Button              │  │  │
│  │  └─────────────────┬────────────────────────────────┘  │  │
│  └────────────────────┼───────────────────────────────────┘  │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      │ Opens Modal
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            Generate Dialog Component                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  [Textarea: Project Description]                   │     │
│  │                                                      │     │
│  │  [Generate Button] [Cancel Button]                 │     │
│  └─────────────────┬────────────────────────────────────┘    │
└──────────────────┼───────────────────────────────────────────┘
                   │
                   │ Submit
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              Convex Action (Backend)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ai.ts: generateProject()                            │  │
│  │                                                        │  │
│  │  1. Validate input                                    │  │
│  │  2. Call Azure OpenAI API ──────────────────┐        │  │
│  │  3. Parse structured JSON response          │        │  │
│  │  4. Create project (get ID)                 │        │  │
│  │  5. Create tasks (link to project)          │        │  │
│  │  6. Create contacts                          │        │  │
│  │  7. Return summary                           │        │  │
│  └───────────────────┬───────────────────────────┘      │  │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       │ HTTP Request
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Azure OpenAI GPT-5                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Endpoint: https://{resource}.openai.azure.com        │  │
│  │  Deployment: gpt-5                                    │  │
│  │                                                        │  │
│  │  Input: Structured prompt with project description    │  │
│  │  Output: JSON with projects, tasks, contacts          │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                       │
                       │ JSON Response
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Convex Database                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Projects Table                                       │  │
│  │  ├─ Auto-generated displayId (PRJ-000042)            │  │
│  │  ├─ Hierarchy fields (level, sortPath)               │  │
│  │                                                        │  │
│  │  Tasks Table                                          │  │
│  │  ├─ Auto-generated displayId (TD-000156)             │  │
│  │  ├─ Linked via projectId                             │  │
│  │  ├─ Hierarchy via parentTaskId                        │  │
│  │                                                        │  │
│  │  Contacts Table                                       │  │
│  │  ├─ Auto-generated displayId (CT-000023)             │  │
│  │  └─ Role stored in title/notes                        │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**
- Convex Actions (for HTTP requests to AI)
- Azure OpenAI GPT-5 (AI model)
- Existing mutations: `projects.create`, `tasks.create`, `contacts.create`

**Frontend:**
- React 19 with TanStack Router
- shadcn/ui Dialog component
- React Hook Form + Zod validation
- Sonner for toast notifications

### Data Flow

1. **User Input** → Dialog textarea
2. **Form Submission** → Validate with Zod schema
3. **Action Call** → `ctx.runAction(api.ai.generateProject, { prompt })`
4. **AI Request** → Azure OpenAI with structured prompt
5. **Response Parsing** → JSON validation with Zod
6. **Batch Creation** → Sequential mutation calls
7. **Success Feedback** → Toast notification + dialog close
8. **Dashboard Refresh** → New items appear automatically (real-time Convex)

---

## Feature Specifications

### UI/UX Specifications

#### Dashboard Button
- **Location**: Dashboard header, right side next to title
- **Label**: "Generate Project with AI"
- **Icon**: `Sparkles` from lucide-react
- **Styling**: Primary button variant
- **Action**: Opens generation dialog

#### Generation Dialog
- **Size**: Large modal (`sm:max-w-[600px]`)
- **Title**: "Generate Project with AI"
- **Description**: "Describe your project and let AI create the complete structure with tasks and contacts."

**Form Fields:**
1. **Project Description (Textarea)**
   - Label: "Project Description"
   - Placeholder: "Example: Build a mobile app for task management with authentication, offline sync, and push notifications..."
   - Rows: 8
   - Required: Yes
   - Validation: Minimum 20 characters, maximum 2000 characters
   - Help text: "Be specific about features, timeline, budget, and team size for better results."

**Buttons:**
- **Cancel**: Outline variant, closes dialog
- **Generate**: Primary variant, submits form
  - Loading state: "Generating..." with spinner
  - Disabled during submission

#### Loading State
- Replace form with loading indicator
- Message: "AI is analyzing your project and creating structure..."
- Estimated time display: "This usually takes 10-30 seconds"
- Spinner animation

#### Success State
- Toast notification: "Generated successfully! Created X projects, Y tasks, Z contacts"
- Auto-close dialog after 500ms
- Navigate to project page (optional)

#### Error State
- Toast notification (error variant): Clear error message
- Keep dialog open
- Allow retry

### AI Prompt Engineering

#### System Prompt Template
```
You are a project management expert helping users create structured project plans.

Given a project description, generate a comprehensive project structure including:
1. Main project with appropriate details
2. Tasks broken down into logical phases/categories
3. Subtasks for complex tasks (up to 2 levels deep)
4. Relevant stakeholders/contacts with roles

Follow these rules:
- Project status: "active" for new projects
- Project priority: Infer from description (default: "medium")
- Task status: All tasks start as "backlog"
- Task priority: Vary based on importance (critical for blockers, high for key features)
- Task labels: Use appropriate categories (feature, bug, documentation, design, testing, deployment)
- Create 10-25 tasks depending on project complexity
- Include 3-8 contacts with relevant roles
- Use realistic durations and dependencies

Output must be valid JSON matching this schema:
{
  "project": {
    "name": string,
    "description": string,
    "status": "active" | "on-hold",
    "priority": "low" | "medium" | "high" | "critical",
    "startDate": timestamp (optional),
    "endDate": timestamp (optional)
  },
  "tasks": [
    {
      "title": string,
      "description": string,
      "status": "backlog" | "todo" | "in progress",
      "label": "feature" | "bug" | "documentation" | ...,
      "priority": "low" | "medium" | "high",
      "dueDate": timestamp (optional),
      "parentTaskTitle": string (optional, for subtasks)
    }
  ],
  "contacts": [
    {
      "firstName": string,
      "lastName": string,
      "email": string,
      "title": string (role in project),
      "category": "client" | "vendor" | "colleague" | "partner"
    }
  ]
}
```

#### User Prompt Template
```
Create a project structure for:

{userDescription}

Important context:
- Current date: {currentDate}
- User timezone: {userTimezone}
- Generate realistic timelines based on project scope
- Identify critical path tasks
- Include appropriate stakeholders
```

### Data Generation Rules

#### Project Generation
- **Name**: Extract from description, max 80 characters
- **Description**: Summarize project goals and scope (150-300 words)
- **Status**: Always "active" for new projects
- **Priority**: Infer from keywords:
  - "urgent", "critical", "asap" → "critical"
  - "important", "high priority" → "high"
  - "nice to have", "low priority" → "low"
  - Default → "medium"
- **Dates**:
  - If timeline mentioned (e.g., "4 months"), calculate endDate
  - startDate: Current date
  - No dates if not specified

#### Task Generation Rules
- **Quantity**:
  - Simple projects (1-2 sentences): 8-12 tasks
  - Medium projects (paragraph): 12-18 tasks
  - Complex projects (detailed description): 18-25 tasks
- **Hierarchy**:
  - Create parent tasks for phases/categories
  - Add 2-4 subtasks under complex parent tasks
  - Maximum 2 levels deep
- **Status**: All tasks start as "backlog"
- **Labels**:
  - "feature" - New functionality
  - "bug" - Issues to fix
  - "documentation" - Docs and guides
  - "design" - UI/UX work
  - "testing" - QA and testing
  - "deployment" - Release tasks
  - "research" - Discovery work
- **Priority Distribution**:
  - 10% critical (blockers, dependencies)
  - 30% high (key features)
  - 50% medium (standard work)
  - 10% low (nice-to-have)
- **Due Dates**:
  - Distribute across project timeline
  - Critical tasks: Earlier dates
  - Nice-to-have tasks: Later dates

#### Contact Generation Rules
- **Quantity**:
  - Small project: 3-5 contacts
  - Medium project: 5-7 contacts
  - Large project: 7-10 contacts
- **Roles**: Infer from project type:
  - Software: PM, Designer, Developers, QA, DevOps
  - Marketing: Marketing Manager, Content Writer, Designer, Analyst
  - Construction: Project Manager, Architect, Contractor, Inspector
- **Category**:
  - Internal team: "colleague"
  - Clients: "client"
  - External vendors: "vendor"
  - Partners: "partner"
- **Email Format**: `{firstName}.{lastName}@example.com`
- **Title**: Store role in title field (e.g., "Senior Frontend Developer")

#### Relationship Rules
- **Tasks → Project**: All tasks linked via `projectId`
- **Subtasks → Parent Tasks**: Use `parentTaskId` for hierarchy
- **Creation Order**:
  1. Create project first (get `projectId`)
  2. Create parent tasks (get task IDs)
  3. Create subtasks with `parentTaskId`
  4. Create contacts (independent)

---

## Implementation Details

### Backend Implementation

#### File: `packages/backend/convex/ai.ts`

```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Environment variables (set via Convex CLI)
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY!;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT!;

export const generateProject = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Must be logged in");
    }

    // 2. Call Azure OpenAI API
    const aiResponse = await callAzureOpenAI(args.prompt);

    // 3. Parse and validate response
    const parsedData = await parseAndValidateAIResponse(aiResponse);

    // 4. Create project
    const projectId = await ctx.runMutation(api.projects.create, {
      name: parsedData.project.name,
      description: parsedData.project.description,
      status: parsedData.project.status,
      priority: parsedData.project.priority,
      startDate: parsedData.project.startDate,
      endDate: parsedData.project.endDate,
    });

    // 5. Create tasks (handle hierarchy)
    const taskIdMap = new Map<string, string>();

    // First pass: Create parent tasks
    for (const task of parsedData.tasks.filter(t => !t.parentTaskTitle)) {
      const taskId = await ctx.runMutation(api.tasks.create, {
        title: task.title,
        description: task.description,
        status: task.status,
        label: task.label,
        priority: task.priority,
        dueDate: task.dueDate,
        projectId: projectId,
      });
      taskIdMap.set(task.title, taskId);
    }

    // Second pass: Create subtasks
    for (const task of parsedData.tasks.filter(t => t.parentTaskTitle)) {
      const parentTaskId = taskIdMap.get(task.parentTaskTitle!);
      await ctx.runMutation(api.tasks.create, {
        title: task.title,
        description: task.description,
        status: task.status,
        label: task.label,
        priority: task.priority,
        dueDate: task.dueDate,
        projectId: projectId,
        parentTaskId: parentTaskId,
      });
    }

    // 6. Create contacts
    for (const contact of parsedData.contacts) {
      await ctx.runMutation(api.contacts.create, {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        title: contact.title,
        category: contact.category,
        status: "active",
      });
    }

    // 7. Return summary
    return {
      success: true,
      summary: {
        projectId,
        projectName: parsedData.project.name,
        tasksCreated: parsedData.tasks.length,
        contactsCreated: parsedData.contacts.length,
      },
    };
  },
});

async function callAzureOpenAI(prompt: string): Promise<any> {
  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-08-01-preview`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": AZURE_OPENAI_KEY,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: generateUserPrompt(prompt) },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Azure OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseAndValidateAIResponse(jsonString: string) {
  // Parse JSON and validate with Zod
  // Return validated structure
}
```

#### Environment Setup

```bash
# Set via Convex CLI (production)
npx convex env set AZURE_OPENAI_ENDPOINT "https://your-resource.openai.azure.com"
npx convex env set AZURE_OPENAI_KEY "your-api-key"
npx convex env set AZURE_OPENAI_DEPLOYMENT "gpt-5-deployment-name"

# For development (add to .env.local in packages/backend)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-5-deployment-name
```

### Frontend Implementation

#### File: `apps/web/src/features/ai-generation/data/schema.ts`

```typescript
import { z } from "zod";

export const generateProjectFormSchema = z.object({
  prompt: z
    .string()
    .min(20, "Please provide at least 20 characters")
    .max(2000, "Description too long (max 2000 characters)"),
});

export type GenerateProjectFormValues = z.infer<typeof generateProjectFormSchema>;

// AI Response schema for validation
export const aiProjectSchema = z.object({
  project: z.object({
    name: z.string(),
    description: z.string(),
    status: z.enum(["active", "on-hold"]),
    priority: z.enum(["low", "medium", "high", "critical"]),
    startDate: z.number().optional(),
    endDate: z.number().optional(),
  }),
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      status: z.string(),
      label: z.string(),
      priority: z.enum(["low", "medium", "high"]),
      dueDate: z.number().optional(),
      parentTaskTitle: z.string().optional(),
    })
  ),
  contacts: z.array(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      title: z.string(),
      category: z.enum(["client", "vendor", "colleague", "partner", "personal", "other"]),
    })
  ),
});
```

#### File: `apps/web/src/features/ai-generation/components/generate-dialog.tsx`

```typescript
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { generateProjectFormSchema, type GenerateProjectFormValues } from "../data/schema";

interface GenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (prompt: string) => Promise<void>;
}

export function GenerateDialog({ open, onOpenChange, onGenerate }: GenerateDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GenerateProjectFormValues>({
    resolver: zodResolver(generateProjectFormSchema),
    defaultValues: { prompt: "" },
  });

  const onSubmit = async (values: GenerateProjectFormValues) => {
    setIsGenerating(true);
    try {
      await onGenerate(values.prompt);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate Project with AI</DialogTitle>
          <DialogDescription>
            Describe your project and let AI create the complete structure with tasks and contacts.
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="font-medium">AI is analyzing your project...</p>
              <p className="text-sm text-muted-foreground">
                This usually takes 10-30 seconds
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Project Description</Label>
              <Textarea
                id="prompt"
                placeholder="Example: Build a mobile app for task management with authentication, offline sync, and push notifications. Target iOS and Android. 4-month timeline with a team of 5 developers."
                rows={8}
                {...register("prompt")}
                className="resize-none"
              />
              {errors.prompt && (
                <p className="text-sm text-destructive">{errors.prompt.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Be specific about features, timeline, budget, and team size for better results.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isGenerating}>
                Generate
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

#### File: `apps/web/src/routes/_authenticated/dashboard.tsx` (modifications)

```typescript
// Add imports
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenerateDialog } from "@/features/ai-generation/components/generate-dialog";
import { useAction } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import { toast } from "sonner";

// Inside component
const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
const generateProject = useAction(api.ai.generateProject);

const handleGenerate = async (prompt: string) => {
  try {
    const result = await generateProject({ prompt });
    toast.success(
      `Generated successfully! Created ${result.summary.projectName} with ${result.summary.tasksCreated} tasks and ${result.summary.contactsCreated} contacts.`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    toast.error(`Failed to generate project: ${errorMessage}`);
    throw error;
  }
};

// In JSX (modify header section)
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
    <p className="text-muted-foreground">
      Welcome back! Here's an overview of your tasks.
    </p>
  </div>
  <Button onClick={() => setGenerateDialogOpen(true)}>
    <Sparkles className="mr-2 h-4 w-4" />
    Generate Project with AI
  </Button>
</div>

// Before closing component
<GenerateDialog
  open={generateDialogOpen}
  onOpenChange={setGenerateDialogOpen}
  onGenerate={handleGenerate}
/>
```

---

## Non-Functional Requirements

### Performance
- **API Response Time**: 10-30 seconds for project generation
- **UI Responsiveness**: Dialog opens instantly (<100ms)
- **Loading Feedback**: Show progress within 200ms of submission
- **Database Operations**: Complete batch creation within 5 seconds after AI response

### Security
- **API Key Management**: Store Azure OpenAI credentials in Convex environment variables
- **Authentication**: Enforce user authentication before generation
- **Input Validation**: Sanitize user input, limit prompt length
- **Rate Limiting**: Consider implementing per-user limits (future)

### Scalability
- **Concurrent Requests**: Handle multiple simultaneous generations
- **Database Load**: Batch mutations should not overwhelm Convex
- **Cost Management**: Monitor Azure OpenAI usage, set budgets

### Reliability
- **Error Handling**: Graceful failures with clear user messaging
- **Partial Success**: If generation fails partway, preserve created items
- **Retry Logic**: Allow users to retry failed generations
- **Logging**: Log all AI requests and responses for debugging

### Accessibility
- **Keyboard Navigation**: Dialog accessible via keyboard
- **Screen Readers**: Proper ARIA labels and announcements
- **Focus Management**: Focus moves to dialog on open
- **Loading Announcements**: Announce loading state to screen readers

---

## Testing Strategy

### Unit Tests

**Backend Tests** (`packages/backend/convex/ai.test.ts`):
- AI response parsing with valid JSON
- AI response parsing with invalid JSON
- Error handling for API failures
- Batch creation logic
- Hierarchy handling (parent tasks before subtasks)

**Frontend Tests** (`apps/web/src/features/ai-generation/components/generate-dialog.test.tsx`):
- Form validation (min/max length)
- Loading state display
- Error state handling
- Dialog open/close behavior
- Success callback execution

### Integration Tests

**Backend Integration**:
- Full flow: API call → Parse → Create all entities
- Verify relationships (tasks linked to projects)
- Verify hierarchy (subtasks linked to parent tasks)
- Error recovery scenarios

**Frontend Integration**:
- Dialog → Action call → Success toast
- Dialog → Action call → Error toast
- Dashboard refresh after generation

### E2E Tests

**User Flows**:
1. Open dashboard → Click "Generate" → Enter description → Submit → Verify success
2. Open dialog → Submit empty form → See validation error
3. Generate project → Navigate to project page → Verify data
4. Generate project → Check tasks page → Verify tasks exist
5. Generate project → Check contacts page → Verify contacts exist

### Manual Test Cases

**Test Case 1: Simple Software Project**
```
Input: "Create a simple website with home, about, and contact pages"
Expected: 1 project, 6-8 tasks, 2-3 contacts
Verify: All tasks linked to project, reasonable task breakdown
```

**Test Case 2: Complex Multi-Phase Project**
```
Input: "Build an e-commerce platform with user auth, product catalog, shopping cart, payment integration, admin panel, and mobile app. 12-month timeline, team of 10."
Expected: 1 project, 20-25 tasks with subtasks, 8-10 contacts
Verify: Proper hierarchy, realistic timeline distribution
```

**Test Case 3: Non-Technical Project**
```
Input: "Plan a wedding for 150 guests in 6 months, including venue, catering, photography, and entertainment"
Expected: 1 project, 12-15 tasks, 5-7 contacts (vendors)
Verify: Appropriate categories and priorities
```

**Test Case 4: Edge Cases**
```
- Very short description (20 characters)
- Very long description (2000 characters)
- Description with special characters
- Description in different language
- Vague description ("do something")
```

---

## Future Enhancements

### Phase 2: Preview & Edit
- Show AI-generated structure before creation
- Allow editing of projects, tasks, contacts
- Selectively create only desired items
- Regenerate specific sections

### Phase 3: Template Library
- Save generated structures as templates
- Share templates with team
- Template marketplace
- Industry-specific templates

### Phase 4: Iterative Refinement
- "Modify project" feature after generation
- Add more tasks based on feedback
- Reorganize hierarchy with AI assistance
- Smart suggestions based on project progress

### Phase 5: Advanced Features
- Multi-language support for descriptions
- Integration with external data sources
- AI-powered project updates
- Automatic task assignment based on team skills
- Budget and resource allocation

### Phase 6: Analytics & Learning
- Track generation accuracy metrics
- User satisfaction surveys
- A/B testing different prompts
- Model fine-tuning based on feedback

---

## Risks & Mitigation

### Risk 1: AI Generates Invalid/Inappropriate Content
**Mitigation:**
- Strict Zod schema validation on AI response
- Content filtering in prompts
- Manual review capability (future phase)
- Clear terms of use

### Risk 2: High API Costs
**Mitigation:**
- Monitor usage with alerts
- Implement per-user rate limits
- Optimize prompts for token efficiency
- Consider caching common patterns

### Risk 3: Poor User Experience with Long Wait Times
**Mitigation:**
- Show progress indicators
- Set realistic expectations (10-30 seconds)
- Stream responses if possible (future)
- Background processing option (future)

### Risk 4: Partial Creation Failures
**Mitigation:**
- Transaction-like behavior (rollback on error)
- Track created item IDs
- Provide "cleanup" option
- Clear error messages with recovery steps

### Risk 5: AI Model Changes/Deprecation
**Mitigation:**
- Abstract AI service behind interface
- Easy model switching capability
- Fallback to alternative models
- Regular monitoring of API changes

---

## Success Criteria

### Launch Criteria
- ✅ Core functionality works end-to-end
- ✅ Error handling covers major failure modes
- ✅ Performance meets targets (<30s generation)
- ✅ Security review passed
- ✅ Unit and integration tests passing
- ✅ Manual testing on 10+ diverse examples

### Post-Launch Metrics (30 days)

**Usage Metrics:**
- Number of generations per day
- Average generations per active user
- Success rate (completed vs. failed)

**Quality Metrics:**
- Average projects/tasks/contacts generated
- User retention (do they return?)
- Feature usage after generation (edit, delete rates)

**Business Metrics:**
- Time saved per generation
- User satisfaction (surveys)
- Feature adoption rate
- Conversion impact (trial to paid)

---

## Appendix

### A. Status Values Reference

**Project Status:**
- `active` - Currently being worked on
- `on-hold` - Paused temporarily
- `completed` - Finished
- `archived` - Historical record

**Task Status:**
- `backlog` - Not started, in queue
- `todo` - Ready to start
- `in progress` - Currently being worked on
- `done` - Completed
- `canceled` - Won't be done

**Contact Status:**
- `active` - Current contact
- `archived` - No longer relevant

### B. Priority Values

**Levels:**
- `critical` - Urgent, blocking other work
- `high` - Important, near-term
- `medium` - Standard priority
- `low` - Nice-to-have, can wait

### C. Task Labels

**Available Labels:**
- `feature` - New functionality
- `bug` - Something broken
- `documentation` - Docs, guides
- `design` - UI/UX work
- `testing` - QA activities
- `deployment` - Release tasks
- `research` - Investigation, POCs
- `maintenance` - Ongoing upkeep

### D. Contact Categories

**Categories:**
- `client` - External customers
- `vendor` - Service providers
- `colleague` - Internal team members
- `partner` - Business partners
- `personal` - Personal contacts
- `other` - Miscellaneous

### E. Example Prompts

**Good Prompts (Specific):**
```
"Build a SaaS application for project management targeting small businesses.
Features: user authentication, team collaboration, task tracking,
time logging, reporting dashboard. Tech stack: React, Node.js, PostgreSQL.
6-month development timeline with 5 developers and 1 designer."
```

**Poor Prompts (Vague):**
```
"Make a website"
"Build something cool"
"Project for work"
```

### F. Azure OpenAI Configuration

**Endpoint Format:**
```
https://{your-resource-name}.openai.azure.com/
```

**API Version:**
```
2024-08-01-preview
```

**Required Permissions:**
- Cognitive Services OpenAI User (or higher)

**Cost Estimates (GPT-4):**
- Average tokens per generation: ~3000-4000
- Estimated cost per generation: $0.10-$0.20
- Monthly cost at 100 generations: $10-$20

---

## Document Control

**Version:** 1.0
**Status:** Draft for Review
**Author:** Product Team
**Last Updated:** 2025-01-09
**Next Review:** After implementation completion

**Changelog:**
- 2025-01-09: Initial PRD creation

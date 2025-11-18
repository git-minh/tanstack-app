"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { parseAIResponse } from "./ai_schema";
import { CREDIT_COSTS } from "./credits";
import { logger, safeStringify } from "./lib/logger";
import type {
  CrawledPage,
  ProcessedPage,
  CrawlWebsiteResponse,
  CrawlWebsiteErrorResponse
} from './crawl_types';
import {
  analysisResponseSchema,
  WEBSITE_ANALYSIS_SYSTEM_PROMPT,
  type AnalysisResponse,
  clonePromptsSchema,
  CLONE_PROMPT_GENERATION_SYSTEM_PROMPT,
  type ClonePrompts
} from './analysis_schema';

/**
 * Azure OpenAI API response type
 */
interface AzureOpenAIResponse {
  choices: Array<{
    message: {
      content: string | null;
      refusal?: string | null;
      role: string;
    };
    finish_reason: string | null;
    index: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Standardized error response format (Subtask 1.9 ✓)
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
  summary: {
    projectId: undefined;
    projectDisplayId: undefined;
    projectName: undefined;
    tasksCreated: number;
    contactsCreated: number;
  };
}

/**
 * Error codes for AI project generation
 *
 * These codes help the frontend provide specific user feedback and recovery options.
 *
 * Frontend Usage Guide:
 * ---------------------
 * - AUTH_REQUIRED: Show login prompt or redirect to auth
 * - INVALID_INPUT: Show field validation errors inline
 * - AI_SERVICE_ERROR: Show "AI service unavailable, try again" message with retry button
 * - AI_RESPONSE_INVALID: Show "AI generated unexpected response, try again" with retry
 * - PROJECT_CREATE_FAILED: Show "Failed to create project" with support link
 * - TASK_CREATE_FAILED: Show "Failed to create tasks" with partial success info
 * - CONTACT_CREATE_FAILED: Show "Failed to create contacts" with partial success info
 * - ROLLBACK_FAILED: Show "Error occurred and cleanup failed" with manual cleanup instructions
 * - UNKNOWN_ERROR: Show generic error with retry option
 *
 * All errors include `summary.tasksCreated` and `summary.contactsCreated` for partial success tracking.
 */
export type ErrorCode =
  | "AUTH_REQUIRED"           // User not authenticated
  | "INVALID_INPUT"           // Input validation failed (too short/long)
  | "AI_SERVICE_ERROR"        // Azure OpenAI API error
  | "AI_RESPONSE_INVALID"     // AI returned invalid JSON or schema mismatch
  | "PROJECT_CREATE_FAILED"   // Failed to create project
  | "TASK_CREATE_FAILED"      // Failed to create tasks
  | "CONTACT_CREATE_FAILED"   // Failed to create contacts
  | "ROLLBACK_FAILED"         // Cleanup failed (manual intervention needed)
  | "UNKNOWN_ERROR";          // Unexpected error

/**
 * Success response format
 */
export interface SuccessResponse {
  success: true;
  summary: {
    projectId: Id<"projects">;
    projectDisplayId: string;
    projectName: string;
    tasksCreated: number;
    contactsCreated: number;
  };
}

/**
 * Combined response type
 */
export type GenerateProjectResponse = SuccessResponse | ErrorResponse;

/**
 * Format error into standardized response structure
 *
 * Maps different error types to specific error codes for better frontend handling.
 *
 * @param error - The error to format
 * @param partialCounts - Partial creation counts for context
 * @returns Formatted error response
 */
function formatError(
  error: Error,
  partialCounts: { tasksCreated: number; contactsCreated: number } = {
    tasksCreated: 0,
    contactsCreated: 0,
  }
): ErrorResponse {
  let code: ErrorCode = "UNKNOWN_ERROR";
  let message = error.message;

  // Map error messages to specific error codes
  if (message.includes("Unauthorized")) {
    code = "AUTH_REQUIRED";
  } else if (message.includes("too short") || message.includes("too long")) {
    code = "INVALID_INPUT";
  } else if (message.includes("AI service unavailable")) {
    code = "AI_SERVICE_ERROR";
  } else if (message.includes("AI generated invalid response")) {
    code = "AI_RESPONSE_INVALID";
  } else if (message.includes("Failed to create project")) {
    code = "PROJECT_CREATE_FAILED";
  } else if (message.includes("Failed to create task")) {
    code = "TASK_CREATE_FAILED";
  } else if (message.includes("Failed to create contact")) {
    code = "CONTACT_CREATE_FAILED";
  }

  return {
    success: false,
    error: {
      code,
      message,
      details: {
        originalError: error.name,
        partiallyCreated: partialCounts.tasksCreated > 0 || partialCounts.contactsCreated > 0,
      },
    },
    summary: {
      projectId: undefined,
      projectDisplayId: undefined,
      projectName: undefined,
      tasksCreated: partialCounts.tasksCreated,
      contactsCreated: partialCounts.contactsCreated,
    },
  };
}

// Environment variables for Azure OpenAI
// These will be used in subtask 1.2 for API calls
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;

// Validate required environment variables at startup
const missingVars: string[] = [];
if (!AZURE_OPENAI_ENDPOINT) missingVars.push("AZURE_OPENAI_ENDPOINT");
if (!AZURE_OPENAI_KEY) missingVars.push("AZURE_OPENAI_KEY");
if (!AZURE_OPENAI_DEPLOYMENT) missingVars.push("AZURE_OPENAI_DEPLOYMENT");

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Azure OpenAI environment variables: ${missingVars.join(", ")}. ` +
    `Please set these variables in your Convex environment configuration.`
  );
}

/**
 * System prompt template for AI project generation
 *
 * Defines the AI's role and output format for generating project structures.
 */
const SYSTEM_PROMPT = `You are an expert project management assistant that helps users create comprehensive project plans.

Your task is to analyze a project description and generate a complete project structure including:
1. A main project with details
2. A hierarchical breakdown of tasks (with subtasks where appropriate)
3. Relevant contacts/stakeholders for the project

**OUTPUT FORMAT:**
You must respond with valid JSON matching this exact structure:

{
  "project": {
    "name": "string (required, 3-100 chars)",
    "description": "string (optional, detailed description)",
    "status": "string (required, one of: 'active', 'on-hold', 'completed', 'archived')",
    "priority": "string (required, one of: 'low', 'medium', 'high', 'critical')",
    "color": "string (optional, hex color like '#3b82f6')",
    "startDate": "number (optional, Unix timestamp in milliseconds)",
    "endDate": "number (optional, Unix timestamp in milliseconds)"
  },
  "tasks": [
    {
      "title": "string (required, 3-100 chars)",
      "description": "string (optional, detailed description)",
      "status": "string (required, one of: 'todo', 'in-progress', 'review', 'done', 'cancelled')",
      "label": "string (required, one of: 'bug', 'feature', 'documentation', 'enhancement', 'task')",
      "priority": "string (required, one of: 'low', 'medium', 'high', 'critical')",
      "dueDate": "number (optional, Unix timestamp in milliseconds)",
      "subtasks": [
        {
          "title": "string (required)",
          "description": "string (optional)",
          "status": "string (required)",
          "label": "string (required)",
          "priority": "string (required)",
          "dueDate": "number (optional)"
        }
      ]
    }
  ],
  "contacts": [
    {
      "firstName": "string (required)",
      "lastName": "string (required)",
      "email": "string (required, valid email format)",
      "phone": "string (optional)",
      "company": "string (optional)",
      "title": "string (optional, job title)",
      "department": "string (optional)",
      "website": "string (optional)",
      "address": "string (optional)",
      "notes": "string (optional)",
      "status": "string (required, one of: 'active', 'inactive', 'archived')",
      "category": "string (required, one of: 'client', 'vendor', 'partner', 'team', 'stakeholder', 'other')"
    }
  ]
}

**GENERATION RULES:**

1. **Project:**
   - Set status to 'active' for new projects (default)
   - Choose priority based on urgency indicators in description
   - Set realistic startDate (near future) and endDate (weeks/months out) if timeline is mentioned
   - Use appropriate color: blue (#3b82f6) for general, green (#10b981) for completed, orange (#f97316) for urgent

2. **Tasks:**
   - Create 3-8 main tasks representing major project phases/milestones
   - Break down complex tasks into 2-5 subtasks each
   - Set status to 'todo' for all tasks initially
   - Use label 'feature' for new functionality, 'task' for general work, 'documentation' for docs
   - Distribute priorities: some critical/high, mostly medium, few low
   - Set dueDates progressively (earlier tasks have sooner dates)
   - Make subtasks specific and actionable

3. **Contacts:**
   - Create 2-6 realistic contacts based on project type
   - Include mix of categories: team members, clients, vendors, stakeholders
   - Set all to 'active' status
   - Use realistic but fictional names and emails (e.g., john.doe@example.com)
   - Add relevant title/company based on their role in the project

4. **Quality Guidelines:**
   - Be specific and detailed in descriptions
   - Use professional language
   - Ensure logical task dependencies (parent tasks before subtasks)
   - Make contacts relevant to the project domain
   - Generate realistic timelines (hours for subtasks, days for tasks, weeks for project)

**IMPORTANT:**
- Output ONLY valid JSON, no additional text or explanation
- All required fields must be present
- Use exact enum values as specified
- Timestamps should be realistic (future dates)
- Email addresses must be valid format`;

/**
 * Generate user prompt with context
 *
 * @param userDescription - The user's project description
 * @param currentDate - Current date for timeline context
 * @returns Formatted user prompt with context
 */
function buildUserPrompt(userDescription: string, currentDate: Date): string {
  const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return `Generate a complete project structure for the following project description:

**Project Description:**
${userDescription}

**Context:**
- Current Date: ${dateStr}
- Timezone: ${timezone}
- Generate realistic future dates for startDate, endDate, and dueDates

Please analyze the description and create a comprehensive project plan with appropriate tasks, subtasks, and contacts.`;
}

/**
 * Azure OpenAI API call helper function
 *
 * Makes HTTP requests to Azure OpenAI endpoint with proper configuration.
 * Handles both o1-series models (o1-mini, o1-preview) and GPT-4 series models.
 *
 * Model-specific behavior:
 * - o1-series: Uses max_completion_tokens, no temperature, no response_format, no system messages
 * - GPT-4 series: Uses max_tokens, supports temperature, response_format, system messages
 *
 * @param messages - Array of chat messages with role and content
 * @param options - Optional configuration
 * @returns Parsed JSON response from Azure OpenAI
 * @throws Error if API call fails or returns non-OK status
 */
async function callAzureOpenAI(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  options: {
    maxTokens?: number;
    temperature?: number;
    responseFormat?: "text" | "json_object";
    useO1Model?: boolean; // Flag to indicate o1-series model
  } = {}
) {
  const {
    maxTokens = 4000,
    temperature = 0.7,
    responseFormat = "json_object",
    useO1Model = true, // Default to o1 model based on deployment name
  } = options;

  // Construct Azure OpenAI endpoint URL with API version
  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2025-01-01-preview`;

  // Build request body based on model type
  const requestBody: Record<string, unknown> = {
    messages,
  };

  if (useO1Model) {
    // o1-series models use max_completion_tokens and don't support temperature or response_format
    requestBody.max_completion_tokens = maxTokens;
  } else {
    // GPT-4 series models use max_tokens and support temperature and response_format
    requestBody.max_tokens = maxTokens;
    requestBody.temperature = temperature;

    if (responseFormat === "json_object") {
      requestBody.response_format = { type: "json_object" };
    }
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_KEY!,
      },
      body: JSON.stringify(requestBody),
    });

    // Check for HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Azure OpenAI API error (${response.status}): ${errorText}`
      );
    }

    // Parse response
    const data = await response.json() as AzureOpenAIResponse;

    // Debug: Log the full response structure
    logger.debug("Azure OpenAI full response:", safeStringify(data));

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      logger.error("Response structure:", safeStringify(data));
      throw new Error(
        "Invalid response structure from Azure OpenAI: missing choices"
      );
    }

    return data;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Failed to call Azure OpenAI: ${error.message}`);
    }
    throw new Error("Failed to call Azure OpenAI: Unknown error");
  }
}

/**
 * Scrape URL response types
 */
type ScrapeUrlSuccessResponse = {
  success: true;
  url: string;
  markdown: string;
  originalLength: number;
  truncated: boolean;
};

type ScrapeUrlErrorResponse = {
  success: false;
  error: string;
};

type ScrapeUrlResponse = ScrapeUrlSuccessResponse | ScrapeUrlErrorResponse;

/**
 * Scrape a URL and return its content as markdown
 *
 * Uses Firecrawl API to extract clean markdown content from web pages.
 * Useful for importing context from GitHub READMEs, documentation sites, or blog posts.
 */
export const scrapeUrl = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args): Promise<ScrapeUrlResponse> => {
    try {
      // 1. Authenticate user (Task #33)
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return {
          success: false,
          error: "Unauthorized: Must be logged in to scrape URLs",
        };
      }

      // 2. Check credits before scraping (Task #33)
      const creditCheck = await ctx.runQuery(api.credits.checkCredits, {
        amount: CREDIT_COSTS.URL_SCRAPE,
      });
      if (!creditCheck.hasEnough) {
        return {
          success: false,
          error: `Insufficient credits. This operation requires ${CREDIT_COSTS.URL_SCRAPE} credits but you only have ${creditCheck.creditsRemaining}. Upgrade to Pro for unlimited credits.`,
        };
      }

      // Validate URL format
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(args.url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Only HTTP and HTTPS URLs are supported');
        }
      } catch (error) {
        throw new Error(`Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Check for FIRECRAWL_API_KEY
      const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
      if (!FIRECRAWL_API_KEY) {
        throw new Error('FIRECRAWL_API_KEY environment variable is not set');
      }

      // Import Firecrawl dynamically
      const { default: FirecrawlApp } = await import('firecrawl');

      // Initialize Firecrawl client
      const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });

      logger.debug('Scraping URL:', args.url);

      // Scrape the URL with markdown format and extended timeout
      const result = await firecrawl.scrape(args.url, {
        formats: ['markdown'],
        timeout: 120000, // 2 minutes timeout
      });

      // Extract markdown content
      const markdown = result.markdown || '';

      // Apply character limit (20,000 chars)
      const truncatedMarkdown = markdown.length > 20000
        ? markdown.substring(0, 20000) + '\n\n[Content truncated to 20,000 characters]'
        : markdown;

      logger.debug('Scrape successful:', {
        url: args.url,
        contentLength: markdown.length,
        truncated: markdown.length > 20000,
      });

      // Deduct credits after successful scrape (Task #33)
      await ctx.runMutation(api.credits.deductCredits, {
        amount: CREDIT_COSTS.URL_SCRAPE,
        reason: `URL scrape: ${args.url}`,
      });

      return {
        success: true,
        url: args.url,
        markdown: truncatedMarkdown,
        originalLength: markdown.length,
        truncated: markdown.length > 20000,
      };
    } catch (error) {
      logger.error('URL scraping failed:', error);

      // Provide helpful error messages based on error type
      let errorMessage = 'Unknown error occurred while scraping URL';

      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'The website took too long to respond. Try a different URL or a simpler page.';
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Could not connect to the website. Please check the URL and try again.';
        } else if (error.message.includes('403') || error.message.includes('401')) {
          errorMessage = 'Access denied by the website. Try a different URL that allows scraping.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Page not found. Please check the URL and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      // Return error response
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Generate a complete project structure from a natural language description
 *
 * This action uses Azure OpenAI GPT-5 to parse user input and create:
 * - A main project with appropriate details
 * - Tasks broken down with subtask hierarchy
 * - Contacts with roles relevant to the project
 * - Proper relationships between all entities
 */
export const generateProject = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args): Promise<GenerateProjectResponse> => {
    // Track created IDs for potential rollback (declare outside try block)
    const createdIds: {
      projectId?: Id<"projects">;
      taskIds: Id<"tasks">[];
      contactIds: Id<"contacts">[];
    } = {
      taskIds: [],
      contactIds: [],
    };

    // Comprehensive error handling (Subtask 1.6 ✓)
    try {
      // 1. Authenticate user
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthorized: Must be logged in to generate projects");
      }

      // 2. Check credits before generating (Task #33)
      const creditCheck = await ctx.runQuery(api.credits.checkCredits, {
        amount: CREDIT_COSTS.AI_GENERATION,
      });
      if (!creditCheck.hasEnough) {
        throw new Error(
          `Insufficient credits. This operation requires ${CREDIT_COSTS.AI_GENERATION} credits but you only have ${creditCheck.creditsRemaining}. Upgrade to Pro for unlimited credits.`
        );
      }

      // 3. Check usage limits before generating
      const usage = await ctx.runQuery(api.usage.getUserUsage);
      if (!usage.hasAccess) {
        throw new Error(
          `Usage limit reached (${usage.count}/${usage.limit}). Please upgrade to Pro for unlimited generations.`
        );
      }

      // Log the prompt for debugging
      logger.debug("Generating project from prompt:", args.prompt.substring(0, 100) + "...");

      // Validate prompt length
      if (args.prompt.length < 20) {
        throw new Error("Project description is too short. Please provide at least 20 characters.");
      }
      if (args.prompt.length > 30000) {
        throw new Error("Project description is too long. Please keep it under 30000 characters.");
      }

      // Build prompts with current context
      const userPrompt = buildUserPrompt(args.prompt, new Date());

      // Determine if using o1-series model (deployment "gpt-5" uses o1-series parameters)
      const useO1Model = true; // Set to false only if using GPT-4/GPT-4o

      // Build messages based on model type
      const messages = useO1Model
        ? [
            // o1-series: combine system and user into single user message
            { role: "user" as const, content: `${SYSTEM_PROMPT}\n\n---\n\n${userPrompt}` },
          ]
        : [
            // GPT-4 series: use separate system and user messages
            { role: "system" as const, content: SYSTEM_PROMPT },
            { role: "user" as const, content: userPrompt },
          ];

      // Call Azure OpenAI API (Subtask 1.2 ✓)
      logger.debug("Calling Azure OpenAI API...");
      let aiResponse: AzureOpenAIResponse;
      try {
        aiResponse = await callAzureOpenAI(messages, {
          maxTokens: 16000,  // O1 models need more tokens for reasoning + output
          temperature: 0.7,
          responseFormat: "json_object",
          useO1Model,
        });
      } catch (error) {
        logger.error("Azure OpenAI API call failed:", error);
        throw new Error(
          `AI service unavailable: ${error instanceof Error ? error.message : "Unknown error"}. Please try again later.`
        );
      }

      // Extract the generated content
      const firstChoice = aiResponse.choices[0];
      if (!firstChoice || !firstChoice.message) {
        logger.error("First choice structure:", safeStringify(firstChoice));
        throw new Error("AI response missing expected content structure");
      }
      const generatedContent = firstChoice.message.content;
      logger.debug("AI Response received, length:", generatedContent?.length ?? 0);
      logger.debug("Content preview:", generatedContent?.substring(0, 200) ?? "null/empty");

      if (!generatedContent) {
        logger.error("AI returned null or empty content");
        throw new Error("AI response missing content");
      }

      // Parse and validate AI response (Subtask 1.4 ✓, Subtask 1.8 ✓)
      logger.debug("Parsing and validating AI response...");
      let validatedData;
      try {
        validatedData = parseAIResponse(generatedContent);
      } catch (error) {
        logger.error("AI response validation failed:", error);
        throw new Error(
          `AI generated invalid response: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`
        );
      }

      logger.debug("Validation successful:", {
        project: validatedData.project.name,
        tasksCount: validatedData.tasks.length,
        contactsCount: validatedData.contacts.length,
      });

      // Batch creation with hierarchy handling (Subtask 1.5 ✓)
      logger.debug("Creating project, tasks, and contacts...");

      // Step 1: Create the main project
      let project;
      try {
        project = await ctx.runMutation(api.projects.create, {
          name: validatedData.project.name,
          description: validatedData.project.description,
          status: validatedData.project.status,
          priority: validatedData.project.priority,
          color: validatedData.project.color,
          startDate: validatedData.project.startDate,
          endDate: validatedData.project.endDate,
          parentProjectId: undefined, // Top-level project
        });

        if (!project || !project._id) {
          throw new Error("Failed to create project");
        }

        createdIds.projectId = project._id;
        logger.debug("Project created:", project._id);
      } catch (error) {
        logger.error("Failed to create project:", error);
        throw new Error(
          `Failed to create project: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

      // Step 2: Create tasks with hierarchy (parent tasks first, then subtasks)
      const taskIdMap = new Map<number, Id<"tasks">>(); // Map from index to created task ID
      let totalTasksCreated = 0;

      try {
        for (let i = 0; i < validatedData.tasks.length; i++) {
          const taskData = validatedData.tasks[i];

          if (!taskData) {
            logger.warn(`Skipping undefined task at index ${i}`);
            continue;
          }

          // Create parent task
          const parentTask = await ctx.runMutation(api.tasks.create, {
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            label: taskData.label,
            priority: taskData.priority,
            dueDate: taskData.dueDate,
            parentTaskId: undefined, // Parent task has no parent
            projectId: project._id,
          });

          if (!parentTask || !parentTask._id) {
            throw new Error(`Failed to create task: ${taskData.title}`);
          }

          taskIdMap.set(i, parentTask._id);
          createdIds.taskIds.push(parentTask._id);
          totalTasksCreated++;

          // Create subtasks for this parent task
          if (taskData.subtasks && taskData.subtasks.length > 0) {
            for (const subtaskData of taskData.subtasks) {
              const subtask = await ctx.runMutation(api.tasks.create, {
                title: subtaskData.title,
                description: subtaskData.description,
                status: subtaskData.status,
                label: subtaskData.label,
                priority: subtaskData.priority,
                dueDate: subtaskData.dueDate,
                parentTaskId: parentTask._id, // Link to parent
                projectId: project._id,
              });

              if (!subtask || !subtask._id) {
                throw new Error(`Failed to create subtask: ${subtaskData.title}`);
              }

              createdIds.taskIds.push(subtask._id);
              totalTasksCreated++;
            }
          }
        }

        logger.debug("Tasks created:", totalTasksCreated);
      } catch (error) {
        logger.error("Failed to create tasks:", error);
        throw new Error(
          `Failed to create tasks (${totalTasksCreated} created): ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

      // Step 3: Create all contacts
      let totalContactsCreated = 0;

      try {
        for (const contactData of validatedData.contacts) {
          const contact = await ctx.runMutation(api.contacts.create, {
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            email: contactData.email,
            phone: contactData.phone,
            company: contactData.company,
            title: contactData.title,
            department: contactData.department,
            website: contactData.website,
            address: contactData.address,
            notes: contactData.notes,
            status: contactData.status,
            category: contactData.category,
          });

          if (!contact || !contact._id) {
            throw new Error(
              `Failed to create contact: ${contactData.firstName} ${contactData.lastName}`
            );
          }

          createdIds.contactIds.push(contact._id);
          totalContactsCreated++;
        }

        logger.debug("Contacts created:", totalContactsCreated);
      } catch (error) {
        logger.error("Failed to create contacts:", error);
        throw new Error(
          `Failed to create contacts (${totalContactsCreated} created): ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

      // Increment usage count after successful generation
      await ctx.runMutation(api.usage.incrementUsageCount);

      // Deduct credits after successful generation (Task #33)
      await ctx.runMutation(api.credits.deductCredits, {
        amount: CREDIT_COSTS.AI_GENERATION,
        reason: `AI project generation: ${project.name}`,
      });

      // Return success summary (Subtask 1.9 ✓)
      return {
        success: true,
        summary: {
          projectId: project._id,
          projectDisplayId: project.displayId,
          projectName: project.name,
          tasksCreated: totalTasksCreated,
          contactsCreated: totalContactsCreated,
        },
      } as SuccessResponse;
    } catch (error) {
      // Top-level error handler with rollback (Subtask 1.7 ✓, Subtask 1.9 ✓)
      logger.error("AI project generation failed:", error);

      // Track partial creation counts for error response
      const partialCounts = {
        tasksCreated: createdIds.taskIds.length,
        contactsCreated: createdIds.contactIds.length,
      };

      // Cleanup partially created items
      logger.debug("Rolling back partially created items...");
      let rollbackSucceeded = true;
      try {
        // Delete contacts first (no dependencies)
        for (const contactId of createdIds.contactIds) {
          await ctx.runMutation(api.contacts.remove, { id: contactId });
        }
        logger.debug(`Rolled back ${createdIds.contactIds.length} contacts`);

        // Delete tasks (may have parent-child relationships)
        for (const taskId of createdIds.taskIds) {
          await ctx.runMutation(api.tasks.remove, { id: taskId });
        }
        logger.debug(`Rolled back ${createdIds.taskIds.length} tasks`);

        // Delete project last (parent of tasks)
        if (createdIds.projectId) {
          await ctx.runMutation(api.projects.remove, { id: createdIds.projectId });
          logger.debug("Rolled back project");
        }
      } catch (rollbackError) {
        logger.error("Rollback failed (manual cleanup may be required):", rollbackError);
        rollbackSucceeded = false;
        // If rollback failed, create specific error response
        return {
          success: false,
          error: {
            code: "ROLLBACK_FAILED",
            message: `${error instanceof Error ? error.message : "Unknown error"}. Additionally, cleanup failed - manual intervention required.`,
            details: {
              originalError: error instanceof Error ? error.name : "Unknown",
              rollbackError: rollbackError instanceof Error ? rollbackError.message : "Unknown",
              itemsNeedingCleanup: {
                projectId: createdIds.projectId,
                taskCount: createdIds.taskIds.length,
                contactCount: createdIds.contactIds.length,
              },
            },
          },
          summary: {
            projectId: undefined,
            projectDisplayId: undefined,
            projectName: undefined,
            tasksCreated: partialCounts.tasksCreated,
            contactsCreated: partialCounts.contactsCreated,
          },
        } as ErrorResponse;
      }

      // Return formatted error response using standardized format
      return formatError(
        error instanceof Error ? error : new Error("Unknown error occurred"),
        rollbackSucceeded ? { tasksCreated: 0, contactsCreated: 0 } : partialCounts
      );
    }
  },
});

/**
 * Crawl a website and return multiple pages
 *
 * Uses Firecrawl's crawlUrl API to fetch multiple pages from a website.
 * Implements intelligent page filtering and rate limiting.
 */
export const crawlWebsite = action({
  args: {
    url: v.string(),
    limit: v.optional(v.number()), // Max pages to crawl (default: 10, max: 20)
  },
  handler: async (ctx, args): Promise<CrawlWebsiteResponse> => {
    const startTime = Date.now();

    try {
      // 1. Authenticate user
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return {
          success: false,
          error: "Unauthorized: Must be logged in to crawl websites",
          code: 'AUTH_REQUIRED',
        };
      }

      // 2. Validate URL format
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(args.url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Only HTTP and HTTPS URLs are supported');
        }
      } catch (error) {
        return {
          success: false,
          error: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: 'INVALID_URL',
        };
      }

      // 3. Check rate limiting (5 crawls per hour)
      const userUsage = await ctx.runQuery(api.credits.getUserUsage);
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      // Filter crawls from last hour
      const crawlsThisHour = (userUsage?.websiteCrawlsThisHour || [])
        .filter(timestamp => timestamp > oneHourAgo);

      if (crawlsThisHour.length >= 5) {
        const oldestCrawl = Math.min(...crawlsThisHour);
        const minutesUntilReset = Math.ceil((oldestCrawl + 60 * 60 * 1000 - now) / 60000);
        return {
          success: false,
          error: `Rate limit exceeded: You can crawl up to 5 websites per hour. Try again in ${minutesUntilReset} minutes.`,
          code: 'RATE_LIMIT_EXCEEDED',
        };
      }

      // 4. Check for FIRECRAWL_API_KEY
      const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
      if (!FIRECRAWL_API_KEY) {
        throw new Error('FIRECRAWL_API_KEY environment variable is not set');
      }

      // 6. Initialize Firecrawl client
      const { default: FirecrawlApp } = await import('firecrawl');
      const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });

      logger.debug('Crawling website:', args.url, 'with limit:', args.limit || 10);

      // 7. Crawl the website
      const limit = Math.min(args.limit || 10, 20); // Cap at 20 pages
      const result = await firecrawl.crawl(args.url, {
        limit,
        scrapeOptions: {
          formats: ['markdown', 'html'],
        },
      });

      // 8. Filter and prioritize pages
      const pages = result.data || [];
      const filteredPages = filterPages(pages, limit);

      logger.debug('Crawl successful:', {
        url: args.url,
        totalPages: pages.length,
        filteredPages: filteredPages.length,
        crawlTime: Date.now() - startTime,
      });

      // Update rate limiting timestamp after successful crawl
      const updatedCrawls = [...crawlsThisHour, now];
      await ctx.runMutation(api.credits.updateUserUsage, {
        websiteCrawlsThisHour: updatedCrawls,
      });

      return {
        success: true,
        url: args.url,
        pages: filteredPages,
        totalPages: pages.length,
        crawlTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Website crawling failed:', error);

      // Provide helpful error messages
      let errorMessage = 'Unknown error occurred while crawling website';
      let errorCode: CrawlWebsiteErrorResponse['code'] = undefined;

      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'The website took too long to respond. Try a simpler website or reduce the page limit.';
          errorCode = 'TIMEOUT';
        } else if (error.message.includes('Invalid URL')) {
          errorMessage = error.message;
          errorCode = 'INVALID_URL';
        } else if (error.message.includes('FIRECRAWL_API_KEY')) {
          errorMessage = 'Website crawling is temporarily unavailable. Please try again later.';
          errorCode = 'FIRECRAWL_ERROR';
        } else {
          errorMessage = `Crawling failed: ${error.message}`;
          errorCode = 'FIRECRAWL_ERROR';
        }
      }

      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  },
});

/**
 * Filter and prioritize crawled pages
 *
 * Priority order:
 * 1. Homepage (/)
 * 2. About, Pricing, Features pages
 * 3. Product, Services pages
 * 4. Other pages
 *
 * Filters out: privacy, terms, cookies, legal, 404, error pages
 */
function filterPages(pages: CrawledPage[], limit: number): ProcessedPage[] {
  // Define priority patterns
  const highPriority = [
    /^\/$/, // Homepage
    /^\/index/i,
  ];

  const mediumPriority = [
    /\/about/i,
    /\/pricing/i,
    /\/features/i,
    /\/product/i,
    /\/services/i,
  ];

  // Define filter-out patterns
  const filterOut = [
    /\/privacy/i,
    /\/terms/i,
    /\/cookies/i,
    /\/legal/i,
    /\/404/i,
    /\/error/i,
    /\/sitemap/i,
    /\/robots\.txt/i,
  ];

  // Process and score pages
  const processedPages: ProcessedPage[] = pages
    .filter(page => {
      // Get URL from page or metadata
      const pageUrl = page.url || page.metadata?.url;
      if (!pageUrl) return false;

      // Filter out unwanted pages
      try {
        const urlPath = new URL(pageUrl).pathname;
        return !filterOut.some(pattern => pattern.test(urlPath));
      } catch {
        return false; // Invalid URL, filter out
      }
    })
    .map(page => {
      // Safe to use non-null assertion because filter already checked for URL existence
      const pageUrl = page.url || page.metadata?.url!;
      const urlPath = new URL(pageUrl).pathname;

      // Calculate priority
      let priority = 0;
      if (highPriority.some(pattern => pattern.test(urlPath))) {
        priority = 3;
      } else if (mediumPriority.some(pattern => pattern.test(urlPath))) {
        priority = 2;
      } else {
        priority = 1;
      }

      return {
        url: pageUrl,
        markdown: page.markdown || '',
        html: page.html || '',
        title: page.metadata?.title || '',
        priority,
      };
    })
    .sort((a, b) => b.priority - a.priority) // Sort by priority (high to low)
    .slice(0, limit); // Limit results

  return processedPages;
}

/**
 * Analysis response types
 */
interface AnalyzeWebsiteSuccessResponse {
  success: true;
  url: string;
  analysis: AnalysisResponse;
  clonePrompts: ClonePrompts;
  pagesAnalyzed: number;
  analysisTime: number; // milliseconds
}

interface AnalyzeWebsiteErrorResponse {
  success: false;
  error: string;
  code?: 'AUTH_REQUIRED' | 'INSUFFICIENT_CREDITS' | 'CRAWL_FAILED' | 'AI_SERVICE_ERROR' | 'INVALID_RESPONSE';
}

type AnalyzeWebsiteResponse = AnalyzeWebsiteSuccessResponse | AnalyzeWebsiteErrorResponse;

/**
 * Analyze a website and extract design information using AI
 *
 * Uses crawlWebsite to fetch pages, then analyzes with Azure OpenAI to extract:
 * - UI/UX patterns
 * - Color palette
 * - Typography
 * - Tech stack
 * - Component inventory
 *
 * Costs 10 credits per analysis.
 */
export const analyzeWebsite = action({
  args: {
    url: v.string(),
    limit: v.optional(v.number()), // Max pages to crawl (default: 10)
  },
  handler: async (ctx, args): Promise<AnalyzeWebsiteResponse> => {
    const startTime = Date.now();

    try {
      // 1. Authenticate user
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return {
          success: false,
          error: "Unauthorized: Must be logged in to analyze websites",
          code: 'AUTH_REQUIRED',
        };
      }

      // 2. Check credits (10 credits required)
      const creditCheck = await ctx.runQuery(api.credits.checkCredits, {
        amount: CREDIT_COSTS.WEBSITE_ANALYSIS,
      });

      if (!creditCheck.hasEnough) {
        return {
          success: false,
          error: `Insufficient credits. This operation requires ${CREDIT_COSTS.WEBSITE_ANALYSIS} credits but you only have ${creditCheck.creditsRemaining}. Upgrade to Pro for unlimited credits.`,
          code: 'INSUFFICIENT_CREDITS',
        };
      }

      logger.debug('Starting website analysis:', args.url);

      // 3. Crawl the website to get pages
      const crawlResult = await ctx.runAction(api.ai.crawlWebsite, {
        url: args.url,
        limit: args.limit || 10,
      });

      if (!crawlResult.success) {
        return {
          success: false,
          error: `Failed to crawl website: ${crawlResult.error}`,
          code: 'CRAWL_FAILED',
        };
      }

      const pages = crawlResult.pages;
      logger.debug(`Crawled ${pages.length} pages, preparing for analysis`);

      // 4. Prepare content for AI analysis
      // Combine markdown from all pages, limit to 15,000 chars total
      let combinedContent = pages
        .map((page, idx) => {
          return `=== Page ${idx + 1}: ${page.title || page.url} ===\n${page.markdown}`;
        })
        .join('\n\n');

      // Truncate if too long
      if (combinedContent.length > 15000) {
        combinedContent = combinedContent.substring(0, 15000) + '\n\n[Content truncated to 15,000 characters]';
      }

      logger.debug('Content prepared, calling Azure OpenAI for analysis');

      // 5. Call Azure OpenAI for analysis
      const analysisResult = await callAzureOpenAIForAnalysis(combinedContent);

      // 6. Validate response with Zod schema
      let analysis: AnalysisResponse;
      try {
        analysis = analysisResponseSchema.parse(analysisResult);
      } catch (error) {
        logger.error('Failed to parse analysis response:', error);
        throw new Error(`AI returned invalid response format: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      logger.debug('Analysis validated, generating clone prompts');

      // 7. Generate clone prompts from analysis
      const clonePrompts = await generateClonePrompts(analysis);

      logger.debug('Clone prompts generated:', {
        fullPageLength: clonePrompts.fullPage.length,
        componentsCount: clonePrompts.components.length,
        designSystemLength: clonePrompts.designSystem.length,
      });

      logger.debug('Analysis complete, deducting credits');

      // 8. Deduct credits after successful analysis
      await ctx.runMutation(api.credits.deductCredits, {
        amount: CREDIT_COSTS.WEBSITE_ANALYSIS,
        reason: `Website analysis: ${args.url}`,
      });

      const analysisTime = Date.now() - startTime;

      logger.debug('Website analysis successful:', {
        url: args.url,
        pagesAnalyzed: pages.length,
        analysisTime,
        uiPatterns: analysis.uiPatterns.length,
        components: analysis.components.length,
        clonePromptsComponents: clonePrompts.components.length,
      });

      return {
        success: true,
        url: args.url,
        analysis,
        clonePrompts,
        pagesAnalyzed: pages.length,
        analysisTime,
      };
    } catch (error) {
      logger.error('Website analysis failed:', error);

      let errorMessage = 'Unknown error occurred while analyzing website';
      let errorCode: AnalyzeWebsiteErrorResponse['code'] = undefined;

      if (error instanceof Error) {
        if (error.message.includes('Azure OpenAI')) {
          errorMessage = 'AI analysis service is temporarily unavailable. Please try again later.';
          errorCode = 'AI_SERVICE_ERROR';
        } else if (error.message.includes('invalid response')) {
          errorMessage = 'AI analysis returned unexpected format. Please try again.';
          errorCode = 'INVALID_RESPONSE';
        } else {
          errorMessage = `Analysis failed: ${error.message}`;
        }
      }

      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  },
});

/**
 * Call Azure OpenAI for website analysis
 */
async function callAzureOpenAIForAnalysis(content: string): Promise<any> {
  const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
  const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
  const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY || !AZURE_OPENAI_DEPLOYMENT) {
    throw new Error('Azure OpenAI environment variables not configured');
  }

  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2025-01-01-preview`;

  logger.debug('Calling Azure OpenAI for website analysis...');
  logger.debug('Request URL:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_KEY,
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: `${WEBSITE_ANALYSIS_SYSTEM_PROMPT}\n\n---\n\nAnalyze the following website content and extract design information:\n\n${content}\n\n**CRITICAL: You MUST respond with ONLY valid JSON. No explanations, no markdown, no code blocks - just raw JSON that can be parsed directly.**`,
        },
      ],
      max_completion_tokens: 8000, // Increased for o1 models (reasoning tokens + output)
    }),
  });

  logger.debug('Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Error response:', errorText);
    throw new Error(`Azure OpenAI API error (${response.status}): ${errorText}`);
  }

  logger.debug('Parsing response JSON...');
  const data = await response.json() as AzureOpenAIResponse;
  logger.debug('Response parsed successfully');

  // Debug: Log the full response structure
  logger.debug('Azure OpenAI analysis response:', safeStringify(data));

  // Validate response structure
  if (!data.choices || data.choices.length === 0) {
    logger.error('No choices in response:', safeStringify(data));
    throw new Error('Invalid response from Azure OpenAI: no choices returned');
  }

  const choice = data.choices[0];
  if (!choice) {
    throw new Error('Invalid response from Azure OpenAI: first choice is undefined');
  }

  logger.debug('Choice finish_reason:', choice.finish_reason);
  logger.debug('Choice message role:', choice.message?.role);

  // Check for refusal
  if (choice.message?.refusal) {
    logger.error('AI refused to respond:', choice.message.refusal);
    throw new Error(`Azure OpenAI refused: ${choice.message.refusal}`);
  }

  // Check for content
  if (!choice.message?.content) {
    logger.error('No content in message. Full choice:', safeStringify(choice));

    // Special handling for length finish_reason (o1 models)
    if (choice.finish_reason === 'length') {
      throw new Error('Azure OpenAI response incomplete: The AI model ran out of tokens during reasoning. Please try again or simplify the website content.');
    }

    throw new Error(`Invalid response from Azure OpenAI: no content (finish_reason: ${choice.finish_reason})`);
  }

  const responseContent = choice.message.content;
  logger.debug('Content length:', responseContent.length);
  logger.debug('Content preview:', responseContent.substring(0, 500));

  try {
    return JSON.parse(responseContent);
  } catch (error) {
    logger.error('Failed to parse content:', responseContent);
    throw new Error(`Failed to parse Azure OpenAI response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate clone prompts from website analysis using Azure OpenAI
 */
async function generateClonePrompts(analysis: AnalysisResponse): Promise<ClonePrompts> {
  const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
  const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
  const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY || !AZURE_OPENAI_DEPLOYMENT) {
    throw new Error('Azure OpenAI environment variables not configured');
  }

  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2025-01-01-preview`;

  // Prepare analysis summary for prompt generation
  const analysisSummary = `
Website Analysis Summary:

UI/UX Patterns:
${analysis.uiPatterns.map(p => `- ${p}`).join('\n')}

Color Palette:
- Primary: ${analysis.colorPalette.primary.join(', ')}
- Secondary: ${analysis.colorPalette.secondary.join(', ')}
- Accent: ${analysis.colorPalette.accent.join(', ')}

Typography:
- Heading Font: ${analysis.typography.headingFont || 'Not specified'}
- Body Font: ${analysis.typography.bodyFont || 'Not specified'}
- Sizes: h1(${analysis.typography.sizes?.h1 || 'N/A'}), h2(${analysis.typography.sizes?.h2 || 'N/A'}), h3(${analysis.typography.sizes?.h3 || 'N/A'}), body(${analysis.typography.sizes?.body || 'N/A'})

Tech Stack:
${analysis.techStack.map(t => `- ${t}`).join('\n')}

Components:
${analysis.components.map(c => `- ${c.name}: ${c.description}`).join('\n')}
`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_KEY,
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: `${CLONE_PROMPT_GENERATION_SYSTEM_PROMPT}\n\n---\n\nBased on the following website analysis, generate comprehensive clone prompts:\n\n${analysisSummary}\n\n**CRITICAL: You MUST respond with ONLY valid JSON. No explanations, no markdown, no code blocks - just raw JSON that can be parsed directly.**`,
        },
      ],
      max_completion_tokens: 12000, // Increased for o1 models (reasoning tokens + output)
    }),
  });

  logger.debug('Clone prompts response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Error response for clone prompts:', errorText);
    throw new Error(`Azure OpenAI API error for clone prompts (${response.status}): ${errorText}`);
  }

  logger.debug('Parsing clone prompts response JSON...');
  const data = await response.json() as AzureOpenAIResponse;
  logger.debug('Clone prompts response parsed successfully');

  // Debug: Log the full response structure
  logger.debug('Azure OpenAI clone prompts response:', safeStringify(data));

  // Validate response structure
  if (!data.choices || data.choices.length === 0) {
    logger.error('No choices in clone prompts response:', safeStringify(data));
    throw new Error('Invalid response from Azure OpenAI: no choices returned for clone prompts');
  }

  const choice = data.choices[0];
  if (!choice) {
    throw new Error('Invalid response from Azure OpenAI: first choice is undefined for clone prompts');
  }

  logger.debug('Clone prompts choice finish_reason:', choice.finish_reason);
  logger.debug('Clone prompts choice message role:', choice.message?.role);

  // Check for refusal
  if (choice.message?.refusal) {
    logger.error('AI refused to generate clone prompts:', choice.message.refusal);
    throw new Error(`Azure OpenAI refused clone prompts: ${choice.message.refusal}`);
  }

  // Check for content
  if (!choice.message?.content) {
    logger.error('No content in clone prompts message. Full choice:', safeStringify(choice));

    // Special handling for length finish_reason (o1 models)
    if (choice.finish_reason === 'length') {
      throw new Error('Azure OpenAI response incomplete: The AI model ran out of tokens during reasoning. This is a temporary issue - please try again.');
    }

    throw new Error(`Invalid response from Azure OpenAI: no content for clone prompts (finish_reason: ${choice.finish_reason})`);
  }

  const responseContent = choice.message.content;
  logger.debug('Clone prompts content length:', responseContent.length);
  logger.debug('Clone prompts content preview:', responseContent.substring(0, 500));

  try {
    const parsedResponse = JSON.parse(responseContent);

    // Validate with Zod schema
    const validatedPrompts = clonePromptsSchema.parse(parsedResponse);

    return validatedPrompts;
  } catch (error) {
    logger.error('Failed to parse clone prompts content:', responseContent);
    throw new Error(`Failed to parse or validate clone prompts response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

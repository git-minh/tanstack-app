import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { parseAIResponse } from "./ai_schema";

/**
 * Azure OpenAI API response type
 */
interface AzureOpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
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
 * Makes HTTP requests to Azure OpenAI GPT-5 endpoint with proper configuration.
 * Handles the specific requirements for GPT-5 API (max_completion_tokens, API version, etc.)
 *
 * @param messages - Array of chat messages with role and content
 * @param options - Optional configuration (temperature, maxTokens, responseFormat)
 * @returns Parsed JSON response from Azure OpenAI
 * @throws Error if API call fails or returns non-OK status
 */
async function callAzureOpenAI(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: "text" | "json_object";
  } = {}
) {
  const {
    temperature = 0.7,
    maxTokens = 4000,
    responseFormat = "json_object",
  } = options;

  // Construct Azure OpenAI endpoint URL with API version
  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2025-01-01-preview`;

  // Build request body - GPT-5 requires max_completion_tokens instead of max_tokens
  const requestBody: Record<string, unknown> = {
    messages,
    temperature,
    max_completion_tokens: maxTokens,
  };

  // Add response_format only if json_object is requested
  if (responseFormat === "json_object") {
    requestBody.response_format = { type: "json_object" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_KEY,
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

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
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
  handler: async (ctx, args) => {
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

      // Log the prompt for debugging
      console.log("Generating project from prompt:", args.prompt.substring(0, 100) + "...");

      // Validate prompt length
      if (args.prompt.length < 20) {
        throw new Error("Project description is too short. Please provide at least 20 characters.");
      }
      if (args.prompt.length > 5000) {
        throw new Error("Project description is too long. Please keep it under 5000 characters.");
      }

      // Build prompts with current context
      const userPrompt = buildUserPrompt(args.prompt, new Date());
      const messages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        { role: "user" as const, content: userPrompt },
      ];

      // Call Azure OpenAI API (Subtask 1.2 ✓)
      console.log("Calling Azure OpenAI API...");
      let aiResponse: AzureOpenAIResponse;
      try {
        aiResponse = await callAzureOpenAI(messages, {
          temperature: 0.7,
          maxTokens: 4000,
          responseFormat: "json_object",
        });
      } catch (error) {
        console.error("Azure OpenAI API call failed:", error);
        throw new Error(
          `AI service unavailable: ${error instanceof Error ? error.message : "Unknown error"}. Please try again later.`
        );
      }

      // Extract the generated content
      const firstChoice = aiResponse.choices[0];
      if (!firstChoice || !firstChoice.message) {
        throw new Error("AI response missing expected content structure");
      }
      const generatedContent = firstChoice.message.content;
      console.log("AI Response received, length:", generatedContent.length);

      // Parse and validate AI response (Subtask 1.4 ✓, Subtask 1.8 ✓)
      console.log("Parsing and validating AI response...");
      let validatedData;
      try {
        validatedData = parseAIResponse(generatedContent);
      } catch (error) {
        console.error("AI response validation failed:", error);
        throw new Error(
          `AI generated invalid response: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`
        );
      }

      console.log("Validation successful:", {
        project: validatedData.project.name,
        tasksCount: validatedData.tasks.length,
        contactsCount: validatedData.contacts.length,
      });

      // Batch creation with hierarchy handling (Subtask 1.5 ✓)
      console.log("Creating project, tasks, and contacts...");

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
        console.log("Project created:", project._id);
      } catch (error) {
        console.error("Failed to create project:", error);
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
            console.warn(`Skipping undefined task at index ${i}`);
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

        console.log("Tasks created:", totalTasksCreated);
      } catch (error) {
        console.error("Failed to create tasks:", error);
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

        console.log("Contacts created:", totalContactsCreated);
      } catch (error) {
        console.error("Failed to create contacts:", error);
        throw new Error(
          `Failed to create contacts (${totalContactsCreated} created): ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

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
      console.error("AI project generation failed:", error);

      // Track partial creation counts for error response
      const partialCounts = {
        tasksCreated: createdIds.taskIds.length,
        contactsCreated: createdIds.contactIds.length,
      };

      // Cleanup partially created items
      console.log("Rolling back partially created items...");
      let rollbackSucceeded = true;
      try {
        // Delete contacts first (no dependencies)
        for (const contactId of createdIds.contactIds) {
          await ctx.runMutation(api.contacts.remove, { id: contactId });
        }
        console.log(`Rolled back ${createdIds.contactIds.length} contacts`);

        // Delete tasks (may have parent-child relationships)
        for (const taskId of createdIds.taskIds) {
          await ctx.runMutation(api.tasks.remove, { id: taskId });
        }
        console.log(`Rolled back ${createdIds.taskIds.length} tasks`);

        // Delete project last (parent of tasks)
        if (createdIds.projectId) {
          await ctx.runMutation(api.projects.remove, { id: createdIds.projectId });
          console.log("Rolled back project");
        }
      } catch (rollbackError) {
        console.error("Rollback failed (manual cleanup may be required):", rollbackError);
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

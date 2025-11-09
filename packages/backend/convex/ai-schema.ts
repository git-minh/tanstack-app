/**
 * AI Response Validation Schemas
 *
 * Zod schemas for validating Azure OpenAI responses for project generation.
 * Separated from ai.ts for better maintainability and reusability.
 */

import { z } from "zod";

/**
 * Subtask schema for hierarchical task breakdown
 */
export const aiSubtaskSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "review", "done", "cancelled"]),
  label: z.enum(["bug", "feature", "documentation", "enhancement", "task"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  dueDate: z.number().optional(),
});

/**
 * Task schema with optional nested subtasks
 */
export const aiTaskSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "review", "done", "cancelled"]),
  label: z.enum(["bug", "feature", "documentation", "enhancement", "task"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  dueDate: z.number().optional(),
  subtasks: z.array(aiSubtaskSchema).optional().default([]),
});

/**
 * Project schema
 */
export const aiProjectSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  status: z.enum(["active", "on-hold", "completed", "archived"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  startDate: z.number().optional(),
  endDate: z.number().optional(),
});

/**
 * Contact schema
 */
export const aiContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "archived"]),
  category: z.enum(["client", "vendor", "partner", "team", "stakeholder", "other"]),
});

/**
 * Complete AI response schema for project generation
 */
export const aiProjectResponseSchema = z.object({
  project: aiProjectSchema,
  tasks: z.array(aiTaskSchema).min(1, "At least one task is required"),
  contacts: z.array(aiContactSchema).min(1, "At least one contact is required"),
});

/**
 * TypeScript types inferred from schemas
 */
export type AISubtask = z.infer<typeof aiSubtaskSchema>;
export type AITask = z.infer<typeof aiTaskSchema>;
export type AIProject = z.infer<typeof aiProjectSchema>;
export type AIContact = z.infer<typeof aiContactSchema>;
export type AIProjectResponse = z.infer<typeof aiProjectResponseSchema>;

/**
 * Parse and validate AI response
 *
 * @param jsonString - Raw JSON string from AI response
 * @returns Validated and typed project structure
 * @throws Error if parsing fails or validation fails
 */
export function parseAIResponse(jsonString: string): AIProjectResponse {
  let parsedData: unknown;

  // Step 1: Parse JSON
  try {
    parsedData = JSON.parse(jsonString);
  } catch (error) {
    throw new Error(
      `Failed to parse AI response as JSON: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  // Step 2: Validate against schema
  try {
    const validated = aiProjectResponseSchema.parse(parsedData);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Use structured error representation for better debugging
      const errorDetails = JSON.stringify(error.issues, null, 2);
      throw new Error(
        `AI response validation failed:\n${errorDetails}`
      );
    }
    throw new Error(
      `Unexpected validation error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

import { z } from "zod";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";

// Task schema for Convex integration
export const taskSchema = z.object({
	_id: z.string() as z.ZodType<Id<"tasks">>,
	_creationTime: z.number(),
	title: z.string(),
	status: z.string(),
	label: z.string(),
	priority: z.string(),
	userId: z.string(),
	description: z.string().optional(),
	dueDate: z.number().optional(),
});

export type Task = z.infer<typeof taskSchema>;

// Form schema for create/update operations
export const taskFormSchema = z.object({
	title: z.string().min(1, "Title is required"),
	status: z.string(),
	label: z.string(),
	priority: z.string(),
	description: z.string().optional(),
	dueDate: z.number().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

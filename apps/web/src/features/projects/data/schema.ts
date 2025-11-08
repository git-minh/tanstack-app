import { z } from "zod";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";

// Project schema for form validation
export const projectFormSchema = z.object({
	name: z.string().min(1, "Project name is required"),
	description: z.string().optional(),
	status: z.string(),
	priority: z.string(),
	color: z.string().optional(),
	startDate: z.number().optional(),
	endDate: z.number().optional(),
	parentProjectId: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

// Project type matching backend
export interface Project {
	_id: Id<"projects">;
	_creationTime: number;
	name: string;
	description?: string;
	status: string;
	priority: string;
	color?: string;
	startDate?: number;
	endDate?: number;
	userId: string;
	displayId: string;
	parentProjectId?: Id<"projects">;
	level: number;
	sortPath: string;
	subRows?: Project[];
}

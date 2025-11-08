import { z } from "zod";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";

// Contact schema for Convex integration
export const contactSchema = z.object({
	_id: z.string() as z.ZodType<Id<"contacts">>,
	_creationTime: z.number(),
	firstName: z.string(),
	lastName: z.string(),
	email: z.string(),
	phone: z.string().optional(),
	company: z.string().optional(),
	title: z.string().optional(),
	department: z.string().optional(),
	website: z.string().optional(),
	address: z.string().optional(),
	notes: z.string().optional(),
	status: z.string(),
	category: z.string(),
	userId: z.string(),
	displayId: z.string(),
});

export type Contact = z.infer<typeof contactSchema>;

// Form schema for create/update operations
export const contactFormSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email("Valid email is required"),
	phone: z.string().optional(),
	company: z.string().optional(),
	title: z.string().optional(),
	department: z.string().optional(),
	website: z
		.string()
		.optional()
		.refine(
			(val) => {
				if (!val || val === "") return true;
				try {
					new URL(val.startsWith("http") ? val : `https://${val}`);
					return true;
				} catch {
					return false;
				}
			},
			{ message: "Please enter a valid URL" }
		),
	address: z.string().optional(),
	notes: z.string().optional(),
	status: z.string(),
	category: z.string(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

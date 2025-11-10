import { z } from "zod";

export const generateProjectFormSchema = z.object({
  prompt: z
    .string()
    .max(30000, {
      message: "Project description must not exceed 30000 characters",
    })
    .optional()
    .default(""),
});

export type GenerateProjectFormValues = z.infer<
  typeof generateProjectFormSchema
>;

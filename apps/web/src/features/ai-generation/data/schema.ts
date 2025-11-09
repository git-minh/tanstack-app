import { z } from "zod";

export const generateProjectFormSchema = z.object({
  prompt: z
    .string()
    .min(20, {
      message: "Project description must be at least 20 characters long",
    })
    .max(2000, {
      message: "Project description must not exceed 2000 characters",
    }),
});

export type GenerateProjectFormValues = z.infer<
  typeof generateProjectFormSchema
>;

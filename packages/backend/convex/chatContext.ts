import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get user context for AI chat
 *
 * Fetches user's recent projects and tasks to provide context to the AI assistant.
 * Keeps context concise to stay within token limits.
 */
export const getUserContext = internalQuery({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		// Fetch user's recent active projects (limit to 5)
		const projects = await ctx.db
			.query("projects")
			.withIndex("by_userId_and_status", (q) =>
				q.eq("userId", args.userId).eq("status", "active")
			)
			.order("desc")
			.take(5);

		// Fetch user's pending and in-progress tasks (limit to 10)
		const tasks = await ctx.db
			.query("tasks")
			.withIndex("by_userId", (q) => q.eq("userId", args.userId))
			.filter((q) =>
				q.or(
					q.eq(q.field("status"), "todo"),
					q.eq(q.field("status"), "in-progress")
				)
			)
			.take(10);

		// Format context as structured text
		let context = "# User Context\n\n";

		// Add projects section
		if (projects.length > 0) {
			context += "## Active Projects\n";
			for (const project of projects) {
				context += `- **${project.displayId}**: ${project.name}`;
				if (project.description) {
					context += ` - ${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}`;
				}
				context += `\n  - Priority: ${project.priority}, Status: ${project.status}\n`;
			}
			context += "\n";
		}

		// Add tasks section
		if (tasks.length > 0) {
			context += "## Pending & In-Progress Tasks\n";
			for (const task of tasks) {
				context += `- **${task.displayId}**: ${task.title}`;
				if (task.description) {
					context += ` - ${task.description.substring(0, 80)}${task.description.length > 80 ? '...' : ''}`;
				}
				context += `\n  - Status: ${task.status}, Priority: ${task.priority}, Label: ${task.label}\n`;
			}
			context += "\n";
		}

		// Add summary
		context += `\n**Summary**: ${projects.length} active projects, ${tasks.length} pending/in-progress tasks\n`;

		// Limit total context length to ~2000 chars
		if (context.length > 2000) {
			context = context.substring(0, 2000) + "\n\n[Context truncated to 2000 characters]";
		}

		return {
			context,
			projectCount: projects.length,
			taskCount: tasks.length,
		};
	},
});

import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Get the next sequence number for a counter
 * This is an internal mutation to ensure atomic increments
 */
export const getNextSequence = internalMutation({
	args: { name: v.string() },
	handler: async (ctx, args) => {
		// Try to find existing counter
		const existingCounter = await ctx.db
			.query("counters")
			.withIndex("by_name", (q) => q.eq("name", args.name))
			.first();

		if (existingCounter) {
			// Increment existing counter
			const nextValue = existingCounter.value + 1;
			await ctx.db.patch(existingCounter._id, { value: nextValue });
			return nextValue;
		}

		// Create new counter starting at 1
		await ctx.db.insert("counters", {
			name: args.name,
			value: 1,
		});
		return 1;
	},
});

/**
 * Initialize a counter if it doesn't exist
 * Useful for migration or setup
 */
export const initializeCounter = internalMutation({
	args: {
		name: v.string(),
		startValue: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const existingCounter = await ctx.db
			.query("counters")
			.withIndex("by_name", (q) => q.eq("name", args.name))
			.first();

		if (!existingCounter) {
			await ctx.db.insert("counters", {
				name: args.name,
				value: args.startValue ?? 0,
			});
		}
	},
});

/**
 * Get current counter value without incrementing
 */
export const getCurrentValue = internalQuery({
	args: { name: v.string() },
	handler: async (ctx, args) => {
		const counter = await ctx.db
			.query("counters")
			.withIndex("by_name", (q) => q.eq("name", args.name))
			.first();

		return counter?.value ?? 0;
	},
});

/**
 * Generate a display ID with prefix
 * @param prefix - The prefix for the ID (e.g., "TD", "CT")
 * @param sequence - The sequence number
 * @returns Formatted display ID (e.g., "TD-000001")
 */
export function formatDisplayId(prefix: string, sequence: number): string {
	const paddedSequence = sequence.toString().padStart(6, "0");
	return `${prefix}-${paddedSequence}`;
}

/**
 * Helper to generate next display ID for a given entity type
 * This should be called within a mutation context
 */
export async function generateDisplayId(
	ctx: MutationCtx,
	entityType: "tasks" | "contacts" | "projects"
): Promise<string> {
	const prefixes = {
		tasks: "TD",
		contacts: "CT",
		projects: "PR",
	};

	const prefix = prefixes[entityType];
	const counterName = `${entityType}_counter`;

	// Get next sequence number atomically
	const sequence = await ctx.runMutation(
		internal.counters.getNextSequence,
		{
			name: counterName,
		}
	);

	return formatDisplayId(prefix, sequence);
}

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { generateDisplayId } from "./counters";

/**
 * Helper function to require authentication
 *
 * @throws Error if user is not authenticated
 * @returns User identity with subject (userId)
 */
async function requireAuth(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Unauthorized: Must be logged in");
	}
	return identity;
}

/**
 * Get all design references for the current user
 *
 * Supports:
 * - Pagination with limit parameter
 * - Filtering by style
 * - Filtering by tags
 * - Sorting by updatedAt (newest first)
 */
export const getDesignReferences = query({
	args: {
		limit: v.optional(v.number()),
		style: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		// If style filter is provided, use the by_userId_and_style index for efficient filtering
		if (args.style) {
			const style = args.style; // Assign to const for type narrowing
			let query = ctx.db
				.query("designReferences")
				.withIndex("by_userId_and_style", (q) =>
					q.eq("userId", identity.subject).eq("style", style)
				)
				.order("desc");

			// Collect results
			let references = await query.collect();

			// Apply tags filter if specified (in-memory filter for tag matching)
			// Note: Tags are filtered in-memory because array-contains queries are not directly
			// supported via indexes. For better performance with frequent tag filtering,
			// consider denormalizing tags into separate rows or using a search index.
			if (args.tags && args.tags.length > 0) {
				references = references.filter((ref) =>
					args.tags!.some((tag) => ref.tags.includes(tag))
				);
			}

			// Apply limit after filtering
			if (args.limit) {
				references = references.slice(0, args.limit);
			}

			return references;
		}

		// Standard query without style filter
		let query = ctx.db
			.query("designReferences")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.order("desc");

		// Collect all results (or limit for performance if no tags filter)
		let references = await query.collect();

		// Apply tags filter if specified (in-memory filter)
		if (args.tags && args.tags.length > 0) {
			references = references.filter((ref) =>
				args.tags!.some((tag) => ref.tags.includes(tag))
			);
		}

		// Apply limit after filtering
		if (args.limit) {
			references = references.slice(0, args.limit);
		}

		return references;
	},
});

/**
 * Get a single design reference by ID or displayId
 *
 * @param id - Internal Convex ID
 * @param displayId - Human-readable ID (e.g., DR-000001)
 */
export const getDesignReference = query({
	args: {
		id: v.optional(v.id("designReferences")),
		displayId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		// Must provide either id or displayId
		if (!args.id && !args.displayId) {
			throw new Error("Must provide either id or displayId");
		}

		let reference;

		if (args.id) {
			// Fetch by internal ID
			reference = await ctx.db.get(args.id);
		} else if (args.displayId) {
			// Fetch by displayId
			reference = await ctx.db
				.query("designReferences")
				.withIndex("by_displayId", (q) => q.eq("displayId", args.displayId!))
				.first();
		}

		if (!reference) {
			throw new Error("Design reference not found");
		}

		// Verify ownership
		if (reference.userId !== identity.subject) {
			throw new Error("Unauthorized: Cannot access another user's design reference");
		}

		return reference;
	},
});

/**
 * Create a new design reference after website analysis
 *
 * This is typically called after analyzeWebsite action completes.
 */
export const createDesignReference = mutation({
	args: {
		url: v.string(),
		siteName: v.string(),
		description: v.optional(v.string()),
		analysis: v.object({
			uiPatterns: v.array(v.string()),
			colorPalette: v.object({
				primary: v.array(v.string()),
				secondary: v.array(v.string()),
				accent: v.array(v.string()),
			}),
			typography: v.object({
				headingFont: v.optional(v.string()),
				bodyFont: v.optional(v.string()),
				sizes: v.optional(
					v.object({
						h1: v.optional(v.string()),
						h2: v.optional(v.string()),
						h3: v.optional(v.string()),
						body: v.optional(v.string()),
					})
				),
			}),
			techStack: v.array(v.string()),
			components: v.array(
				v.object({
					name: v.string(),
					description: v.string(),
				})
			),
		}),
		clonePrompts: v.object({
			fullPage: v.string(),
			components: v.array(
				v.object({
					name: v.string(),
					prompt: v.string(),
				})
			),
			designSystem: v.string(),
		}),
		tags: v.optional(v.array(v.string())),
		style: v.string(),
		industry: v.optional(v.string()),
		thumbnail: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		// Generate display ID (e.g., DR-000001)
		const displayId = await generateDisplayId(ctx, "designReferences");

		const now = Date.now();

		// Insert design reference
		const referenceId = await ctx.db.insert("designReferences", {
			userId: identity.subject,
			displayId,
			url: args.url,
			siteName: args.siteName,
			description: args.description,
			analysis: args.analysis,
			clonePrompts: args.clonePrompts,
			tags: args.tags || [],
			style: args.style,
			industry: args.industry,
			thumbnail: args.thumbnail,
			createdAt: now,
			updatedAt: now,
		});

		// Return the created reference
		const reference = await ctx.db.get(referenceId);
		return reference;
	},
});

/**
 * Update a design reference
 *
 * Allows editing tags, description, and style.
 * Analysis and clone prompts are immutable (re-analyze to update).
 */
export const updateDesignReference = mutation({
	args: {
		id: v.id("designReferences"),
		tags: v.optional(v.array(v.string())),
		description: v.optional(v.string()),
		style: v.optional(v.string()),
		industry: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		// Verify the reference exists and belongs to current user
		const reference = await ctx.db.get(args.id);
		if (!reference) {
			throw new Error("Design reference not found");
		}
		if (reference.userId !== identity.subject) {
			throw new Error("Unauthorized: Cannot update another user's design reference");
		}

		// Build update object with only provided fields
		const updates: {
			tags?: string[];
			description?: string;
			style?: string;
			industry?: string;
			updatedAt: number;
		} = {
			updatedAt: Date.now(),
		};

		if (args.tags !== undefined) updates.tags = args.tags;
		if (args.description !== undefined) updates.description = args.description;
		if (args.style !== undefined) updates.style = args.style;
		if (args.industry !== undefined) updates.industry = args.industry;

		// Update the reference
		await ctx.db.patch(args.id, updates);

		// Return updated reference
		return await ctx.db.get(args.id);
	},
});

/**
 * Delete a design reference
 */
export const deleteDesignReference = mutation({
	args: {
		id: v.id("designReferences"),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		// Verify the reference exists and belongs to current user
		const reference = await ctx.db.get(args.id);
		if (!reference) {
			throw new Error("Design reference not found");
		}
		if (reference.userId !== identity.subject) {
			throw new Error("Unauthorized: Cannot delete another user's design reference");
		}

		// Delete the reference
		await ctx.db.delete(args.id);

		return { success: true };
	},
});

/**
 * Search design references by URL, site name, or tags
 *
 * Case-insensitive search across multiple fields.
 */
export const searchDesignReferences = query({
	args: {
		query: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		// Get all user's references
		const allReferences = await ctx.db
			.query("designReferences")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.order("desc")
			.collect();

		// Normalize search query
		const searchQuery = args.query.toLowerCase().trim();

		if (!searchQuery) {
			// If empty query, return recent references
			return args.limit ? allReferences.slice(0, args.limit) : allReferences;
		}

		// Filter by search query (case-insensitive)
		const results = allReferences.filter((ref) => {
			const matchesUrl = ref.url.toLowerCase().includes(searchQuery);
			const matchesSiteName = ref.siteName.toLowerCase().includes(searchQuery);
			const matchesTags = ref.tags.some((tag) =>
				tag.toLowerCase().includes(searchQuery)
			);
			const matchesDescription = ref.description
				? ref.description.toLowerCase().includes(searchQuery)
				: false;

			return matchesUrl || matchesSiteName || matchesTags || matchesDescription;
		});

		// Apply limit if specified
		if (args.limit) {
			return results.slice(0, args.limit);
		}

		return results;
	},
});

/**
 * Delete multiple design references
 *
 * Useful for bulk operations.
 * Validates all IDs first before deleting to avoid partial deletions.
 */
export const deleteMany = mutation({
	args: {
		ids: v.array(v.id("designReferences")),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		// Step 1: Validate all references exist and belong to current user
		// This prevents partial deletions if validation fails mid-operation
		const referencesToDelete = [];
		for (const id of args.ids) {
			const reference = await ctx.db.get(id);
			if (!reference) {
				throw new Error(`Design reference ${id} not found`);
			}
			if (reference.userId !== identity.subject) {
				throw new Error(`Unauthorized: Cannot delete another user's design reference ${id}`);
			}
			referencesToDelete.push(id);
		}

		// Step 2: All validations passed, now delete all references atomically
		for (const id of referencesToDelete) {
			await ctx.db.delete(id);
		}

		return { success: true, deleted: referencesToDelete.length };
	},
});

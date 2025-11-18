import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery, internalAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Job input type definitions matching schema discriminated unions
 *
 * NOTE: This duplicates the union from schema.ts by design:
 * - schema.ts defines the database table structure
 * - This defines the mutation argument validation
 * - They must match exactly to ensure type safety
 * - Any mismatch will cause runtime errors, alerting us to divergence
 * - When adding new job types, update both locations
 */
const jobInputSchema = v.union(
	v.object({
		type: v.literal("scrape_design_reference"),
		url: v.string(),
		limit: v.optional(v.number()),
	}),
	v.object({
		type: v.literal("generate_ai_content"),
		prompt: v.string(),
		context: v.optional(v.string()),
	}),
	v.object({
		type: v.literal("process_bulk_import"),
		// Structured import data - specific record shapes
		data: v.array(
			v.object({
				// Generic record structure for bulk import
				// Can be extended with discriminated unions for specific import types
				id: v.optional(v.string()),
				data: v.any(), // Actual record data
			})
		),
		importType: v.string(),
	})
);

/**
 * TypeScript types for job inputs (inferred from schema)
 */
type ScrapeDesignReferenceInput = {
	type: "scrape_design_reference";
	url: string;
	limit?: number;
};

type GenerateAIContentInput = {
	type: "generate_ai_content";
	prompt: string;
	context?: string;
};

type ProcessBulkImportInput = {
	type: "process_bulk_import";
	data: Array<{
		id?: string;
		data: any;
	}>;
	importType: string;
};

/**
 * Create a new background job and schedule it for processing.
 * Returns immediately with jobId - job runs asynchronously.
 */
export const createJob = mutation({
	args: {
		input: jobInputSchema,
	},
	handler: async (ctx, args) => {
		// Validate authentication
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: You must be logged in to create jobs");
		}

		const userId = identity.subject;

		// Extract job type from input
		const jobType = args.input.type;

		// Create job record with 'pending' status
		const jobId = await ctx.db.insert("backgroundJobs", {
			userId,
			type: jobType,
			status: "pending",
			input: args.input,
			createdAt: Date.now(),
		});

		// Schedule background processing immediately (runs in separate context)
		await ctx.scheduler.runAfter(0, internal.backgroundJobs.processJob, {
			jobId,
		});

		// Return jobId immediately - UI can subscribe to updates
		return jobId;
	},
});

/**
 * Get a specific job by ID (for real-time subscriptions)
 */
export const getJob = query({
	args: { jobId: v.id("backgroundJobs") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const job = await ctx.db.get(args.jobId);
		if (!job) {
			throw new Error("Job not found");
		}

		// Verify user owns this job
		if (job.userId !== identity.subject) {
			throw new Error("Unauthorized: You don't have access to this job");
		}

		return job;
	},
});

/**
 * Internal mutation to update job status to 'processing'
 */
export const processJob = internalMutation({
	args: { jobId: v.id("backgroundJobs") },
	handler: async (ctx, args) => {
		const job = await ctx.db.get(args.jobId);
		if (!job) {
			return;
		}

		// Race condition check: only process if job is pending
		if (job.status !== "pending") {
			console.log(
				`Job ${args.jobId} is already in status ${job.status}, skipping processing`
			);
			return;
		}

		// Update status to processing
		await ctx.db.patch(args.jobId, {
			status: "processing",
		});

		// Schedule the actual execution only after successful status transition
		await ctx.scheduler.runAfter(0, internal.backgroundJobs.executeJob, {
			jobId: args.jobId,
		});
	},
});

/**
 * Internal action to execute the actual job work
 * This is where we'll dispatch to specific handlers based on job type
 */
export const executeJob = internalAction({
	args: { jobId: v.id("backgroundJobs") },
	handler: async (ctx, args) => {
		// Get job details
		const job = await ctx.runQuery(internal.backgroundJobs.getJobInternal, {
			jobId: args.jobId,
		});

		if (!job) {
			return;
		}

		try {
			let result;

			// Route to appropriate handler based on job type
			switch (job.type) {
				case "scrape_design_reference":
					result = await handleScrapeDesignReference(
						ctx,
						job.input as ScrapeDesignReferenceInput
					);
					break;
				case "generate_ai_content":
					result = await handleGenerateAIContent(
						ctx,
						job.input as GenerateAIContentInput
					);
					break;
				case "process_bulk_import":
					result = await handleProcessBulkImport(
						ctx,
						job.input as ProcessBulkImportInput
					);
					break;
				default:
					throw new Error(`Unknown job type: ${job.type}`);
			}

			// Mark job as complete
			await ctx.runMutation(internal.backgroundJobs.completeJob, {
				jobId: args.jobId,
				result,
			});
		} catch (error: any) {
			// Mark job as failed
			await ctx.runMutation(internal.backgroundJobs.failJob, {
				jobId: args.jobId,
				error: error.message || "Unknown error occurred",
			});
		}
	},
});

/**
 * Helper: Get job (internal use only)
 */
export const getJobInternal = internalQuery({
	args: { jobId: v.id("backgroundJobs") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.jobId);
	},
});

/**
 * Helper: Mark job as complete with result
 */
export const completeJob = internalMutation({
	args: {
		jobId: v.id("backgroundJobs"),
		result: v.any(), // Will be type-safe at runtime due to schema
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.jobId, {
			status: "completed",
			result: args.result,
			completedAt: Date.now(),
			progress: 100,
		});
	},
});

/**
 * Helper: Mark job as failed with error message
 */
export const failJob = internalMutation({
	args: {
		jobId: v.id("backgroundJobs"),
		error: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.jobId, {
			status: "failed",
			error: args.error,
			completedAt: Date.now(),
		});
	},
});

/**
 * Helper: Update job progress (0-100)
 */
export const updateProgress = internalMutation({
	args: {
		jobId: v.id("backgroundJobs"),
		progress: v.number(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.jobId, {
			progress: args.progress,
		});
	},
});

/**
 * Job handler: Scrape design reference
 * Calls the existing crawlWebsite action to fetch pages
 */
async function handleScrapeDesignReference(
	ctx: ActionCtx,
	input: ScrapeDesignReferenceInput
) {
	const { url, limit = 10 } = input;

	// Import the api dynamically to avoid circular dependencies
	const { api } = await import("./_generated/api");

	// Call the existing crawlWebsite action
	const result = await ctx.runAction(api.ai.crawlWebsite, {
		url,
		limit,
	});

	// Handle error responses
	if (!result.success) {
		throw new Error(result.error || "Failed to crawl website");
	}

	// Transform the success result to match our expected schema
	return {
		type: "scrape_design_reference" as const,
		pages: result.pages || [],
		pagesScraped: result.totalPages || 0,
	};
}

/**
 * Job handler: Generate AI content
 * Supports chat message generation and other AI generation tasks
 */
async function handleGenerateAIContent(
	_ctx: ActionCtx,
	input: GenerateAIContentInput
) {
	const { prompt, context } = input;

	// For now, use a simple text generation approach
	// In production, this would call Azure OpenAI or similar
	// You can integrate with existing chat.ts logic here

	try {
		// Example: Generate simple response
		// In production, integrate with api.ai functions or chat.sendChatMessage
		const generated = `AI Response to: ${prompt}\n\n${context ? `Context: ${context}\n\n` : ""}This is a placeholder response. Integrate with Azure OpenAI for actual generation.`;

		return {
			type: "generate_ai_content" as const,
			generated,
			tokensUsed: Math.floor(generated.length / 4), // Rough token estimate
		};
	} catch (error: any) {
		throw new Error(`Failed to generate AI content: ${error.message}`);
	}
}

/**
 * Job handler: Process bulk import
 *
 * FUTURE IMPLEMENTATION:
 * This is a placeholder for bulk data import functionality.
 * To implement:
 * - Accept and validate job input shape
 * - Fetch/stream source data
 * - Batch-insert or upsert records using DB helpers
 * - Track created/failed counters per item
 * - Collect per-item errors
 * - Handle transactions and rollbacks
 * - Add comprehensive unit tests
 *
 * Currently returns zero processed records as expected for stub.
 */
async function handleProcessBulkImport(
	_ctx: ActionCtx,
	_input: ProcessBulkImportInput
) {
	// Placeholder implementation - returns zero processed records
	// Job type remains in schema for future implementation
	return {
		type: "process_bulk_import" as const,
		created: 0,
		failed: 0,
		errors: [],
	};
}

/**
 * Hierarchy utility functions for task subtasks
 * Provides helpers for managing parent-child relationships
 */

import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Calculate the next sort path for a task
 * @param ctx - Mutation context
 * @param userId - User ID
 * @param parentTaskId - Optional parent task ID
 * @returns Object with level and sortPath
 */
export async function calculateSortPath(
	ctx: MutationCtx | QueryCtx,
	userId: string,
	parentTaskId?: Id<"tasks">
): Promise<{ level: number; sortPath: string }> {
	let level = 0;
	let sortPath = "";

	if (parentTaskId) {
		// Get parent task
		const parentTask = await ctx.db.get(parentTaskId);
		if (!parentTask) {
			throw new Error("Parent task not found");
		}
		if (parentTask.userId !== userId) {
			throw new Error("Cannot add subtask to another user's task");
		}

		// Calculate level and sortPath
		level = parentTask.level + 1;

		// Get siblings to calculate next sequential number
		const siblings = await ctx.db
			.query("tasks")
			.withIndex("by_parentTaskId", (q) => q.eq("parentTaskId", parentTaskId))
			.collect();

		const nextNumber = String(siblings.length + 1).padStart(3, "0");
		sortPath = parentTask.sortPath
			? `${parentTask.sortPath}.${nextNumber}`
			: nextNumber;
	} else {
		// Root task - get next sequential number among root tasks
		const rootTasks = await ctx.db
			.query("tasks")
			.withIndex("by_userId_and_level", (q) =>
				q.eq("userId", userId).eq("level", 0)
			)
			.collect();

		sortPath = String(rootTasks.length + 1).padStart(3, "0");
	}

	return { level, sortPath };
}

/**
 * Recursively update status of all descendant tasks
 * @param ctx - Mutation context
 * @param taskId - Parent task ID
 * @param status - New status to apply
 */
export async function updateDescendantsStatus(
	ctx: MutationCtx,
	taskId: Id<"tasks">,
	status: string
): Promise<void> {
	const children = await ctx.db
		.query("tasks")
		.withIndex("by_parentTaskId", (q) => q.eq("parentTaskId", taskId))
		.collect();

	for (const child of children) {
		await ctx.db.patch(child._id, { status });
		// Recursively update grandchildren
		await updateDescendantsStatus(ctx, child._id, status);
	}
}

/**
 * Recursively delete all descendant tasks
 * @param ctx - Mutation context
 * @param taskId - Parent task ID
 */
export async function deleteTaskAndDescendants(
	ctx: MutationCtx,
	taskId: Id<"tasks">
): Promise<void> {
	// Get all children
	const children = await ctx.db
		.query("tasks")
		.withIndex("by_parentTaskId", (q) => q.eq("parentTaskId", taskId))
		.collect();

	// Delete children first (depth-first deletion)
	for (const child of children) {
		await deleteTaskAndDescendants(ctx, child._id);
	}

	// Delete the task itself
	await ctx.db.delete(taskId);
}

/**
 * Build hierarchical task tree from flat list
 * @param tasks - Flat array of tasks
 * @returns Hierarchical array with nested subRows
 */
export function buildTaskHierarchy<T extends { _id: string; parentTaskId?: string | null }>(
	tasks: T[]
): (T & { subRows?: T[] })[] {
	const taskMap = new Map<string, T & { subRows?: T[] }>();
	const rootTasks: (T & { subRows?: T[] })[] = [];

	// First pass: create task map
	tasks.forEach((task) => {
		taskMap.set(task._id, { ...task, subRows: [] });
	});

	// Second pass: build hierarchy
	tasks.forEach((task) => {
		const taskWithChildren = taskMap.get(task._id)!;

		if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
			const parent = taskMap.get(task.parentTaskId)!;
			parent.subRows = parent.subRows || [];
			parent.subRows.push(taskWithChildren);
		} else {
			// Root task or orphaned task
			rootTasks.push(taskWithChildren);
		}
	});

	return rootTasks;
}

/**
 * Get all descendant IDs of a task recursively
 * @param ctx - Query context
 * @param taskId - Parent task ID
 * @returns Array of descendant task IDs
 */
export async function getDescendantIds(
	ctx: QueryCtx | MutationCtx,
	taskId: Id<"tasks">
): Promise<Id<"tasks">[]> {
	const descendants: Id<"tasks">[] = [];

	async function traverse(currentId: Id<"tasks">) {
		const children = await ctx.db
			.query("tasks")
			.withIndex("by_parentTaskId", (q) => q.eq("parentTaskId", currentId))
			.collect();

		for (const child of children) {
			descendants.push(child._id);
			await traverse(child._id);
		}
	}

	await traverse(taskId);
	return descendants;
}

/**
 * Check if a task would create a circular reference
 * @param ctx - Query context
 * @param taskId - Task to check
 * @param potentialParentId - Potential parent task ID
 * @returns True if circular reference would be created
 */
export async function wouldCreateCircularReference(
	ctx: QueryCtx | MutationCtx,
	taskId: Id<"tasks">,
	potentialParentId: Id<"tasks">
): Promise<boolean> {
	// A task cannot be its own parent
	if (taskId === potentialParentId) {
		return true;
	}

	// Get all descendants of the task
	const descendants = await getDescendantIds(ctx, taskId);

	// Check if the potential parent is a descendant
	return descendants.includes(potentialParentId);
}

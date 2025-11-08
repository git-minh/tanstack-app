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
	return buildHierarchy(tasks, 'parentTaskId');
}

/**
 * Build hierarchical project tree from flat list
 * @param projects - Flat array of projects
 * @returns Hierarchical array with nested subRows
 */
export function buildProjectHierarchy<T extends { _id: string; parentProjectId?: string | null }>(
	projects: T[]
): (T & { subRows?: T[] })[] {
	return buildHierarchy(projects, 'parentProjectId');
}

/**
 * Generic hierarchy builder that works with any parent field name
 * @param items - Flat array of items
 * @param parentFieldName - Name of the parent ID field
 * @returns Hierarchical array with nested subRows
 */
function buildHierarchy<T extends { _id: string; [key: string]: any }>(
	items: T[],
	parentFieldName: string
): (T & { subRows?: T[] })[] {
	const itemMap = new Map<string, T & { subRows?: T[] }>();
	const rootItems: (T & { subRows?: T[] })[] = [];

	// First pass: create item map
	items.forEach((item) => {
		itemMap.set(item._id, { ...item, subRows: [] });
	});

	// Second pass: build hierarchy
	items.forEach((item) => {
		const itemWithChildren = itemMap.get(item._id)!;
		const parentId = item[parentFieldName];

		if (parentId && itemMap.has(parentId)) {
			const parent = itemMap.get(parentId)!;
			parent.subRows = parent.subRows || [];
			parent.subRows.push(itemWithChildren);
		} else {
			// Root item or orphaned item
			rootItems.push(itemWithChildren);
		}
	});

	return rootItems;
}

/**
 * Generic helper to calculate hierarchy sort path
 * @param ctx - Mutation or Query context
 * @param userId - User ID
 * @param tableName - Table name (e.g., "tasks", "projects")
 * @param parentFieldName - Parent field name (e.g., "parentTaskId", "parentProjectId")
 * @param parentId - Optional parent ID
 * @returns Object with level and sortPath
 */
async function calculateHierarchySortPath<T extends "tasks" | "projects">(
	ctx: MutationCtx | QueryCtx,
	userId: string,
	tableName: T,
	parentFieldName: string,
	parentId?: Id<T>
): Promise<{ level: number; sortPath: string }> {
	let level = 0;
	let sortPath = "";

	if (parentId) {
		// Get parent item
		const parentItem = await ctx.db.get(parentId);
		if (!parentItem) {
			throw new Error(`Parent ${tableName.slice(0, -1)} not found`);
		}
		if (parentItem.userId !== userId) {
			throw new Error(`Cannot add sub-${tableName.slice(0, -1)} to another user's ${tableName.slice(0, -1)}`);
		}

		// Calculate level and sortPath
		level = parentItem.level + 1;

		// Get siblings to calculate next sequential number
		const siblings = await ctx.db
			.query(tableName)
			.withIndex(`by_${parentFieldName}` as any, (q: any) => q.eq(parentFieldName, parentId))
			.collect();

		const nextNumber = String(siblings.length + 1).padStart(3, "0");
		sortPath = parentItem.sortPath
			? `${parentItem.sortPath}.${nextNumber}`
			: nextNumber;
	} else {
		// Root item - get next sequential number among root items
		const rootItems = await ctx.db
			.query(tableName)
			.withIndex("by_userId_and_level", (q: any) =>
				q.eq("userId", userId).eq("level", 0)
			)
			.collect();

		sortPath = String(rootItems.length + 1).padStart(3, "0");
	}

	return { level, sortPath };
}

/**
 * Generic helper to recursively update status of all descendants
 * @param ctx - Mutation context
 * @param tableName - Table name (e.g., "tasks", "projects")
 * @param parentFieldName - Parent field name (e.g., "parentTaskId", "parentProjectId")
 * @param itemId - Parent item ID
 * @param status - New status to apply
 */
async function updateHierarchyDescendantsStatus<T extends "tasks" | "projects">(
	ctx: MutationCtx,
	tableName: T,
	parentFieldName: string,
	itemId: Id<T>,
	status: string
): Promise<void> {
	const children = await ctx.db
		.query(tableName)
		.withIndex(`by_${parentFieldName}` as any, (q: any) => q.eq(parentFieldName, itemId))
		.collect();

	for (const child of children) {
		// Type-safe patch: both tasks and projects tables have a status field
		if (tableName === "tasks") {
			await ctx.db.patch(child._id as Id<"tasks">, { status });
		} else if (tableName === "projects") {
			await ctx.db.patch(child._id as Id<"projects">, { status });
		}
		// Recursively update grandchildren
		await updateHierarchyDescendantsStatus(ctx, tableName, parentFieldName, child._id, status);
	}
}

/**
 * Generic helper to recursively delete all descendants
 * @param ctx - Mutation context
 * @param tableName - Table name (e.g., "tasks", "projects")
 * @param parentFieldName - Parent field name (e.g., "parentTaskId", "parentProjectId")
 * @param itemId - Parent item ID
 */
async function deleteHierarchyAndDescendants<T extends "tasks" | "projects">(
	ctx: MutationCtx,
	tableName: T,
	parentFieldName: string,
	itemId: Id<T>
): Promise<void> {
	// Get all children
	const children = await ctx.db
		.query(tableName)
		.withIndex(`by_${parentFieldName}` as any, (q: any) => q.eq(parentFieldName, itemId))
		.collect();

	// Delete children first (depth-first deletion)
	for (const child of children) {
		await deleteHierarchyAndDescendants(ctx, tableName, parentFieldName, child._id);
	}

	// Delete the item itself
	await ctx.db.delete(itemId);
}

/**
 * Calculate the next sort path for a project
 * @param ctx - Mutation context
 * @param userId - User ID
 * @param parentProjectId - Optional parent project ID
 * @returns Object with level and sortPath
 */
export async function calculateProjectSortPath(
	ctx: MutationCtx | QueryCtx,
	userId: string,
	parentProjectId?: Id<"projects">
): Promise<{ level: number; sortPath: string }> {
	return calculateHierarchySortPath(ctx, userId, "projects", "parentProjectId", parentProjectId);
}

/**
 * Recursively update status of all descendant projects
 * @param ctx - Mutation context
 * @param projectId - Parent project ID
 * @param status - New status to apply
 */
export async function updateProjectDescendantsStatus(
	ctx: MutationCtx,
	projectId: Id<"projects">,
	status: string
): Promise<void> {
	return updateHierarchyDescendantsStatus(ctx, "projects", "parentProjectId", projectId, status);
}

/**
 * Recursively delete all descendant projects
 * @param ctx - Mutation context
 * @param projectId - Parent project ID
 */
export async function deleteProjectAndDescendants(
	ctx: MutationCtx,
	projectId: Id<"projects">
): Promise<void> {
	return deleteHierarchyAndDescendants(ctx, "projects", "parentProjectId", projectId);
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

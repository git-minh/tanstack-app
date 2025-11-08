/**
 * Hierarchy utility functions for task subtasks
 * Frontend helpers for managing hierarchical task data
 */

import type { Task } from "../data/schema";

/**
 * Check if a task has any descendants (subtasks)
 * @param task - Task to check
 * @returns True if task has subtasks
 */
export function hasDescendants(task: Task): boolean {
	return !!(task.subRows && task.subRows.length > 0);
}

/**
 * Get all descendant IDs of a task recursively
 * @param task - Parent task
 * @returns Array of all descendant task IDs
 */
export function getDescendantIds(task: Task): string[] {
	const descendants: string[] = [];

	function traverse(currentTask: Task) {
		if (currentTask.subRows) {
			currentTask.subRows.forEach((child) => {
				descendants.push(child._id);
				traverse(child);
			});
		}
	}

	traverse(task);
	return descendants;
}

/**
 * Flatten hierarchical task structure to a flat array
 * @param hierarchicalTasks - Array of tasks with nested subRows
 * @returns Flat array of all tasks
 */
export function flattenTaskHierarchy(hierarchicalTasks: Task[]): Task[] {
	const result: Task[] = [];

	function traverse(tasks: Task[]) {
		tasks.forEach((task) => {
			const { subRows, ...taskData } = task;
			result.push(taskData as Task);
			if (subRows && subRows.length > 0) {
				traverse(subRows);
			}
		});
	}

	traverse(hierarchicalTasks);
	return result;
}

/**
 * Count the total number of tasks including all descendants
 * @param tasks - Array of tasks with nested subRows
 * @returns Total count of all tasks
 */
export function countTotalTasks(tasks: Task[]): number {
	let count = 0;

	function traverse(taskArray: Task[]) {
		taskArray.forEach((task) => {
			count++;
			if (task.subRows && task.subRows.length > 0) {
				traverse(task.subRows);
			}
		});
	}

	traverse(tasks);
	return count;
}

/**
 * Find a task by ID in hierarchical structure
 * @param tasks - Array of tasks with nested subRows
 * @param id - Task ID to find
 * @returns Task if found, undefined otherwise
 */
export function findTaskById(tasks: Task[], id: string): Task | undefined {
	for (const task of tasks) {
		if (task._id === id) {
			return task;
		}
		if (task.subRows && task.subRows.length > 0) {
			const found = findTaskById(task.subRows, id);
			if (found) return found;
		}
	}
	return undefined;
}

/**
 * Get the parent task of a given task
 * @param tasks - Array of tasks with nested subRows
 * @param childId - ID of the child task
 * @returns Parent task if found, undefined otherwise
 */
export function findParentTask(tasks: Task[], childId: string): Task | undefined {
	for (const task of tasks) {
		if (task.subRows) {
			// Check if this task is the direct parent
			if (task.subRows.some((child) => child._id === childId)) {
				return task;
			}
			// Recursively search in subtasks
			const found = findParentTask(task.subRows, childId);
			if (found) return found;
		}
	}
	return undefined;
}

/**
 * Get the depth of a task in the hierarchy
 * @param tasks - Array of tasks with nested subRows
 * @param taskId - ID of the task
 * @param currentDepth - Current depth level (used internally for recursion)
 * @returns Depth of the task (0 for root, 1 for first level subtask, etc.)
 */
export function getTaskDepth(
	tasks: Task[],
	taskId: string,
	currentDepth: number = 0
): number {
	for (const task of tasks) {
		if (task._id === taskId) {
			return currentDepth;
		}
		if (task.subRows && task.subRows.length > 0) {
			const depth = getTaskDepth(task.subRows, taskId, currentDepth + 1);
			if (depth !== -1) return depth;
		}
	}
	return -1; // Not found
}

/**
 * Check if a task is a root task (no parent)
 * @param task - Task to check
 * @returns True if task is a root task
 */
export function isRootTask(task: Task): boolean {
	return task.level === 0 || !task.parentTaskId;
}

/**
 * Get all root tasks from a flat array
 * @param tasks - Flat array of tasks
 * @returns Array of root tasks only
 */
export function getRootTasks(tasks: Task[]): Task[] {
	return tasks.filter(isRootTask);
}

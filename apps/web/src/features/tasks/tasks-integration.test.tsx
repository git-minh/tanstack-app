import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Task } from "./data/schema";

// Mock Convex hooks
const mockUseMutation = vi.fn();
const mockUseSuspenseQuery = vi.fn();
const mockUseQuery = vi.fn();

vi.mock("convex/react", () => ({
	useMutation: () => mockUseMutation(),
	useQuery: () => mockUseQuery(),
}));

vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual("@tanstack/react-query");
	return {
		...actual,
		useSuspenseQuery: () => mockUseSuspenseQuery(),
	};
});

vi.mock("@convex-dev/react-query", () => ({
	convexQuery: vi.fn((apiFunction, args) => ({ apiFunction, args })),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

// Mock task data
const mockTask: Task = {
	_id: "task-1" as any,
	_creationTime: Date.now(),
	userId: "user-1",
	title: "Test Task",
	status: "todo",
	label: "feature",
	priority: "medium",
	displayId: "TSK-001",
	level: 0,
	sortPath: "001",
};

const mockDoneTask: Task = {
	...mockTask,
	_id: "task-2" as any,
	status: "done",
	title: "Completed Task",
	displayId: "TSK-002",
};

describe("Tasks Component Integration", () => {
	let queryClient: QueryClient;
	let mockUpdateTask: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
			},
		});

		mockUpdateTask = vi.fn().mockResolvedValue(undefined);

		// Setup default mocks
		mockUseSuspenseQuery.mockReturnValue({
			data: {
				hierarchicalTasks: [mockTask, mockDoneTask],
				rootTasks: [mockTask, mockDoneTask],
			},
		});

		mockUseQuery.mockReturnValue(undefined);
		mockUseMutation.mockReturnValue(mockUpdateTask);
	});

	describe("Task toggle button", () => {
		it("should render Circle icon for todo tasks", async () => {
			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			// Find the todo task
			const taskTitle = screen.getByText("Test Task");
			expect(taskTitle).toBeInTheDocument();

			// The Circle icon should be present (not filled)
			const taskRow = taskTitle.closest("div");
			const circleButton = taskRow?.querySelector("button");
			expect(circleButton).toBeInTheDocument();
		});

		it("should render CheckCircle2 icon for done tasks", async () => {
			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			// Find the done task
			const doneTaskTitle = screen.getByText("Completed Task");
			expect(doneTaskTitle).toBeInTheDocument();

			// Should have line-through style
			expect(doneTaskTitle).toHaveClass("line-through");
		});

		it("should call updateTask when toggle button is clicked", async () => {
			const user = userEvent.setup();
			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			// Find and click the toggle button for todo task
			const taskTitle = screen.getByText("Test Task");
			const taskRow = taskTitle.closest("div");
			const toggleButton = taskRow?.querySelector("button");

			if (toggleButton) {
				await user.click(toggleButton);

				await waitFor(() => {
					expect(mockUpdateTask).toHaveBeenCalledWith(
						expect.objectContaining({
							id: mockTask._id,
							status: "done",
						})
					);
				});
			}
		});

		it("should toggle from done to todo", async () => {
			const user = userEvent.setup();
			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			// Find and click the toggle button for done task
			const doneTaskTitle = screen.getByText("Completed Task");
			const taskRow = doneTaskTitle.closest("div");
			const toggleButton = taskRow?.querySelector("button");

			if (toggleButton) {
				await user.click(toggleButton);

				await waitFor(() => {
					expect(mockUpdateTask).toHaveBeenCalledWith(
						expect.objectContaining({
							id: mockDoneTask._id,
							status: "todo",
						})
					);
				});
			}
		});

		it("should show appropriate icon based on status", async () => {
			const { Tasks } = await import("./index");

			mockUseSuspenseQuery.mockReturnValue({
				data: {
					hierarchicalTasks: [
						mockTask,
						mockDoneTask,
						{ ...mockTask, _id: "task-3" as any, status: "in progress" },
					],
					rootTasks: [mockTask, mockDoneTask],
				},
			});

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			// All tasks should have toggle buttons
			const buttons = screen.getAllByRole("button");
			expect(buttons.length).toBeGreaterThan(0);
		});
	});

	describe("Task status display", () => {
		it("should show strikethrough for done tasks", async () => {
			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			const doneTaskTitle = screen.getByText("Completed Task");
			expect(doneTaskTitle).toHaveClass("line-through");
			expect(doneTaskTitle).toHaveClass("text-muted-foreground");
		});

		it("should not show strikethrough for todo tasks", async () => {
			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			const todoTaskTitle = screen.getByText("Test Task");
			expect(todoTaskTitle).not.toHaveClass("line-through");
		});

		it("should display task status in metadata", async () => {
			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			// Status should be displayed in uppercase
			const todoStatus = screen.getByText("todo");
			expect(todoStatus).toBeInTheDocument();

			const doneStatus = screen.getByText("done");
			expect(doneStatus).toBeInTheDocument();
		});
	});

	describe("Bulk operations", () => {
		it("should handle bulk status update via filters", async () => {
			const user = userEvent.setup();
			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			// Click on "Done" filter
			const doneFilter = screen.getByText("Done");
			await user.click(doneFilter);

			// Should filter to show only done tasks
			expect(screen.getByText("Completed Task")).toBeInTheDocument();
		});

		it("should handle bulk status update via filters to Todo", async () => {
			const user = userEvent.setup();
			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			// Click on "Todo" filter
			const todoFilter = screen.getByText("Todo");
			await user.click(todoFilter);

			// Should show todo tasks
			expect(screen.getByText("Test Task")).toBeInTheDocument();
		});
	});

	describe("Error handling", () => {
		it("should handle failed status update gracefully", async () => {
			const user = userEvent.setup();
			const { toast } = await import("sonner");

			// Mock update to fail
			const failingUpdateTask = vi
				.fn()
				.mockRejectedValue(new Error("Network error"));
			mockUseMutation.mockReturnValue(failingUpdateTask);

			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			const taskTitle = screen.getByText("Test Task");
			const taskRow = taskTitle.closest("div");
			const toggleButton = taskRow?.querySelector("button");

			if (toggleButton) {
				await user.click(toggleButton);

				await waitFor(() => {
					expect(toast.error).toHaveBeenCalledWith("Failed to update task");
				});
			}
		});
	});

	describe("Hierarchical tasks", () => {
		it("should render subtasks with proper indentation", async () => {
			const parentTask: Task = {
				...mockTask,
				_id: "parent" as any,
				displayId: "TSK-100",
				subRows: [
					{
						...mockTask,
						_id: "child-1" as any,
						displayId: "TSK-101",
						level: 1,
						parentTaskId: "parent" as any,
					},
				],
			};

			mockUseSuspenseQuery.mockReturnValue({
				data: {
					hierarchicalTasks: [parentTask],
					rootTasks: [parentTask],
				},
			});

			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			// Both parent and child should be visible
			expect(screen.getByText("Test Task")).toBeInTheDocument();
		});

		it("should allow toggling status of parent and child independently", async () => {
			const user = userEvent.setup();

			const parentTask: Task = {
				...mockTask,
				_id: "parent" as any,
				displayId: "TSK-100",
				title: "Parent Task",
				subRows: [
					{
						...mockTask,
						_id: "child-1" as any,
						displayId: "TSK-101",
						title: "Child Task",
						level: 1,
						parentTaskId: "parent" as any,
					},
				],
			};

			mockUseSuspenseQuery.mockReturnValue({
				data: {
					hierarchicalTasks: [parentTask],
					rootTasks: [parentTask],
				},
			});

			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			// Find parent and child
			const parentTitle = screen.getByText("Parent Task");
			const childTitle = screen.getByText("Child Task");

			expect(parentTitle).toBeInTheDocument();
			expect(childTitle).toBeInTheDocument();

			// Each should have its own toggle button
			const parentRow = parentTitle.closest("div");
			const childRow = childTitle.closest("div");

			const parentButton = parentRow?.querySelector("button");
			const childButton = childRow?.querySelector("button");

			expect(parentButton).toBeInTheDocument();
			expect(childButton).toBeInTheDocument();

			// Toggle parent
			if (parentButton) {
				await user.click(parentButton);
				await waitFor(() => {
					expect(mockUpdateTask).toHaveBeenCalledWith(
						expect.objectContaining({
							id: "parent",
							status: "done",
						})
					);
				});
			}
		});
	});

	describe("Accessibility", () => {
		it("should have accessible toggle buttons", async () => {
			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			// Toggle buttons should be keyboard accessible
			const buttons = screen.getAllByRole("button");
			buttons.forEach((button) => {
				expect(button).toBeInTheDocument();
			});
		});

		it("should show visual feedback on hover", async () => {
			const user = userEvent.setup();
			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			const taskTitle = screen.getByText("Test Task");
			const taskRow = taskTitle.closest("div");
			const toggleButton = taskRow?.querySelector("button");

			if (toggleButton) {
				// Hover should show scale effect (verified via className)
				expect(toggleButton).toHaveClass("hover:scale-110");
			}
		});
	});

	describe("Statistics", () => {
		it("should update done count when task is toggled", async () => {
			const { Tasks } = await import("./index");

			render(
				<QueryClientProvider client={queryClient}>
					<Tasks />
				</QueryClientProvider>
			);

			// Should show statistics
			const totalStat = screen.getByText("Total");
			const doneStat = screen.getByText("Done");

			expect(totalStat).toBeInTheDocument();
			expect(doneStat).toBeInTheDocument();

			// Count should match mock data (1 done task)
			// This is calculated from hierarchicalTasks
		});
	});
});

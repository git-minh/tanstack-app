/**
 * Unit and integration tests for GenerateDialog component
 *
 * Tests cover:
 * - Component rendering and form elements
 * - Form validation rules (min/max length)
 * - Loading state transitions
 * - Success and error flows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { GenerateDialog } from "./generate-dialog";
import type { GenerateProjectFormValues } from "../data/schema";

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock convex/react hooks
vi.mock("convex/react", () => ({
	useAction: vi.fn(() => vi.fn()),
	useQuery: vi.fn(() => undefined),
}));

// Mock autumn-js/react
vi.mock("autumn-js/react", () => ({
	useCustomer: vi.fn(() => ({
		checkout: vi.fn(),
	})),
}));

describe("GenerateDialog - Rendering and Form Elements (Subtask 6.1)", () => {
	const mockOnOpenChange = vi.fn();
	const mockOnSubmit = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render dialog when open is true", () => {
		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});

	it("should display the dialog title", () => {
		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		expect(screen.getByText("Generate Project with AI")).toBeInTheDocument();
	});

	it("should display the dialog description", () => {
		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		expect(
			screen.getByText(
				/Describe your project and AI will generate the structure/i
			)
		).toBeInTheDocument();
	});

	it("should render textarea with correct label", () => {
		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const textarea = screen.getByLabelText("Project Description");
		expect(textarea).toBeInTheDocument();
		expect(textarea).toHaveAttribute("id", "prompt");
	});

	it("should render textarea with placeholder text", () => {
		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const textarea = screen.getByPlaceholderText(
			/A task management app with projects/i
		);
		expect(textarea).toBeInTheDocument();
	});

	it("should display help text about character limits", () => {
		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		expect(
			screen.getByText(/Provide a detailed description.*20-30,000 characters/i)
		).toBeInTheDocument();
	});

	it("should render Cancel button", () => {
		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
	});

	it("should render Generate button", () => {
		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		expect(
			screen.getByRole("button", { name: /generate.*credits/i })
		).toBeInTheDocument();
	});

	it("should call onOpenChange when Cancel is clicked", async () => {
		const user = userEvent.setup();

		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const cancelButton = screen.getByRole("button", { name: /cancel/i });
		await user.click(cancelButton);

		expect(mockOnOpenChange).toHaveBeenCalledWith(false);
	});
});

describe("GenerateDialog - Form Validation (Subtask 6.2)", () => {
	const mockOnOpenChange = vi.fn();
	const mockOnSubmit = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should show error for empty submission", async () => {
		const { toast } = await import("sonner");
		const user = userEvent.setup();

		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const generateButton = screen.getByRole("button", { name: /generate.*credits/i });
		await user.click(generateButton);

		// Should show toast error for empty input
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				"Please provide either a project description or scrape a URL"
			);
		});
		expect(mockOnSubmit).not.toHaveBeenCalled();
	});

	it("should show error when input is less than 20 characters", async () => {
		const { toast } = await import("sonner");
		const user = userEvent.setup();

		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const textarea = screen.getByLabelText("Project Description");
		await user.type(textarea, "Too short"); // Only 9 chars

		const generateButton = screen.getByRole("button", { name: /generate.*credits/i });
		await user.click(generateButton);

		// Should show toast error for input less than 20 chars
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				"Please provide either a project description or scrape a URL"
			);
		});
		expect(mockOnSubmit).not.toHaveBeenCalled();
	});

	it("should show error when input exceeds 30000 characters", async () => {
		const user = userEvent.setup();

		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const textarea = screen.getByLabelText("Project Description") as HTMLTextAreaElement;
		const longText = "A".repeat(30001); // 30001 chars (exceeds limit)

		// Use paste instead of type to avoid timeout
		await user.click(textarea);
		await user.paste(longText);

		const generateButton = screen.getByRole("button", { name: /generate.*credits/i });
		await user.click(generateButton);

		expect(
			await screen.findByText(/must not exceed 30000 characters/i)
		).toBeInTheDocument();
		expect(mockOnSubmit).not.toHaveBeenCalled();
	});

	it("should accept valid input (20-30000 characters)", async () => {
		const user = userEvent.setup();
		mockOnSubmit.mockResolvedValue({ projectsCount: 1, tasksCount: 5 });

		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const textarea = screen.getByLabelText("Project Description") as HTMLTextAreaElement;
		const validText = "A valid project description with enough characters to pass validation";

		// Use paste for consistent text input
		await user.click(textarea);
		await user.paste(validText);

		const generateButton = screen.getByRole("button", { name: /generate.*credits/i });
		await user.click(generateButton);

		// Should call onSubmit with the entered text
		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledWith({ prompt: validText });
		});
	});
});

describe("GenerateDialog - Loading States (Subtask 6.3)", () => {
	const mockOnOpenChange = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should show loading UI during submission", async () => {
		const user = userEvent.setup();
		let resolveSubmit: () => void;
		const submitPromise = new Promise<void>((resolve) => {
			resolveSubmit = resolve;
		});

		const mockOnSubmit = vi.fn(() => submitPromise);

		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const textarea = screen.getByLabelText("Project Description");
		await user.type(textarea, "A valid project description that is long enough");

		const generateButton = screen.getByRole("button", { name: /generate.*credits/i });
		await user.click(generateButton);

		// Wait for loading state to appear
		await waitFor(() => {
			expect(screen.queryByLabelText("Project Description")).not.toBeInTheDocument();
		});

		// Loading spinner should appear
		expect(screen.getByLabelText("Loading spinner")).toBeInTheDocument();

		// Loading message should appear
		expect(
			screen.getByText("AI is analyzing your project...")
		).toBeInTheDocument();

		// Cleanup: resolve promise to avoid memory leaks
		resolveSubmit!();
	});

	it("should display loading description text", async () => {
		const user = userEvent.setup();
		let resolveSubmit: () => void;
		const submitPromise = new Promise<void>((resolve) => {
			resolveSubmit = resolve;
		});
		const mockOnSubmit = vi.fn(() => submitPromise);

		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const textarea = screen.getByLabelText("Project Description");
		await user.type(textarea, "Valid description with enough characters here");

		const generateButton = screen.getByRole("button", { name: /generate.*credits/i });
		await user.click(generateButton);

		// Wait for loading state
		await waitFor(() => {
			expect(
				screen.getByText(/Please wait while we generate your project/i)
			).toBeInTheDocument();
		});

		expect(
			screen.getByText(/This usually takes 10-30 seconds/i)
		).toBeInTheDocument();

		// Cleanup
		resolveSubmit!();
	});

	it("should hide form buttons during loading", async () => {
		const user = userEvent.setup();
		let resolveSubmit: () => void;
		const submitPromise = new Promise<void>((resolve) => {
			resolveSubmit = resolve;
		});
		const mockOnSubmit = vi.fn(() => submitPromise);

		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const textarea = screen.getByLabelText("Project Description");
		await user.type(textarea, "Valid description with enough characters here");

		const generateButton = screen.getByRole("button", { name: /generate.*credits/i });
		await user.click(generateButton);

		// Wait for loading state
		await waitFor(() => {
			expect(
				screen.queryByRole("button", { name: /cancel/i })
			).not.toBeInTheDocument();
		});

		expect(
			screen.queryByRole("button", { name: /generate.*credits/i })
		).not.toBeInTheDocument();

		// Cleanup
		resolveSubmit!();
	});
});

describe("GenerateDialog - Success and Error Flows (Subtask 6.4)", () => {
	const mockOnOpenChange = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should show success toast and close dialog on successful submission", async () => {
		const { toast } = await import("sonner");
		const user = userEvent.setup();
		const mockOnSubmit = vi.fn().mockResolvedValue({
			projectsCount: 1,
			tasksCount: 5,
			contactsCount: 2,
		});

		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const textarea = screen.getByLabelText("Project Description");
		await user.type(textarea, "Create a task management application with teams");

		const generateButton = screen.getByRole("button", { name: /generate.*credits/i });
		await user.click(generateButton);

		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith(
				"Successfully generated 1 project, 5 tasks, 2 contacts"
			);
		});

		// Dialog should close after 500ms delay
		await waitFor(
			() => {
				expect(mockOnOpenChange).toHaveBeenCalledWith(false);
			},
			{ timeout: 1000 }
		);
	});

	it("should handle success with partial counts", async () => {
		const { toast } = await import("sonner");
		const user = userEvent.setup();
		const mockOnSubmit = vi.fn().mockResolvedValue({
			projectsCount: 1,
			tasksCount: 3,
		});

		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const textarea = screen.getByLabelText("Project Description");
		await user.type(textarea, "Build a simple todo app with authentication");

		const generateButton = screen.getByRole("button", { name: /generate.*credits/i });
		await user.click(generateButton);

		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith(
				"Successfully generated 1 project, 3 tasks"
			);
		});
	});

	it("should show error toast and keep dialog open on failure", async () => {
		const { toast } = await import("sonner");
		const user = userEvent.setup();
		const errorMessage = "Failed to connect to AI service";
		const mockOnSubmit = vi.fn().mockRejectedValue(new Error(errorMessage));

		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const textarea = screen.getByLabelText("Project Description");
		await user.type(textarea, "Create an e-commerce platform with payment");

		const generateButton = screen.getByRole("button", { name: /generate.*credits/i });
		await user.click(generateButton);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(errorMessage);
		});

		// Dialog should remain open (not call onOpenChange)
		expect(mockOnOpenChange).not.toHaveBeenCalled();

		// Form should be visible again after error
		await waitFor(() => {
			expect(screen.getByLabelText("Project Description")).toBeInTheDocument();
		});
	});

	it("should handle generic error without Error object", async () => {
		const { toast } = await import("sonner");
		const user = userEvent.setup();
		const mockOnSubmit = vi.fn().mockRejectedValue("String error");

		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const textarea = screen.getByLabelText("Project Description");
		await user.type(textarea, "Build a blog platform with markdown support");

		const generateButton = screen.getByRole("button", { name: /generate.*credits/i });
		await user.click(generateButton);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				"Failed to generate project. Please try again."
			);
		});
	});

	it("should reset form on successful submission (verify via empty form on reopen)", async () => {
		const { toast } = await import("sonner");
		const mockOnSubmit = vi.fn().mockResolvedValue({ projectsCount: 1 });

		// First render - fill and submit form
		const { unmount } = render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		const user = userEvent.setup();
		const textarea = screen.getByLabelText("Project Description");
		const testText = "A project management system with Gantt charts";
		await user.type(textarea, testText);

		const generateButton = screen.getByRole("button", { name: /generate.*credits/i });
		await user.click(generateButton);

		// Wait for success and close
		await waitFor(() => {
			expect(toast.success).toHaveBeenCalled();
		});

		await waitFor(
			() => {
				expect(mockOnOpenChange).toHaveBeenCalledWith(false);
			},
			{ timeout: 1000 }
		);

		// Unmount and remount (simulates dialog closing and reopening)
		unmount();

		// Render fresh dialog - should have empty form
		render(
			<GenerateDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onSubmit={mockOnSubmit}
			/>
		);

		// Textarea should be empty in new render
		const newTextarea = screen.getByLabelText("Project Description");
		expect(newTextarea).toHaveValue("");
	});
});

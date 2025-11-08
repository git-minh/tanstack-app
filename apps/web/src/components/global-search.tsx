import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Search,
	CheckSquare,
	Users,
	ListTodo,
	FileText,
	Calendar,
	ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface GlobalSearchProps {
	className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();

	// Search results
	const searchResults = useQuery(
		api.search.searchAll,
		debouncedQuery.length >= 2 ? { query: debouncedQuery } : "skip"
	);

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(query);
		}, 300);

		return () => clearTimeout(timer);
	}, [query]);

	// Keyboard shortcut (Cmd/Ctrl + K)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setOpen(true);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Focus input when dialog opens
	useEffect(() => {
		if (open) {
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	}, [open]);

	const handleSelect = (type: string, id: string, displayId?: string) => {
		setOpen(false);
		setQuery("");
		setDebouncedQuery("");

		// Navigate based on type
		switch (type) {
			case "task":
				// Navigate to specific task by display ID
				if (displayId) {
					navigate({ to: `/tasks/${displayId}` });
				} else {
					navigate({ to: "/tasks" });
				}
				break;
			case "contact":
				// Navigate to specific contact by display ID
				if (displayId) {
					navigate({ to: `/contacts/${displayId}` });
				} else {
					navigate({ to: "/contacts" });
				}
				break;
			case "todo":
				navigate({ to: "/todos" });
				break;
		}
	};

	const getIcon = (type: string) => {
		switch (type) {
			case "task":
				return <CheckSquare className="h-4 w-4" />;
			case "contact":
				return <Users className="h-4 w-4" />;
			case "todo":
				return <ListTodo className="h-4 w-4" />;
			default:
				return <FileText className="h-4 w-4" />;
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "critical":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "high":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
			case "medium":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			case "low":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			default:
				return "";
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "done":
			case "active":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "in progress":
			case "qualified":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "todo":
			case "lead":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "canceled":
			case "inactive":
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
			default:
				return "";
		}
	};

	const hasResults =
		searchResults &&
		(searchResults.tasks.length > 0 ||
			searchResults.contacts.length > 0 ||
			searchResults.todos.length > 0);

	return (
		<>
			{/* Search trigger button */}
			<Button
				variant="outline"
				className={cn(
					"relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64",
					className
				)}
				onClick={() => setOpen(true)}
			>
				<Search className="mr-2 h-4 w-4" />
				Search...
				<kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
					<span className="text-xs">⌘</span>K
				</kbd>
			</Button>

			{/* Search dialog */}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-2xl p-0">
					<DialogHeader className="border-b px-4 py-3">
						<DialogTitle className="sr-only">Search</DialogTitle>
						<div className="flex items-center">
							<Search className="mr-2 h-4 w-4 text-muted-foreground" />
							<Input
								ref={inputRef}
								placeholder="Search tasks, contacts, and todos..."
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
							/>
						</div>
					</DialogHeader>

					<div className="max-h-[400px] overflow-y-auto">
						{debouncedQuery.length < 2 ? (
							<div className="p-8 text-center text-sm text-muted-foreground">
								Type at least 2 characters to search
							</div>
						) : !searchResults ? (
							<div className="p-8 text-center text-sm text-muted-foreground">
								Searching...
							</div>
						) : !hasResults ? (
							<div className="p-8 text-center text-sm text-muted-foreground">
								No results found for "{debouncedQuery}"
							</div>
						) : (
							<div className="p-2">
								{/* Tasks */}
								{searchResults.tasks.length > 0 && (
									<div className="mb-4">
										<div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
											TASKS
										</div>
										{searchResults.tasks.map((task: any) => (
											<button
												key={task._id}
												className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-accent"
												onClick={() =>
													handleSelect("task", task._id, task.displayId)
												}
											>
												<div className="flex items-center space-x-2">
													{getIcon("task")}
													<div>
														<div className="flex items-center space-x-2">
															<span className="font-medium">
																{task.title}
															</span>
															<Badge
																variant="outline"
																className="text-xs"
															>
																{task.displayId}
															</Badge>
														</div>
														<div className="flex items-center space-x-2 text-xs text-muted-foreground">
															<Badge
																className={cn(
																	"text-xs",
																	getStatusColor(task.status)
																)}
															>
																{task.status}
															</Badge>
															<Badge
																className={cn(
																	"text-xs",
																	getPriorityColor(task.priority)
																)}
															>
																{task.priority}
															</Badge>
															{task.dueDate && (
																<span className="flex items-center">
																	<Calendar className="mr-1 h-3 w-3" />
																	{format(
																		new Date(task.dueDate),
																		"MMM d"
																	)}
																</span>
															)}
														</div>
													</div>
												</div>
												<ArrowRight className="h-4 w-4 text-muted-foreground" />
											</button>
										))}
									</div>
								)}

								{/* Contacts */}
								{searchResults.contacts.length > 0 && (
									<div className="mb-4">
										<div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
											CONTACTS
										</div>
										{searchResults.contacts.map((contact: any) => (
											<button
												key={contact._id}
												className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-accent"
												onClick={() =>
													handleSelect(
														"contact",
														contact._id,
														contact.displayId
													)
												}
											>
												<div className="flex items-center space-x-2">
													{getIcon("contact")}
													<div>
														<div className="flex items-center space-x-2">
															<span className="font-medium">
																{contact.firstName} {contact.lastName}
															</span>
															<Badge
																variant="outline"
																className="text-xs"
															>
																{contact.displayId}
															</Badge>
														</div>
														<div className="flex items-center space-x-2 text-xs text-muted-foreground">
															<span>{contact.email}</span>
															{contact.company && (
																<span>• {contact.company}</span>
															)}
															<Badge
																className={cn(
																	"text-xs",
																	getStatusColor(contact.status)
																)}
															>
																{contact.status}
															</Badge>
														</div>
													</div>
												</div>
												<ArrowRight className="h-4 w-4 text-muted-foreground" />
											</button>
										))}
									</div>
								)}

								{/* Todos */}
								{searchResults.todos.length > 0 && (
									<div>
										<div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
											TODOS
										</div>
										{searchResults.todos.map((todo: any) => (
											<button
												key={todo._id}
												className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-accent"
												onClick={() => handleSelect("todo", todo._id)}
											>
												<div className="flex items-center space-x-2">
													{getIcon("todo")}
													<div>
														<span
															className={cn(
																"font-medium",
																todo.completed &&
																	"line-through text-muted-foreground"
															)}
														>
															{todo.text}
														</span>
														<div className="text-xs text-muted-foreground">
															{todo.completed
																? "Completed"
																: "Active"}
														</div>
													</div>
												</div>
												<ArrowRight className="h-4 w-4 text-muted-foreground" />
											</button>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					{hasResults && (
						<div className="border-t px-4 py-2 text-xs text-muted-foreground">
							Found {searchResults.total} result
							{searchResults.total !== 1 ? "s" : ""}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}

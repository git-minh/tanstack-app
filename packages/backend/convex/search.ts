import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Global search across all tables
 * Searches in tasks, contacts, todos, and projects
 */
export const searchAll = query({
	args: {
		query: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to search");
		}

		const searchTerm = args.query.toLowerCase().trim();
		if (!searchTerm) {
			return {
				tasks: [],
				contacts: [],
				todos: [],
				projects: [],
				total: 0,
			};
		}

		// Search tasks
		const tasks = await ctx.db
			.query("tasks")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		const matchingTasks = tasks.filter((task) => {
			const titleMatch = task.title.toLowerCase().includes(searchTerm);
			const descMatch = task.description?.toLowerCase().includes(searchTerm);
			const idMatch = task.displayId.toLowerCase().includes(searchTerm);
			return titleMatch || descMatch || idMatch;
		});

		// Search contacts
		const contacts = await ctx.db
			.query("contacts")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		const matchingContacts = contacts.filter((contact) => {
			const firstNameMatch = contact.firstName.toLowerCase().includes(searchTerm);
			const lastNameMatch = contact.lastName.toLowerCase().includes(searchTerm);
			const emailMatch = contact.email.toLowerCase().includes(searchTerm);
			const companyMatch = contact.company?.toLowerCase().includes(searchTerm);
			const notesMatch = contact.notes?.toLowerCase().includes(searchTerm);
			const idMatch = contact.displayId.toLowerCase().includes(searchTerm);
			return firstNameMatch || lastNameMatch || emailMatch || companyMatch || notesMatch || idMatch;
		});

		// Search todos
		const todos = await ctx.db
			.query("todos")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		const matchingTodos = todos.filter((todo) => {
			return todo.text.toLowerCase().includes(searchTerm);
		});

		// Search projects
		const projects = await ctx.db
			.query("projects")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		const matchingProjects = projects.filter((project) => {
			const nameMatch = project.name.toLowerCase().includes(searchTerm);
			const descMatch = project.description?.toLowerCase().includes(searchTerm);
			const idMatch = project.displayId.toLowerCase().includes(searchTerm);
			return nameMatch || descMatch || idMatch;
		});

		// Search design references
		const designReferences = await ctx.db
			.query("designReferences")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		const matchingDesignReferences = designReferences.filter((ref) => {
			const siteNameMatch = ref.siteName.toLowerCase().includes(searchTerm);
			const urlMatch = ref.url.toLowerCase().includes(searchTerm);
			const descMatch = ref.description?.toLowerCase().includes(searchTerm);
			const styleMatch = ref.style.toLowerCase().includes(searchTerm);
			const industryMatch = ref.industry?.toLowerCase().includes(searchTerm);
			const tagsMatch = ref.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm));
			const idMatch = ref.displayId.toLowerCase().includes(searchTerm);
			return siteNameMatch || urlMatch || descMatch || styleMatch || industryMatch || tagsMatch || idMatch;
		});

		return {
			tasks: matchingTasks.slice(0, 10), // Limit results
			contacts: matchingContacts.slice(0, 10),
			todos: matchingTodos.slice(0, 10),
			projects: matchingProjects.slice(0, 10),
			designReferences: matchingDesignReferences.slice(0, 10),
			total: matchingTasks.length + matchingContacts.length + matchingTodos.length + matchingProjects.length + matchingDesignReferences.length,
		};
	},
});

/**
 * Search tasks only
 */
export const searchTasks = query({
	args: {
		query: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to search");
		}

		const searchTerm = args.query.toLowerCase().trim();
		if (!searchTerm) {
			return [];
		}

		const tasks = await ctx.db
			.query("tasks")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		const matchingTasks = tasks.filter((task) => {
			const titleMatch = task.title.toLowerCase().includes(searchTerm);
			const descMatch = task.description?.toLowerCase().includes(searchTerm);
			const idMatch = task.displayId.toLowerCase().includes(searchTerm);
			const labelMatch = task.label.toLowerCase().includes(searchTerm);
			const statusMatch = task.status.toLowerCase().includes(searchTerm);
			return titleMatch || descMatch || idMatch || labelMatch || statusMatch;
		});

		const limit = args.limit || 20;
		return matchingTasks.slice(0, limit);
	},
});

/**
 * Search contacts only
 */
export const searchContacts = query({
	args: {
		query: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to search");
		}

		const searchTerm = args.query.toLowerCase().trim();
		if (!searchTerm) {
			return [];
		}

		const contacts = await ctx.db
			.query("contacts")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		const matchingContacts = contacts.filter((contact) => {
			const firstNameMatch = contact.firstName.toLowerCase().includes(searchTerm);
			const lastNameMatch = contact.lastName.toLowerCase().includes(searchTerm);
			const emailMatch = contact.email.toLowerCase().includes(searchTerm);
			const phoneMatch = contact.phone?.toLowerCase().includes(searchTerm);
			const companyMatch = contact.company?.toLowerCase().includes(searchTerm);
			const departmentMatch = contact.department?.toLowerCase().includes(searchTerm);
			const notesMatch = contact.notes?.toLowerCase().includes(searchTerm);
			const idMatch = contact.displayId.toLowerCase().includes(searchTerm);
			
			return firstNameMatch || lastNameMatch || emailMatch || phoneMatch || 
			       companyMatch || departmentMatch || notesMatch || idMatch;
		});

		const limit = args.limit || 20;
		return matchingContacts.slice(0, limit);
	},
});

/**
 * Quick search by display ID (for direct navigation)
 */
export const getByDisplayId = query({
	args: {
		displayId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to search");
		}

		const displayId = args.displayId.toUpperCase();

		// Check if it's a task ID (TD-XXXXXX)
		if (displayId.startsWith("TD-")) {
			const task = await ctx.db
				.query("tasks")
				.withIndex("by_displayId", (q) => q.eq("displayId", displayId))
				.first();

			if (task && task.userId === identity.subject) {
				return {
					type: "task",
					data: task,
				};
			}
		}

		// Check if it's a contact ID (CT-XXXXXX)
		if (displayId.startsWith("CT-")) {
			const contact = await ctx.db
				.query("contacts")
				.withIndex("by_displayId", (q) => q.eq("displayId", displayId))
				.first();

			if (contact && contact.userId === identity.subject) {
				return {
					type: "contact",
					data: contact,
				};
			}
		}

		return null;
	},
});

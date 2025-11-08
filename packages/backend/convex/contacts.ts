import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { generateDisplayId } from "./counters";

export const getAll = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view contacts");
		}
		// Return only the current user's contacts, ordered by creation time (newest first)
		const contacts = await ctx.db
			.query("contacts")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.order("desc")
			.collect();

		return contacts;
	},
});

export const create = mutation({
	args: {
		firstName: v.string(),
		lastName: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),
		company: v.optional(v.string()),
		title: v.optional(v.string()),
		department: v.optional(v.string()),
		website: v.optional(v.string()),
		address: v.optional(v.string()),
		notes: v.optional(v.string()),
		status: v.string(),
		category: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to create contacts");
		}

		// Generate display ID
		const displayId = await generateDisplayId(ctx, "contacts");

		const newContactId = await ctx.db.insert("contacts", {
			firstName: args.firstName,
			lastName: args.lastName,
			email: args.email,
			phone: args.phone,
			company: args.company,
			title: args.title,
			department: args.department,
			website: args.website,
			address: args.address,
			notes: args.notes,
			status: args.status,
			category: args.category,
			userId: identity.subject,
			displayId,
		});
		return await ctx.db.get(newContactId);
	},
});

export const update = mutation({
	args: {
		id: v.id("contacts"),
		firstName: v.string(),
		lastName: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),
		company: v.optional(v.string()),
		title: v.optional(v.string()),
		department: v.optional(v.string()),
		website: v.optional(v.string()),
		address: v.optional(v.string()),
		notes: v.optional(v.string()),
		status: v.string(),
		category: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to update contacts");
		}
		// Verify the contact belongs to the current user
		const contact = await ctx.db.get(args.id);
		if (!contact) {
			throw new Error("Contact not found");
		}
		if (contact.userId !== identity.subject) {
			throw new Error("Unauthorized: Cannot update another user's contact");
		}
		await ctx.db.patch(args.id, {
			firstName: args.firstName,
			lastName: args.lastName,
			email: args.email,
			phone: args.phone,
			company: args.company,
			title: args.title,
			department: args.department,
			website: args.website,
			address: args.address,
			notes: args.notes,
			status: args.status,
			category: args.category,
		});
		return await ctx.db.get(args.id);
	},
});

export const remove = mutation({
	args: {
		id: v.id("contacts"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to delete contacts");
		}
		// Verify the contact belongs to the current user
		const contact = await ctx.db.get(args.id);
		if (!contact) {
			throw new Error("Contact not found");
		}
		if (contact.userId !== identity.subject) {
			throw new Error("Unauthorized: Cannot delete another user's contact");
		}
		await ctx.db.delete(args.id);
		return { success: true };
	},
});

export const removeMany = mutation({
	args: {
		ids: v.array(v.id("contacts")),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to delete contacts");
		}
		// Verify all contacts belong to the current user and delete them
		for (const id of args.ids) {
			const contact = await ctx.db.get(id);
			if (!contact) {
				throw new Error(`Contact ${id} not found`);
			}
			if (contact.userId !== identity.subject) {
				throw new Error(`Unauthorized: Cannot delete contact ${id}`);
			}
			await ctx.db.delete(id);
		}
		return { success: true, deleted: args.ids.length };
	},
});

export const getContactStats = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view contact stats");
		}

		const allContacts = await ctx.db
			.query("contacts")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		const stats = {
			total: allContacts.length,
			byStatus: {
				active: allContacts.filter((c) => c.status === "active").length,
				archived: allContacts.filter((c) => c.status === "archived").length,
			},
			byCategory: {
				client: allContacts.filter((c) => c.category === "client").length,
				vendor: allContacts.filter((c) => c.category === "vendor").length,
				colleague: allContacts.filter((c) => c.category === "colleague").length,
				partner: allContacts.filter((c) => c.category === "partner").length,
				personal: allContacts.filter((c) => c.category === "personal").length,
				other: allContacts.filter((c) => c.category === "other").length,
			},
			withoutEmail: allContacts.filter((c) => !c.email || c.email === "")
				.length,
		};

		return stats;
	},
});

/**
 * Get contact by display ID (for URL routing)
 */
export const getByDisplayId = query({
	args: {
		displayId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view contacts");
		}

		const contact = await ctx.db
			.query("contacts")
			.withIndex("by_displayId", (q) => q.eq("displayId", args.displayId))
			.first();

		if (!contact) {
			return null;
		}

		// Verify the contact belongs to the user
		if (contact.userId !== identity.subject) {
			return null;
		}

		return contact;
	},
});

/**
 * Get contacts by category
 */
export const getByCategory = query({
	args: {
		category: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view contacts");
		}

		// First filter by user, then by category
		const contacts = await ctx.db
			.query("contacts")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		return contacts.filter((contact) => contact.category === args.category);
	},
});

/**
 * Get contacts by status
 */
export const getByStatus = query({
	args: {
		status: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view contacts");
		}

		// First filter by user, then by status
		const contacts = await ctx.db
			.query("contacts")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		return contacts.filter((contact) => contact.status === args.status);
	},
});

/**
 * Search contacts by email
 */
export const searchByEmail = query({
	args: {
		email: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to search contacts");
		}

		// Search by email (partial match)
		const contacts = await ctx.db
			.query("contacts")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.collect();

		// Filter by user ownership
		return contacts.filter((contact) => contact.userId === identity.subject);
	},
});

/**
 * Get contacts by filters (status and/or category)
 */
export const getByFilters = query({
	args: {
		status: v.optional(v.string()),
		category: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view contacts");
		}

		// Get all user's contacts
		let contacts = await ctx.db
			.query("contacts")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		// Apply filters
		if (args.status) {
			contacts = contacts.filter((c) => c.status === args.status);
		}
		if (args.category) {
			contacts = contacts.filter((c) => c.category === args.category);
		}

		return contacts;
	},
});

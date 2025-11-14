import { internalMutation } from "./_generated/server";

const FREE_TIER_CREDITS = 100;

/**
 * One-time migration to add credit fields to existing userUsage records
 * Run this with: npx convex run migrateUserUsage:migrateAll
 */
export const migrateAll = internalMutation({
	args: {},
	handler: async (ctx) => {
		const allUsage = await ctx.db.query("userUsage").collect();

		let migratedCount = 0;

		for (const usage of allUsage) {
			// Check if migration is needed
			const needsMigration =
				usage.creditsRemaining === undefined ||
				usage.creditsTotal === undefined ||
				usage.lastCreditReset === undefined;

			if (needsMigration) {
				await ctx.db.patch(usage._id, {
					creditsRemaining: FREE_TIER_CREDITS,
					creditsTotal: FREE_TIER_CREDITS,
					lastCreditReset: Date.now(),
				});
				migratedCount++;
			}
		}

		return {
			success: true,
			totalRecords: allUsage.length,
			migratedRecords: migratedCount,
			message: `Migration complete: ${migratedCount} out of ${allUsage.length} records updated`,
		};
	},
});

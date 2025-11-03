import { useConvexAuth } from "convex/react";

/**
 * Hook to track authentication loading state
 *
 * This hook provides access to the authentication loading state from ConvexBetterAuthProvider.
 * Use this to prevent queries from executing before auth is fully established.
 *
 * @returns {Object} Authentication state
 * @returns {boolean} isLoading - True while auth is initializing
 * @returns {boolean} isAuthenticated - True when user is authenticated and ready
 */
export function useAuthLoading() {
	const { isLoading, isAuthenticated } = useConvexAuth();

	return {
		isLoading,
		isAuthenticated,
		isReady: !isLoading && isAuthenticated,
	};
}

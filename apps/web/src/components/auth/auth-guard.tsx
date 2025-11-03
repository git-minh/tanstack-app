import { ReactNode } from "react";
import { useAuthLoading } from "@/hooks/use-auth-loading";
import Loader from "@/components/loader";

interface AuthGuardProps {
	children: ReactNode;
	fallback?: ReactNode;
}

/**
 * AuthGuard component that prevents rendering until authentication is ready
 *
 * This component solves the race condition where queries execute before
 * ConvexBetterAuthProvider completes authentication initialization.
 *
 * Use this to wrap components that make authenticated queries to ensure
 * auth is fully established before queries execute.
 *
 * @example
 * ```tsx
 * <AuthGuard>
 *   <DashboardContent />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
	const { isLoading, isReady } = useAuthLoading();

	// Show loading state while auth is initializing
	if (isLoading || !isReady) {
		return fallback || <Loader />;
	}

	// Auth is ready, render children (queries can execute safely)
	return <>{children}</>;
}

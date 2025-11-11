import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { lazyRoute, createRouteSkeleton } from "@/lib/lazy-route";
import { ErrorBoundary } from "@/components/error-boundary";

// Lazy load Contacts feature (24 KB) - only loads when route is accessed
const Contacts = lazyRoute(() => import("@/features/contacts").then(m => ({ default: m.Contacts })));

// Create skeleton loader for contacts route
const ContactsSkeleton = createRouteSkeleton({
	title: "Contacts",
	description: "Manage your contacts and relationships",
});

export const Route = createFileRoute("/_authenticated/contacts")({
	component: ContactsRoute,
});

function ContactsRoute() {
	return (
		<ErrorBoundary>
			<Suspense fallback={<ContactsSkeleton />}>
				<Contacts />
			</Suspense>
		</ErrorBoundary>
	);
}

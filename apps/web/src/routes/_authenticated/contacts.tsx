import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { lazyRoute } from "@/lib/lazy-route";
import { ErrorBoundary } from "@/components/error-boundary";
import { ContactsSkeleton } from "@/features/contacts/components/contacts-skeleton";

// Lazy load Contacts feature (24 KB) - only loads when route is accessed
const Contacts = lazyRoute(() => import("@/features/contacts").then(m => ({ default: m.Contacts })));

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

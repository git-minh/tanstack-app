import { createFileRoute } from "@tanstack/react-router";
import { Contacts } from "@/features/contacts";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/_authenticated/contacts")({
	component: ContactsRoute,
});

function ContactsRoute() {
	return (
		<ErrorBoundary>
			<Contacts />
		</ErrorBoundary>
	);
}

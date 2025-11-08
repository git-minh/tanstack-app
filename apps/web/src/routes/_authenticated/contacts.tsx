import { createFileRoute } from "@tanstack/react-router";
import { Contacts } from "@/features/contacts";

export const Route = createFileRoute("/_authenticated/contacts")({
	component: ContactsRoute,
});

function ContactsRoute() {
	return <Contacts />;
}

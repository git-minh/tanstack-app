import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "@/components/features/todos/data-table";
import { columns } from "@/components/features/todos/columns";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";

export const Route = createFileRoute("/_authenticated/todos")({
	component: TodosRoute,
});

function TodosRoute() {
	const { data: todos } = useSuspenseQuery(
		convexQuery(api.todos.getAll, {})
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Todos</h1>
				<p className="text-muted-foreground">
					Manage your tasks efficiently with sorting and filtering
				</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Todo List</CardTitle>
					<CardDescription>
						Powered by Convex real-time database with TanStack Table
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable columns={columns} data={todos} />
				</CardContent>
			</Card>
		</div>
	);
}

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ProjectsSkeleton() {
	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i} className="p-6">
						<Skeleton className="h-4 w-24 mb-2" />
						<Skeleton className="h-8 w-16" />
					</Card>
				))}
			</div>
			<Card className="p-6">
				<Skeleton className="h-8 w-full mb-4" />
				<Skeleton className="h-64 w-full" />
			</Card>
		</div>
	);
}

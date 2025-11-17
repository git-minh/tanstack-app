import { Skeleton } from "@/components/ui/skeleton";

export function DesignReferencesSkeleton() {
	return (
		<div className="space-y-0">
			{/* Header */}
			<div className="border-b-2 border-foreground bg-background p-6">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-2">
						<Skeleton className="h-8 w-64 border-4" />
						<Skeleton className="h-4 w-96" />
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="h-9 w-32" />
						<Skeleton className="h-9 w-40 border-4" />
					</div>
				</div>
			</div>

			{/* Filter Bar */}
			<div className="border-b-2 border-foreground bg-background p-4">
				<div className="flex items-center gap-2 flex-wrap">
					<Skeleton className="h-9 w-64" />
					<Skeleton className="h-9 w-32" />
				</div>
			</div>

			{/* Table Container */}
			<div className="border-b-2 border-foreground">
				{/* Table Header */}
				<div className="grid grid-cols-[48px_80px_1fr_200px_150px_120px] gap-4 px-4 py-2 bg-foreground text-background border-b-2 border-foreground">
					<Skeleton className="h-4 w-4 bg-background/20" />
					<Skeleton className="h-4 w-12 bg-background/20" />
					<Skeleton className="h-4 w-24 bg-background/20" />
					<Skeleton className="h-4 w-16 bg-background/20" />
					<Skeleton className="h-4 w-16 bg-background/20" />
					<Skeleton className="h-4 w-20 bg-background/20" />
				</div>

				{/* Table Rows */}
				<div className="divide-y divide-foreground/10">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="grid grid-cols-[48px_80px_1fr_200px_150px_120px] gap-4 px-4 py-3 hover:bg-foreground/5"
						>
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-10 w-10 border-2" /> {/* Image thumbnail */}
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-4 w-40" />
							<div className="flex gap-2">
								<Skeleton className="h-5 w-16" />
								<Skeleton className="h-5 w-16" />
							</div>
							<Skeleton className="h-4 w-24" />
						</div>
					))}
				</div>
			</div>

			{/* Pagination */}
			<div className="border-b-2 border-foreground bg-background p-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-4 w-48" />
					<div className="flex gap-2">
						<Skeleton className="h-8 w-24" />
						<Skeleton className="h-8 w-16" />
					</div>
				</div>
			</div>
		</div>
	);
}

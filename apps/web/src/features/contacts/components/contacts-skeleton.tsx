import { Skeleton } from "@/components/ui/skeleton";

export function ContactsSkeleton() {
	return (
		<div className="min-h-[calc(100vh-8rem)] flex flex-col">
			{/* Stats Grid - Bloomberg Terminal Style */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-foreground border-y-2 border-foreground">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="bg-background p-8 md:p-12 border-r-2 border-foreground last:border-r-0"
					>
						<div className="space-y-2">
							{/* Giant number placeholder */}
							<Skeleton className="h-24 md:h-32 w-20 border-4" />
							{/* Label */}
							<div className="text-xs uppercase tracking-widest font-medium">
								<Skeleton className="h-3 w-16" />
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Filters Bar */}
			<div className="border-b-2 border-foreground bg-background">
				<div className="p-4 flex flex-wrap items-center gap-2">
					<Skeleton className="h-7 w-12" />
					<Skeleton className="h-7 w-20" />
					<Skeleton className="h-7 w-24" />
					<Skeleton className="h-7 w-24" />
					<Skeleton className="h-7 w-16" />
					<div className="h-4 w-px bg-border mx-2" />
					<Skeleton className="h-7 w-20" />
					<Skeleton className="h-7 w-24" />
					<Skeleton className="h-7 w-24" />
					<div className="flex-1" />
					<Skeleton className="h-7 w-24 border-4" />
				</div>
			</div>

			{/* Contacts List */}
			<div className="flex-1 p-6 md:p-12">
				<div className="max-w-5xl">
					<div className="space-y-px">
						{Array.from({ length: 6 }).map((_, i) => (
							<div
								key={i}
								className="group py-4 border-b border-border/30 last:border-0 flex items-start gap-4"
							>
								{/* Content */}
								<div className="flex-1 min-w-0 space-y-2">
									{/* Name and ID */}
									<div className="flex items-baseline gap-3 flex-wrap">
										<Skeleton className="h-4 w-48" />
										<Skeleton className="h-3 w-16" />
									</div>

									{/* Email and Company */}
									<div className="space-y-1.5">
										<div className="flex items-center gap-2">
											<Skeleton className="h-3.5 w-3.5" />
											<Skeleton className="h-3.5 w-56" />
										</div>
										<div className="flex items-center gap-2">
											<Skeleton className="h-3.5 w-3.5" />
											<Skeleton className="h-3.5 w-40" />
										</div>
									</div>

									{/* Metadata */}
									<div className="flex items-center gap-3">
										<Skeleton className="h-3 w-16" />
										<Skeleton className="h-1 w-1 rounded-full" />
										<Skeleton className="h-3 w-16" />
										<Skeleton className="h-1 w-1 rounded-full" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>

								{/* Actions */}
								<div className="flex items-center gap-1 opacity-60">
									<Skeleton className="h-6 w-12" />
									<Skeleton className="h-6 w-14" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

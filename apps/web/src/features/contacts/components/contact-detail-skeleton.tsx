import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export function ContactDetailSkeleton() {
	return (
		<div className="min-h-[calc(100vh-8rem)]">
			{/* Header */}
			<div className="border-b-2 border-foreground bg-background p-6">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-4">
						<button
							disabled
							className="h-8 w-8 border-2 border-foreground flex items-center justify-center opacity-50"
						>
							<ArrowLeft className="h-4 w-4" />
						</button>
						<div className="space-y-2">
							<Skeleton className="h-8 w-64 border-4" />
							<Skeleton className="h-4 w-48" />
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="h-9 w-20" />
						<Skeleton className="h-9 w-20" />
					</div>
				</div>
			</div>

			{/* Quick Info Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-foreground border-b-2 border-foreground">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="bg-background p-8 md:p-12 border-r-2 border-foreground last:border-r-0"
					>
						<div className="space-y-2">
							<Skeleton className="h-3 w-16" />
							<Skeleton className="h-6 w-32 border-2" />
						</div>
					</div>
				))}
			</div>

			{/* Content */}
			<div className="p-6 md:p-12">
				<div className="max-w-4xl space-y-6">
					{/* Contact Information */}
					<div className="border-2 border-foreground p-6">
						<div className="text-[9px] uppercase tracking-[0.2em] font-medium mb-4">
							<Skeleton className="h-3 w-40" />
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="space-y-2">
									<Skeleton className="h-3 w-20" />
									<Skeleton className="h-4 w-40" />
								</div>
							))}
						</div>
					</div>

					{/* Professional Info */}
					<div className="border-2 border-foreground p-6">
						<div className="text-[9px] uppercase tracking-[0.2em] font-medium mb-4">
							<Skeleton className="h-3 w-40" />
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="space-y-2">
									<Skeleton className="h-3 w-20" />
									<Skeleton className="h-4 w-32" />
								</div>
							))}
						</div>
					</div>

					{/* Notes */}
					<div className="border-2 border-foreground p-6">
						<div className="text-[9px] uppercase tracking-[0.2em] font-medium mb-4">
							<Skeleton className="h-3 w-16" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-3/4" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

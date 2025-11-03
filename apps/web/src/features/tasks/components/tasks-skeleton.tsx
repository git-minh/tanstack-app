import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export function TasksSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-[250px]" />
				<Skeleton className="h-8 w-[100px]" />
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[50px]">
								<Skeleton className="h-4 w-4" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-[80px]" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-[200px]" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-[100px]" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-[100px]" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-[120px]" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-[150px]" />
							</TableHead>
							<TableHead className="w-[50px]" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{Array.from({ length: 5 }).map((_, i) => (
							<TableRow key={i}>
								<TableCell>
									<Skeleton className="h-4 w-4" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-[60px]" />
								</TableCell>
								<TableCell>
									<div className="flex space-x-2">
										<Skeleton className="h-5 w-[60px]" />
										<Skeleton className="h-4 w-[150px]" />
									</div>
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-[80px]" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-[80px]" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-[100px]" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-[120px]" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-8" />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-between">
				<Skeleton className="h-4 w-[150px]" />
				<div className="flex space-x-2">
					<Skeleton className="h-8 w-[80px]" />
					<Skeleton className="h-8 w-[80px]" />
				</div>
			</div>
		</div>
	);
}

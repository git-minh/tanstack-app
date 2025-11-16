import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { Link } from "@tanstack/react-router";
import Palette from "lucide-react/dist/esm/icons/palette";
import Plus from "lucide-react/dist/esm/icons/plus";
import Clock from "lucide-react/dist/esm/icons/clock";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export function RecentDesignReferencesCard() {
	const { data } = useSuspenseQuery(
		convexQuery(api.designReferences.getDesignReferences, { limit: 3 })
	);

	const recentReferences = data || [];

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Palette className="h-5 w-5" />
							Recent Design References
						</CardTitle>
						<CardDescription>Latest analyzed websites</CardDescription>
					</div>
					<Button size="sm" variant="outline" asChild>
						<Link to="/design-references">
							<Plus className="mr-2 h-4 w-4" />
							Analyze Website
						</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{recentReferences.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<Palette className="mb-2 h-12 w-12 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							No design references yet
						</p>
						<Button size="sm" className="mt-4" asChild>
							<Link to="/design-references">Analyze your first website</Link>
						</Button>
					</div>
				) : (
					<div className="space-y-3">
						{recentReferences.map((ref) => (
							<Link
								key={ref._id}
								to="/design-references"
								className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
							>
								<Palette className="mt-0.5 h-4 w-4 text-muted-foreground" />
								<div className="flex-1 space-y-1">
									<div className="flex items-center justify-between gap-2">
										<p className="text-sm font-medium leading-none">
											{ref.siteName}
										</p>
										<Badge variant="outline" className="text-xs">
											{ref.style}
										</Badge>
									</div>
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<ExternalLink className="h-3 w-3" />
										<span className="truncate max-w-[180px]">{ref.url}</span>
									</div>
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<Clock className="h-3 w-3" />
										{formatDistanceToNow(ref.createdAt, { addSuffix: true })}
									</div>
								</div>
							</Link>
						))}
						<Button variant="ghost" size="sm" className="w-full" asChild>
							<Link to="/design-references">View all references</Link>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

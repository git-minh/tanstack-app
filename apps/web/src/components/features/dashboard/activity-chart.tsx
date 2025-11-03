import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export function ActivityChart() {
	const { data: chartData } = useSuspenseQuery(
		convexQuery(api.dashboard.getChartData, {})
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Activity Overview</CardTitle>
				<CardDescription>
					Task creation and completion over the last 7 days
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="h-[300px]">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart
							data={chartData}
							margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
						>
							<defs>
								<linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="hsl(var(--primary))"
										stopOpacity={0.8}
									/>
									<stop
										offset="95%"
										stopColor="hsl(var(--primary))"
										stopOpacity={0}
									/>
								</linearGradient>
								<linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="hsl(var(--chart-2))"
										stopOpacity={0.8}
									/>
									<stop
										offset="95%"
										stopColor="hsl(var(--chart-2))"
										stopOpacity={0}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
							<XAxis
								dataKey="date"
								className="text-xs"
								tickFormatter={(value) => {
									const date = new Date(value);
									return date.toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									});
								}}
							/>
							<YAxis className="text-xs" />
							<Tooltip
								contentStyle={{
									backgroundColor: "hsl(var(--background))",
									border: "1px solid hsl(var(--border))",
									borderRadius: "var(--radius)",
								}}
								labelFormatter={(value) => {
									const date = new Date(value as string);
									return date.toLocaleDateString("en-US", {
										month: "long",
										day: "numeric",
										year: "numeric",
									});
								}}
							/>
							<Area
								type="monotone"
								dataKey="created"
								stroke="hsl(var(--primary))"
								fillOpacity={1}
								fill="url(#colorCreated)"
								name="Created"
							/>
							<Area
								type="monotone"
								dataKey="completed"
								stroke="hsl(var(--chart-2))"
								fillOpacity={1}
								fill="url(#colorCompleted)"
								name="Completed"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}

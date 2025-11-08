import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import type { Task } from "../data/schema";

interface DragOverlayTaskProps {
	task: Task;
}

export function DragOverlayTask({ task }: DragOverlayTaskProps) {
	return (
		<Card className="p-3 shadow-2xl border-primary rotate-3 opacity-95 min-w-[300px]">
			<div className="flex items-center gap-2">
				<GripVertical className="h-4 w-4 text-muted-foreground" />
				<div className="flex-1">
					<div className="font-semibold text-sm">{task.title}</div>
					<div className="flex items-center gap-2 mt-1">
						<Badge variant="outline" className="text-xs">
							{task.displayId}
						</Badge>
						<Badge className="text-xs">{task.status}</Badge>
						<Badge variant="secondary" className="text-xs">
							{task.priority}
						</Badge>
					</div>
				</div>
			</div>
		</Card>
	);
}

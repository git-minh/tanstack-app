import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TableCell, TableRow } from "@/components/ui/table";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { flexRender, type Row } from "@tanstack/react-table";
import type { Task } from "../data/schema";

interface SortableTaskRowProps {
	row: Row<Task>;
	level: number;
	isParent: boolean;
}

export function SortableTaskRow({ row, level, isParent }: SortableTaskRowProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
		isOver,
	} = useSortable({
		id: row.original._id,
		data: {
			type: "task",
			task: row.original,
		},
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<TableRow
			ref={setNodeRef}
			style={style}
			data-state={row.getIsSelected() && "selected"}
			className={cn(
				"border-b transition-all",
				level === 0 && "bg-accent/5 hover:bg-accent/10 border-l-4 border-l-primary/20",
				level === 1 && "bg-muted/20 hover:bg-muted/30 border-l-2 border-l-muted-foreground/30",
				level >= 2 && "bg-background hover:bg-muted/20 border-l border-l-border",
				isParent && level === 0 && "font-medium",
				isDragging && "shadow-lg ring-2 ring-primary z-50",
				isOver && "ring-2 ring-primary/50"
			)}
		>
			{/* Drag handle cell */}
			<TableCell className="w-[40px] p-0">
				<div
					className="flex items-center justify-center h-full cursor-grab active:cursor-grabbing p-2 hover:bg-accent/50"
					{...attributes}
					{...listeners}
				>
					<GripVertical className="h-4 w-4 text-muted-foreground" />
				</div>
			</TableCell>

			{/* Rest of the cells */}
			{row.getVisibleCells().map((cell) => (
				<TableCell key={cell.id}>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</TableCell>
			))}
		</TableRow>
	);
}

import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Simple time ago formatter
function formatTimeAgo(timestamp: number): string {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	if (seconds < 60) return "now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d`;
	const months = Math.floor(days / 30);
	return `${months}mo`;
}

interface ChatSessionListProps {
	activeSessionId: Id<"chatSessions"> | null;
	onSessionSelect: (sessionId: Id<"chatSessions"> | null) => void;
	onNewChat: () => void;
}

export function ChatSessionList({
	activeSessionId,
	onSessionSelect,
	onNewChat,
}: ChatSessionListProps) {
	const { data } = useSuspenseQuery(
		convexQuery(api.chatSessions.getSessions, {})
	);

	const deleteSession = useMutation(api.chatSessions.deleteSession);
	const updateSessionTitle = useMutation(api.chatSessions.updateSessionTitle);

	const [editingSessionId, setEditingSessionId] = useState<Id<"chatSessions"> | null>(null);
	const [editTitle, setEditTitle] = useState("");

	const handleDelete = async (sessionId: Id<"chatSessions">, e: React.MouseEvent) => {
		e.stopPropagation();
		if (confirm("Delete this conversation?")) {
			await deleteSession({ id: sessionId });
			if (activeSessionId === sessionId) {
				onSessionSelect(null);
			}
		}
	};

	const handleRename = (sessionId: Id<"chatSessions">, currentTitle: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setEditingSessionId(sessionId);
		setEditTitle(currentTitle);
	};

	const handleSaveRename = async (sessionId: Id<"chatSessions">) => {
		if (editTitle.trim()) {
			await updateSessionTitle({
				id: sessionId,
				title: editTitle.trim(),
			});
		}
		setEditingSessionId(null);
		setEditTitle("");
	};

	const sessions = data?.sessions || [];

	return (
		<div className="flex-1 overflow-y-auto">
			{sessions.length === 0 ? (
				<div className="p-8 text-center">
					<p className="text-sm text-muted-foreground">
						No conversations yet
					</p>
				</div>
			) : (
				<div className="space-y-px">
					{sessions.map((session) => (
						<div
							key={session._id}
							className={cn(
								"group p-4 cursor-pointer transition-all border-b border-border/30",
								"hover:pl-6",
								activeSessionId === session._id && "bg-foreground/5 border-l-2 border-foreground pl-6"
							)}
							onClick={() => onSessionSelect(session._id)}
						>
							{editingSessionId === session._id ? (
								<Input
									value={editTitle}
									onChange={(e) => setEditTitle(e.target.value)}
									onBlur={() => handleSaveRename(session._id)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleSaveRename(session._id);
										} else if (e.key === "Escape") {
											setEditingSessionId(null);
											setEditTitle("");
										}
									}}
									className="h-6 px-2 text-sm rounded-none border-foreground"
									autoFocus
									onClick={(e) => e.stopPropagation()}
								/>
							) : (
								<>
									<div className="font-light text-sm truncate mb-2">
										{session.title}
									</div>
									<div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
										<span>{formatTimeAgo(session.updatedAt)}</span>
										<span className="h-1 w-1 rounded-full bg-muted-foreground" />
										<span>{session.messageCount}</span>
									</div>

									{/* Hover Actions */}
									<div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
										<button
											onClick={(e) => handleRename(session._id, session.title, e)}
											className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-muted transition-colors"
										>
											Rename
										</button>
										<button
											onClick={(e) => handleDelete(session._id, e)}
											className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-destructive/10 hover:text-destructive transition-colors"
										>
											Delete
										</button>
									</div>
								</>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
	Plus,
	MessageSquare,
	Trash2,
	Edit2,
	MoreVertical,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Simple time ago formatter
function formatTimeAgo(timestamp: number): string {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	const months = Math.floor(days / 30);
	if (months < 12) return `${months}mo ago`;
	const years = Math.floor(months / 12);
	return `${years}y ago`;
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

	const [editingSessionId, setEditingSessionId] = useState<
		Id<"chatSessions"> | null
	>(null);
	const [editTitle, setEditTitle] = useState("");

	const handleDelete = async (sessionId: Id<"chatSessions">) => {
		if (confirm("Are you sure you want to delete this chat session?")) {
			await deleteSession({ id: sessionId });
			// If deleting active session, clear selection
			if (activeSessionId === sessionId) {
				onSessionSelect(null);
			}
		}
	};

	const handleRename = (sessionId: Id<"chatSessions">, currentTitle: string) => {
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
		<div className="flex flex-col h-full">
			{/* New Chat Button */}
			<div className="flex-none p-4 border-b">
				<Button onClick={onNewChat} className="w-full" size="sm">
					<Plus className="h-4 w-4 mr-2" />
					New Chat
				</Button>
			</div>

			{/* Session List */}
			<div className="flex-1 overflow-y-auto">
				{sessions.length === 0 ? (
					<div className="p-6 text-center">
						<MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
						<p className="text-sm text-muted-foreground mb-2">
							No conversations yet
						</p>
						<p className="text-xs text-muted-foreground">
							Click "New Chat" to start your first conversation
						</p>
					</div>
				) : (
					<div className="p-2 space-y-1">
						{sessions.map((session) => (
							<div
								key={session._id}
								className={cn(
									"group relative rounded-lg p-3 cursor-pointer transition-colors",
									"hover:bg-accent",
									activeSessionId === session._id &&
										"bg-accent border border-primary/20"
								)}
								onClick={() => onSessionSelect(session._id)}
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1 min-w-0">
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
												className="h-6 px-2 text-sm"
												autoFocus
												onClick={(e) => e.stopPropagation()}
											/>
										) : (
											<>
												<div className="font-medium text-sm truncate">
													{session.title}
												</div>
												<div className="text-xs text-muted-foreground mt-1">
													{formatTimeAgo(session.updatedAt)}
													{" · "}
													{session.messageCount}{" "}
													{session.messageCount === 1 ? "message" : "messages"}
												</div>
											</>
										)}
									</div>

									{/* Actions Menu */}
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
												onClick={(e) => e.stopPropagation()}
											>
												<MoreVertical className="h-3.5 w-3.5" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													handleRename(session._id, session.title);
												}}
											>
												<Edit2 className="h-4 w-4 mr-2" />
												Rename
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													handleDelete(session._id);
												}}
												className="text-destructive"
											>
												<Trash2 className="h-4 w-4 mr-2" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

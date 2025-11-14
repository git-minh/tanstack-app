import { useEffect, useRef } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessagesProps {
	sessionId: Id<"chatSessions">;
}

export function ChatMessages({ sessionId }: ChatMessagesProps) {
	const { data: messages } = useSuspenseQuery(
		convexQuery(api.chatMessages.getMessages, { sessionId })
	);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	if (!messages || messages.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-6 text-center">
				<Bot className="h-12 w-12 text-muted-foreground mb-3" />
				<h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
				<p className="text-sm text-muted-foreground max-w-md">
					Ask me anything about your projects, tasks, or get help planning your
					next steps.
				</p>
			</div>
		);
	}

	return (
		<div ref={containerRef} className="h-full overflow-y-auto p-6 space-y-4">
			{messages.map((message) => {
				const isUser = message.role === "user";
				const timestamp = new Date(message.createdAt).toLocaleTimeString(
					"en-US",
					{
						hour: "numeric",
						minute: "2-digit",
						hour12: true,
					}
				);

				return (
					<div
						key={message._id}
						className={cn(
							"flex gap-3 group",
							isUser ? "flex-row-reverse" : "flex-row"
						)}
					>
						{/* Avatar */}
						<div
							className={cn(
								"flex-none flex items-center justify-center w-8 h-8 rounded-full",
								isUser
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground"
							)}
						>
							{isUser ? (
								<User className="h-4 w-4" />
							) : (
								<Bot className="h-4 w-4" />
							)}
						</div>

						{/* Message Bubble */}
						<div
							className={cn(
								"flex flex-col gap-1 max-w-[75%]",
								isUser ? "items-end" : "items-start"
							)}
						>
							<div
								className={cn(
									"rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap break-words",
									isUser
										? "bg-primary text-primary-foreground"
										: "bg-muted text-foreground"
								)}
							>
								{message.content}
							</div>

							{/* Timestamp (shows on hover) */}
							<div
								className={cn(
									"text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity px-1"
								)}
							>
								{timestamp}
								{message.creditsUsed && (
									<span className="ml-2">· {message.creditsUsed} credits</span>
								)}
							</div>
						</div>
					</div>
				);
			})}
			<div ref={messagesEndRef} />
		</div>
	);
}

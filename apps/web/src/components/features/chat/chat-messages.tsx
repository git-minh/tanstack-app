import { useEffect, useRef } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ChatMessagesProps {
	sessionId: Id<"chatSessions">;
}

export function ChatMessages({ sessionId }: ChatMessagesProps) {
	const hasStreamingMessage = (messages: any[]) => {
		return messages.some((msg) => msg.isStreaming === true);
	};

	const { data: messages } = useSuspenseQuery({
		...convexQuery(api.chatMessages.getMessages, { sessionId }),
		refetchInterval: (query) => {
			const data = query.state.data;
			return data && hasStreamingMessage(data) ? 100 : false;
		},
	});

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	if (!messages || messages.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-12 text-center">
				<p className="text-sm text-muted-foreground">
					Start a conversation
				</p>
			</div>
		);
	}

	return (
		<div ref={containerRef} className="h-full overflow-y-auto p-6 space-y-px">
			{messages.map((message) => {
				const isUser = message.role === "user";
				const isStreaming = message.isStreaming === true;
				const timestamp = new Date(message.createdAt).toLocaleTimeString("en-US", {
					hour: "numeric",
					minute: "2-digit",
					hour12: true,
				});

				return (
					<div
						key={message._id}
						className={cn(
							"group py-4 border-b border-border/30 last:border-0",
							isUser && "bg-foreground/5"
						)}
					>
						{/* Message Header */}
						<div className="flex items-baseline gap-3 mb-2">
							<span className="text-[10px] uppercase tracking-widest font-medium">
								{isUser ? "You" : "Assistant"}
							</span>
							<span className="text-[10px] uppercase tracking-widest text-muted-foreground">
								{timestamp}
							</span>
							{isStreaming && (
								<span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
									<Loader2 className="h-3 w-3 animate-spin" />
									Streaming
								</span>
							)}
							{message.creditsUsed && !isStreaming && (
								<span className="text-[10px] uppercase tracking-widest text-muted-foreground">
									{message.creditsUsed} credits
								</span>
							)}
						</div>

						{/* Message Content */}
						<div className="text-sm font-light whitespace-pre-wrap break-words max-w-4xl">
							{message.content || (isStreaming && (
								<span className="text-muted-foreground italic">
									Generating...
								</span>
							))}
						</div>
					</div>
				);
			})}
			<div ref={messagesEndRef} />
		</div>
	);
}

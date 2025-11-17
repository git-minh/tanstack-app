import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import { ChatSessionList } from "@/components/features/chat/chat-session-list";
import { ChatMessages } from "@/components/features/chat/chat-messages";
import { ChatInput } from "@/components/features/chat/chat-input";
import { ChatEmptyState } from "@/components/features/chat/chat-empty-state";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/_authenticated/chat")({
	component: ChatRoute,
});

function ChatRoute() {
	const isMobile = useIsMobile();
	const [activeSessionId, setActiveSessionId] = useState<Id<"chatSessions"> | null>(null);
	const [showSessions, setShowSessions] = useState(!isMobile);

	const createSession = useMutation(api.chatSessions.createSession);
	const sendMessage = useAction(api.chat.sendChatMessage);

	const handleNewChat = async () => {
		try {
			const result = await createSession({});
			if (result?._id) {
				setActiveSessionId(result._id);
				if (isMobile) setShowSessions(false);
			}
		} catch (error) {
			console.error("Failed to create chat session:", error);
		}
	};

	const handleSessionCreatedWithPrompt = async (
		sessionId: Id<"chatSessions">,
		prompt?: string
	) => {
		setActiveSessionId(sessionId);
		if (isMobile) setShowSessions(false);
		if (prompt) {
			try {
				await sendMessage({
					sessionId,
					message: prompt,
					includeContext: true,
				});
			} catch (error) {
				console.error("Failed to send initial message:", error);
			}
		}
	};

	return (
		<div className="flex h-[calc(100vh-4rem)]">
			{/* Sessions Panel */}
			{(!isMobile || showSessions) && (
				<div className="w-full md:w-80 border-r-2 border-foreground flex flex-col bg-background">
					{/* New Chat Button */}
					<div className="p-4 border-b-2 border-foreground">
						<Button
							onClick={handleNewChat}
							className="w-full rounded-none bg-foreground text-background hover:bg-foreground/90 font-light group h-9"
						>
							<Plus className="mr-2 h-4 w-4" />
							New Chat
							<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</Button>
					</div>

					{/* Session List */}
					<ChatSessionList
						activeSessionId={activeSessionId}
						onSessionSelect={(id) => {
							setActiveSessionId(id);
							if (isMobile) setShowSessions(false);
						}}
						onNewChat={handleNewChat}
					/>
				</div>
			)}

			{/* Chat Area */}
			{(!isMobile || !showSessions) && (
				<div className="flex-1 flex flex-col">
					{activeSessionId ? (
						<>
							{/* Mobile back button */}
							{isMobile && (
								<div className="p-3 border-b-2 border-foreground">
									<button
										onClick={() => setShowSessions(true)}
										className="text-xs uppercase tracking-widest font-light hover:font-normal"
									>
										← Sessions
									</button>
								</div>
							)}

							{/* Messages */}
							<div className="flex-1 overflow-hidden">
								<ChatMessages sessionId={activeSessionId} />
							</div>

							{/* Input */}
							<div className="border-t-2 border-foreground p-4">
								<ChatInput sessionId={activeSessionId} />
							</div>
						</>
					) : (
						<div className="flex-1 overflow-y-auto">
							<ChatEmptyState onSessionCreated={handleSessionCreatedWithPrompt} />
						</div>
					)}
				</div>
			)}
		</div>
	);
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatSessionList } from "@/components/features/chat/chat-session-list";
import { ChatMessages } from "@/components/features/chat/chat-messages";
import { ChatInput } from "@/components/features/chat/chat-input";
import { ChatEmptyState } from "@/components/features/chat/chat-empty-state";

export const Route = createFileRoute("/_authenticated/chat")({
	component: ChatRoute,
});

function ChatRoute() {
	const [activeSessionId, setActiveSessionId] = useState<
		Id<"chatSessions"> | null
	>(null);

	const createSession = useMutation(api.chatSessions.createSession);
	const sendMessage = useAction(api.chat.sendChatMessage);

	const handleNewChat = async () => {
		try {
			const result = await createSession({});
			if (result?._id) {
				setActiveSessionId(result._id);
			} else {
				throw new Error("Invalid session response");
			}
		} catch (error) {
			console.error("Failed to create chat session:", error);
			alert(
				`Failed to create chat: ${
					error instanceof Error
						? error.message
						: "An error occurred while creating a new chat session"
				}`
			);
		}
	};

	const handleSessionCreatedWithPrompt = async (
		sessionId: Id<"chatSessions">,
		prompt?: string
	) => {
		setActiveSessionId(sessionId);
		if (prompt) {
			// Automatically send the prompt as the first message
			try {
				await sendMessage({
					sessionId,
					message: prompt,
					includeContext: true,
				});
			} catch (error) {
				console.error("Failed to send initial message:", error);
				alert(
					`Failed to send message: ${
						error instanceof Error
							? error.message
							: "An error occurred while sending the message"
					}`
				);
			}
		}
	};

	return (
		<div className="flex flex-col h-[calc(100vh-4rem)]">
			<div className="flex-none px-6 py-4 border-b">
				<h1 className="text-2xl font-semibold">AI Chat Assistant</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Get help with your projects, tasks, and planning
				</p>
			</div>

			<div className="flex-1 overflow-hidden">
				<ResizablePanelGroup direction="horizontal" className="h-full">
					{/* Left Panel - Session List */}
					<ResizablePanel
						defaultSize={30}
						minSize={20}
						maxSize={40}
						className="border-r"
					>
						<ChatSessionList
							activeSessionId={activeSessionId}
							onSessionSelect={setActiveSessionId}
							onNewChat={handleNewChat}
						/>
					</ResizablePanel>

					<ResizableHandle withHandle />

					{/* Right Panel - Chat Area */}
					<ResizablePanel defaultSize={70} minSize={50}>
						<div className="flex flex-col h-full">
							{activeSessionId ? (
								<>
									{/* Messages Area */}
									<div className="flex-1 overflow-hidden">
										<ChatMessages sessionId={activeSessionId} />
									</div>

									{/* Input Area */}
									<div className="flex-none border-t p-4">
										<ChatInput sessionId={activeSessionId} />
									</div>
								</>
							) : (
								/* Empty State */
								<div className="flex-1 overflow-y-auto">
									<ChatEmptyState
										onSessionCreated={handleSessionCreatedWithPrompt}
									/>
								</div>
							)}
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			</div>
		</div>
	);
}

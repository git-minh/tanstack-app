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
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";
import Menu from "lucide-react/dist/esm/icons/menu";
import { ChatSessionList } from "@/components/features/chat/chat-session-list";
import { ChatMessages } from "@/components/features/chat/chat-messages";
import { ChatInput } from "@/components/features/chat/chat-input";
import { ChatEmptyState } from "@/components/features/chat/chat-empty-state";

export const Route = createFileRoute("/_authenticated/chat")({
	component: ChatRoute,
});

function ChatRoute() {
	const isMobile = useMobile();
	const [activeSessionId, setActiveSessionId] = useState<
		Id<"chatSessions"> | null
	>(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
			<div className="flex-none px-4 sm:px-6 py-4 border-b">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl sm:text-2xl font-semibold">
							AI Chat Assistant
						</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Get help with your projects, tasks, and planning
						</p>
					</div>
					{/* Mobile menu button */}
					{isMobile && (
						<Button
							variant="outline"
							size="icon"
							onClick={() => setMobileMenuOpen(true)}
							aria-label="Open chat sessions menu"
						>
							<Menu className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>

			<div className="flex-1 overflow-hidden">
				{isMobile ? (
					/* Mobile Layout */
					<>
						{/* Mobile Session List Sheet */}
						<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
							<SheetContent side="left" className="w-[80vw] p-0">
								<SheetHeader className="px-4 py-3 border-b">
									<SheetTitle>Chat Sessions</SheetTitle>
								</SheetHeader>
								<ChatSessionList
									activeSessionId={activeSessionId}
									onSessionSelect={(id) => {
										setActiveSessionId(id);
										setMobileMenuOpen(false);
									}}
									onNewChat={async () => {
										await handleNewChat();
										setMobileMenuOpen(false);
									}}
								/>
							</SheetContent>
						</Sheet>

						{/* Mobile Chat Area */}
						<div className="flex flex-col h-full">
							{activeSessionId ? (
								<>
									{/* Messages Area */}
									<div className="flex-1 overflow-hidden">
										<ChatMessages sessionId={activeSessionId} />
									</div>

									{/* Input Area */}
									<div className="flex-none border-t p-3">
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
					</>
				) : (
					/* Desktop Layout */
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
				)}
			</div>
		</div>
	);
}

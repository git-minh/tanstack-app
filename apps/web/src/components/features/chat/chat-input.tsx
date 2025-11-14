import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Sparkles } from "lucide-react";
import { CREDIT_COSTS } from "@tanstack/backend/convex/credits";

interface ChatInputProps {
	sessionId: Id<"chatSessions">;
}

export function ChatInput({ sessionId }: ChatInputProps) {
	const [message, setMessage] = useState("");
	const [includeContext, setIncludeContext] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const { data: credits } = useSuspenseQuery(
		convexQuery(api.credits.getUserCredits, {})
	);

	const sendMessage = useAction(api.chat.sendChatMessage);

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			const scrollHeight = textareaRef.current.scrollHeight;
			const maxHeight = 5 * 24; // 5 lines * 24px line height
			textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
		}
	}, [message]);

	const handleSend = async () => {
		if (!message.trim() || isLoading) return;

		// Check credits
		if (!credits.isUnlimited && credits.creditsRemaining < CREDIT_COSTS.CHAT_MESSAGE) {
			alert(
				`Insufficient credits: You need ${CREDIT_COSTS.CHAT_MESSAGE} credits to send a message. Upgrade to Pro for unlimited credits.`
			);
			return;
		}

		setIsLoading(true);
		const userMessage = message;
		setMessage(""); // Clear input immediately for better UX

		try {
			await sendMessage({
				sessionId,
				message: userMessage,
				includeContext,
			});
		} catch (error) {
			console.error("Failed to send message:", error);
			alert(
				`Failed to send message: ${
					error instanceof Error ? error.message : "An error occurred"
				}`
			);
			// Restore message on error
			setMessage(userMessage);
		} finally {
			setIsLoading(false);
			textareaRef.current?.focus();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const isDisabled = isLoading || !message.trim() || (!credits.isUnlimited && credits.creditsRemaining < CREDIT_COSTS.CHAT_MESSAGE);

	return (
		<div className="space-y-3">
			{/* Credit Indicator */}
			<div className="flex items-center justify-between text-xs text-muted-foreground px-1">
				<div className="flex items-center gap-2">
					<Sparkles className="h-3.5 w-3.5" />
					<span>
						{credits.isUnlimited
							? "Unlimited credits"
							: `${credits.creditsRemaining} credits remaining · ${CREDIT_COSTS.CHAT_MESSAGE} per message`}
					</span>
				</div>
				{!credits.isUnlimited && credits.creditsRemaining < CREDIT_COSTS.CHAT_MESSAGE && (
					<span className="text-destructive font-medium">
						Insufficient credits
					</span>
				)}
			</div>

			{/* Context Toggle */}
			<div className="flex items-center space-x-2 px-1">
				<Checkbox
					id="include-context"
					checked={includeContext}
					onCheckedChange={(checked) => setIncludeContext(checked === true)}
				/>
				<Label
					htmlFor="include-context"
					className="text-sm text-muted-foreground cursor-pointer"
				>
					Include my projects and tasks as context
				</Label>
			</div>

			{/* Input Area */}
			<div className="flex gap-2">
				<Textarea
					ref={textareaRef}
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Ask me anything..."
					className="min-h-[44px] max-h-[120px] resize-none"
					disabled={isLoading}
				/>
				<Button
					onClick={handleSend}
					disabled={isDisabled}
					size="icon"
					className="flex-none h-[44px] w-[44px]"
				>
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Send className="h-4 w-4" />
					)}
				</Button>
			</div>

			{/* Keyboard Shortcut Hint */}
			<div className="text-xs text-muted-foreground text-center px-1">
				Press <kbd className="px-1.5 py-0.5 rounded bg-muted">Enter</kbd> to
				send, <kbd className="px-1.5 py-0.5 rounded bg-muted">Shift+Enter</kbd>{" "}
				for new line
			</div>
		</div>
	);
}

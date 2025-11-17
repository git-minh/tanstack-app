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
import { ArrowRight, Loader2 } from "lucide-react";
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

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			const scrollHeight = textareaRef.current.scrollHeight;
			const maxHeight = 5 * 24;
			textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
		}
	}, [message]);

	const handleSend = async () => {
		if (!message.trim() || isLoading) return;

		if (!credits.isUnlimited && credits.creditsRemaining < CREDIT_COSTS.CHAT_MESSAGE) {
			alert(`Need ${CREDIT_COSTS.CHAT_MESSAGE} credits. Upgrade to Pro for unlimited.`);
			return;
		}

		setIsLoading(true);
		const userMessage = message;
		setMessage("");

		try {
			await sendMessage({
				sessionId,
				message: userMessage,
				includeContext,
			});
		} catch (error) {
			console.error("Failed to send message:", error);
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
			{/* Context Toggle */}
			<div className="flex items-center gap-2">
				<Checkbox
					id="include-context"
					checked={includeContext}
					onCheckedChange={(checked) => setIncludeContext(checked === true)}
					className="rounded-none border-foreground"
				/>
				<Label
					htmlFor="include-context"
					className="text-[10px] uppercase tracking-widest text-muted-foreground cursor-pointer font-light"
				>
					Include projects & tasks
				</Label>
			</div>

			{/* Input Area */}
			<div className="flex gap-2">
				<Textarea
					ref={textareaRef}
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Ask anything..."
					className="min-h-[44px] max-h-[120px] resize-none rounded-none border-foreground font-light"
					disabled={isLoading}
				/>
				<Button
					onClick={handleSend}
					disabled={isDisabled}
					className="flex-none rounded-none bg-foreground text-background hover:bg-foreground/90 font-light group h-[44px] px-4"
				>
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
					)}
				</Button>
			</div>

			{/* Credit Info */}
			<div className="text-[10px] uppercase tracking-widest text-muted-foreground">
				{credits.isUnlimited
					? "Unlimited credits"
					: `${credits.creditsRemaining} credits · ${CREDIT_COSTS.CHAT_MESSAGE} per message`}
				{!credits.isUnlimited && credits.creditsRemaining < CREDIT_COSTS.CHAT_MESSAGE && (
					<span className="text-destructive ml-2">· Insufficient</span>
				)}
			</div>
		</div>
	);
}

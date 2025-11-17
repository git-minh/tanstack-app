import { useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";

interface ChatEmptyStateProps {
	onSessionCreated: (sessionId: Id<"chatSessions">, prompt?: string) => void;
}

const SUGGESTED_PROMPTS = [
	{
		title: "Help me plan a project",
		prompt: "I need help planning and organizing a new project. Can you guide me through the process?",
	},
	{
		title: "What should I work on next?",
		prompt: "Based on my current tasks and projects, what should I prioritize and work on next?",
	},
	{
		title: "Explain my current tasks",
		prompt: "Can you give me an overview of my current tasks and how they relate to each other?",
	},
];

export function ChatEmptyState({ onSessionCreated }: ChatEmptyStateProps) {
	const createSession = useMutation(api.chatSessions.createSession);

	const handlePromptClick = async (prompt: string, title: string) => {
		const result = await createSession({ title });
		onSessionCreated(result._id, prompt);
	};

	return (
		<div className="flex flex-col h-full p-12 max-w-3xl mx-auto">
			<div className="mb-12">
				<h2 className="text-2xl font-light tracking-tight mb-3">
					Start a conversation
				</h2>
				<p className="text-sm text-muted-foreground font-light">
					AI assistant for project planning, task management, and productivity
				</p>
			</div>

			{/* Suggested Prompts */}
			<div className="space-y-px mb-12">
				<p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
					Suggested Prompts
				</p>
				{SUGGESTED_PROMPTS.map((item) => (
					<button
						key={item.title}
						onClick={() => handlePromptClick(item.prompt, item.title)}
						className="w-full text-left p-4 border-b border-border/30 hover:pl-6 hover:bg-foreground/5 transition-all group"
					>
						<h3 className="font-light text-sm mb-2">{item.title}</h3>
						<p className="text-xs text-muted-foreground font-light line-clamp-2">
							{item.prompt}
						</p>
					</button>
				))}
			</div>

			{/* Context Info */}
			<div className="p-4 border-2 border-dashed border-border">
				<p className="text-xs text-muted-foreground font-light">
					Enable "Include projects & tasks" to get personalized recommendations
					based on your current work
				</p>
			</div>
		</div>
	);
}

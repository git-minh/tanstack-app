import { useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Sparkles, Calendar, ListChecks } from "lucide-react";

interface ChatEmptyStateProps {
	onSessionCreated: (sessionId: Id<"chatSessions">, prompt?: string) => void;
}

const SUGGESTED_PROMPTS = [
	{
		icon: Calendar,
		title: "Help me plan a project",
		prompt: "I need help planning and organizing a new project. Can you guide me through the process?",
	},
	{
		icon: ListChecks,
		title: "What should I work on next?",
		prompt: "Based on my current tasks and projects, what should I prioritize and work on next?",
	},
	{
		icon: Sparkles,
		title: "Explain my current tasks",
		prompt: "Can you give me an overview of my current tasks and how they relate to each other?",
	},
];

export function ChatEmptyState({ onSessionCreated }: ChatEmptyStateProps) {
	const createSession = useMutation(api.chatSessions.createSession);

	const handlePromptClick = async (prompt: string, title: string) => {
		// Create new session with the prompt as title
		const result = await createSession({ title });
		// Pass both session ID and prompt to parent
		onSessionCreated(result._id, prompt);
	};

	return (
		<div className="flex flex-col items-center justify-center h-full p-6 max-w-3xl mx-auto">
			<div className="text-center mb-8">
				<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
					<MessageSquare className="h-8 w-8 text-primary" />
				</div>
				<h2 className="text-2xl font-semibold mb-2">
					Start a new conversation
				</h2>
				<p className="text-muted-foreground max-w-md mx-auto">
					I'm your AI assistant, ready to help you with project planning, task
					management, and productivity insights.
				</p>
			</div>

			{/* Suggested Prompts */}
			<div className="w-full space-y-3 mb-8">
				<p className="text-sm font-medium text-muted-foreground mb-3">
					Suggested prompts:
				</p>
				<div className="grid gap-3">
					{SUGGESTED_PROMPTS.map((item) => (
						<Card
							key={item.title}
							className="p-4 cursor-pointer hover:bg-accent transition-colors group"
							onClick={() => handlePromptClick(item.prompt, item.title)}
						>
							<div className="flex items-start gap-3">
								<div className="flex-none mt-0.5">
									<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
										<item.icon className="h-4 w-4 text-primary" />
									</div>
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="font-medium text-sm mb-1">{item.title}</h3>
									<p className="text-sm text-muted-foreground line-clamp-2">
										{item.prompt}
									</p>
								</div>
							</div>
						</Card>
					))}
				</div>
			</div>

			{/* Context Feature Explanation */}
			<Card className="w-full p-4 bg-muted/50 border-dashed">
				<div className="flex items-start gap-3">
					<Sparkles className="h-5 w-5 text-primary flex-none mt-0.5" />
					<div className="flex-1">
						<h4 className="font-medium text-sm mb-1">Context-aware assistance</h4>
						<p className="text-xs text-muted-foreground">
							Toggle "Include my projects and tasks as context" when sending
							messages to get personalized recommendations based on your current
							work.
						</p>
					</div>
				</div>
			</Card>
		</div>
	);
}

import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { Link } from "@tanstack/react-router";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Plus from "lucide-react/dist/esm/icons/plus";
import Clock from "lucide-react/dist/esm/icons/clock";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export function QuickChatCard() {
	const { data } = useSuspenseQuery(
		convexQuery(api.chatSessions.getSessions, { limit: 3 })
	);

	const recentSessions = data.sessions || [];

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<MessageSquare className="h-5 w-5" />
							Quick Chat
						</CardTitle>
						<CardDescription>Recent AI conversations</CardDescription>
					</div>
					<Button size="sm" asChild>
						<Link to="/chat">
							<Plus className="mr-2 h-4 w-4" />
							New Chat
						</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{recentSessions.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<MessageSquare className="mb-2 h-12 w-12 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							No chat sessions yet
						</p>
						<Button size="sm" className="mt-4" asChild>
							<Link to="/chat">Start your first chat</Link>
						</Button>
					</div>
				) : (
					<div className="space-y-3">
						{recentSessions.map((session) => (
							<Link
								key={session._id}
								to="/chat"
								search={{ sessionId: session._id }}
								className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
							>
								<MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
								<div className="flex-1 space-y-1">
									<p className="text-sm font-medium leading-none">
										{session.title}
									</p>
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<Clock className="h-3 w-3" />
										{formatDistanceToNow(session.updatedAt, { addSuffix: true })}
										{session.messageCount > 0 && (
											<span>• {session.messageCount} messages</span>
										)}
									</div>
								</div>
							</Link>
						))}
						{recentSessions.length >= 3 && (
							<Button variant="ghost" size="sm" className="w-full" asChild>
								<Link to="/chat">View all chats</Link>
							</Button>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

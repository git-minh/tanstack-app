import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { Separator } from "@/components/ui/separator";

interface AppShellProps {
	children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
	return (
		<>
			<AppSidebar />
			<SidebarInset className="flex flex-col">
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					<div className="flex-1" />
				</header>
				<main className="flex-1 p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
					{children}
				</main>
			</SidebarInset>
		</>
	);
}

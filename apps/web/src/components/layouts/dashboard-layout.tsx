import { AppShell } from "@/components/layouts/app-shell";

interface DashboardLayoutProps {
	children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
	return <AppShell>{children}</AppShell>;
}

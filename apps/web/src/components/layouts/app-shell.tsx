import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { CreditBalance } from "@/components/features/credits/credit-balance";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AppShellProps {
	children: React.ReactNode;
	fixed?: boolean;
	fluid?: boolean;
}

export function AppShell({ children, fixed = false, fluid = false }: AppShellProps) {
	return (
		<>
			<Header fixed={fixed}>
				<ThemeToggle />
				<div className="h-3 w-px bg-border/50" />
				<CreditBalance />
			</Header>
			<Main fixed={fixed} fluid={fluid}>
				{children}
			</Main>
		</>
	);
}

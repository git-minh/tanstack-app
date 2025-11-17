import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { CreditBalance } from "@/components/features/credits/credit-balance";

interface AppShellProps {
	children: React.ReactNode;
	fixed?: boolean;
	fluid?: boolean;
}

export function AppShell({ children, fixed = false, fluid = false }: AppShellProps) {
	return (
		<>
			<Header fixed={fixed}>
				<div className="flex-1" />
				<CreditBalance />
			</Header>
			<Main fixed={fixed} fluid={fluid}>
				{children}
			</Main>
		</>
	);
}

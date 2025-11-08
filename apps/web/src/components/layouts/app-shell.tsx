import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { GlobalSearch } from "@/components/global-search";

interface AppShellProps {
	children: React.ReactNode;
	fixed?: boolean;
	fluid?: boolean;
}

export function AppShell({ children, fixed = false, fluid = false }: AppShellProps) {
	return (
		<>
			<Header fixed={fixed}>
				<GlobalSearch />
				<div className="flex-1" />
			</Header>
			<Main fixed={fixed} fluid={fluid}>
				{children}
			</Main>
		</>
	);
}

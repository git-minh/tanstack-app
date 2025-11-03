import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { useQuery } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import { useLayout } from "@/context/layout-provider";
import { AppTitle } from "@/components/layout/app-title";
import { NavGroup } from "@/components/layout/nav-group";
import { NavUser } from "@/components/layout/nav-user";
import { getSidebarData } from "@/components/layout/data/sidebar-data";

export function AppSidebar() {
	const { collapsible, variant } = useLayout();
	const user = useQuery(api.auth.getCurrentUser);

	// Get sidebar data with user information
	const sidebarData = getSidebarData({
		name: user?.name || "User",
		email: user?.email || "",
		image: user?.image,
	});

	return (
		<Sidebar collapsible={collapsible} variant={variant}>
			<SidebarHeader>
				<AppTitle />
			</SidebarHeader>
			<SidebarContent>
				{sidebarData.navGroups.map((props) => (
					<NavGroup key={props.title} {...props} />
				))}
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={sidebarData.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

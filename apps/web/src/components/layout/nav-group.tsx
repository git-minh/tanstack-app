import { Link, useLocation, useRouter } from '@tanstack/react-router'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { type NavGroup as NavGroupProps } from './types'

export function NavGroup({ title, items }: NavGroupProps) {
  const { setOpenMobile } = useSidebar()
  const href = useLocation({ select: (location) => location.href })
  const router = useRouter()

  const handleMouseEnter = (url: string) => {
    router.preloadRoute({ to: url }).catch(() => {
      // Silently ignore preload errors
    })
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className='text-xs uppercase tracking-widest text-muted-foreground font-medium'>
        {title}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // Only render top-level items (no nested menus for ultra-minimalism)
          if (item.items) return null

          const isActive = href === item.url || href.split('?')[0] === item.url
          const key = `${item.title}-${item.url}`

          return (
            <SidebarMenuItem key={key}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className='font-light hover:font-normal transition-all'
              >
                <Link
                  to={item.url}
                  onClick={() => setOpenMobile(false)}
                  onMouseEnter={() => handleMouseEnter(item.url)}
                >
                  <span className='text-sm'>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

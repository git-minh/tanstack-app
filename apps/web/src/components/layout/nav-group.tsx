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
import { cn } from '@/lib/utils'

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
      {title && (
        <SidebarGroupLabel className='text-[10px] uppercase tracking-widest text-muted-foreground font-light'>
          {title}
        </SidebarGroupLabel>
      )}
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
                className={cn(
                  // Ultra-minimalist base styles
                  'rounded-none',
                  'text-[11px] uppercase tracking-wider font-light',

                  // Hover: pure typography, no background
                  'hover:bg-transparent hover:font-normal transition-all',

                  // Active state: border + typography only (override shadcn defaults)
                  'data-[active=true]:bg-transparent',
                  'data-[active=true]:text-foreground',
                  isActive && 'border-l-2 border-l-foreground font-normal'
                )}
              >
                <Link
                  to={item.url}
                  onClick={() => setOpenMobile(false)}
                  onMouseEnter={() => handleMouseEnter(item.url)}
                  className='flex items-center gap-2'
                >
                  {item.symbol && (
                    <div className='h-4 w-4 border border-foreground flex items-center justify-center flex-shrink-0'>
                      <span className='text-[8px] font-bold leading-none'>{item.symbol}</span>
                    </div>
                  )}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

import { useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
}

// Route path to title mapping
const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks',
  '/projects': 'Projects',
  '/contacts': 'Contacts',
  '/chat': 'Chat',
  '/pricing': 'Pricing',
  '/': 'Home',
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)
  const [mounted, setMounted] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMounted(true)
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    document.addEventListener('scroll', onScroll, { passive: true })
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  // Calculate scroll-based effects
  const scrollProgress = Math.min(offset / 100, 1) // 0 to 1 over 100px
  const borderWidth = 1 + Math.floor(scrollProgress * 3) // 1px to 4px
  const shadowIntensity = scrollProgress * 0.12 // 0 to 0.12
  const blurAmount = Math.floor(scrollProgress * 8) // 0 to 8px

  // Get current page title
  const currentPath = location.pathname
  const pageTitle = routeTitles[currentPath] || 'App'

  return (
    <header
      className={cn(
        'z-50 transition-all duration-300',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        className
      )}
      style={{
        borderBottom: `${borderWidth}px solid var(--border)`,
        boxShadow: `0 ${borderWidth}px ${borderWidth * 2}px 0 hsl(0 0% 0% / ${shadowIntensity})`,
        backdropFilter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
        backgroundColor: blurAmount > 0 ? 'var(--background)' : 'var(--background)',
        height: offset > 100 ? '3.5rem' : '3.5rem',
      }}
      {...props}
    >
      <div
        className={cn(
          'relative flex h-full items-center gap-4 px-4',
          'transition-opacity duration-500',
          mounted ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Navigation Section */}
        <div className="flex items-center gap-3">
          {/* Sidebar Trigger */}
          <SidebarTrigger className="-ml-1 h-7 w-7" />

          {/* Divider */}
          <div className="h-4 w-px bg-border opacity-60" />
        </div>

        {/* Page Title Section - with subtle frame */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 border border-border/40 bg-muted/30">
          {/* Route Indicator */}
          <div className="flex flex-col justify-center gap-0.5">
            <div className="font-mono text-[7px] uppercase tracking-[0.25em] font-medium opacity-30 leading-none">
              CURRENT
            </div>
            <div className="text-[15px] font-medium tracking-[-0.01em] leading-none">
              {pageTitle}
            </div>
          </div>
        </div>

        {/* Mobile Page Title - simplified */}
        <div className="flex sm:hidden items-center">
          <div className="text-[15px] font-medium tracking-[-0.01em] leading-none">
            {pageTitle}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions Section */}
        <div className="flex items-center gap-3">
          {/* Divider before credits - hidden on mobile */}
          <div className="hidden sm:block h-4 w-px bg-border opacity-60" />

          {/* Children (Credit Balance, etc) */}
          {children}
        </div>
      </div>
    </header>
  )
}

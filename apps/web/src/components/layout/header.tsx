import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    document.addEventListener('scroll', onScroll, { passive: true })
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'z-50 h-14 border-b border-border',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit] bg-background',
        className
      )}
      {...props}
    >
      <div className={cn('relative flex h-full items-center gap-4 px-4')}>
        <SidebarTrigger className="-ml-1 h-7 w-7" />
        <div className="h-3 w-px bg-border" />
        {children}
      </div>
    </header>
  )
}

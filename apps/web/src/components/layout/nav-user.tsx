import { useState } from 'react'
import LogOut from 'lucide-react/dist/esm/icons/log-out'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { SignOutDialog } from '@/components/sign-out-dialog'

type NavUserProps = {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='hover:bg-transparent data-[state=open]:bg-transparent'
              >
                <div className='h-8 w-8 border-2 border-foreground flex items-center justify-center'>
                  <span className='text-xs font-bold'>{initials}</span>
                </div>
                <div className='flex-1 text-start'>
                  <div className='text-xs font-medium truncate'>{user.name}</div>
                  <div className='text-[10px] text-muted-foreground truncate'>
                    {user.email}
                  </div>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-48 rounded-none border-2 border-foreground'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
            >
              <DropdownMenuLabel className='font-light'>
                <div className='text-xs uppercase tracking-widest'>Account</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={toggleTheme}
                className='gap-2 font-light cursor-pointer'
              >
                {theme === 'dark' ? (
                  <Moon className='h-3.5 w-3.5' strokeWidth={1.5} />
                ) : (
                  <Sun className='h-3.5 w-3.5' strokeWidth={1.5} />
                )}
                <span className='text-xs flex-1'>Theme</span>
                <span className='text-[9px] uppercase tracking-wider opacity-60'>
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setOpen(true)}
                className='font-light'
              >
                <LogOut className='h-3.5 w-3.5' />
                <span className='text-xs'>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

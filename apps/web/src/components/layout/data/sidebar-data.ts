import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard'
import ListTodo from 'lucide-react/dist/esm/icons/list-todo'
import CheckSquare from 'lucide-react/dist/esm/icons/check-square'
import Users from 'lucide-react/dist/esm/icons/users'
import FolderKanban from 'lucide-react/dist/esm/icons/folder-kanban'
import CreditCard from 'lucide-react/dist/esm/icons/credit-card'
import MessageSquare from 'lucide-react/dist/esm/icons/message-square'
import Palette from 'lucide-react/dist/esm/icons/palette'
import { type SidebarData } from '../types'

/**
 * Get sidebar data with user information
 * This should be called with user data from Convex
 */
export function getSidebarData(user: {
  name: string
  email: string
  image?: string
}): SidebarData {
  return {
    user: {
      name: user.name || 'User',
      email: user.email || '',
      avatar: user.image || '',
    },
    navGroups: [
      {
        title: 'General',
        items: [
          {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            title: 'Chat',
            url: '/chat',
            icon: MessageSquare,
          },
          {
            title: 'Projects',
            url: '/projects',
            icon: FolderKanban,
          },
          {
            title: 'Design References',
            url: '/design-references',
            icon: Palette,
          },
          {
            title: 'Tasks',
            url: '/tasks',
            icon: CheckSquare,
          },
          {
            title: 'Contacts',
            url: '/contacts',
            icon: Users,
          },
          {
            title: 'Todos',
            url: '/todos',
            icon: ListTodo,
          },
          {
            title: 'Pricing',
            url: '/pricing',
            icon: CreditCard,
          },
        ],
      },
    ],
  }
}

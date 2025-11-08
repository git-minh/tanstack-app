import { LayoutDashboard, ListTodo, CheckSquare, Users } from 'lucide-react'
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
        ],
      },
    ],
  }
}

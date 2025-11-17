import { type SidebarData } from '../types'

/**
 * Geometric symbols for ultra-minimalist navigation
 * Pure shapes that match the border-only logo aesthetic
 */
const ICONS = {
  dashboard: '□',
  projects: '△',
  tasks: '▢',
  todos: '·',
  chat: '○',
  contacts: '◎',
  designReferences: '◇',
  pricing: '▭',
} as const

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
        title: 'Workspace',
        items: [
          {
            title: 'Dashboard',
            url: '/dashboard',
            symbol: ICONS.dashboard,
          },
          {
            title: 'Projects',
            url: '/projects',
            symbol: ICONS.projects,
          },
          {
            title: 'Tasks',
            url: '/tasks',
            symbol: ICONS.tasks,
          },
          {
            title: 'Todos',
            url: '/todos',
            symbol: ICONS.todos,
          },
        ],
      },
      {
        title: 'Resources',
        items: [
          {
            title: 'Chat',
            url: '/chat',
            symbol: ICONS.chat,
          },
          {
            title: 'Contacts',
            url: '/contacts',
            symbol: ICONS.contacts,
          },
          {
            title: 'Design References',
            url: '/design-references',
            symbol: ICONS.designReferences,
          },
        ],
      },
      {
        title: '',
        items: [
          {
            title: 'Pricing',
            url: '/pricing',
            symbol: ICONS.pricing,
          },
        ],
      },
    ],
  }
}

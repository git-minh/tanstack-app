# Tech Stack Overview

This is a modern full-stack TanStack application built as a monorepo with cutting-edge technologies.

## Architecture

```
tanstack/
├── apps/
│   └── web/                 # Frontend application
├── packages/
│   └── backend/            # Convex backend
└── docs/                   # Documentation
```

## Frontend (apps/web)

### Core Framework
- **TanStack Start** - Full-stack React framework with SSR/SSG
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript** - Type-safe development

### UI & Styling
- **Tailwind CSS v4.1.3** - Modern utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Radix UI** - Accessible primitive components
- **Lucide React** - Icon library
- **next-themes** - Dark mode support

### Routing & State Management
- **TanStack Router** - File-based routing with type safety
- **TanStack Query** - Server state management
- **TanStack React Form** - Form management with Zod validation

### Development Tools
- **Vite** - Fast build tool and dev server
- **Vitest** - Testing framework
- **TypeScript** - Static type checking

### Deployment
- **Cloudflare Workers** - Edge computing platform
- **Wrangler** - Cloudflare deployment CLI

## Backend (packages/backend)

### Database & Backend
- **Convex** - Real-time database with serverless functions
- **Better Auth** - Modern authentication solution
- **@convex-dev/better-auth** - Convex integration for Better Auth

### Runtime
- **Node.js Compatible** - Runs on Convex's JavaScript environment

## Development Infrastructure

### Monorepo Management
- **pnpm Workspaces** - Package management with workspace support
- **Turborepo** - Build system orchestration
- **Catalog Dependencies** - Centralized dependency management

### Package Management
- **pnpm** - Fast, disk space efficient package manager
- **Version Catalog** - Shared dependency versions across workspaces

## Key Features

### 🚀 Performance
- **Edge Deployment** - Cloudflare Workers for global low latency
- **SSR/SSG** - Server-side rendering and static generation
- **Real-time** - Convex provides real-time data synchronization

### 🔧 Developer Experience
- **Type Safety** - End-to-end TypeScript support
- **Hot Reload** - Fast development feedback loops
- **Code Generation** - Automatic type generation for routes and API

### 🎨 Modern UI
- **Component Library** - shadcn/ui with Radix primitives
- **Dark Mode** - Built-in theme switching
- **Responsive Design** - Mobile-first approach

### 🔐 Authentication
- **Better Auth** - Modern, secure authentication
- **Session Management** - Secure session handling
- **Social Providers** - OAuth integration support

## Deployment Target

- **Frontend**: Cloudflare Workers/Pages
- **Backend**: Convex (serverless database + functions)
- **CI/CD**: GitHub Actions (typical setup)

This stack represents the current best practices for modern full-stack web development, focusing on performance, developer experience, and scalability.

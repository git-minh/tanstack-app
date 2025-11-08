# TanStack App

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/git-minh/tanstack-app?utm_source=oss&utm_medium=github&utm_campaign=git-minh%2Ftanstack-app&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TanStack](https://img.shields.io/badge/TanStack-Start-FF4154?logo=tanstack&logoColor=white)](https://tanstack.com/start)
[![Convex](https://img.shields.io/badge/Convex-Backend-F46C1C?logo=convex&logoColor=white)](https://convex.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-10.16.1-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Vitest](https://img.shields.io/badge/Vitest-Testing-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build/)
[![CircleCI](https://img.shields.io/badge/CircleCI-CI/CD-343434?logo=circleci&logoColor=white)](https://circleci.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

A modern, full-stack TypeScript application built with React, TanStack Start, and Convex. Features hierarchical data management, real-time updates, and a production-ready authentication system.

Built with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) - a modern TypeScript stack combining the best tools for full-stack development.

## ✨ Features

### Core Stack
- **TypeScript** - End-to-end type safety across frontend and backend
- **TanStack Start** - Modern SSR framework with file-based routing
- **TanStack Router** - Type-safe routing with built-in code splitting
- **React 19** - Latest React with server components support
- **TailwindCSS v4** - Modern utility-first CSS with custom design tokens
- **shadcn/ui** - Beautiful, accessible UI components built with Radix UI
- **Convex** - Reactive serverless database with real-time subscriptions
- **Better-Auth** - Secure authentication with session management
- **Turborepo** - Optimized monorepo build system with intelligent caching
- **Vitest** - Fast unit testing with React Testing Library

### Application Features
- 🔐 **Authentication** - Secure user authentication with Better-Auth + Convex integration
- 📋 **Task Management** - Full CRUD with advanced filtering, sorting, and bulk operations
- 🗂️ **Project Management** - Hierarchical projects with unlimited nesting (subprojects)
- 👥 **Contact Management** - Organize and manage contacts with search
- 🔍 **Global Search** - Keyboard-first search (Cmd/K) across all entities
- 🌳 **Hierarchical Data** - Parent-child relationships with tree views
- 🎨 **Theme System** - Light/dark mode with professional design tokens
- 📱 **Responsive Design** - Mobile-first UI with adaptive layouts
- 🚀 **Real-time Updates** - Live data synchronization via Convex subscriptions
- ⚡ **Server-Side Rendering** - Fast initial page loads with TanStack Start
- 🔄 **CI/CD Pipeline** - Automated testing and deployment via CircleCI

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 20.x or higher
- **pnpm** 10.16.1 (automatically managed via corepack)
- **Git** for version control

## 🚀 Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Convex Setup

This project uses Convex as the backend. Set up your Convex project:

```bash
pnpm dev:setup
```

Follow the interactive prompts to:
1. Create a new Convex project (or link existing one)
2. Configure your deployment
3. Set up environment variables

### 3. Environment Configuration

Create a `.env.local` file in `apps/web/`:

```env
VITE_CONVEX_URL=https://your-project.convex.cloud
```

Set backend environment variables via Convex CLI:

```bash
npx convex env set SITE_URL http://localhost:3001
npx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)
```

For complete environment setup, see [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

### 4. Start Development Server

```bash
pnpm dev
```

This starts both frontend and backend:
- **Frontend**: http://localhost:3001
- **Backend**: Convex cloud development deployment

The app will hot-reload on changes and automatically sync schema updates.

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage report
pnpm test:coverage

# Interactive test UI
cd apps/web && pnpm test:ui

# Run single test file
cd apps/web && pnpm test -- run src/path/to/test.test.ts
```

## 🏗️ Project Structure

```
tanstack-app/
├── apps/
│   └── web/                    # Frontend application
│       ├── src/
│       │   ├── routes/         # File-based routing
│       │   │   ├── _authenticated/  # Protected routes
│       │   │   ├── _auth/           # Auth routes
│       │   │   └── __root.tsx       # Root layout
│       │   ├── components/
│       │   │   ├── ui/              # shadcn/ui components
│       │   │   ├── features/        # Feature components
│       │   │   ├── layouts/         # Layout components
│       │   │   └── navigation/      # Navigation components
│       │   ├── lib/                 # Utilities and config
│       │   └── hooks/               # Custom React hooks
│       └── vitest.config.ts    # Test configuration
│
├── packages/
│   └── backend/                # Convex backend
│       └── convex/
│           ├── schema.ts       # Database schema
│           ├── tasks.ts        # Task queries/mutations
│           ├── projects.ts     # Project queries/mutations
│           ├── contacts.ts     # Contact queries/mutations
│           ├── search.ts       # Global search
│           ├── hierarchy.ts    # Hierarchy utilities
│           ├── counters.ts     # Display ID generation
│           ├── auth.ts         # Auth configuration
│           └── http.ts         # HTTP routes
│
├── docs/                       # Comprehensive documentation
│   ├── README.md              # Quick start guide
│   ├── TECH_STACK.md          # Technology breakdown
│   ├── DEVELOPMENT.md         # Development workflow
│   ├── ENVIRONMENT.md         # Environment setup
│   └── DEPLOYMENT.md          # Deployment guide
│
├── .circleci/
│   └── config.yml             # CI/CD pipeline
├── CLAUDE.md                  # AI assistant guidance
├── turbo.json                 # Turborepo configuration
└── package.json               # Root package configuration
```

## 📜 Available Scripts

### Development
```bash
pnpm dev              # Start all (frontend + backend)
pnpm dev:web          # Frontend only (port 3001)
pnpm dev:server       # Backend only (Convex)
pnpm dev:setup        # Configure Convex project
```

### Build & Validation
```bash
pnpm build            # Build all packages
pnpm check-types      # TypeScript validation
pnpm test             # Run all tests
```

### Deployment
```bash
# Deploy to production (CircleCI handles this automatically on push to master)
cd apps/web && pnpm deploy          # Frontend to Cloudflare
cd packages/backend && npx convex deploy --yes  # Backend to Convex
```

## 🚢 Deployment

This project uses automated CI/CD via CircleCI:

1. **Push to master** triggers the pipeline
2. **Sequential deployment**: Backend (Convex) → Frontend (Cloudflare)
3. **Pipeline stages**: Install → Validate → Test → Build → Deploy

### Manual Deployment

**Backend (Convex):**
```bash
cd packages/backend
npx convex deploy --yes
```

**Frontend (Cloudflare Workers):**
```bash
cd apps/web
pnpm deploy
```

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 📖 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Quick Start](docs/README.md)** - Getting started guide
- **[Tech Stack](docs/TECH_STACK.md)** - Complete technology breakdown
- **[Development](docs/DEVELOPMENT.md)** - Development workflow and patterns
- **[Environment](docs/ENVIRONMENT.md)** - Environment variable configuration
- **[Deployment](docs/DEPLOYMENT.md)** - Production deployment guide
- **[CLAUDE.md](CLAUDE.md)** - Guidance for AI assistants working with this codebase

## 🎯 Key Features

### Task Management
- Full CRUD operations with TanStack Table
- Advanced filtering by status, priority, label, and date
- Bulk operations with multi-select
- Hierarchical subtasks with unlimited nesting
- Due date tracking with overdue indicators
- Real-time statistics dashboard

### Project Management
- Hierarchical projects with subprojects
- Tree view with expand/collapse
- Human-readable IDs (e.g., PRJ-001)
- Status inheritance for project hierarchies
- Navigate by display ID
- Bulk operations respecting hierarchy

### Global Search
- Keyboard shortcut (Cmd/K or Ctrl/K)
- Search across tasks, projects, and contacts
- Instant results with type categorization
- Navigate directly to results

### Authentication
- Secure session management
- Protected routes with automatic redirects
- Server-side auth validation
- User profile with avatar support

## 🛠️ Tech Stack Details

### Frontend Architecture
- **Routing**: File-based with TanStack Router (type-safe)
- **Data Fetching**: React Query + Convex (real-time subscriptions)
- **Styling**: TailwindCSS v4 with custom OKLCH design tokens
- **Components**: shadcn/ui with Radix UI primitives
- **Forms**: React Hook Form + Zod validation
- **State**: React hooks + TanStack Router context

### Backend Architecture
- **Database**: Convex (serverless, real-time)
- **Queries**: Reactive subscriptions with automatic invalidation
- **Auth**: Better-Auth with Convex integration
- **Schema**: TypeScript-first with automatic type generation
- **Functions**: Queries (read), Mutations (write), Actions (external APIs)

### Development Tools
- **Monorepo**: Turborepo with intelligent caching
- **Package Manager**: pnpm with workspaces
- **Testing**: Vitest + React Testing Library
- **Type Checking**: TypeScript strict mode
- **CI/CD**: CircleCI with multi-layer caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Check types (`pnpm check-types`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📝 License

This project is private and not licensed for public use.

## 🙏 Acknowledgments

- Built with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Convex](https://convex.dev/) and [TanStack](https://tanstack.com/)

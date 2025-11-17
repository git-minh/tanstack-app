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

A production-ready full-stack TypeScript application with AI-powered features, real-time data synchronization, and hierarchical data management. Built with React 19, TanStack Start, and Convex.

## Features

### Core Stack
- **TypeScript** - End-to-end type safety across frontend and backend
- **TanStack Start** - Modern SSR framework with file-based routing
- **React 19** - Latest React with concurrent features
- **Convex** - Reactive serverless database with real-time subscriptions
- **Better-Auth** - Secure authentication with session management
- **TailwindCSS v4** - Utility-first CSS with custom design tokens
- **shadcn/ui** - Accessible UI components built with Radix UI
- **Turborepo** - Optimized monorepo with intelligent caching

### Application Features
- **AI Chat Assistant** - Real-time streaming chat with Azure OpenAI integration
- **AI Project Generation** - Generate projects from natural language descriptions
- **Task Management** - Hierarchical tasks with advanced filtering and bulk operations
- **Project Management** - Nested projects with tree views and status inheritance
- **Contact Management** - Categorized contacts with search
- **Global Search** - Keyboard-first search (Cmd/K) across all entities
- **Credit System** - Usage-based billing with Autumn integration
- **Real-time Updates** - Live data synchronization via Convex subscriptions
- **Server-Side Rendering** - Fast initial loads with TanStack Start
- **Theme System** - Light/dark mode with OKLCH color space
- **Responsive Design** - Mobile-first adaptive layouts
- **CI/CD Pipeline** - Automated deployment via CircleCI

## Prerequisites

- **Node.js** 20.x or higher
- **pnpm** 10.16.1 (managed via corepack)
- **Git** for version control

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Convex Setup

```bash
pnpm dev:setup
```

Follow the prompts to create or link a Convex project.

### 3. Environment Configuration

Create `apps/web/.env.local`:

```env
VITE_CONVEX_URL=https://your-project.convex.cloud
```

Set backend environment variables:

```bash
npx convex env set SITE_URL http://localhost:3001
npx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)
```

For AI features (optional):

```bash
npx convex env set AZURE_OPENAI_ENDPOINT <endpoint>
npx convex env set AZURE_OPENAI_KEY <key>
npx convex env set AZURE_OPENAI_DEPLOYMENT <deployment-name>
```

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for complete configuration.

### 4. Start Development

```bash
pnpm dev
```

- **Frontend**: http://localhost:3001
- **Backend**: Convex cloud development

## Testing

```bash
pnpm test                 # Run all tests
pnpm test:watch           # Watch mode
pnpm test:coverage        # Coverage report

# Single test file
cd apps/web && pnpm test -- run src/path/to/test.test.ts
```

## Project Structure

```
tanstack-app/
├── apps/web/                      # Frontend (TanStack Start + React)
│   └── src/
│       ├── routes/                # File-based routing
│       │   ├── _authenticated/    # Protected routes (dashboard, tasks, projects, chat)
│       │   ├── _auth/             # Auth routes (login)
│       │   └── __root.tsx         # Root layout with auth
│       ├── components/
│       │   ├── ui/                # shadcn/ui components
│       │   ├── features/          # Feature components (tasks, projects, chat, etc.)
│       │   └── layouts/           # Layout components
│       ├── lib/                   # Utilities and configuration
│       └── hooks/                 # Custom React hooks
│
├── packages/backend/              # Backend (Convex)
│   └── convex/
│       ├── schema.ts              # Database schema
│       ├── tasks.ts               # Task operations
│       ├── projects.ts            # Project operations
│       ├── chat*.ts               # AI chat features
│       ├── ai.ts                  # AI generation
│       ├── credits.ts             # Credit system
│       ├── hierarchy.ts           # Hierarchy utilities
│       └── auth.ts                # Authentication
│
├── docs/                          # Documentation
│   ├── README.md                  # Quick start
│   ├── TECH_STACK.md              # Technology details
│   ├── DEVELOPMENT.md             # Development workflow
│   ├── ENVIRONMENT.md             # Environment setup
│   └── DEPLOYMENT.md              # Deployment guide
│
└── .circleci/config.yml           # CI/CD pipeline
```

## Scripts

### Development
```bash
pnpm dev              # Start all services
pnpm dev:web          # Frontend only
pnpm dev:server       # Backend only
pnpm dev:setup        # Configure Convex
```

### Build & Validation
```bash
pnpm build            # Build all packages
pnpm check-types      # TypeScript validation
pnpm test             # Run tests
```

### Deployment
```bash
cd apps/web && pnpm deploy                        # Frontend to Cloudflare
cd packages/backend && npx convex deploy --yes    # Backend to Convex
```

## Deployment

Automated via CircleCI on push to master:

1. Install dependencies (cached)
2. Type checking and tests
3. Build all packages
4. Deploy backend to Convex
5. Deploy frontend to Cloudflare Workers

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for manual deployment.

## Documentation

- [Quick Start](docs/README.md)
- [Tech Stack](docs/TECH_STACK.md)
- [Development](docs/DEVELOPMENT.md)
- [Environment](docs/ENVIRONMENT.md)
- [Deployment](docs/DEPLOYMENT.md)

## Architecture

### Frontend
- **Routing**: Type-safe file-based routing with TanStack Router
- **Data**: React Query + Convex real-time subscriptions
- **Styling**: TailwindCSS v4 with OKLCH design tokens
- **Forms**: React Hook Form + Zod validation
- **Auth**: Server-side validation with protected route groups

### Backend
- **Database**: Convex serverless with automatic type generation
- **Functions**: Queries (reactive), Mutations (transactional), Actions (external APIs)
- **Auth**: Better-Auth with Convex integration
- **AI**: Azure OpenAI for chat and project generation
- **Billing**: Credit-based system with Autumn webhooks

### Infrastructure
- **Monorepo**: Turborepo with task caching
- **Packages**: pnpm workspaces
- **CI/CD**: CircleCI with parallel jobs
- **Hosting**: Cloudflare Workers (frontend) + Convex Cloud (backend)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests: `pnpm test`
4. Check types: `pnpm check-types`
5. Submit a pull request

## License

This project is private and not licensed for public use.

## Acknowledgments

- Built with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Convex](https://convex.dev/) and [TanStack](https://tanstack.com/)

# Streamline

![CodeRabbit](https://img.shields.io/coderabbit/prs/github/git-minh/tanstack-app?utm_source=oss&utm_medium=github&utm_campaign=git-minh%2Ftanstack-app&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TanStack](https://img.shields.io/badge/TanStack-Start-FF4154?logo=tanstack&logoColor=white)](https://tanstack.com/start)
[![Convex](https://img.shields.io/badge/Convex-Backend-F46C1C?logo=convex&logoColor=white)](https://convex.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build/)
[![Vitest](https://img.shields.io/badge/Vitest-Testing-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![CircleCI](https://img.shields.io/badge/CircleCI-CI/CD-343434?logo=circleci&logoColor=white)](https://circleci.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

*We use CodeRabbit for local code reviews, not primarily for PR reviews.*

> A modern workspace for managing projects, tasks, and ideas—powered by real-time sync and AI assistance.

Streamline is a full-stack productivity platform that combines project management, task tracking, contact organization, and an AI chat assistant into a unified workspace. Built with real-time collaboration in mind, changes sync instantly across all your devices.

## What You Can Do

### Project & Task Management
- **Organize hierarchically** - Create projects and tasks with unlimited nesting
- **Track progress** - Visual status indicators and completion metrics
- **Quick capture** - Simple todo list for rapid task entry
- **Smart IDs** - Human-readable identifiers (TSK-001, PRJ-042) for easy reference
- **Bulk operations** - Update multiple items at once

### AI-Powered Workflows
- **Chat assistant** - Ask questions, brainstorm ideas, get instant help
- **Project generation** - Describe what you want to build, get a structured project plan
- **Real-time streaming** - See AI responses as they're generated

### Collaboration & Organization
- **Contact management** - Keep track of people with categories and notes
- **Design references** - Save and organize inspiration, mockups, and resources
- **Global search** - Find anything instantly with Cmd/K
- **Real-time sync** - Changes appear immediately across all sessions

### Modern Experience
- **Fast & responsive** - Server-side rendering for instant page loads
- **Works everywhere** - Mobile-friendly responsive design
- **Theme aware** - Clean light/dark modes that respect your preferences
- **Keyboard-first** - Navigate and search without touching your mouse

## Quick Start

**Requirements:** Node.js 20+, pnpm 10+

```bash
# Install dependencies
pnpm install

# Set up backend (follow prompts)
pnpm dev:setup

# Start the app
pnpm dev
```

Open **http://localhost:3001** and you're ready to go!

### Environment Setup

Create `apps/web/.env.local`:
```env
VITE_CONVEX_URL=https://your-project.convex.cloud
```

Configure backend:
```bash
npx convex env set SITE_URL http://localhost:3001
npx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)
```

**Optional AI features** - See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for Azure OpenAI configuration.

## Development

```bash
pnpm dev              # Start everything
pnpm dev:web          # Frontend only
pnpm dev:server       # Backend only

pnpm test             # Run tests
pnpm test:watch       # Test watch mode
pnpm check-types      # Type checking
pnpm build            # Production build
```

## Project Structure

```
apps/web/              # Frontend - React + TanStack Start
  ├── routes/          # File-based routing
  ├── components/      # UI components
  └── lib/             # Utilities

packages/backend/      # Backend - Convex
  └── convex/          # Database, queries, mutations
```

Full architecture details in [CLAUDE.md](CLAUDE.md).

## Tech Stack

**Frontend:** React 19, TanStack Start (SSR), TailwindCSS v4, shadcn/ui
**Backend:** Convex (real-time database), Better-Auth
**AI:** Azure OpenAI for chat and generation
**Infrastructure:** Turborepo monorepo, Cloudflare Workers, CircleCI

See [docs/](docs/) for detailed documentation.

## Deployment

Push to `master` triggers automated deployment via CircleCI:
- Backend → Convex Cloud
- Frontend → Cloudflare Workers

Manual deployment: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Documentation

- [CLAUDE.md](CLAUDE.md) - Complete development guide
- [docs/TECH_STACK.md](docs/TECH_STACK.md) - Technology breakdown
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - Workflows and patterns
- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) - Configuration reference
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment guide

---

Built with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) • [Convex](https://convex.dev/) • [TanStack](https://tanstack.com/) • [shadcn/ui](https://ui.shadcn.com/)

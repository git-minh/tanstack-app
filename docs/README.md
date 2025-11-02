# TanStack App Documentation

Welcome to the documentation for the TanStack full-stack application. This modern web application is built with cutting-edge technologies for optimal performance and developer experience.

## 📚 Documentation

### Getting Started
- [**Tech Stack Overview**](./TECH_STACK.md) - Complete overview of technologies and architecture
- [**Development Setup**](./DEVELOPMENT.md) - How to set up and run the application locally
- [**Environment Variables**](./ENVIRONMENT.md) - Configuration and environment setup
- [**Deployment Guide**](./DEPLOYMENT.md) - How to deploy to production

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- pnpm package manager
- Git

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd tanstack-app
   pnpm install
   ```

2. **Set up environment variables**
   ```bash
   # Frontend environment
   echo "VITE_CONVEX_URL=https://your-project.convex.cloud" > apps/web/.env.local
   
   # Backend environment  
   cp packages/backend/.env.local.example packages/backend/.env.local
   # Edit packages/backend/.env.local with your values
   ```

3. **Start development servers**
   ```bash
   pnpm dev
   ```

### Development Commands

```bash
# Start all services (recommended)
pnpm dev

# Start frontend only (port 3001)
pnpm dev:web

# Start backend only (Convex)
pnpm dev:server

# Initial Convex setup
pnpm dev:setup

# Build for production
pnpm build

# Type checking
pnpm check-types
```

## 🏗️ Project Structure

```
tanstack-app/
├── apps/
│   └── web/                 # Frontend (React + TanStack)
├── packages/
│   └── backend/            # Backend (Convex)
├── docs/                   # Documentation (you are here)
├── package.json            # Root scripts and workspace config
├── pnpm-workspace.yaml     # Package manager configuration
└── turbo.json             # Build system configuration
```

## 🛠️ Technologies

### Frontend
- **TanStack Start** - Full-stack React framework
- **React 19** - UI library with latest features
- **Tailwind CSS v4** - Modern styling framework
- **shadcn/ui** - High-quality component library
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Server state management

### Backend
- **Convex** - Real-time database + serverless functions
- **Better Auth** - Modern authentication
- **TypeScript** - Type-safe development

### Infrastructure
- **Cloudflare Workers** - Edge deployment platform
- **pnpm** - Fast package manager
- **Turborepo** - Build system orchestration

## 🔧 Development Workflow

### Adding Routes
1. Create files in `apps/web/src/routes/`
2. Export React components as default
3. Types are generated automatically

### Backend Functions
1. Edit files in `packages/backend/convex/`
2. Define schema in `schema.ts`
3. Changes sync automatically to dev deployment

### UI Components
1. Use shadcn/ui components from `apps/web/src/components/ui/`
2. Follow established patterns
3. Maintain dark mode compatibility

## 🌐 Deployment

- **Frontend**: Cloudflare Workers/Pages
- **Backend**: Convex serverless platform
- **CI/CD**: GitHub Actions (recommended)

See the [Deployment Guide](./DEPLOYMENT.md) for detailed instructions.

## 🔐 Environment Configuration

### Frontend (apps/web/.env.local)
```env
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_APP_NAME=Your App Name
```

### Backend (packages/backend/.env.local)
```env
CONVEX_URL=https://your-project.convex.cloud
SITE_URL=http://localhost:3001
BETTER_AUTH_SECRET=your-secret-key
```

For complete environment setup, see the [Environment Variables guide](./ENVIRONMENT.md).

## 🆘 Getting Help

### Common Issues
1. **Environment variables not loading** - Check `.env.local` file locations
2. **Convex connection issues** - Verify URL matching between frontend/backend
3. **Build errors** - Run `pnpm check-types` and clear `.turbo` cache

### Debug Commands
```bash
# Check types
pnpm check-types

# Clear cache
rm -rf .turbo && rm -rf apps/web/.turbo

# Check Convex status
npx convex env list
```

## 📖 Additional Resources

- [TanStack Documentation](https://tanstack.com)
- [Convex Documentation](https://docs.convex.dev)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

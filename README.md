# IronLogic3 - Gym Management System

A comprehensive gym management platform built with MongoDB, Express.js, Next.js, and TypeScript.

## Architecture

This is a monorepo containing three main applications:

- **Server**: Express.js API server with JWT authentication
- **Client**: Next.js web application with PWA support  
- **Shared**: Common TypeScript types and utilities

## Features

- Multi-tenant gym management
- Role-based access control (Admin, Gym Owner, Coach, Client)
- Hierarchical workout program builder (Block → Week → Day → Activity)
- Schedule management with templates and weekly active schedules
- Client benchmark tracking and progress monitoring
- PWA mobile experience for clients
- Optimistic loading for real-time updates

## Tech Stack

- **Backend**: Express.js, MongoDB, JWT authentication
- **Frontend**: Next.js 14, Mantine v7 UI library, TypeScript
- **Mobile**: Progressive Web App (PWA)
- **Drag & Drop**: @dnd-kit for program builder
- **Development**: ESLint, TypeScript, npm workspaces

## Quick Start

### Prerequisites
- Node.js 18.17.0 or higher
- MongoDB instance
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secrets
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

This will start:
- Server on http://localhost:3001
- Client on http://localhost:3000

### Available Scripts

- `npm run dev` - Start both server and client in development mode
- `npm run build` - Build both applications for production
- `npm run start` - Start production server
- `npm run lint` - Run linting on both applications
- `npm run type-check` - Run TypeScript checking

## Project Structure

```
ironlogic3/
├── server/           # Express.js API server
│   ├── src/          # TypeScript source code
│   ├── dist/         # Compiled JavaScript (build output)
│   └── package.json
├── client/           # Next.js web application
│   ├── src/          # React components and pages
│   ├── public/       # Static assets and PWA manifest
│   └── package.json
├── shared/           # Shared TypeScript types
│   ├── src/          # Common interfaces and types
│   └── package.json
└── package.json      # Root workspace configuration
```

## API Endpoints

### Health Check
- `GET /health` - Server health status
- `GET /api/status` - API status and version

More endpoints will be added as development progresses.

## PWA Features

The client application is configured as a Progressive Web App with:
- App manifest for home screen installation
- Service worker support (to be implemented)
- Responsive design optimized for mobile devices
- Offline capabilities (to be implemented)

## Development

### Code Style
- TypeScript strict mode enabled
- ESLint with TypeScript rules
- Consistent formatting across all packages

### Database Schema
See `architecture.md` for detailed MongoDB collection schemas and relationships.

## Contributing

1. Follow the existing code style and conventions
2. Write TypeScript with strict typing
3. Test your changes thoroughly
4. Update documentation as needed

## License

MIT
rem# IronLogic3 Migration Plan: Next.js → Vite + React Router

## Overview

This document outlines the migration from Next.js 15 to a simpler Vite + React + React Router architecture while maintaining all existing functionality and UI components.

## Current vs Target Architecture

### Current Stack
```
Next.js 15 Client (localhost:3000) → Express API Server (localhost:3001) → MongoDB
```

### Target Stack
```
Vite + React SPA (localhost:3000) → Express API Server (localhost:3001) → MongoDB
```

## Why Migrate?

- **Faster Development**: Vite HMR is significantly faster than Next.js webpack
- **Simpler Architecture**: Standard React SPA without framework complexity
- **Zero Vendor Lock-in**: Deploy anywhere (not tied to Vercel)
- **Smaller Bundle**: No Next.js framework overhead
- **Faster Builds**: Vite builds are 3-5x faster than Next.js

## What Stays the Same

✅ **All React Components** - Zero changes needed  
✅ **All Mantine UI Components** - Identical functionality  
✅ **State Management** - All hooks (useWorkoutPrograms, useAuth, etc.)  
✅ **API Integration** - All axios calls and endpoints  
✅ **Authentication Logic** - JWT handling and context  
✅ **Drag & Drop** - @dnd-kit functionality  
✅ **Express Server** - Zero changes needed  
✅ **Database** - MongoDB schema and operations unchanged  

## Migration Steps

### Phase 1: Preparation (30 minutes)

1. **Create feature branch**
   ```bash
   git checkout -b migrate-to-vite
   ```

2. **Backup current client**
   ```bash
   cd /Users/carterwilson/Repos/IronLogic3
   cp -r client client-nextjs-backup
   ```

3. **Document current routes**
   ```bash
   find client/src/app -name "page.tsx" | sort > current-routes.txt
   ```

### Phase 2: Initialize Vite Project (45 minutes)

1. **Create new Vite project in temporary directory**
   ```bash
   npm create vite@latest client-vite -- --template react-ts
   cd client-vite
   npm install
   ```

2. **Install required dependencies**
   ```bash
   # Core React Router
   npm install react-router-dom
   
   # Existing dependencies (copy from client/package.json)
   npm install @dnd-kit/core @dnd-kit/modifiers @dnd-kit/sortable @dnd-kit/utilities
   npm install @mantine/core @mantine/dates @mantine/form @mantine/hooks @mantine/modals @mantine/notifications
   npm install @tabler/icons-react axios dayjs mantine-datatable
   
   # Dev dependencies
   npm install -D @types/react @types/react-dom
   ```

3. **Replace client directory**
   ```bash
   cd /Users/carterwilson/Repos/IronLogic3
   rm -rf client
   mv client-vite client
   ```

### Phase 3: Configure Vite (30 minutes)

1. **Create `client/vite.config.ts`**
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   
   export default defineConfig({
     plugins: [react()],
     server: {
       port: 3000,
       proxy: {
         '/api': {
           target: 'http://localhost:3001',
           changeOrigin: true,
         },
       },
     },
     build: {
       outDir: 'dist',
       sourcemap: true,
     },
   })
   ```

2. **Update `client/index.html`**
   ```html
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <link rel="icon" type="image/svg+xml" href="/vite.svg" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>IronLogic3 - Gym Management System</title>
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/src/main.tsx"></script>
     </body>
   </html>
   ```

3. **Update `client/package.json` scripts**
   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "tsc && vite build",
       "preview": "vite preview",
       "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
       "type-check": "tsc --noEmit"
     }
   }
   ```

### Phase 4: Project Structure Migration (1 hour)

1. **Create new directory structure**
   ```bash
   cd client/src
   mkdir -p {components,hooks,lib,pages,contexts,types}
   ```

2. **Copy existing code with new structure**
   ```bash
   # From backup directory
   cp -r ../client-nextjs-backup/src/components/* components/
   cp -r ../client-nextjs-backup/src/hooks/* hooks/
   cp -r ../client-nextjs-backup/src/lib/* lib/
   cp -r ../client-nextjs-backup/src/app/globals.css .
   ```

### Phase 5: Routing Migration (2 hours)

1. **Create route mapping file** `client/src/routes.tsx`
   ```typescript
   import { Routes, Route, Navigate } from 'react-router-dom'
   import { HomePage } from './pages/HomePage'
   import { LoginPage } from './pages/auth/LoginPage'
   import { RegisterPage } from './pages/auth/RegisterPage'
   import { ProgramsPage } from './pages/programs/ProgramsPage'
   import { ProgramBuilderPage } from './pages/programs/ProgramBuilderPage'
   import { UsersPage } from './pages/users/UsersPage'
   import { GymsPage } from './pages/gyms/GymsPage'
   import { ActivitiesPage } from './pages/activities/ActivitiesPage'
   import { ProtectedRoute } from './components/auth/ProtectedRoute'
   
   export function AppRoutes() {
     return (
       <Routes>
         {/* Public routes */}
         <Route path="/auth/login" element={<LoginPage />} />
         <Route path="/auth/register" element={<RegisterPage />} />
         
         {/* Protected routes */}
         <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
         <Route path="/programs" element={<ProtectedRoute><ProgramsPage /></ProtectedRoute>} />
         <Route path="/programs/builder" element={<ProtectedRoute><ProgramBuilderPage /></ProtectedRoute>} />
         <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
         <Route path="/gyms" element={<ProtectedRoute><GymsPage /></ProtectedRoute>} />
         <Route path="/activities" element={<ProtectedRoute><ActivitiesPage /></ProtectedRoute>} />
         
         {/* Redirects */}
         <Route path="*" element={<Navigate to="/" replace />} />
       </Routes>
     )
   }
   ```

2. **Convert Next.js pages to React Router pages**
   
   **Pattern**: `app/path/page.tsx` → `pages/path/PathPage.tsx`
   
   Create these files by copying and renaming:
   ```bash
   # Create pages directory structure
   mkdir -p pages/{auth,programs,users,gyms,activities}
   
   # Copy and rename page files
   cp ../client-nextjs-backup/src/app/page.tsx pages/HomePage.tsx
   cp ../client-nextjs-backup/src/app/auth/login/page.tsx pages/auth/LoginPage.tsx
   cp ../client-nextjs-backup/src/app/auth/register/page.tsx pages/auth/RegisterPage.tsx
   cp ../client-nextjs-backup/src/app/programs/page.tsx pages/programs/ProgramsPage.tsx
   cp ../client-nextjs-backup/src/app/programs/builder/page.tsx pages/programs/ProgramBuilderPage.tsx
   cp ../client-nextjs-backup/src/app/users/page.tsx pages/users/UsersPage.tsx
   cp ../client-nextjs-backup/src/app/gyms/page.tsx pages/gyms/GymsPage.tsx
   cp ../client-nextjs-backup/src/app/activities/page.tsx pages/activities/ActivitiesPage.tsx
   ```

3. **Update each page file**
   
   **Before (Next.js)**:
   ```typescript
   export default function UsersPage() {
     return <div>Users content</div>
   }
   ```
   
   **After (React Router)**:
   ```typescript
   export function UsersPage() {
     return <div>Users content</div>
   }
   ```

### Phase 6: Main App Setup (45 minutes)

1. **Create `client/src/main.tsx`**
   ```typescript
   import React from 'react'
   import ReactDOM from 'react-dom/client'
   import { BrowserRouter } from 'react-router-dom'
   import { MantineProvider } from '@mantine/core'
   import { Notifications } from '@mantine/notifications'
   import { ModalsProvider } from '@mantine/modals'
   import { AuthProvider } from './lib/auth-context'
   import { AppRoutes } from './routes'
   import './globals.css'
   import '@mantine/core/styles.css'
   import '@mantine/notifications/styles.css'
   import '@mantine/dates/styles.css'
   
   ReactDOM.createRoot(document.getElementById('root')!).render(
     <React.StrictMode>
       <BrowserRouter>
         <MantineProvider>
           <Notifications />
           <ModalsProvider>
             <AuthProvider>
               <AppRoutes />
             </AuthProvider>
           </ModalsProvider>
         </MantineProvider>
       </BrowserRouter>
     </React.StrictMode>,
   )
   ```

2. **Update navigation components**
   
   Replace Next.js `Link` with React Router `Link`:
   ```typescript
   // Before
   import Link from 'next/link'
   
   // After  
   import { Link } from 'react-router-dom'
   ```

   Replace Next.js `useRouter` with React Router `useNavigate`:
   ```typescript
   // Before
   import { useRouter } from 'next/navigation'
   const router = useRouter()
   router.push('/path')
   
   // After
   import { useNavigate } from 'react-router-dom'
   const navigate = useNavigate()
   navigate('/path')
   ```

### Phase 7: Fix Import Paths (30 minutes)

1. **Update relative imports**
   
   Since we're moving from `app/` structure to `pages/` structure, some imports need updating:
   ```typescript
   // Before (Next.js app directory)
   import { useAuth } from '../../lib/auth-context'
   
   // After (standard React structure)  
   import { useAuth } from '../lib/auth-context'
   ```

2. **Global find and replace operations**
   ```bash
   cd client/src
   
   # Replace Next.js imports
   find . -name "*.tsx" -type f -exec sed -i '' 's/next\/link/react-router-dom/g' {} \;
   find . -name "*.tsx" -type f -exec sed -i '' 's/next\/navigation/react-router-dom/g' {} \;
   find . -name "*.ts" -type f -exec sed -i '' 's/next\/link/react-router-dom/g' {} \;
   find . -name "*.ts" -type f -exec sed -i '' 's/next\/navigation/react-router-dom/g' {} \;
   
   # Update useRouter to useNavigate
   find . -name "*.tsx" -type f -exec sed -i '' 's/useRouter/useNavigate/g' {} \;
   find . -name "*.ts" -type f -exec sed -i '' 's/useRouter/useNavigate/g' {} \;
   
   # Update router.push to navigate
   find . -name "*.tsx" -type f -exec sed -i '' 's/router\.push/navigate/g' {} \;
   find . -name "*.ts" -type f -exec sed -i '' 's/router\.push/navigate/g' {} \;
   ```

### Phase 8: Environment Configuration (15 minutes)

1. **Create `client/.env`**
   ```
   VITE_API_BASE_URL=http://localhost:3001
   VITE_APP_NAME=IronLogic3
   ```

2. **Update API configuration**
   ```typescript
   // client/src/lib/api.ts
   const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
   ```

### Phase 9: Update Root Package.json (15 minutes)

1. **Update workspace scripts in root `package.json`**
   ```json
   {
     "scripts": {
       "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
       "dev:server": "npm run dev --workspace=server", 
       "dev:client": "npm run dev --workspace=client",
       "build": "npm run build --workspace=server && npm run build --workspace=client",
       "build:client": "npm run build --workspace=client",
       "build:server": "npm run build --workspace=server"
     }
   }
   ```

### Phase 10: Testing & Validation (1 hour)

1. **Type checking**
   ```bash
   cd client
   npm run type-check
   ```

2. **Build test**
   ```bash
   cd client  
   npm run build
   ```

3. **Development server test**
   ```bash
   cd /Users/carterwilson/Repos/IronLogic3
   npm run dev
   ```

4. **Functionality checklist**
   - [ ] Authentication (login/logout)
   - [ ] Navigation between pages
   - [ ] Program Builder UI
   - [ ] Drag and drop functionality
   - [ ] API calls working
   - [ ] Forms and modals
   - [ ] Data tables and filtering

### Phase 11: Cleanup (15 minutes)

1. **Remove Next.js files**
   ```bash
   rm -rf client-nextjs-backup
   rm -f next.config.js
   rm -f current-routes.txt
   ```

2. **Update documentation**
   - Update README.md with new tech stack
   - Update development commands
   - Update deployment instructions

## Post-Migration Benefits

### Performance Improvements
- **Dev Server**: ~3-5x faster hot reload
- **Build Time**: ~2-3x faster production builds  
- **Bundle Size**: ~20-30% smaller without Next.js framework

### Deployment Flexibility
- **Static Hosting**: Deploy to Netlify, Vercel, AWS S3, etc.
- **CDN**: Easy CDN distribution of static assets
- **Docker**: Simpler containerization (just nginx + static files)

### Developer Experience
- **Simpler Debugging**: Standard React DevTools
- **Faster CI/CD**: Quicker build and test cycles
- **Less Magic**: Explicit routing and configuration

## Rollback Plan

If issues arise during migration:

1. **Quick rollback**
   ```bash
   git checkout main
   rm -rf client
   mv client-nextjs-backup client
   npm install
   ```

2. **Partial rollback**
   - Keep working features in Vite
   - Revert problematic pages to Next.js temporarily
   - Migrate incrementally

## Risk Mitigation

### Low Risk Items ✅
- Component logic (zero changes needed)
- API integration (already abstracted)
- State management (hooks work identically)
- UI components (Mantine works the same)

### Medium Risk Items ⚠️
- Routing edge cases
- Environment variable references
- Build configuration issues

### High Risk Items 🚨
- Authentication flow changes
- Import path resolution
- Browser compatibility issues

## Estimated Timeline

- **Small team (1-2 devs)**: 1-2 days
- **Larger team**: 2-3 days (coordination overhead)
- **Testing phase**: +1 day

## Success Criteria

✅ All existing functionality works identically  
✅ Development server starts in <5 seconds  
✅ Build completes in <2 minutes  
✅ All TypeScript types resolve correctly  
✅ All tests pass  
✅ No console errors in browser  

---

**Questions or Issues?**
- Create GitHub issue with "Migration" label
- Slack #ironlogic3-migration channel
- Tag @lead-dev for urgent migration blockers
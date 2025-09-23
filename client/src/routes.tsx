import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { ProgramsPage } from './pages/programs/ProgramsPage'
import { ProgramBuilderPage } from './pages/programs/ProgramBuilderPage'
import { UsersPage } from './pages/UsersPage'
import { GymsPage } from './pages/GymsPage'
import { ActivitiesPage } from './pages/activities/ActivitiesPage.tsx'
import { ActivityGroupsPage } from './pages/activity-groups/ActivityGroupsPage.tsx'
import { BenchmarkTemplatesPage } from './pages/benchmark-templates/BenchmarkTemplatesPage.tsx'
import { SchedulesPage } from './pages/schedules/SchedulesPage'
import { ClientsPage } from './pages/clients/ClientsPage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { MobilePage } from './pages/MobilePage'
import { ProtectedRoute, AdminOnly, GymOwnerOnly, CoachOnly, ClientOnly } from './components/auth/ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      
      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      
      {/* Admin-only routes */}
      <Route path="/users" element={<AdminOnly><UsersPage /></AdminOnly>} />
      <Route path="/gyms" element={<AdminOnly><GymsPage /></AdminOnly>} />
      
      {/* Gym Owner, Coach, and Admin routes (gym-specific content) */}
      <Route path="/programs" element={<GymOwnerOnly><ProgramsPage /></GymOwnerOnly>} />
      <Route path="/programs/builder" element={<GymOwnerOnly><ProgramBuilderPage /></GymOwnerOnly>} />
      <Route path="/activities" element={<GymOwnerOnly><ActivitiesPage /></GymOwnerOnly>} />
      <Route path="/activity-groups" element={<GymOwnerOnly><ActivityGroupsPage /></GymOwnerOnly>} />
      <Route path="/benchmark-templates" element={<GymOwnerOnly><BenchmarkTemplatesPage /></GymOwnerOnly>} />
      <Route path="/schedules" element={<GymOwnerOnly><SchedulesPage /></GymOwnerOnly>} />
      <Route path="/clients" element={<GymOwnerOnly><ClientsPage /></GymOwnerOnly>} />
      
      {/* Legacy redirects */}
      <Route path="/schedule-templates" element={<Navigate to="/schedules?tab=templates" replace />} />
      <Route path="/weekly-schedules" element={<Navigate to="/schedules?tab=schedules" replace />} />
      
      {/* Common routes */}
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      
      {/* Mobile interface for clients */}
      <Route path="/mobile" element={<ClientOnly><MobilePage /></ClientOnly>} />
      
      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
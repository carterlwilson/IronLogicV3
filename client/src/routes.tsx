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
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { MobilePage } from './pages/MobilePage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

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
      <Route path="/programs" element={<ProtectedRoute><ProgramsPage /></ProtectedRoute>} />
      <Route path="/programs/builder" element={<ProtectedRoute><ProgramBuilderPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/gyms" element={<ProtectedRoute><GymsPage /></ProtectedRoute>} />
      <Route path="/activities" element={<ProtectedRoute><ActivitiesPage /></ProtectedRoute>} />
      <Route path="/activity-groups" element={<ProtectedRoute><ActivityGroupsPage /></ProtectedRoute>} />
      <Route path="/benchmark-templates" element={<ProtectedRoute><BenchmarkTemplatesPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/mobile" element={<ProtectedRoute><MobilePage /></ProtectedRoute>} />
      
      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
import { AuthLayout } from '../../components/auth/AuthLayout';
import { ForgotPasswordForm } from '../../components/auth/ForgotPasswordForm';

export function ForgotPasswordPage() {
  return (
    <AuthLayout title="RESET PASSWORD" subtitle="Enter your email to reset your password">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
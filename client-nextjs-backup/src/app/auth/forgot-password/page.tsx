import { AuthLayout } from '../../../components/auth/AuthLayout';
import { ForgotPasswordForm } from '../../../components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout 
      title="FORGOT PASSWORD" 
      subtitle="Reset your password"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
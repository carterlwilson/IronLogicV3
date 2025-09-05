import { AuthLayout } from '../../components/auth/AuthLayout';
import { LoginForm } from '../../components/auth/LoginForm';

export function LoginPage() {
  return (
    <AuthLayout title="LOGIN" subtitle="Welcome back to IronLogic3">
      <LoginForm />
    </AuthLayout>
  );
}
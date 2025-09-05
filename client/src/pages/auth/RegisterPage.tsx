import { AuthLayout } from '../../components/auth/AuthLayout';
import { RegisterForm } from '../../components/auth/RegisterForm';

export function RegisterPage() {
  return (
    <AuthLayout 
      title="CREATE ACCOUNT" 
      subtitle="Join the IronLogic3 community"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
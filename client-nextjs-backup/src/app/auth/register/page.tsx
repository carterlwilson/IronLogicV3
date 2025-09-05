import { AuthLayout } from '../../../components/auth/AuthLayout';
import { RegisterForm } from '../../../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthLayout 
      title="CREATE ACCOUNT" 
      subtitle="Join the IronLogic3 community"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
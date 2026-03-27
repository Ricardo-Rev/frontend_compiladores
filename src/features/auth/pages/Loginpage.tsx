import { AuthCard } from '../components/AuthCard';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <AuthLayout>
      <AuthCard title="Bienvenido a UMG ++" subtitle="Inicia sesión para comenzar la misión">
        <LoginForm />
      </AuthCard>
    </AuthLayout>
  );
}

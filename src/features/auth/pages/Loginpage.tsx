import { AuthCard } from '../components/AuthCard';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <AuthLayout>
      <AuthCard
        title="Acceso seguro"
        subtitle="Ingresa tus credenciales para continuar."
      >
        <LoginForm />
      </AuthCard>
    </AuthLayout>
  );
}
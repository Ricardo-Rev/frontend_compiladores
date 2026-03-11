import { AuthCard } from '../components/AuthCard';
import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';

export function RegisterPage() {
  return (
    <AuthLayout>
      <AuthCard
        title="Crear cuenta"
        subtitle="Regístrate para acceder a la plataforma."
      >
        <RegisterForm />
      </AuthCard>
    </AuthLayout>
  );
}
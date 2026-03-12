import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { AuthCard } from '../components/AuthCard';
import { AuthLayout } from '../components/AuthLayout';

export function QrLoginPage() {
  return (
    <AuthLayout>
      <AuthCard title="Acceso con QR" subtitle="Escanea el código con tu dispositivo autorizado.">
        <div className="auth-placeholder-box">[ Aquí irá el QR dinámico ]</div>

        <Link to="/login">
          <Button type="button" variant="secondary" fullWidth>
            Volver al login
          </Button>
        </Link>
      </AuthCard>
    </AuthLayout>
  );
}

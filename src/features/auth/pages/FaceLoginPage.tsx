import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { AuthCard } from '../components/AuthCard';
import { AuthLayout } from '../components/AuthLayout';

export function FaceLoginPage() {
  return (
    <AuthLayout>
      <AuthCard title="Reconocimiento facial" subtitle="Activa la cámara y valida tu identidad.">
        <div className="auth-placeholder-box">
          [ Aquí irá la vista previa de cámara / reconocimiento ]
        </div>

        <Button fullWidth>Activar cámara</Button>

        <Link to="/login">
          <Button type="button" variant="secondary" fullWidth>
            Volver al login
          </Button>
        </Link>
      </AuthCard>
    </AuthLayout>
  );
}

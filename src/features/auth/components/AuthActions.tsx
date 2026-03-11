import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';

export function AuthActions() {
  return (
    <div className="auth-action">
      <Link to="/login/face" className="auth-actions__link">
        <Button type="button" variant="secondary" fullWidth>
          Reconocimiento facial
        </Button>
      </Link>

      <Link to="/login/QR" className="auth-actions__link">
        <Button type="button" variant="secondary" fullWidth>
          QR
        </Button>
      </Link>
    </div>
  );
}

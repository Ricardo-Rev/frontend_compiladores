import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { RecaptchaPlaceholder } from './RecaptchaPlaceholder';
import { AuthActions } from './AuthActions';
import { useLoginForm } from '../hooks/useAuthForm';

export function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const { handleLogin, isLoading, error } = useLoginForm();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!recaptchaToken) {
      alert('Debes completar el reCAPTCHA');
      return;
    }

    await handleLogin({
      ...(identifier.includes('@')
        ? { email: identifier }
        : { usuario: identifier }),
      password,
      recaptcha_token: recaptchaToken, // ✅ TOKEN REAL
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Input
        id="login-identifier"
        label="Correo o usuario"
        placeholder="Ingresa tu correo o nombre de usuario"
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
      />

      <Input
        id="login-password"
        label="Contraseña"
        type="password"
        placeholder="Ingresa tu contraseña"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <RecaptchaPlaceholder onChange={setRecaptchaToken} />

      {error && <p className="auth-form__message">{error}</p>}

      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </Button>

      <AuthActions />

      <p className="auth-form__footer">
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </form>
  );
}
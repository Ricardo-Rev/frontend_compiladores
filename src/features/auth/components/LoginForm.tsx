import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { RecaptchaPlaceholder } from './RecaptchaPlaceholder';
import { AuthActions } from './AuthActions';
import { useLoginForm } from '../hooks/useAuthForm';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { handleLogin, isLoading, error } = useLoginForm();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleLogin({
      email,
      password,
      recaptcha_token: 'test-token-bypass',
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Input
        id="login-email"
        label="Correo electrónico"
        type="email"
        placeholder="Ingresa tu correo"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <Input
        id="login-password"
        label="Contraseña"
        type="password"
        placeholder="Ingresa tu contraseña"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <RecaptchaPlaceholder />

      {error && (
        <p className="auth-form__message">{error}</p>
      )}

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
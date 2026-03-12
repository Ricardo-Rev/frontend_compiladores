import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { loginUser } from '../services/authServices';
import { AuthActions } from './AuthActions';
import { RecaptchaPlaceholder } from './RecaptchaPlaceholder';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await loginUser({
      username,
      password,
      recaptchaToken: 'pending-recaptcha-token',
    });

    setMessage(response.message);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Input
        id="login-username"
        label="Usuario"
        placeholder="Ingresa tu usuario"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
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

      <Button type="submit" fullWidth>
        Iniciar sesión
      </Button>

      <AuthActions />

      <p className="auth-form__footer">
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>

      {message ? <p className="auth-form__message">{message}</p> : null}
    </form>
  );
}

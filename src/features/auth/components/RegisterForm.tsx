import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { registerUser } from '../services/authServices';
import { RecaptchaPlaceholder } from './RecaptchaPlaceholder';

export function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    const response = await registerUser({
      fullName,
      username,
      email,
      password,
      confirmPassword,
      recaptchaToken: 'pending-recaptcha-token',
    });

    setMessage(response.message);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Input
        id="register-fullname"
        label="Nombre completo"
        placeholder="Ingresa tu nombre"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
      />

      <Input
        id="register-username"
        label="Usuario"
        placeholder="Crea un nombre de usuario"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />

      <Input
        id="register-email"
        label="Correo electrónico"
        type="email"
        placeholder="Ingresa tu correo"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <Input
        id="register-password"
        label="Contraseña"
        type="password"
        placeholder="Crea una contraseña"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <Input
        id="register-confirm-password"
        label="Confirmar contraseña"
        type="password"
        placeholder="Confirma tu contraseña"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />

      <RecaptchaPlaceholder />

      <Button type="submit" fullWidth>
        Registrarse
      </Button>

      <p className="auth-form__footer">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>

      {message ? <p className="auth-form__message">{message}</p> : null}
    </form>
  );
}

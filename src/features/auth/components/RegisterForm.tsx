import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { RecaptchaPlaceholder } from './RecaptchaPlaceholder';
import { useRegisterForm } from '../hooks/useAuthForm';

export function RegisterForm() {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { handleRegister, isLoading, error } = useRegisterForm();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }

    await handleRegister({
      usuario,
      email,
      nombre_completo: nombreCompleto,
      password,
      telefono,
      recaptcha_token: 'test-token-bypass',
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Input
        id="register-nombre"
        label="Nombre completo"
        placeholder="Ingresa tu nombre completo"
        value={nombreCompleto}
        onChange={(event) => setNombreCompleto(event.target.value)}
      />

      <Input
        id="register-usuario"
        label="Usuario"
        placeholder="Crea un nombre de usuario"
        value={usuario}
        onChange={(event) => setUsuario(event.target.value)}
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
        id="register-telefono"
        label="Teléfono"
        placeholder="+502 1234-5678"
        value={telefono}
        onChange={(event) => setTelefono(event.target.value)}
      />

      <Input
        id="register-password"
        label="Contraseña"
        type="password"
        placeholder="Mínimo 8 caracteres"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <Input
        id="register-confirm-password"
        label="Confirmar contraseña"
        type="password"
        placeholder="Repite tu contraseña"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />

      <RecaptchaPlaceholder />

      {localError && <p className="auth-form__message">{localError}</p>}
      {error && <p className="auth-form__message">{error}</p>}

      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? 'Registrando...' : 'Registrarse'}
      </Button>

      <p className="auth-form__footer">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </form>
  );
}
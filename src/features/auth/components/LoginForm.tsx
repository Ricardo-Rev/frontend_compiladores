import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { RecaptchaPlaceholder } from './RecaptchaPlaceholder';
import { AuthActions } from './AuthActions';
import { useLoginForm } from '../hooks/useAuthForm';
import { toast } from "sonner";

export function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { handleLogin, isLoading, error } = useLoginForm();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!recaptchaToken) {
      toast.error("⚠️ Debes completar el reCAPTCHA 🤖", {
        description: "Verifica que no eres un robot antes de continuar",
      });
      return;
    }

    await handleLogin({
      ...(identifier.includes('@')
        ? { email: identifier }
        : { usuario: identifier }),
      password,
      recaptcha_token: recaptchaToken,
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

      <div style={{ position: 'relative' }}>
        <Input
          id="login-password"
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          placeholder="Ingresa tu contraseña"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: '10px',
            top: '42px',
            cursor: 'pointer',
            background: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.25)',
            borderRadius: '10px',
            padding: '6px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',  
          }}
        >
          {showPassword ? <FaEye /> : <FaEyeSlash />}
        </button>
      </div>

      <RecaptchaPlaceholder onChange={setRecaptchaToken} />

      {error && <p className="auth-form__message">{error}</p>}

      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? 'Entrando al juego....' : '🚀 Entrar al juego'}
      </Button>

      <AuthActions />

      <p className="auth-form__footer">
        ¿Primera vez aquí? <Link to="/register">🎮 Crear perfil</Link>
      </p>
    </form>
  );
}
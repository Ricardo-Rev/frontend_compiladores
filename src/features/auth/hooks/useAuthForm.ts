import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  loginUser,
  registerUser,
  loginWithQr,
  loginWithFacial,
} from '../services/authServices';
import type {
  LoginRequest,
  RegisterRequest,
} from '../types/auth.types';

// ─────────────────────────────────────────────
// 🔐 LOGIN
// ─────────────────────────────────────────────
export function useLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // 🔹 LOGIN NORMAL
  const handleLogin = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginUser(data);
      login(response.access_token, response.user);
      toast.success(`¡Bienvenido, ${response.user.usuario}! 👋`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Error al iniciar sesión.');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 LOGIN QR
  const handleLoginQr = async (codigo: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginWithQr({ codigo_qr: codigo });
      login(response.access_token, response.user);
      toast.success(`¡Bienvenido, ${response.user.usuario}! 📱`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'QR inválido.');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 LOGIN FACIAL
  const handleLoginFacial = async (base64: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginWithFacial({ rostro_base64: base64 });
      login(response.access_token, response.user);
      toast.success(`¡Bienvenido, ${response.user.usuario}! 😎`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'No se pudo reconocer el rostro.');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleLogin,
    handleLoginQr,
    handleLoginFacial,
    isLoading,
    error,
  };
}

// ─────────────────────────────────────────────
// 📝 REGISTER (CORREGIDO)
// ─────────────────────────────────────────────
export function useRegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await registerUser(data);

      // 🔥 YA NO LOGUEA AUTOMÁTICAMENTE
      toast.success(
        'Cuenta creada exitosamente 🎉. Ahora puedes iniciar sesión.',
      );

      navigate('/login'); // 🔥 REGRESA AL LOGIN
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Error al registrarse.');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleRegister, isLoading, error };
}

// ─────────────────────────────────────────────
// 🧠 HELPER DE ERRORES
// ─────────────────────────────────────────────
function getErrorMessage(err: unknown, defaultMsg: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as {
      response?: { data?: { error?: string } };
    };
    return axiosErr.response?.data?.error ?? defaultMsg;
  }
  return defaultMsg;
}
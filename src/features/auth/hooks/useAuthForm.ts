import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../services/authServices';
import type { LoginRequest, RegisterRequest } from '../types/auth.types';

export function useLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginUser(data);
      login(response.access_token, response.user);
      navigate('/profile');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error ?? 'Error al iniciar sesión.');
      } else {
        setError('Error al iniciar sesión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { handleLogin, isLoading, error };
}

export function useRegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await registerUser(data);
      login(response.access_token, response.user);
      navigate('/profile');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error ?? 'Error al registrarse.');
      } else {
        setError('Error al registrarse.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { handleRegister, isLoading, error };
}
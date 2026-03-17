import axios from 'axios';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth.types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rover_token');
      localStorage.removeItem('rover_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/Auth/login', payload);
  return response.data;
}

export async function registerUser(payload: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/Auth/register', payload);
  return response.data;
}

export async function logoutUser(): Promise<void> {
  const token = localStorage.getItem('rover_token');
  await api.post('/api/Auth/logout', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  localStorage.removeItem('rover_token');
  localStorage.removeItem('rover_user');
}

export async function getMe(): Promise<AuthResponse['user']> {
  const token = localStorage.getItem('rover_token');
  const response = await api.get('/api/Auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
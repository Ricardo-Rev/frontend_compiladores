import axios from 'axios';
import { env } from '../../../config/env';
import type {
  AuthResponse,
  FacialLoginRequest,
  FaceSegmentRequest,
  FaceSegmentResponse,
  LoginRequest,
  QrLoginRequest,
  RegisterRequest,
  UserProfileDto,
} from '../types/auth.types';

const api = axios.create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rover_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rover_token');
      localStorage.removeItem('rover_user');
    }
    return Promise.reject(error);
  },
);

export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/login', payload);
  return response.data;
}

export async function registerUser(
  payload: RegisterRequest,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/register', payload);
  return response.data;
}

export async function loginWithQr(
  payload: QrLoginRequest,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/login/qr', payload);
  return response.data;
}

export async function loginWithFacial(
  payload: FacialLoginRequest,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    '/api/auth/login/facial',
    payload,
  );
  return response.data;
}

export async function segmentFace(
  payload: FaceSegmentRequest,
): Promise<FaceSegmentResponse> {
  const response = await api.post<FaceSegmentResponse>(
    '/api/Face/segment',
    payload,
  );
  return response.data;
}

export async function logoutUser(): Promise<void> {
  await api.post('/api/Auth/logout');
  localStorage.removeItem('rover_token');
  localStorage.removeItem('rover_user');
}

export async function getMe(): Promise<UserProfileDto> {
  const response = await api.get<UserProfileDto>('/api/auth/me');
  return response.data;
}
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth.types';

/**
 * Servicio de autenticación.
 *
 * Este archivo queda preparado para la integración con backend.
 * La implementación real de llamadas HTTP será realizada por el
 * responsable de conexión con endpoints.
 */

export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  console.log('Pendiente integración endpoint login:', payload);

  return Promise.resolve({
    success: false,
    message: 'Integración de login pendiente.',
  });
}

export async function registerUser(payload: RegisterRequest): Promise<AuthResponse> {
  console.log('Pendiente integración endpoint register:', payload);

  return Promise.resolve({
    success: false,
    message: 'Integración de registro pendiente.',
  });
}

export async function requestQrLogin(): Promise<AuthResponse> {
  console.log('Pendiente integración endpoint QR login');

  return Promise.resolve({
    success: false,
    message: 'Integración de acceso por QR pendiente.',
  });
}

export async function requestFaceLogin(): Promise<AuthResponse> {
  console.log('Pendiente integración endpoint Face ID login');

  return Promise.resolve({
    success: false,
    message: 'Integración de reconocimiento facial pendiente.',
  });
}

export interface LoginRequest {
  email: string;
  password: string;
  recaptcha_token: string;
}

export interface RegisterRequest {
  usuario: string;
  email: string;
  nombre_completo: string;
  password: string;
  telefono: string;
  recaptcha_token: string;
  avatar_base64?: string; // ✅ foto capturada por cámara o subida
}

export interface UserDto {
  id: number;
  usuario: string;
  nombre_completo: string;
  email: string;
  rol: string;
  avatar_url: string | null;
  fecha_creacion: string;
}

export interface AuthResponse {
  access_token: string;
  expires_in_seconds: number;
  user: UserDto;
}
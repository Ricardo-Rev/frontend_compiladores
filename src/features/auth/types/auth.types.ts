export interface LoginRequest {
  email?: string;
  usuario?: string;
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
  avatar_base64?: string;
}

export interface QrLoginRequest {
  codigo_qr: string;
}

export interface FacialLoginRequest {
  rostro_base64: string;
}

export interface FaceSegmentRequest {
  image_base64: string;
}

export interface FaceSegmentResponse {
  success: boolean;
  resultado: string;
  mensaje: string;
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

export interface UserProfileDto extends UserDto {
  email_confirmado?: boolean;
  telefono?: string;
  telefono_confirmado?: boolean;
  activo?: boolean;
  total_compilaciones?: number;
  preferencias?: {
    tema?: string;
    tamano_fuente?: number;
    fuente?: string;
    color_keywords?: string;
    color_commands?: string;
    color_parenthesis?: string;
    color_integers?: string;
    interlineado?: number;
    lenguaje_destino_default?: string;
  } | null;
}

export interface AuthResponse {
  access_token: string;
  expires_in_seconds: number;
  user: UserDto;
}
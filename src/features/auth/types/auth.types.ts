export interface LoginRequest {
  username: string;
  password: string;
  recaptchaToken?: string;
}

export interface RegisterRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  recaptchaToken?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
}

/*Definición de forma de los datos como 
se pedira para que no haya errores de 
envio o de recepción */

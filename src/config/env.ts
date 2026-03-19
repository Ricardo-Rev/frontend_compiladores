const required = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
};

export const env = {
  apiUrl: required(import.meta.env.VITE_API_URL, 'VITE_API_URL'),
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000),
};
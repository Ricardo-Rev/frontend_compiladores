import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5123';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar token en cada request automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rover_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Tipos que devuelve el backend ────────────────────────────

export interface FileListResponse {
  id:                 number;
  nombre_archivo:     string;
  version:            number;
  descripcion:        string | null;
  es_coreografia:     boolean;
  fecha_modificacion: string;
}

export interface FileResponse {
  id:                 number;
  nombre_archivo:     string;
  contenido:          string;
  version:            number;
  descripcion:        string | null;
  es_coreografia:     boolean;
  fecha_creacion:     string;
  fecha_modificacion: string;
}

// ── Tipos que envía el frontend ──────────────────────────────

export interface CreateFileRequest {
  nombre_archivo: string;
  contenido:      string;
  descripcion?:   string;
}

export interface UpdateFileRequest {
  contenido:          string;
  comentario?:        string;
  guardar_historial?: boolean;
}

// ── Funciones del servicio ───────────────────────────────────

/**
 * Lista todos los archivos .umgpp activos del usuario autenticado.
 * Ordenados por fecha_modificacion DESC (más reciente primero).
 */
export async function listarArchivos(): Promise<FileListResponse[]> {
  const res = await api.get<FileListResponse[]>('/api/File');
  return res.data;
}

/**
 * Obtiene el contenido completo de un archivo por su id.
 * Lanza error 404 si no existe o no pertenece al usuario.
 */
export async function obtenerArchivo(id: number): Promise<FileResponse> {
  const res = await api.get<FileResponse>(`/api/File/${id}`);
  return res.data;
}

/**
 * Crea un nuevo archivo .umgpp en la base de datos.
 * El backend agrega .umgpp al nombre si no lo tiene.
 * También crea automáticamente la versión inicial en historial_archivos.
 * Devuelve 201 con el FileResponse incluyendo el id generado.
 */
export async function crearArchivo(request: CreateFileRequest): Promise<FileResponse> {
  const res = await api.post<FileResponse>('/api/File', request);
  return res.data;
}

/**
 * Actualiza el contenido de un archivo existente.
 * El backend guarda la versión anterior en historial_archivos antes de actualizar.
 * Si comentario es null, el backend usa "Auto-guardado v{n}" por defecto.
 * Incrementa la version en +1 automáticamente.
 */
export async function actualizarArchivo(
  id: number,
  request: UpdateFileRequest
): Promise<FileResponse> {
  const res = await api.put<FileResponse>(`/api/File/${id}`, request);
  return res.data;
}

/**
 * Elimina un archivo (soft delete: activo = false).
 * Las compilaciones asociadas se mantienen en BD.
 * Devuelve 204 sin body.
 */
export async function eliminarArchivo(id: number): Promise<void> {
  await api.delete(`/api/File/${id}`);
}

/**
 * Obtiene el historial de versiones de un archivo.
 * Ordenado por version DESC (más reciente primero).
 * Cada item tiene: id, nombre_archivo ("v{n}"), version,
 * descripcion (el comentario del guardado), fecha_modificacion.
 */
export async function obtenerHistorial(id: number): Promise<FileListResponse[]> {
  const res = await api.get<FileListResponse[]>(`/api/File/${id}/history`);
  return res.data;
}


export async function obtenerVersionHistorial(
  archivoId: number,
  version:   number
): Promise<FileResponse> {
  const res = await api.get<FileResponse>(`/api/File/${archivoId}/history/${version}`);
  return res.data;
}
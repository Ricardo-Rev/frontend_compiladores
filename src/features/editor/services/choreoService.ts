import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5123';

export interface ChoreoListItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  cancion_nombre: string | null;
  duracion_min_seg: number;
}

export interface ChoreoDetalle {
  id: number;
  nombre: string;
  descripcion: string | null;
  codigo_fuente: string;
  cancion_url: string | null;
  cancion_nombre: string | null;
  duracion_min_seg: number;
}

function headers() {
  const token = localStorage.getItem('rover_token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function listarCoreografias(): Promise<ChoreoListItem[]> {
  const response = await axios.get<ChoreoListItem[]>(`${API_URL}/api/Choreo`, { headers: headers() });
  return response.data;
}

export async function obtenerCoreografia(id: number): Promise<ChoreoDetalle> {
  const response = await axios.get<ChoreoDetalle>(`${API_URL}/api/Choreo/${id}`, { headers: headers() });
  return response.data;
}
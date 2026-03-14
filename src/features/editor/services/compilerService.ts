import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5123';

export type LenguajeDestino = 'python' | 'csharp';
export type ModoCompilacion = 'solo_compilar' | 'compilar_simular' | 'compilar_ejecutar';

export interface TokenDto {
  linea: number;
  columna: number;
  tipo: string;
  lexema: string;
  valor: string;
}

export interface ErrorDto {
  tipo: string;
  linea: number;
  columna: number;
  token: string;
  mensaje: string;
  sugerencia: string;
}

export interface InstruccionDto {
  orden: number;
  nombre: string;
  raw: string;
  parametro_n: number | null;
  parametro_r: number | null;
  parametro_l: number | null;
}

export interface SimulacionDto {
  simulacion_id: number;
  trayectoria_json: string;
  duracion_estimada_seg: number;
  distancia_total_cm: number;
}

export interface CompileResponse {
  exitoso: boolean;
  resultado: string;
  compilacion_id: number;
  tiempo_ms: number;
  tokens: TokenDto[];
  errores: ErrorDto[];
  instrucciones: InstruccionDto[];
  codigo_transpilado: string;
  simulacion: SimulacionDto | null;
}

export interface CompileRequest {
  codigo_fuente: string;
  modo: ModoCompilacion;
  archivo_id: null;
  lenguaje_destino: LenguajeDestino;
}

export async function compilarCodigo(
  codigo_fuente: string,
  lenguaje_destino: LenguajeDestino,
  modo: ModoCompilacion = 'solo_compilar'
): Promise<CompileResponse> {
  const token = localStorage.getItem('rover_token');

  const body: CompileRequest = {
    codigo_fuente,
    modo,
    archivo_id: null,
    lenguaje_destino,
  };

  const response = await axios.post<CompileResponse>(
    `${API_URL}/api/Compiler/analyze`,
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}
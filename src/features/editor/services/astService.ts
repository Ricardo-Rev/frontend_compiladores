import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5123';

export interface AstNodoDto {
  tipo: string;
  valor: string | null;
  linea: number;
  hijos: AstNodoDto[];
}

export interface AstResponse {
  exitoso: boolean;
  programa: string;
  arbol: AstNodoDto | null;
  errores: {
    tipo: string;
    codigo: string | null;
    linea: number | null;
    columna: number | null;
    mensaje: string;
    sugerencia: string | null;
  }[];
}

export async function generarAst(codigo_fuente: string): Promise<AstResponse> {
  const token = localStorage.getItem('rover_token');

  const response = await axios.post<AstResponse>(
    `${API_URL}/api/Compiler/ast`,
    { codigo_fuente, modo: 'solo_compilar', lenguaje_destino: 'python' },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}
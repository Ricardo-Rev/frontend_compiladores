import { useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5123';

// ── Tipos de los eventos que llegan desde el backend ─────────
export interface RoverStatusPayload {
  status: 'online' | 'offline' | 'ejecutando';
  compilacion_id?: number;
  timestamp: string;
}

export interface RoverAckPayload {
  estado: 'ok' | 'error' | 'stopped' | 'completado';
  mensaje: string;
  compilacion_id?: number;
  timestamp: string;
}

export interface RoverProgresoPayload {
  compilacion_id: number;
  progreso: number;
  total: number;
}

interface UseRoverSignalROptions {
  onStatus: (data: RoverStatusPayload) => void;
  onAck: (data: RoverAckPayload) => void;
  onProgreso: (data: RoverProgresoPayload) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (msg: string) => void;
}

// ── Hook ──────────────────────────────────────────────────────
export function useRoverSignalR(options: UseRoverSignalROptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // Guardar callbacks en ref para no recrear las funciones
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connect = useCallback(async () => {
    // Cerrar conexión anterior si existe
    if (connectionRef.current) {
      await connectionRef.current.stop().catch(() => null);
      connectionRef.current = null;
    }

    const hubUrl = `${API_URL}/hubs/rover`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        // El token se lee en tiempo real desde localStorage
        accessTokenFactory: () => localStorage.getItem('rover_token') ?? '',
      })
      .withAutomaticReconnect([0, 1500, 3000, 5000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // ── Eventos que llegan del backend ────────────────────────
    connection.on('RoverStatus', (data: RoverStatusPayload) => {
      optionsRef.current.onStatus(data);
    });

    connection.on('RoverAck', (data: RoverAckPayload) => {
      optionsRef.current.onAck(data);
    });

    connection.on('RoverProgreso', (data: RoverProgresoPayload) => {
      optionsRef.current.onProgreso(data);
    });

    connection.onclose(() => {
      optionsRef.current.onDisconnected();
    });

    connection.onreconnecting(() => {
      optionsRef.current.onError('Reconectando al rover...');
    });

    connection.onreconnected(() => {
      optionsRef.current.onConnected();
    });

    try {
      await connection.start();
      connectionRef.current = connection;
      optionsRef.current.onConnected();
    } catch (err) {
      optionsRef.current.onError(
        `No se pudo conectar al hub: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      await connectionRef.current.stop().catch(() => null);
      connectionRef.current = null;
    }
  }, []);

  // Limpiar al desmontar el componente
  useEffect(() => {
    return () => {
      connectionRef.current?.stop().catch(() => null);
    };
  }, []);

  return { connect, disconnect };
}
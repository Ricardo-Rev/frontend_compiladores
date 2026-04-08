import { useEffect, useRef, useCallback, useState } from 'react';
import { crearArchivo, actualizarArchivo } from '../services/fileService';

const LS_KEY           = 'rover_autosave_code';
const LS_TIMESTAMP_KEY = 'rover_autosave_ts';
const LS_ARCHIVO_ID    = 'rover_autosave_archivo_id';
const DEBOUNCE_MS      = 2000;
const BACKEND_INTERVAL = 30000;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  code:         string;
  archivoId:    number | null;
  setArchivoId: (id: number) => void;
}

export function useAutoSave({ code, archivoId, setArchivoId }: UseAutoSaveOptions) {
  const [status, setStatus]           = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const isDirtyRef      = useRef(false);
  const latestCode      = useRef(code);
  const latestArchivoId = useRef(archivoId);
  // Referencia del codigo que ya se guardo exitosamente en BD
  // Permite comparar si realmente hubo cambios antes de hacer PUT
  const lastSavedCode   = useRef<string | null>(null);
  const debounceTimer   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { latestCode.current = code; }, [code]);
  useEffect(() => { latestArchivoId.current = archivoId; }, [archivoId]);

  // Capa 1: localStorage con debounce
  useEffect(() => {
    if (!code) return;
    clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      localStorage.setItem(LS_KEY, code);
      localStorage.setItem(LS_TIMESTAMP_KEY, Date.now().toString());

      // Solo marcar dirty si el contenido cambio respecto al ultimo guardado en BD
      // Esto evita disparar PUT cuando el contenido no cambio desde el ultimo sync
      if (code !== lastSavedCode.current) {
        isDirtyRef.current = true;
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceTimer.current);
  }, [code]);

  // Capa 2: sincronizacion con backend cada 30s
  const syncBackend = useCallback(async () => {
    if (!isDirtyRef.current) return;

    const currentCode = latestCode.current;
    const currentId   = latestArchivoId.current;

    // Doble verificacion: si el codigo no cambio desde el ultimo guardado, cancelar
    if (currentCode === lastSavedCode.current) {
      isDirtyRef.current = false;
      return;
    }

    setStatus('saving');

    try {
      if (currentId) {
        await actualizarArchivo(currentId, {
          contenido:         currentCode,
          comentario:        'Auto-guardado',
          guardar_historial: false,   // ← agregar esto
        });
      } else {
        const nuevo = await crearArchivo({
          nombre_archivo: 'programa_rover',
          contenido:      currentCode,
          descripcion:    'Creado por autoguardado',
        });
        setArchivoId(nuevo.id);
        latestArchivoId.current = nuevo.id;
        localStorage.setItem(LS_ARCHIVO_ID, String(nuevo.id));
      }

      // Guardar referencia del codigo que se acaba de persistir en BD
      lastSavedCode.current = currentCode;
      isDirtyRef.current    = false;
      setStatus('saved');
      setLastSavedAt(new Date());

    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 401) return;
      setStatus('error');
    }
  }, [setArchivoId]);

  useEffect(() => {
    const interval = setInterval(syncBackend, BACKEND_INTERVAL);
    return () => clearInterval(interval);
  }, [syncBackend]);

  const restoreFromLocal = useCallback((): string | null => {
    return localStorage.getItem(LS_KEY);
  }, []);

  const getLocalTimestamp = useCallback((): number => {
    return parseInt(localStorage.getItem(LS_TIMESTAMP_KEY) ?? '0', 10);
  }, []);

  const getLocalArchivoId = useCallback((): number | null => {
    const raw = localStorage.getItem(LS_ARCHIVO_ID);
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? null : parsed;
  }, []);

  /**
   * Marcar el codigo actual como ya guardado en BD.
   * Llamar despues de abrir un archivo desde el menu para que el hook
   * no lo considere como cambio pendiente y no dispare un PUT innecesario.
   */
  const markAsSaved = useCallback((savedCode: string) => {
    lastSavedCode.current = savedCode;
    isDirtyRef.current    = false;
  }, []);

  const clearLocal = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_TIMESTAMP_KEY);
    localStorage.removeItem(LS_ARCHIVO_ID);
    lastSavedCode.current = null;
    isDirtyRef.current    = false;
  }, []);

  return {
    status,
    lastSavedAt,
    restoreFromLocal,
    getLocalTimestamp,
    getLocalArchivoId,
    markAsSaved,
    clearLocal,
  };
}
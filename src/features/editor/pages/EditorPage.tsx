import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { toast } from 'sonner';
import { useAuth } from '../../auth/context/AuthContext';
import { logoutUser } from '../../auth/services/authServices';
import {
  compilarCodigo,
  type LenguajeDestino,
  type ErrorDto,
  type TokenDto,
  type InstruccionDto,
} from '../services/compilerService';
import { generarAst, type AstNodoDto } from '../services/astService';
import {
  listarCoreografias,
  obtenerCoreografia,
  type ChoreoListItem,
} from '../services/choreoService';
import {
  listarArchivos,
  obtenerArchivo,
  obtenerHistorial,
  obtenerVersionHistorial,
  actualizarArchivo,
  type FileListResponse,
} from '../services/fileService';
import { useAutoSave, type SaveStatus } from '../hooks/useAutoSave';
import { useRoverSignalR } from '../hooks/useRoverSignalR';

// ── Íconos ──────────────────────────────────────────────────
const IconGrid         = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>);
const IconCode         = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>);
const IconUser         = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconLogout       = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const IconCpu          = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>);
const IconPlay         = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>);
const IconTrash        = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>);
const IconDownload     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);
const IconZap          = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
const IconList         = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>);
const IconTree         = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M5 9l7-6 7 6M5 15l7-6 7 6"/></svg>);
const IconMusic        = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>);
const IconChevronRight = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>);
const IconChevronDown  = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>);
const IconSimulate     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>);
const IconRover        = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="8" width="20" height="10" rx="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M7 8V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3"/></svg>);
const IconCamera       = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);
const IconSave         = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);
const IconFolder       = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>);
const IconFilePlus     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>);
const IconFileOpen     = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>);
const IconClock        = () => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const IconHistory      = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>);
const IconRotateCcw    = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>);
const IconX            = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconCheckCircle  = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
// ── NUEVOS ÍCONOS ────────────────────────────────────────────
const IconStop         = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>);
const IconPause        = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>);
const IconVolume       = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>);
const IconVolumeX      = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>);
const IconMusicNote    = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>);

// ── Indicador de autoguardado ────────────────────────────────
function AutoSaveIndicator({ status, lastSavedAt }: { status: SaveStatus; lastSavedAt: Date | null }) {
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const config: Record<SaveStatus, { color: string; dot: string; label: string }> = {
    idle:   { color: 'var(--text-muted)',  dot: 'rgba(255,255,255,0.2)', label: 'Sin cambios' },
    saving: { color: '#fbbf24',            dot: '#fbbf24',               label: 'Guardando...' },
    saved:  { color: 'var(--accent3)',     dot: '#34d399',               label: `Guardado ${lastSavedAt ? formatTime(lastSavedAt) : ''}` },
    error:  { color: '#f87171',            dot: '#f87171',               label: 'Sin conexión — guardado local' },
  };
  const { color, dot, label } = config[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.65rem', color, fontFamily: 'var(--font-mono)', transition: 'color 0.3s ease' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0, transition: 'background 0.3s ease', animation: status === 'saving' ? 'autosavePulse 1s ease-in-out infinite' : 'none' }} />
      <IconSave />
      {label}
    </div>
  );
}

// ── Modal Historial ──────────────────────────────────────────
interface VersionItem extends FileListResponse { contenido?: string; }
interface ModalHistorialProps {
  archivoId: number; archivoNombre: string;
  onRestaurar: (contenido: string, version: number) => void;
  onCerrar: () => void;
}

function ModalHistorial({ archivoId, archivoNombre, onRestaurar, onCerrar }: ModalHistorialProps) {
  const [versiones, setVersiones]               = useState<VersionItem[]>([]);
  const [cargando, setCargando]                 = useState(true);
  const [seleccionada, setSeleccionada]         = useState<VersionItem | null>(null);
  const [contenidoPreview, setContenidoPreview] = useState<string>('');
  const [cargandoPreview, setCargandoPreview]   = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const lista = await obtenerHistorial(archivoId);
        setVersiones(lista as VersionItem[]);
        if (lista.length > 0) seleccionarVersion(lista[0] as VersionItem);
      } catch { toast.error('No se pudo cargar el historial.'); }
      finally { setCargando(false); }
    };
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archivoId]);

  const seleccionarVersion = async (version: VersionItem) => {
    setSeleccionada(version);
    if (version.contenido) { setContenidoPreview(version.contenido); return; }
    setCargandoPreview(true);
    try {
      const detalle = await obtenerVersionHistorial(archivoId, version.version);
      const updated = { ...version, contenido: detalle.contenido };
      setVersiones(prev => prev.map(v => v.id === version.id ? updated : v));
      setSeleccionada(updated);
      setContenidoPreview(detalle.contenido);
    } catch { setContenidoPreview(`-- No se pudo cargar el código de la versión ${version.version}`); }
    finally { setCargandoPreview(false); }
  };

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleString('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '920px', height: '600px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', flexShrink: 0 }}>
          <IconHistory />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>Historial de versiones</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>{archivoNombre} — solo compilaciones exitosas</div>
          </div>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}><IconX /></button>
        </div>
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div style={{ width: '270px', flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {cargando ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cargando historial...</div>
            ) : versiones.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <IconHistory /><p style={{ margin: 0 }}>Sin versiones guardadas</p>
                <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--text-muted)' }}>Las versiones se crean al compilar exitosamente</p>
              </div>
            ) : (
              versiones.map((v, idx) => (
                <button key={v.id} onClick={() => seleccionarVersion(v)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', padding: '0.75rem 1rem', cursor: 'pointer', backgroundColor: seleccionada?.id === v.id ? 'rgba(56,189,248,0.08)' : 'transparent', borderLeft: seleccionada?.id === v.id ? '3px solid var(--accent)' : '3px solid transparent', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <IconCheckCircle />
                    <span style={{ color: seleccionada?.id === v.id ? 'var(--accent)' : 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700 }}>Versión {v.version}</span>
                    {idx === 0 && <span style={{ fontSize: '0.6rem', background: 'rgba(52,211,153,0.15)', color: 'var(--accent3)', padding: '1px 5px', borderRadius: '4px' }}>última</span>}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.descripcion ?? 'Compilación exitosa'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.67rem' }}><IconClock />{formatFecha(v.fecha_modificacion)}</div>
                </button>
              ))
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {seleccionada ? (
              <>
                <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>Vista previa — Versión {seleccionada.version}</span>
                  {cargandoPreview && <span style={{ color: 'var(--accent)', fontSize: '0.68rem', marginLeft: 'auto', flexShrink: 0 }}>Cargando...</span>}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <Editor height="100%" defaultLanguage="plaintext" theme="vs-dark" value={contenidoPreview} options={{ readOnly: true, fontSize: 12, fontFamily: 'JetBrains Mono, Fira Code, monospace', minimap: { enabled: false }, lineNumbers: 'on', scrollBeyondLastLine: false, padding: { top: 12, bottom: 12 }, renderLineHighlight: 'none', wordWrap: 'on' }} />
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', flexDirection: 'column', gap: '0.5rem' }}>
                <IconHistory /><p>Selecciona una versión para ver el preview</p>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', flexShrink: 0 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', flex: 1 }}>{versiones.length > 0 ? `${versiones.length} versión${versiones.length !== 1 ? 'es' : ''} compilada${versiones.length !== 1 ? 's' : ''} exitosamente` : ''}</span>
          <button onClick={onCerrar} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.825rem', cursor: 'pointer' }}>Cancelar</button>
          <button disabled={!seleccionada} onClick={() => seleccionada && onRestaurar(contenidoPreview, seleccionada.version)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: seleccionada ? 'var(--accent)' : 'rgba(56,189,248,0.15)', color: seleccionada ? '#000' : 'var(--text-muted)', border: 'none', borderRadius: '8px', padding: '0.5rem 1.1rem', fontSize: '0.825rem', fontWeight: 700, cursor: seleccionada ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
            <IconRotateCcw />Restaurar esta versión
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Menú Archivo ─────────────────────────────────────────────
interface MenuArchivoProps {
  onNuevo: () => void; onAbrir: (archivo: FileListResponse) => void;
  onVerHistorial: () => void; archivoActualId: number | null;
}

function MenuArchivo({ onNuevo, onAbrir, onVerHistorial, archivoActualId }: MenuArchivoProps) {
  const [open, setOpen]         = useState(false);
  const [archivos, setArchivos] = useState<FileListResponse[]>([]);
  const [cargando, setCargando] = useState(false);
  const [abriendo, setAbriendo] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = async () => {
    const next = !open; setOpen(next);
    if (next && archivos.length === 0) {
      setCargando(true);
      try { setArchivos(await listarArchivos()); }
      catch { toast.error('No se pudieron cargar los archivos.'); }
      finally { setCargando(false); }
    }
  };

  const handleSeleccionar = async (archivo: FileListResponse) => {
    if (abriendo !== null) return;
    setAbriendo(archivo.id);
    try { onAbrir(archivo); setOpen(false); }
    finally { setAbriendo(null); }
  };

  const formatFecha = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button onClick={handleToggle} style={styles.btnArchivo}><IconFolder />Archivo<IconChevronDown /></button>
      {open && (
        <div style={styles.archivoDropdown}>
          <div style={styles.archivoHeader}><span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Menú Archivo</span></div>
          <button onClick={() => { onNuevo(); setOpen(false); }} style={styles.archivoAccion}><IconFilePlus /><div><div style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600 }}>Nuevo archivo</div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Limpiar editor y empezar desde cero</div></div></button>
          {archivoActualId && (
            <button onClick={() => { onVerHistorial(); setOpen(false); }} style={styles.archivoAccion}><IconHistory /><div><div style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600 }}>Historial de versiones</div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Ver y restaurar compilaciones exitosas</div></div></button>
          )}
          <div style={{ height: '1px', background: 'var(--border)' }} />
          <div style={{ padding: '6px 10px 4px' }}><span style={{ color: 'var(--text-muted)', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Abrir guardado</span></div>
          {cargando ? <div style={styles.archivoEmpty}>Cargando archivos...</div>
            : archivos.length === 0 ? <div style={styles.archivoEmpty}>No hay archivos guardados aún</div>
            : <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {archivos.map(a => (
                <button key={a.id} onClick={() => handleSeleccionar(a)} disabled={abriendo === a.id} style={{ ...styles.archivoItem, backgroundColor: archivoActualId === a.id ? 'rgba(56,189,248,0.08)' : 'transparent', borderLeft: archivoActualId === a.id ? '2px solid var(--accent)' : '2px solid transparent' }}>
                  <IconFileOpen />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: archivoActualId === a.id ? 'var(--accent)' : 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre_archivo}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>v{a.version}</span>
                      {archivoActualId === a.id && <span style={{ fontSize: '0.6rem', background: 'rgba(56,189,248,0.15)', color: 'var(--accent)', padding: '1px 5px', borderRadius: '4px', flexShrink: 0 }}>actual</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.67rem', marginTop: '2px' }}><IconClock />{formatFecha(a.fecha_modificacion)}</div>
                  </div>
                  {abriendo === a.id && <span style={{ color: 'var(--accent)', fontSize: '0.68rem', flexShrink: 0 }}>Abriendo...</span>}
                </button>
              ))}
            </div>}
        </div>
      )}
    </div>
  );
}

// ── Divisores arrastrables ───────────────────────────────────
function HDivider({ onDrag }: { onDrag: (dx: number) => void }) {
  const dragging = useRef(false); const lastX = useRef(0);
  const onMouseDown = (e: React.MouseEvent) => { dragging.current = true; lastX.current = e.clientX; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; };
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (!dragging.current) return; onDrag(e.clientX - lastX.current); lastX.current = e.clientX; };
    const onUp = () => { dragging.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [onDrag]);
  return (
    <div onMouseDown={onMouseDown} style={{ width: '6px', flexShrink: 0, cursor: 'col-resize', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <div style={{ width: '2px', height: '40px', borderRadius: '2px', background: 'var(--border)' }} />
    </div>
  );
}

function VDivider({ onDrag }: { onDrag: (dy: number) => void }) {
  const dragging = useRef(false); const lastY = useRef(0);
  const onMouseDown = (e: React.MouseEvent) => { dragging.current = true; lastY.current = e.clientY; document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none'; };
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (!dragging.current) return; onDrag(e.clientY - lastY.current); lastY.current = e.clientY; };
    const onUp = () => { dragging.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [onDrag]);
  return (
    <div onMouseDown={onMouseDown} style={{ height: '6px', flexShrink: 0, cursor: 'row-resize', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <div style={{ height: '2px', width: '40px', borderRadius: '2px', background: 'var(--border)' }} />
    </div>
  );
}

// ── AST ──────────────────────────────────────────────────────
const NODE_COLORS: Record<string, string> = {
  PROGRAMA: 'var(--accent)', BLOQUE: 'var(--accent2)', INSTRUCCION: 'var(--accent3)',
  INSTRUCCION_COMBINADA: 'var(--warning)', COMPONENTE: '#f472b6', PARAMETRO: 'var(--text-muted)',
};

function AstNodo({ nodo, depth = 0 }: { nodo: AstNodoDto; depth?: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const color = NODE_COLORS[nodo.tipo] ?? 'var(--text-secondary)';
  const tieneHijos = nodo.hijos && nodo.hijos.length > 0;
  return (
    <div style={{ marginLeft: depth === 0 ? 0 : '1.25rem', borderLeft: depth > 0 ? '1px dashed rgba(255,255,255,0.08)' : 'none', paddingLeft: depth > 0 ? '0.75rem' : 0 }}>
      <div onClick={() => tieneHijos && setCollapsed(c => !c)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.4rem', borderRadius: '6px', cursor: tieneHijos ? 'pointer' : 'default', marginBottom: '0.2rem', background: depth === 0 ? 'rgba(56,189,248,0.07)' : 'transparent' }}>
        {tieneHijos ? (collapsed ? <IconChevronRight /> : <IconChevronDown />) : <span style={{ width: 12 }} />}
        <span style={{ color, fontWeight: depth === 0 ? '700' : '600', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{nodo.tipo}</span>
        {nodo.valor && <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>= <span style={{ color: 'var(--accent3)' }}>{nodo.valor}</span></span>}
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.65rem' }}>L{nodo.linea}</span>
      </div>
      {!collapsed && tieneHijos && <div>{nodo.hijos.map((hijo, i) => <AstNodo key={i} nodo={hijo} depth={depth + 1} />)}</div>}
    </div>
  );
}

// ── Simulación ────────────────────────────────────────────────
interface SimPoint   { x: number; y: number; angle: number; }
interface SimSegment { points: SimPoint[]; instrIdx: number; }

const METRO_PX = 60;
const WHEEL_BASE_PX = 18;
const CM_POR_VUELTA = 20.4;

function calcularTrayectoria(instrucciones: InstruccionDto[]): SimSegment[] {
  const segments: SimSegment[] = [];
  let x = 0, y = 0, angle = -Math.PI / 2;

  for (let idx = 0; idx < instrucciones.length; idx++) {
    const inst  = instrucciones[idx];
    const n     = inst.parametro_n ?? inst.parametro_r ?? inst.parametro_l ?? 1;
    const nombre = inst.nombre.toLowerCase();
    const pts: SimPoint[] = [{ x, y, angle }];

    const avanzarPx = (px: number, dir: number, steps: number) => {
      for (let s = 1; s <= steps; s++) {
        x += Math.cos(angle) * (px / steps) * dir;
        y += Math.sin(angle) * (px / steps) * dir;
        pts.push({ x, y, angle });
      }
    };

    if (nombre === 'avanzar_mts') {
      avanzarPx(Math.abs(n) * METRO_PX, n > 0 ? 1 : -1, 40);
    } else if (nombre === 'avanzar_ctms') {
      avanzarPx(Math.abs(n) * METRO_PX / 100, n > 0 ? 1 : -1, Math.max(10, Math.abs(n)));
    } else if (nombre === 'avanzar_vlts') {
      const pxPerVuelta = CM_POR_VUELTA * METRO_PX / 100;
      avanzarPx(Math.abs(n) * pxPerVuelta, n > 0 ? 1 : -1, 20);
    } else if (nombre === 'girar') {
      if (n === 0) {
        avanzarPx(10 * METRO_PX / 100, 1, 10);
      } else {
        const dir = n > 0 ? 1 : -1;
        const steps = 24;
        const pivotAngle = angle + dir * Math.PI / 2;
        const pivotX = x + Math.cos(pivotAngle) * WHEEL_BASE_PX;
        const pivotY = y + Math.sin(pivotAngle) * WHEEL_BASE_PX;
        for (let s = 1; s <= steps; s++) {
          const newAngle  = angle + dir * (Math.PI / 2 * s / steps);
          const backAngle = newAngle - dir * Math.PI / 2;
          x = pivotX + Math.cos(backAngle) * WHEEL_BASE_PX;
          y = pivotY + Math.sin(backAngle) * WHEEL_BASE_PX;
          pts.push({ x, y, angle: newAngle });
        }
        angle += dir * Math.PI / 2;
        if (pts.length > 1) { x = pts[pts.length - 1].x; y = pts[pts.length - 1].y; }
      }
    } else if (nombre === 'circulo') {
      const r = Math.abs(n) * METRO_PX / 100;
      const sa = angle;
      for (let s = 1; s <= 80; s++) {
        const a = sa + (Math.PI * 2 * s) / 80;
        pts.push({ x: x + Math.cos(a) * r - Math.cos(sa) * r, y: y + Math.sin(a) * r - Math.sin(sa) * r, angle: a + Math.PI / 2 });
      }
    } else if (nombre === 'cuadrado') {
      const lado = Math.abs(n) * METRO_PX / 100;
      for (let side = 0; side < 4; side++) {
        for (let s = 1; s <= 15; s++) { x += Math.cos(angle) * (lado / 15); y += Math.sin(angle) * (lado / 15); pts.push({ x, y, angle }); }
        const cx = x, cy = y;
        for (let s = 1; s <= 16; s++) { const na = angle + (Math.PI / 2 * s / 16); pts.push({ x: cx, y: cy, angle: na }); }
        angle += Math.PI / 2;
      }
    } else if (nombre === 'rotar') {
      const vueltas = Math.abs(n); const dir = n > 0 ? 1 : -1;
      for (let s = 1; s <= 40; s++) { angle += (Math.PI * 2 * vueltas * dir) / 40; pts.push({ x, y, angle }); }
    } else if (nombre === 'caminar') {
      avanzarPx(Math.abs(n) * METRO_PX * 0.18, n > 0 ? 1 : -1, 25);
    } else if (nombre === 'moonwalk') {
      avanzarPx(Math.abs(n) * METRO_PX * 0.18, n > 0 ? 1 : -1, 25);
    } else {
      pts.push({ x, y, angle });
    }
    segments.push({ points: pts, instrIdx: idx });
  }
  return segments;
}

interface SimuladorProps { instrucciones: InstruccionDto[]; activeInstrIdx: number; animProgress: number; }

function Simulador({ instrucciones, activeInstrIdx, animProgress }: SimuladorProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const segRef      = useRef<SimSegment[]>([]);
  const zoomRef     = useRef(1);
  const offsetRef   = useRef({ x: 0, y: 0 });
  const autoZoomRef = useRef(1);
  const autoOffRef  = useRef({ x: 0, y: 0 });
  const [zoomDisplay, setZoomDisplay] = useState(100);

  useEffect(() => {
    segRef.current = calcularTrayectoria(instrucciones);
    zoomRef.current = 1; offsetRef.current = { x: 0, y: 0 };
    if (segRef.current.length > 0) {
      const allPts = segRef.current.flatMap(s => s.points);
      const xs = allPts.map(p => p.x); const ys = allPts.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const W = canvasRef.current?.width ?? 320; const H = canvasRef.current?.height ?? 240;
      const pad = 40;
      const scale = Math.min((W - pad * 2) / (maxX - minX || 1), (H - pad * 2) / (maxY - minY || 1), 3);
      autoZoomRef.current = scale;
      autoOffRef.current = { x: W / 2 - ((minX + maxX) / 2) * scale, y: H / 2 - ((minY + maxY) / 2) * scale };
    }
    setZoomDisplay(Math.round(zoomRef.current * 100));
  }, [instrucciones]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); zoomRef.current = Math.min(Math.max(zoomRef.current * (e.deltaY < 0 ? 1.12 : 0.88), 0.1), 10); setZoomDisplay(Math.round(zoomRef.current * 100)); };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  const changeZoom = (f: number) => { zoomRef.current = Math.min(Math.max(zoomRef.current * f, 0.1), 10); setZoomDisplay(Math.round(zoomRef.current * 100)); };
  const resetZoom  = () => { zoomRef.current = 1; offsetRef.current = { x: 0, y: 0 }; setZoomDisplay(100); };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0a0f1a'; ctx.fillRect(0, 0, W, H);
    const totalZoom = autoZoomRef.current * zoomRef.current;
    const ox = autoOffRef.current.x + offsetRef.current.x;
    const oy = autoOffRef.current.y + offsetRef.current.y;
    ctx.save(); ctx.translate(ox, oy); ctx.scale(totalZoom, totalZoom);
    const gridStep = METRO_PX / 2;
    ctx.strokeStyle = 'rgba(56,189,248,0.05)'; ctx.lineWidth = 0.5 / totalZoom;
    const gx0 = -ox/totalZoom, gy0 = -oy/totalZoom, gxN = (W-ox)/totalZoom, gyN = (H-oy)/totalZoom;
    for (let gx = Math.floor(gx0/gridStep)*gridStep; gx <= gxN; gx += gridStep) { ctx.beginPath(); ctx.moveTo(gx,gy0); ctx.lineTo(gx,gyN); ctx.stroke(); }
    for (let gy = Math.floor(gy0/gridStep)*gridStep; gy <= gyN; gy += gridStep) { ctx.beginPath(); ctx.moveTo(gx0,gy); ctx.lineTo(gxN,gy); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0,0,4/totalZoom,0,Math.PI*2); ctx.fillStyle='rgba(56,189,248,0.6)'; ctx.fill();
    ctx.strokeStyle='rgba(56,189,248,0.4)'; ctx.lineWidth=1/totalZoom; ctx.beginPath(); ctx.arc(0,0,10/totalZoom,0,Math.PI*2); ctx.stroke();
    if (segRef.current.length === 0) { ctx.restore(); return; }
    ctx.setLineDash([4/totalZoom,4/totalZoom]); ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1/totalZoom; ctx.beginPath();
    let firstPt = true;
    for (const seg of segRef.current) { for (const pt of seg.points) { if (firstPt) { ctx.moveTo(pt.x,pt.y); firstPt=false; } else ctx.lineTo(pt.x,pt.y); } }
    ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i <= Math.min(activeInstrIdx, segRef.current.length-1); i++) {
      const seg = segRef.current[i]; if (!seg) continue;
      const isActive = i === activeInstrIdx;
      const pts = isActive ? seg.points.slice(0, Math.max(2, Math.round(seg.points.length*animProgress))) : seg.points;
      ctx.beginPath(); ctx.lineWidth=(isActive?2:1.5)/totalZoom; ctx.strokeStyle=isActive?'#38bdf8':'rgba(56,189,248,0.55)';
      let f=true; for (const pt of pts) { if(f){ctx.moveTo(pt.x,pt.y);f=false;}else ctx.lineTo(pt.x,pt.y); } ctx.stroke();
      const p0=seg.points[0]; ctx.beginPath(); ctx.arc(p0.x,p0.y,(isActive?3:2)/totalZoom,0,Math.PI*2); ctx.fillStyle=isActive?'#38bdf8':'rgba(56,189,248,0.5)'; ctx.fill();
    }
    const activeSeg = segRef.current[Math.min(activeInstrIdx, segRef.current.length-1)];
    if (activeSeg && activeInstrIdx >= 0) {
      const pts=activeSeg.points; const rawIdx=animProgress*(pts.length-1);
      const i0=Math.floor(rawIdx), i1=Math.min(i0+1,pts.length-1); const t=rawIdx-i0;
      const rx=pts[i0].x+(pts[i1].x-pts[i0].x)*t; const ry=pts[i0].y+(pts[i1].y-pts[i0].y)*t; const ra=pts[i0].angle+(pts[i1].angle-pts[i0].angle)*t;
      const s=1/totalZoom; ctx.save(); ctx.translate(rx,ry); ctx.rotate(ra+Math.PI/2);
      ctx.beginPath(); ctx.arc(0,0,14*s,0,Math.PI*2); ctx.fillStyle='rgba(56,189,248,0.08)'; ctx.fill();
      ctx.fillStyle='#1e3a5f'; ctx.strokeStyle='#38bdf8'; ctx.lineWidth=1.2*s;
      const bw=8*s,bh=12*s; ctx.beginPath(); ctx.roundRect(-bw/2,-bh/2,bw,bh,2*s); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#38bdf8';
      [[-bw/2-2*s,-bh*0.3],[bw/2-2*s,-bh*0.3],[-bw/2-2*s,bh*0.15],[bw/2-2*s,bh*0.15]].forEach(([wx,wy])=>{ctx.beginPath();ctx.rect(wx,wy as number,4*s,5*s);ctx.fill();});
      ctx.fillStyle='#7dd3fc'; ctx.beginPath(); ctx.arc(0,-bh/2-1*s,2.5*s,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }, [activeInstrIdx, animProgress, instrucciones]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} width={320} height={240} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(10,15,26,0.85)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '8px', padding: '4px 6px' }}>
        <button onClick={() => changeZoom(0.8)} style={zoomBtn}>−</button>
        <span onClick={resetZoom} style={{ color: '#38bdf8', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', minWidth: '36px', textAlign: 'center' }}>{zoomDisplay}%</span>
        <button onClick={() => changeZoom(1.25)} style={zoomBtn}>+</button>
      </div>
    </div>
  );
}

const zoomBtn: React.CSSProperties = { background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 };

// ── Registro del lenguaje UMG++ en Monaco ────────────────────
import type * as Monaco from 'monaco-editor';
let temaRegistrado = false;

function registrarLenguajeUmgpp(monaco: typeof Monaco) {
  const yaRegistrado = monaco.languages.getLanguages().some(l => l.id === 'umgpp');
  if (!yaRegistrado) {
    monaco.languages.register({ id: 'umgpp' });
    monaco.languages.setMonarchTokensProvider('umgpp', {
      tokenizer: {
        root: [
          [/\b(PROGRAM|BEGIN|END)\b/, 'keyword'],
          [/\.(?!\d)/, 'keyword'],
          [/\b(avanzar_mts|avanzar_ctms|avanzar_vlts|girar|circulo|cuadrado|rotar|caminar|moonwalk)\b/, 'command'],
          [/[()]/, 'paren'],
          [/-?\d+/, 'number'],
          [/;/, 'delimiter'],
        ],
      },
    });
  }
  if (!temaRegistrado) {
    monaco.editor.defineTheme('umgpp-dark', {
      base: 'vs-dark', inherit: true,
      rules: [
        { token: 'keyword', foreground: '4A9EFF', fontStyle: 'bold' },
        { token: 'command', foreground: '38BDF8' },
        { token: 'paren',   foreground: '4ADE80' },
        { token: 'number',  foreground: 'F87171' },
      ],
      colors: { 'editor.background': '#0d1117' },
    });
    temaRegistrado = true;
  }
  monaco.editor.setTheme('umgpp-dark');
}

// ── Constantes ───────────────────────────────────────────────
const CODIGO_EJEMPLO = `PROGRAM mi_ruta\nBEGIN\n  avanzar_mts(3);\n  girar(1);\n  circulo(50);\nEND.\n`;
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5123';
type OutputTab  = 'consola' | 'tokens' | 'instrucciones' | 'codigo' | 'ast';
type OutputLine = { type: 'info' | 'success' | 'error' | 'warn'; text: string };

// ── EditorPage ───────────────────────────────────────────────
export function EditorPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [code, setCode]                   = useState(CODIGO_EJEMPLO);
  const [archivoNombre, setArchivoNombre] = useState('programa_rover.umgpp');
  const [isCompiling, setIsCompiling]     = useState(false);
  const [selectedLang, setSelectedLang]   = useState<LenguajeDestino>('python');
  const [compilaciones, setCompilaciones] = useState(0);
  const [consolaLines, setConsolaLines]   = useState<OutputLine[]>([]);
  const [tokens, setTokens]               = useState<TokenDto[]>([]);
  const [instrucciones, setInstrucciones] = useState<InstruccionDto[]>([]);
  const [codigoTranspilado, setCodigoTranspilado] = useState('');
  const [activeTab, setActiveTab]         = useState<OutputTab>('consola');
  const [lastTiempoMs, setLastTiempoMs]   = useState<number | null>(null);
  const [lastCompilacionId, setLastCompilacionId] = useState<number | null>(null);
  const [astData, setAstData]             = useState<AstNodoDto | null>(null);
  const [isLoadingAst, setIsLoadingAst]   = useState(false);
  const [choreoOpen, setChoreoOpen]       = useState(false);
  const [choreoList, setChoreoList]       = useState<ChoreoListItem[]>([]);
  const [choreoLoading, setChoreoLoading] = useState(false);
  const [choreoLoadingId, setChoreoLoadingId] = useState<number | null>(null);
  const choreoRef = useRef<HTMLDivElement>(null);
  const [isSimulating, setIsSimulating]   = useState(false);
  const [simActiveIdx, setSimActiveIdx]   = useState(-1);
  const [animProgress, setAnimProgress]   = useState(0);
  const rafRef      = useRef<number>(0);
  const simStateRef = useRef({ idx: -1, running: false });
  const [isSendingRover, setIsSendingRover] = useState(false);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [archivoId, setArchivoId]         = useState<number | null>(null);

  // ── NUEVAS VARIABLES DE ESTADO: Audio + STOP ─────────────────
  const audioRef                        = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioVolume, setAudioVolume]   = useState(0.8);
  const [cancionActual, setCancionActual] = useState<string | null>(null);
  const [cancionUrl, setCancionUrl]     = useState<string | null>(null);
  const [roverActivo, setRoverActivo]   = useState(false);
  const [isStopping, setIsStopping]     = useState(false);

  const { status: saveStatus, lastSavedAt, restoreFromLocal, getLocalTimestamp, getLocalArchivoId, markAsSaved, clearLocal } =
    useAutoSave({ code, archivoId, setArchivoId });

  // ── SignalR ──────────────────────────────────────────────────
  const addLine = useCallback((type: OutputLine['type'], text: string) =>
    setConsolaLines(prev => [...prev, { type, text }]), []);

  const { connect: connectSignalR, disconnect: disconnectSignalR } = useRoverSignalR({
    onConnected:    () => addLine('info', '📶 Conexión en tiempo real establecida con el rover'),
    onDisconnected: () => addLine('info', '🔌 Conexión con el rover cerrada'),
    onError:        (msg) => addLine('error', `❌ ${msg}`),

    onStatus: (data) => {
      if (data.status === 'offline') addLine('warn', '⚠️ Rover desconectado');
      else if (data.status === 'ejecutando') addLine('info', `🤖 Rover ejecutando compilación #${data.compilacion_id ?? ''}`);
    },

    onAck: (data) => {
      if (data.estado === 'ok') {
        addLine('success', `✅ ACK recibido: ${data.mensaje}`);
      } else if (data.estado === 'completado') {
        // ── NUEVO: detener música cuando el rover termina ──────
        detenerMusica();
        setRoverActivo(false);
        addLine('success', '🏁 Rover completó la ejecución');
        toast.success('Rover completó la ejecución 🏁');
        disconnectSignalR();
      } else if (data.estado === 'error') {
        addLine('error', `❌ Error en rover: ${data.mensaje}`);
        toast.error(`Error en rover: ${data.mensaje}`);
      } else if (data.estado === 'stopped') {
        // ── NUEVO: detener música cuando llega STOP ────────────
        detenerMusica();
        setRoverActivo(false);
        addLine('warn', '⚠️ Rover detenido por STOP de emergencia');
      }
    },

    onProgreso: (data) => {
      addLine('info', `🤖 Rover → instrucción ${data.progreso}/${data.total}`);
    },
  });

  // ── NUEVO: Inicializar elemento de audio ────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.volume = audioVolume;
    const onEnded = () => setAudioPlaying(false);
    audio.addEventListener('ended', onEnded);
    audioRef.current = audio;
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── NUEVO: Recargar audio cuando cambia la URL ──────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(false);
      if (cancionUrl) {
        audioRef.current.src = cancionUrl;
        audioRef.current.load();
      } else {
        audioRef.current.src = '';
      }
    }
  }, [cancionUrl]);

  // ── NUEVO: Helper para detener la música ────────────────────
  const detenerMusica = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioPlaying(false);
    }
  }, []);

  // ── NUEVO: Toggle play/pause del audio ──────────────────────
  const handleToggleAudio = useCallback(() => {
    if (!audioRef.current || !cancionUrl) return;
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setAudioPlaying(true))
        .catch(() => toast.error('No se pudo reproducir la canción. Verifica la URL en el backend.'));
    }
  }, [audioPlaying, cancionUrl]);

  // ── NUEVO: Cambiar volumen ───────────────────────────────────
  const handleVolumeChange = useCallback((vol: number) => {
    setAudioVolume(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  // ── NUEVO: STOP de emergencia ────────────────────────────────
  const handleStop = async () => {
    detenerMusica();
    setRoverActivo(false);
    setIsStopping(true);
    try {
      const token = localStorage.getItem('rover_token');
      const res = await fetch(`${API_URL}/api/Rover/stop`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        addLine('warn', '🛑 STOP de emergencia enviado al rover');
        toast.warning('🛑 Rover detenido');
        setActiveTab('consola');
        disconnectSignalR();
      } else {
        addLine('error', `❌ Error al enviar STOP: ${data.error ?? 'desconocido'}`);
        toast.error('Error al enviar STOP al rover');
      }
    } catch {
      addLine('error', '❌ Error de conexión al enviar STOP');
      toast.error('Error de conexión');
    } finally {
      setIsStopping(false);
    }
  };

  // ── Restaurar al montar ──────────────────────────────────────
  useEffect(() => {
    const localId = getLocalArchivoId();
    if (localId) setArchivoId(localId);
    const localCode = restoreFromLocal();
    const localTs   = getLocalTimestamp();
    if (localCode && localTs > Date.now() - 1000 * 60 * 60 * 24 && localCode !== CODIGO_EJEMPLO) {
      setCode(localCode); markAsSaved(localCode);
      addLine('info', '💾 Código restaurado desde autoguardado local');
      toast.info('Código restaurado desde el último autoguardado');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Layout ───────────────────────────────────────────────────
  const containerRef  = useRef<HTMLDivElement>(null);
  const visualColRef  = useRef<HTMLDivElement>(null);
  const [colWidths, setColWidths]             = useState([30, 30, 40]);
  const [cameraHeightPct, setCameraHeightPct] = useState(35);
  const initials = user?.usuario?.charAt(0).toUpperCase() ?? '?';

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (choreoRef.current && !choreoRef.current.contains(e.target as Node)) setChoreoOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── MODIFICADO: cleanup incluye audio ───────────────────────
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    disconnectSignalR();
    audioRef.current?.pause();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onDragDiv1 = useCallback((dx: number) => {
    const total = containerRef.current?.clientWidth ?? 1; const pct = (dx / total) * 100;
    setColWidths(prev => { const newA = Math.max(15, Math.min(60, prev[0]+pct)); const diff = newA-prev[0]; const newB = Math.max(15, Math.min(60, prev[1]-diff)); return [newA, newB, 100-newA-newB]; });
  }, []);

  const onDragDiv2 = useCallback((dx: number) => {
    const total = containerRef.current?.clientWidth ?? 1; const pct = (dx / total) * 100;
    setColWidths(prev => { const newB = Math.max(15, Math.min(60, prev[1]+pct)); const diff = newB-prev[1]; const newC = Math.max(15, Math.min(60, prev[2]-diff)); return [prev[0], newB, newC]; });
  }, []);

  const onDragVDiv = useCallback((dy: number) => {
    const total = visualColRef.current?.clientHeight ?? 1; const pct = (dy / total) * 100;
    setCameraHeightPct(prev => Math.max(15, Math.min(75, prev + pct)));
  }, []);

  const handleLogout = async () => {
    detenerMusica();
    try { await logoutUser(); } finally { logout(); toast.success('Sesión cerrada.'); navigate('/login'); }
  };

  // ── MODIFICADO: Nuevo — limpia audio ─────────────────────────
  const handleNuevo = useCallback(() => {
    detenerMusica();
    setCancionActual(null);
    setCancionUrl(null);
    setRoverActivo(false);
    setCode(''); setArchivoNombre('nuevo_programa.umgpp'); setArchivoId(null); clearLocal();
    setConsolaLines([]); setTokens([]); setInstrucciones([]);
    setCodigoTranspilado(''); setAstData(null); setSimActiveIdx(-1); setAnimProgress(0);
    cancelAnimationFrame(rafRef.current); setIsSimulating(false); simStateRef.current.running = false;
    setActiveTab('consola');
    toast.success('Nuevo archivo — empieza a escribir tu código');
  }, [clearLocal, detenerMusica]);

  // ── Abrir archivo ────────────────────────────────────────────
  const handleAbrirArchivo = useCallback(async (archivo: FileListResponse) => {
    try {
      const detalle = await obtenerArchivo(archivo.id);
      setCode(detalle.contenido); setArchivoNombre(detalle.nombre_archivo); setArchivoId(detalle.id);
      markAsSaved(detalle.contenido);
      localStorage.setItem('rover_autosave_code', detalle.contenido);
      localStorage.setItem('rover_autosave_ts', Date.now().toString());
      localStorage.setItem('rover_autosave_archivo_id', String(detalle.id));
      setConsolaLines([]); setTokens([]); setInstrucciones([]);
      setCodigoTranspilado(''); setAstData(null); setSimActiveIdx(-1); setAnimProgress(0);
      cancelAnimationFrame(rafRef.current); setIsSimulating(false); simStateRef.current.running = false;
      setActiveTab('consola');
      addLine('info', `📂 Archivo abierto: ${detalle.nombre_archivo} (v${detalle.version})`);
      toast.success(`Archivo "${detalle.nombre_archivo}" cargado`);
    } catch { toast.error('No se pudo abrir el archivo.'); }
  }, [markAsSaved, addLine]);

  // ── Restaurar versión ────────────────────────────────────────
  const handleRestaurarVersion = useCallback((contenido: string, version: number) => {
    setCode(contenido); setHistorialOpen(false);
    setConsolaLines([]); setTokens([]); setInstrucciones([]);
    setCodigoTranspilado(''); setAstData(null);
    setSimActiveIdx(-1); setAnimProgress(0);
    cancelAnimationFrame(rafRef.current);
    setIsSimulating(false); simStateRef.current.running = false;
    setActiveTab('consola');
    addLine('info', `🔄 Versión ${version} restaurada`);
    toast.success(`Versión ${version} restaurada en el editor`);
    setTimeout(() => { if (monacoRef.current) monacoRef.current.editor.setTheme('umgpp-dark'); }, 150);
  }, [addLine]);

  // ── Compilar ─────────────────────────────────────────────────
  const handleCompile = async () => {
    if (!code.trim()) { toast.error('El editor está vacío.'); return; }
    setIsCompiling(true);
    setConsolaLines([]); setTokens([]); setInstrucciones([]); setCodigoTranspilado('');
    setAstData(null); setSimActiveIdx(-1); setAnimProgress(0); setActiveTab('consola');
    addLine('info', '🔍 Conectando con el compilador UMG++...');
    try {
      const result = await compilarCodigo(code, selectedLang);
      setLastTiempoMs(result.tiempo_ms);
      if (result.exitoso) {
        addLine('success', `✅ Compilación exitosa en ${result.tiempo_ms}ms (ID: ${result.compilacion_id})`);
        addLine('info', `📦 ${result.tokens.length} tokens reconocidos`);
        addLine('info', `🎯 ${result.instrucciones.length} instrucciones validadas`);
        addLine('success', `🐍 Código ${selectedLang.toUpperCase()} generado correctamente`);
        addLine('info', `💡 Usa "Simular" para previsualizar el recorrido`);
        setTokens(result.tokens); setInstrucciones(result.instrucciones);
        setCodigoTranspilado(result.codigo_transpilado); setLastCompilacionId(result.compilacion_id);
        setCompilaciones(c => c + 1);
        toast.success(`Compilación exitosa en ${result.tiempo_ms}ms 🚀`);
        setTimeout(() => setActiveTab('codigo'), 600);
        if (archivoId) {
          try {
            await actualizarArchivo(archivoId, { contenido: code, comentario: `Compilación exitosa — ${result.instrucciones.length} instrucciones`, guardar_historial: true });
            markAsSaved(code);
            addLine('info', '📌 Versión guardada en historial');
          } catch { /* no interrumpir flujo */ }
        }
      } else {
        addLine('error', `❌ Compilación fallida: ${result.resultado}`);
        result.errores.forEach((e: ErrorDto) => {
          addLine('error', `  [${e.tipo.toUpperCase()}] Línea ${e.linea ?? '?'}, Col ${e.columna ?? '?'}: ${e.mensaje}`);
          if (e.sugerencia) addLine('warn', `  💡 ${e.sugerencia}`);
        });
        setTokens(result.tokens); toast.error('Error de compilación — revisa la consola');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
      const status = axiosErr.response?.status; const msg = axiosErr.response?.data?.error ?? 'Error al conectar con el compilador.';
      if (status === 401) { addLine('error', '❌ Sesión expirada.'); toast.error('Sesión expirada.'); logout(); navigate('/login'); }
      else { addLine('error', `❌ ${msg}`); toast.error(msg); }
    } finally { setIsCompiling(false); }
  };

  // ── Simular ──────────────────────────────────────────────────
  const handleSimular = useCallback(() => {
    if (instrucciones.length === 0) { toast.error('Compila primero para simular.'); return; }
    if (isSimulating) {
      simStateRef.current.running = false; cancelAnimationFrame(rafRef.current);
      setIsSimulating(false); setSimActiveIdx(-1); setAnimProgress(0);
      toast.info('Simulación detenida.'); return;
    }
    const SEG_DURATION = 900;
    simStateRef.current = { idx: 0, running: true };
    setIsSimulating(true); setSimActiveIdx(0); setAnimProgress(0); toast.success('Simulación iniciada 🚗');
    let startTime: number | null = null;
    const animate = (ts: number) => {
      if (!simStateRef.current.running) return;
      if (startTime === null) startTime = ts;
      const elapsed = ts - startTime; const progress = Math.min(elapsed / SEG_DURATION, 1);
      const eased = progress < 0.5 ? 2*progress*progress : 1-Math.pow(-2*progress+2,2)/2;
      setAnimProgress(eased);
      if (progress < 1) { rafRef.current = requestAnimationFrame(animate); }
      else {
        const nextIdx = simStateRef.current.idx + 1;
        if (nextIdx >= instrucciones.length) {
          simStateRef.current.running = false; setIsSimulating(false); setAnimProgress(1);
          toast.success('Simulación completada ✅');
        } else {
          simStateRef.current.idx = nextIdx; setSimActiveIdx(nextIdx); setAnimProgress(0);
          startTime = null; rafRef.current = requestAnimationFrame(animate);
        }
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [instrucciones, isSimulating]);

  // ── MODIFICADO: Enviar al Rover — auto-inicia música ─────────
  const handleEnviarRover = async () => {
    if (!lastCompilacionId) { toast.error('Compila primero antes de enviar al rover.'); return; }
    setIsSendingRover(true);
    try {
      const token = localStorage.getItem('rover_token');
      const res = await fetch(`${API_URL}/api/Rover/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ compilacion_id: lastCompilacionId, lenguaje_destino: selectedLang }),
      });
      const data = await res.json();
      if (res.ok && data.exitoso) {
        addLine('success', `🚀 Instrucciones enviadas al rover (transmisión #${data.transmision_id})`);
        addLine('info', `📡 ${data.total_instrucciones} instrucciones publicadas vía MQTT`);
        toast.success('¡Instrucciones enviadas al rover! 🤖'); setActiveTab('consola');
        setRoverActivo(true);
        // ── NUEVO: reproducir música si hay canción cargada ────
        if (cancionUrl && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play()
            .then(() => { setAudioPlaying(true); addLine('info', `🎵 Reproduciendo: ${cancionActual ?? 'canción'}`); })
            .catch(() => addLine('warn', '🔇 No se pudo iniciar la música automáticamente — usa el reproductor'));
        }
        await connectSignalR();
      } else {
        addLine('error', `❌ ${data.error ?? 'Error al enviar al rover'}`);
        toast.error(data.error ?? 'Error al enviar al rover');
      }
    } catch { addLine('error', '❌ No se pudo conectar con el servidor.'); toast.error('Error de conexión al enviar al rover.'); }
    finally { setIsSendingRover(false); setActiveTab('consola'); }
  };

  // ── AST ──────────────────────────────────────────────────────
  const handleGenerarAst = async () => {
    if (!code.trim()) { toast.error('El editor está vacío.'); return; }
    setIsLoadingAst(true); setActiveTab('ast'); setAstData(null);
    try {
      const result = await generarAst(code);
      if (result.exitoso && result.arbol) { setAstData(result.arbol); toast.success(`AST generado — programa: ${result.programa}`); }
      else {
        const primer = result.errores[0]; toast.error(primer ? `Error ${primer.tipo}: ${primer.mensaje}` : 'No se pudo generar el AST.'); setActiveTab('consola');
        if (primer) { addLine('error', `[AST] ${primer.tipo.toUpperCase()} L${primer.linea ?? '?'}: ${primer.mensaje}`); if (primer.sugerencia) addLine('warn', `  💡 ${primer.sugerencia}`); }
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 401) { logout(); navigate('/login'); }
      toast.error('Error al generar el AST.'); setActiveTab('consola');
    } finally { setIsLoadingAst(false); }
  };

  // ── MODIFICADO: Coreografías — captura cancion_url ───────────
  const handleAbrirChoreo = async () => {
    setChoreoOpen(prev => !prev);
    if (choreoList.length === 0) {
      setChoreoLoading(true);
      try { const lista = await listarCoreografias(); setChoreoList(lista); }
      catch { toast.error('No se pudieron cargar las coreografías.'); }
      finally { setChoreoLoading(false); }
    }
  };

  const handleCargarChoreo = async (id: number, nombre: string) => {
    setChoreoLoadingId(id);
    try {
      const detalle = await obtenerCoreografia(id);
      setCode(detalle.codigo_fuente);
      setChoreoOpen(false);
      setConsolaLines([]); setTokens([]); setInstrucciones([]); setCodigoTranspilado('');
      setAstData(null); setSimActiveIdx(-1); setAnimProgress(0); setActiveTab('consola');
      cancelAnimationFrame(rafRef.current); setIsSimulating(false); simStateRef.current.running = false;
      addLine('info', `🎵 Coreografía cargada: ${nombre}`);
      // ── NUEVO: cargar canción de la coreografía ─────────────
      if (detalle.cancion_url) {
        setCancionUrl(detalle.cancion_url);
        setCancionActual(detalle.cancion_nombre ?? nombre);
        addLine('info', `🎶 Canción lista: ${detalle.cancion_nombre ?? 'sin nombre'}`);
        toast.success(`Coreografía "${nombre}" cargada · 🎶 ${detalle.cancion_nombre ?? 'con música'}`);
      } else {
        setCancionUrl(null);
        setCancionActual(null);
        toast.success(`Coreografía "${nombre}" cargada en el editor`);
      }
    } catch { toast.error('Error al cargar la coreografía.'); }
    finally { setChoreoLoadingId(null); }
  };

  // ── Utilidades ───────────────────────────────────────────────
  const handleClear = () => {
    setCode(''); setConsolaLines([]); setTokens([]); setInstrucciones([]);
    setCodigoTranspilado(''); setAstData(null); setSimActiveIdx(-1); setAnimProgress(0);
    cancelAnimationFrame(rafRef.current); setIsSimulating(false); simStateRef.current.running = false;
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = archivoNombre; a.click(); URL.revokeObjectURL(url); toast.success('Archivo descargado.');
  };

  const handleDownloadTranspilado = () => {
    if (!codigoTranspilado) return;
    const ext = selectedLang === 'python' ? 'py' : 'cs';
    const blob = new Blob([codigoTranspilado], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `programa_rover.${ext}`; a.click(); URL.revokeObjectURL(url); toast.success(`Código ${selectedLang.toUpperCase()} descargado.`);
  };

  const outputColor = (type: OutputLine['type']) => {
    if (type==='success') return 'var(--accent3)'; if (type==='error') return 'var(--danger)'; if (type==='warn') return 'var(--warning)'; return 'var(--text-secondary)';
  };
  const formatDuracion = (seg: number) => { const m = Math.floor(seg/60); const s = seg%60; return m>0 ? `${m}m ${s}s` : `${s}s`; };

  const tabs: { id: OutputTab; label: string; count?: number }[] = [
    { id: 'consola',       label: 'Consola',       count: consolaLines.length },
    { id: 'tokens',        label: 'Tokens',         count: tokens.length },
    { id: 'instrucciones', label: 'Instrucciones',  count: instrucciones.length },
    { id: 'codigo',        label: selectedLang === 'python' ? 'Python' : 'C#' },
    { id: 'ast',           label: 'AST' },
  ];

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes autosavePulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes stopPulse { 0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,0.5)} 50%{box-shadow:0 0 0 8px rgba(248,113,113,0)} }
        @keyframes musicBar { 0%,100%{height:4px} 50%{height:12px} }
      `}</style>
      <div style={styles.shell}>
        <div style={styles.bgOrb1} /><div style={styles.bgOrb2} />

        {/* SIDEBAR */}
        <aside style={{ ...styles.sidebar, width: sidebarOpen ? '240px' : '68px' }}>
          <div style={styles.sidebarLogo}><div style={styles.logoIcon}><IconCpu /></div>{sidebarOpen && <span style={styles.logoText}>UMG ++</span>}</div>
          <div style={styles.sidebarDivider} />
          <nav style={styles.nav}>
            {[{ to: '/dashboard', icon: <IconGrid />, label: 'Dashboard' }, { to: '/editor', icon: <IconCode />, label: 'Editor' }, { to: '/profile', icon: <IconUser />, label: 'Perfil' }].map(({ to, icon, label }) => (
              <NavLink key={to} to={to} style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}>
                <span style={styles.navIcon}>{icon}</span>{sidebarOpen && <span style={styles.navLabel}>{label}</span>}
              </NavLink>
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          <div style={styles.sidebarFooter}>
            <div style={styles.sidebarUser}>
              <div style={styles.avatarSmall}>{initials}</div>
              {sidebarOpen && (<div style={styles.sidebarUserInfo}><span style={styles.sidebarUserName}>{user?.usuario}</span><span style={styles.sidebarUserRole}>{user?.rol}</span></div>)}
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}><IconLogout /></button>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.collapseBtn}>{sidebarOpen ? '‹' : '›'}</button>
        </aside>

        {/* MAIN */}
        <main style={styles.main}>
          <header style={styles.topbar}>
            <div><p style={styles.topbarSub}>Compilador UMG++ — Motor v2.0</p><h1 style={styles.topbarTitle}>Editor de Código</h1></div>
            <div style={styles.topbarRight}>
              <MenuArchivo onNuevo={handleNuevo} onAbrir={handleAbrirArchivo} onVerHistorial={() => setHistorialOpen(true)} archivoActualId={archivoId} />
              <div style={styles.topbarSep} />
              <div ref={choreoRef} style={{ position: 'relative' }}>
                <button onClick={handleAbrirChoreo} style={styles.btnChoreo}><IconMusic />Coreografías</button>
                {choreoOpen && (
                  <div style={styles.choreoDropdown}>
                    <div style={styles.choreoDropdownHeader}>🎵 Coreografías pregrabadas</div>
                    {choreoLoading ? <div style={styles.choreoLoading}>Cargando...</div>
                      : choreoList.length === 0 ? <div style={styles.choreoLoading}>Sin coreografías disponibles</div>
                      : choreoList.map(c => (
                        <button key={c.id} onClick={() => handleCargarChoreo(c.id, c.nombre)} disabled={choreoLoadingId === c.id} style={styles.choreoItem}>
                          <div style={styles.choreoItemTop}><span style={styles.choreoItemNombre}>{c.nombre}</span><span style={styles.choreoItemDur}>{formatDuracion(c.duracion_min_seg)}</span></div>
                          {c.descripcion && <div style={styles.choreoItemDesc}>{c.descripcion}</div>}
                          {c.cancion_nombre && <div style={styles.choreoItemCancion}>🎶 {c.cancion_nombre}</div>}
                          {choreoLoadingId === c.id && <div style={styles.choreoItemLoading}>Cargando código...</div>}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <select value={selectedLang} onChange={e => setSelectedLang(e.target.value as LenguajeDestino)} style={styles.langSelect}><option value="python">Python</option><option value="csharp">C#</option></select>
              <button onClick={handleDownload} style={styles.btnSecondary}><IconDownload /> Descargar</button>
              {codigoTranspilado && <button onClick={handleDownloadTranspilado} style={styles.btnSecondary}><IconDownload /> .{selectedLang==='python'?'py':'cs'}</button>}
              <button onClick={handleGenerarAst} disabled={isLoadingAst} style={{ ...styles.btnAst, opacity: isLoadingAst?0.7:1, cursor: isLoadingAst?'not-allowed':'pointer' }}><IconTree />{isLoadingAst?'Generando...':'Ver AST'}</button>
              <div style={styles.topbarSep} />
              <button onClick={handleSimular} style={{ ...styles.btnSimular, background: isSimulating?'rgba(251,191,36,0.18)':'rgba(251,191,36,0.08)', borderColor: isSimulating?'rgba(251,191,36,0.6)':'rgba(251,191,36,0.3)' }}><IconSimulate />{isSimulating?'Detener':'Simular'}</button>
              <button onClick={handleEnviarRover} disabled={isSendingRover||!lastCompilacionId} style={{ ...styles.btnRover, opacity:(isSendingRover||!lastCompilacionId)?0.5:1, cursor:(isSendingRover||!lastCompilacionId)?'not-allowed':'pointer' }}><IconRover />{isSendingRover?'Enviando...':'Enviar al Rover'}</button>
              {/* ── NUEVO: Botón STOP prominente ──────────────── */}
              <button
                onClick={handleStop}
                disabled={isStopping}
                title="Detener rover y música de emergencia"
                style={{
                  ...styles.btnStop,
                  animation: roverActivo ? 'stopPulse 1.5s ease-in-out infinite' : 'none',
                  opacity: isStopping ? 0.7 : 1,
                  cursor: isStopping ? 'not-allowed' : 'pointer',
                }}
              >
                <IconStop />{isStopping ? 'Deteniendo...' : '⬛ STOP'}
              </button>
              <button onClick={handleClear} style={styles.btnDanger}><IconTrash /> Limpiar</button>
              <button onClick={handleCompile} disabled={isCompiling} style={{ ...styles.btnPrimary, opacity:isCompiling?0.7:1, cursor:isCompiling?'not-allowed':'pointer' }}><IconPlay />{isCompiling?'Compilando...':'Compilar'}</button>
            </div>
          </header>

          {/* ── NUEVO: Mini reproductor de música ─────────────── */}
          {cancionUrl && (
            <div style={styles.musicPlayer}>
              {/* Barras de visualización */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '16px', flexShrink: 0 }}>
                {[0, 80, 160, 240, 320].map((delay, i) => (
                  <div key={i} style={{ width: '3px', borderRadius: '2px', background: '#f472b6', height: audioPlaying ? undefined : '4px', animation: audioPlaying ? `musicBar 0.6s ease-in-out infinite ${delay}ms` : 'none', minHeight: '4px' }} />
                ))}
              </div>
              <IconMusicNote />
              <span style={styles.musicPlayerNombre}>{cancionActual ?? 'Canción de coreografía'}</span>
              {/* Controles */}
              <button onClick={handleToggleAudio} style={styles.musicPlayerBtn} title={audioPlaying ? 'Pausar' : 'Reproducir'}>
                {audioPlaying ? <IconPause /> : <IconPlay />}
              </button>
              <button
                onClick={() => handleVolumeChange(audioVolume > 0 ? 0 : 0.8)}
                style={{ ...styles.musicPlayerBtn, color: audioVolume === 0 ? 'var(--danger)' : '#f472b6' }}
                title={audioVolume === 0 ? 'Activar sonido' : 'Silenciar'}
              >
                {audioVolume === 0 ? <IconVolumeX /> : <IconVolume />}
              </button>
              <input
                type="range" min="0" max="1" step="0.05" value={audioVolume}
                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                style={styles.musicVolumeSlider}
                title={`Volumen: ${Math.round(audioVolume * 100)}%`}
              />
              <span style={{ color: '#f472b6', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>{Math.round(audioVolume * 100)}%</span>
              {roverActivo && (
                <span style={{ fontSize: '0.65rem', color: 'var(--accent3)', background: 'rgba(52,211,153,0.12)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(52,211,153,0.3)' }}>
                  🤖 EN EJECUCIÓN
                </span>
              )}
              <button onClick={detenerMusica} style={{ ...styles.musicPlayerBtn, marginLeft: 'auto', opacity: 0.6 }} title="Cerrar reproductor">
                <IconX />
              </button>
            </div>
          )}

          {/* Stats */}
          <div style={styles.statsRow}>
            {[
              { label: 'Compilaciones',    value: compilaciones,                                                   color: 'var(--accent)'  },
              { label: 'Lenguaje destino', value: selectedLang.toUpperCase(),                                      color: 'var(--accent2)' },
              { label: 'Estado',           value: isCompiling?'Compilando...':isSimulating?'Simulando...':roverActivo?'Rover activo':'Listo', color: roverActivo?'var(--danger)':isSimulating?'#fbbf24':'var(--accent3)' },
              { label: 'Líneas',           value: code.split('\n').length,                                         color: 'var(--warning)' },
              { label: 'Tiempo',           value: lastTiempoMs!==null?`${lastTiempoMs}ms`:'—',                    color: 'var(--text-muted)' },
            ].map(s => (
              <div key={s.label} style={styles.statChip}>
                <span style={styles.statChipLabel}>{s.label}</span>
                <span style={{ ...styles.statChipValue, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Layout principal */}
          <div ref={containerRef} style={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0, gap: 0 }}>

            {/* COL 1 — Editor */}
            <div style={{ flex: `0 0 ${colWidths[0]}%`, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', minWidth: 0 }}>
              <div style={styles.panelHeader}>
                <div style={styles.panelDots}>
                  <span style={{ ...styles.dot, background: '#f87171' }} />
                  <span style={{ ...styles.dot, background: '#fbbf24' }} />
                  <span style={{ ...styles.dot, background: '#34d399' }} />
                </div>
                <span style={styles.panelLabel}>{archivoNombre}</span>
                <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <Editor
                  height="100%"
                  defaultLanguage="umgpp"
                  theme="umgpp-dark"
                  value={code}
                  onChange={val => setCode(val ?? '')}
                  onMount={(_editor, monaco) => { monacoRef.current = monaco; registrarLenguajeUmgpp(monaco); }}
                  options={{ fontSize: 13, fontFamily: 'JetBrains Mono, Fira Code, monospace', minimap: { enabled: false }, lineNumbers: 'on', scrollBeyondLastLine: false, padding: { top: 12, bottom: 12 }, renderLineHighlight: 'line', cursorBlinking: 'smooth', smoothScrolling: true, wordWrap: 'on' }}
                />
              </div>
            </div>

            <HDivider onDrag={onDragDiv1} />

            {/* COL 2 — Cámara + Simulación */}
            <div ref={visualColRef} style={{ flex: `0 0 ${colWidths[1]}%`, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, gap: 0 }}>
              <div style={{ flex: `0 0 ${cameraHeightPct}%`, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={styles.visualPanelHeader}><IconCamera /><span style={styles.visualPanelLabel}>Cámara Rover — RPi 5MP</span><span style={styles.liveBadge}>LIVE</span></div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <img src="https://rover.nexttechsolutionspc.xyz/?action=stream" alt="Cámara Rover en vivo" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                </div>
              </div>
              <VDivider onDrag={onDragVDiv} />
              <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={styles.visualPanelHeader}>
                  <IconSimulate /><span style={styles.visualPanelLabel}>Simulación de trayectoria</span>
                  {isSimulating && <span style={{ ...styles.liveBadge, background:'rgba(251,191,36,0.15)', color:'#fbbf24', borderColor:'rgba(251,191,36,0.3)' }}>EN CURSO</span>}
                  {!isSimulating && simActiveIdx>=0 && instrucciones.length>0 && simActiveIdx>=instrucciones.length-1 && animProgress>=1 && (
                    <span style={{ ...styles.liveBadge, background:'rgba(52,211,153,0.15)', color:'var(--accent3)', borderColor:'rgba(52,211,153,0.3)' }}>COMPLETADO</span>
                  )}
                </div>
                {instrucciones.length > 0 && (
                  <div style={styles.simInstrRow}>
                    {instrucciones.map((inst, i) => (
                      <span key={i} style={{ ...styles.simInstrChip, color:i===simActiveIdx?'#fbbf24':i<simActiveIdx?'var(--accent3)':'var(--text-muted)', background:i===simActiveIdx?'rgba(251,191,36,0.12)':'transparent', border:`1px solid ${i===simActiveIdx?'rgba(251,191,36,0.3)':'transparent'}`, fontWeight:i===simActiveIdx?700:400, transition:'all 0.3s ease' }}>{inst.raw}</span>
                    ))}
                  </div>
                )}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  {instrucciones.length === 0
                    ? <div style={styles.simEmpty}><IconSimulate /><p>Compila y presiona <strong style={{ color:'#fbbf24' }}>Simular</strong></p><p style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:'-0.3rem' }}>Rueda del mouse o botones ± para zoom</p></div>
                    : <Simulador instrucciones={instrucciones} activeInstrIdx={simActiveIdx} animProgress={animProgress} />
                  }
                </div>
              </div>
            </div>

            <HDivider onDrag={onDragDiv2} />

            {/* COL 3 — Output */}
            <div style={{ flex: `0 0 ${colWidths[2]}%`, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              <div style={styles.tabsBar}>
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ ...styles.tab, ...(activeTab===tab.id?styles.tabActive:{}) }}>
                    {tab.label}
                    {tab.count!==undefined && tab.count>0 && (<span style={{ ...styles.tabBadge, background:activeTab===tab.id?'var(--accent)':'var(--bg-elevated)', color:activeTab===tab.id?'#000':'var(--text-muted)' }}>{tab.count}</span>)}
                    {tab.id==='ast' && astData && (<span style={{ ...styles.tabBadge, background:activeTab==='ast'?'var(--accent)':'rgba(56,189,248,0.15)', color:activeTab==='ast'?'#000':'var(--accent)' }}>✓</span>)}
                  </button>
                ))}
              </div>
              <div style={styles.outputContent}>
                {activeTab==='consola' && (consolaLines.length===0
                  ? <div style={styles.outputEmpty}><IconZap /><p>Presiona <strong style={{ color:'var(--accent)' }}>Compilar</strong> para ver los resultados</p></div>
                  : consolaLines.map((line,i) => (<div key={i} style={{ ...styles.outputLine, color:outputColor(line.type) }}><span style={styles.outputLineNum}>{String(i+1).padStart(2,'0')}</span><span>{line.text}</span></div>))
                )}
                {activeTab==='tokens' && (tokens.length===0
                  ? <div style={styles.outputEmpty}><IconList /><p>Sin tokens — compila primero</p></div>
                  : <table style={styles.table}><thead><tr>{['Línea','Col','Tipo','Lexema'].map(h=><th key={h} style={styles.th}>{h}</th>)}</tr></thead><tbody>{tokens.map((t,i)=>(<tr key={i} style={{ background:i%2===0?'transparent':'rgba(255,255,255,0.02)' }}><td style={styles.td}>{t.linea}</td><td style={styles.td}>{t.columna}</td><td style={{ ...styles.td, color:'var(--accent2)', fontFamily:'var(--font-mono)' }}>{t.tipo}</td><td style={{ ...styles.td, fontFamily:'var(--font-mono)', color:'var(--accent)' }}>{t.lexema}</td></tr>))}</tbody></table>
                )}
                {activeTab==='instrucciones' && (instrucciones.length===0
                  ? <div style={styles.outputEmpty}><IconList /><p>Sin instrucciones — compila primero</p></div>
                  : <table style={styles.table}><thead><tr>{['#','Instrucción','Raw','N','R','L'].map(h=><th key={h} style={styles.th}>{h}</th>)}</tr></thead><tbody>{instrucciones.map((inst,i)=>(<tr key={i} style={{ background:i===simActiveIdx?'rgba(251,191,36,0.07)':i%2===0?'transparent':'rgba(255,255,255,0.02)' }}><td style={styles.td}>{inst.orden}</td><td style={{ ...styles.td, color:i===simActiveIdx?'#fbbf24':'var(--accent2)', fontFamily:'var(--font-mono)' }}>{inst.nombre}</td><td style={{ ...styles.td, fontFamily:'var(--font-mono)', color:i===simActiveIdx?'#fbbf24':'var(--accent)' }}>{inst.raw}</td><td style={styles.td}>{inst.parametro_n??'—'}</td><td style={styles.td}>{inst.parametro_r??'—'}</td><td style={styles.td}>{inst.parametro_l??'—'}</td></tr>))}</tbody></table>
                )}
                {activeTab==='codigo' && (!codigoTranspilado?<div style={styles.outputEmpty}><IconCode /><p>Sin código generado — compila primero</p></div>:<pre style={styles.codeBlock}>{codigoTranspilado}</pre>)}
                {activeTab==='ast' && (isLoadingAst
                  ? <div style={styles.outputEmpty}><IconTree /><p style={{ color:'var(--accent)' }}>Generando árbol sintáctico...</p></div>
                  : !astData
                    ? <div style={styles.outputEmpty}><IconTree /><p>Presiona <strong style={{ color:'var(--accent)' }}>Ver AST</strong></p><p style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'-0.5rem' }}>No requiere compilar primero</p></div>
                    : <div><div style={styles.astLeyenda}>{Object.entries(NODE_COLORS).map(([tipo,color])=>(<span key={tipo} style={styles.astLeyendaItem}><span style={{ ...styles.astLeyendaDot, background:color }}/><span style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>{tipo}</span></span>))}</div><AstNodo nodo={astData} depth={0}/></div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Historial */}
      {historialOpen && archivoId && (
        <ModalHistorial archivoId={archivoId} archivoNombre={archivoNombre} onRestaurar={handleRestaurarVersion} onCerrar={() => setHistorialOpen(false)} />
      )}

      {/* ── NUEVO: Botón flotante STOP de emergencia ─────────── */}
      {roverActivo && (
        <button
          onClick={handleStop}
          disabled={isStopping}
          title="STOP de emergencia — detiene rover y música"
          style={styles.btnStopFlotante}
        >
          <IconStop />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px' }}>
            {isStopping ? 'DETENIENDO' : 'STOP'}
          </span>
        </button>
      )}
    </>
  );
}

// ── Estilos ──────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  shell:             { display:'flex', height:'100vh', background:'var(--bg-deep)', position:'relative', overflow:'hidden', fontFamily:'var(--font-ui)' },
  bgOrb1:            { position:'fixed', top:'-20%', left:'-10%', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 },
  bgOrb2:            { position:'fixed', bottom:'-20%', right:'-10%', width:'700px', height:'700px', borderRadius:'50%', background:'radial-gradient(circle, rgba(129,140,248,0.05) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 },
  sidebar:           { display:'flex', flexDirection:'column', background:'var(--bg-card)', borderRight:'1px solid var(--border)', padding:'1.25rem 0.75rem', position:'relative', zIndex:10, transition:'width 0.25s ease', flexShrink:0, overflow:'hidden' },
  sidebarLogo:       { display:'flex', alignItems:'center', gap:'0.75rem', padding:'0 0.5rem 0.5rem', whiteSpace:'nowrap' },
  logoIcon:          { width:'36px', height:'36px', borderRadius:'8px', background:'linear-gradient(135deg, var(--accent), var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 },
  logoText:          { fontFamily:'var(--font-brand)', color:'var(--accent)', fontSize:'1.1rem', fontWeight:'700', letterSpacing:'2px' },
  sidebarDivider:    { height:'1px', background:'var(--border)', margin:'0.75rem 0' },
  nav:               { display:'flex', flexDirection:'column', gap:'0.25rem' },
  navLink:           { display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.65rem 0.75rem', borderRadius:'8px', color:'var(--text-secondary)', textDecoration:'none', transition:'all 0.2s', whiteSpace:'nowrap', border:'1px solid transparent' },
  navLinkActive:     { background:'rgba(56,189,248,0.1)', color:'var(--accent)', borderColor:'rgba(56,189,248,0.2)' },
  navIcon:           { flexShrink:0 },
  navLabel:          { fontSize:'0.875rem', fontWeight:'500' },
  sidebarFooter:     { display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.75rem 0.5rem', marginTop:'0.5rem', borderTop:'1px solid var(--border)' },
  sidebarUser:       { display:'flex', alignItems:'center', gap:'0.65rem', flex:1, overflow:'hidden' },
  avatarSmall:       { width:'32px', height:'32px', borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'700', fontSize:'0.875rem', flexShrink:0 },
  sidebarUserInfo:   { display:'flex', flexDirection:'column', overflow:'hidden' },
  sidebarUserName:   { color:'var(--text-primary)', fontSize:'0.8rem', fontWeight:'600', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  sidebarUserRole:   { color:'var(--text-muted)', fontSize:'0.7rem' },
  logoutBtn:         { background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:'0.4rem', borderRadius:'6px', display:'flex', alignItems:'center', flexShrink:0 },
  collapseBtn:       { position:'absolute', top:'50%', right:'-12px', transform:'translateY(-50%)', width:'24px', height:'24px', borderRadius:'50%', background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem', zIndex:20 },
  main:              { flex:1, display:'flex', flexDirection:'column', padding:'1.5rem', gap:'0.75rem', overflow:'hidden', position:'relative', zIndex:1 },
  topbar:            { display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexShrink:0 },
  topbarSub:         { color:'var(--text-muted)', fontSize:'0.8rem', margin:0 },
  topbarTitle:       { color:'var(--text-primary)', fontSize:'1.5rem', fontWeight:'700', margin:'0.2rem 0 0', fontFamily:'var(--font-brand)', letterSpacing:'1px' },
  topbarRight:       { display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' },
  topbarSep:         { width:'1px', height:'22px', background:'var(--border)', margin:'0 0.15rem' },
  langSelect:        { background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-primary)', borderRadius:'8px', padding:'0.5rem 0.75rem', fontSize:'0.825rem', cursor:'pointer', fontFamily:'var(--font-mono)' },
  btnPrimary:        { display:'flex', alignItems:'center', gap:'0.4rem', background:'var(--accent)', color:'#000', border:'none', borderRadius:'8px', padding:'0.55rem 1.1rem', fontWeight:'700', fontSize:'0.85rem', cursor:'pointer' },
  btnSecondary:      { display:'flex', alignItems:'center', gap:'0.4rem', background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-secondary)', borderRadius:'8px', padding:'0.55rem 0.9rem', fontSize:'0.825rem', cursor:'pointer' },
  btnDanger:         { display:'flex', alignItems:'center', gap:'0.4rem', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', color:'var(--danger)', borderRadius:'8px', padding:'0.55rem 0.9rem', fontSize:'0.825rem', cursor:'pointer' },
  btnAst:            { display:'flex', alignItems:'center', gap:'0.4rem', background:'rgba(129,140,248,0.12)', border:'1px solid rgba(129,140,248,0.3)', color:'var(--accent2)', borderRadius:'8px', padding:'0.55rem 0.9rem', fontSize:'0.825rem', fontWeight:'600', cursor:'pointer' },
  btnChoreo:         { display:'flex', alignItems:'center', gap:'0.4rem', background:'rgba(244,114,182,0.1)', border:'1px solid rgba(244,114,182,0.3)', color:'#f472b6', borderRadius:'8px', padding:'0.55rem 0.9rem', fontSize:'0.825rem', cursor:'pointer', fontWeight:'600' },
  btnSimular:        { display:'flex', alignItems:'center', gap:'0.4rem', border:'1px solid', color:'#fbbf24', borderRadius:'8px', padding:'0.55rem 0.9rem', fontSize:'0.825rem', fontWeight:'600', cursor:'pointer' },
  btnRover:          { display:'flex', alignItems:'center', gap:'0.4rem', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.3)', color:'var(--accent3)', borderRadius:'8px', padding:'0.55rem 0.9rem', fontSize:'0.825rem', fontWeight:'600', cursor:'pointer' },
  // ── NUEVOS ESTILOS ────────────────────────────────────────
  btnStop:           { display:'flex', alignItems:'center', gap:'0.4rem', background:'rgba(248,113,113,0.15)', border:'2px solid rgba(248,113,113,0.6)', color:'#f87171', borderRadius:'8px', padding:'0.55rem 1rem', fontSize:'0.85rem', fontWeight:'800', cursor:'pointer', letterSpacing:'0.5px', transition:'all 0.2s' },
  btnStopFlotante:   { position:'fixed', bottom:'24px', right:'24px', zIndex:999, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', background:'rgba(220,38,38,0.95)', border:'2px solid rgba(248,113,113,0.8)', color:'#fff', borderRadius:'50px', padding:'14px 20px', fontSize:'0.85rem', fontWeight:'800', cursor:'pointer', letterSpacing:'1px', animation:'stopPulse 1.5s ease-in-out infinite', boxShadow:'0 4px 20px rgba(220,38,38,0.4)' },
  musicPlayer:       { display:'flex', alignItems:'center', gap:'8px', background:'rgba(244,114,182,0.06)', border:'1px solid rgba(244,114,182,0.2)', borderRadius:'10px', padding:'6px 12px', flexShrink:0, minHeight:'36px' },
  musicPlayerNombre: { color:'#f472b6', fontSize:'0.78rem', fontWeight:'600', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'220px' },
  musicPlayerBtn:    { background:'none', border:'none', color:'#f472b6', cursor:'pointer', padding:'4px', borderRadius:'4px', display:'flex', alignItems:'center', flexShrink:0, transition:'opacity 0.2s' },
  musicVolumeSlider: { width:'80px', accentColor:'#f472b6', cursor:'pointer', flexShrink:0 },
  // ─────────────────────────────────────────────────────────
  btnArchivo:        { display:'flex', alignItems:'center', gap:'0.4rem', background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-secondary)', borderRadius:'8px', padding:'0.55rem 0.9rem', fontSize:'0.825rem', cursor:'pointer', fontWeight:'600' },
  archivoDropdown:   { position:'absolute', top:'calc(100% + 6px)', left:0, width:'300px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'10px', zIndex:100, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' },
  archivoHeader:     { padding:'0.65rem 0.9rem', borderBottom:'1px solid var(--border)', background:'var(--bg-elevated)' },
  archivoAccion:     { width:'100%', textAlign:'left', background:'none', border:'none', padding:'0.7rem 0.9rem', cursor:'pointer', display:'flex', alignItems:'flex-start', gap:'0.65rem', color:'var(--text-secondary)' },
  archivoItem:       { width:'100%', textAlign:'left', background:'none', border:'none', borderBottom:'1px solid var(--border)', padding:'0.55rem 0.9rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.65rem', color:'var(--text-secondary)', transition:'background 0.15s' },
  archivoEmpty:      { padding:'1rem', textAlign:'center', color:'var(--text-muted)', fontSize:'0.8rem' },
  choreoDropdown:    { position:'absolute', top:'calc(100% + 6px)', right:0, width:'280px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'10px', zIndex:100, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' },
  choreoDropdownHeader: { padding:'0.65rem 0.9rem', fontSize:'0.75rem', fontWeight:'700', color:'var(--text-muted)', borderBottom:'1px solid var(--border)', background:'var(--bg-elevated)' },
  choreoLoading:     { padding:'1rem', textAlign:'center', color:'var(--text-muted)', fontSize:'0.8rem' },
  choreoItem:        { width:'100%', textAlign:'left', background:'none', border:'none', borderBottom:'1px solid var(--border)', padding:'0.65rem 0.9rem', cursor:'pointer', display:'block' },
  choreoItemTop:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.2rem' },
  choreoItemNombre:  { color:'var(--text-primary)', fontSize:'0.82rem', fontWeight:'600' },
  choreoItemDur:     { color:'var(--text-muted)', fontSize:'0.7rem', fontFamily:'var(--font-mono)' },
  choreoItemDesc:    { color:'var(--text-muted)', fontSize:'0.72rem', marginBottom:'0.15rem' },
  choreoItemCancion: { color:'#f472b6', fontSize:'0.7rem' },
  choreoItemLoading: { color:'var(--accent)', fontSize:'0.7rem', marginTop:'0.25rem' },
  statsRow:          { display:'flex', gap:'0.75rem', flexShrink:0 },
  statChip:          { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px', padding:'0.5rem 1rem', display:'flex', flexDirection:'column', gap:'0.1rem' },
  statChipLabel:     { color:'var(--text-muted)', fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.5px' },
  statChipValue:     { fontSize:'0.9rem', fontWeight:'700', fontFamily:'var(--font-mono)' },
  panelHeader:       { display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.65rem 1rem', borderBottom:'1px solid var(--border)', background:'var(--bg-elevated)', flexShrink:0 },
  panelDots:         { display:'flex', gap:'5px' },
  dot:               { width:'10px', height:'10px', borderRadius:'50%' },
  panelLabel:        { color:'var(--text-muted)', fontSize:'0.78rem', fontFamily:'var(--font-mono)', flex:1 },
  visualPanelHeader: { display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.75rem', borderBottom:'1px solid var(--border)', background:'var(--bg-elevated)', flexShrink:0 },
  visualPanelLabel:  { color:'var(--text-muted)', fontSize:'0.7rem', fontWeight:600, flex:1 },
  liveBadge:         { fontSize:'0.58rem', fontWeight:700, padding:'0.12rem 0.35rem', borderRadius:'4px', background:'rgba(248,113,113,0.15)', color:'var(--danger)', border:'1px solid rgba(248,113,113,0.3)', letterSpacing:'0.5px' },
  simInstrRow:       { display:'flex', flexWrap:'wrap', gap:'0.25rem', padding:'0.35rem 0.65rem', borderBottom:'1px solid var(--border)', maxHeight:'48px', overflowY:'auto' },
  simInstrChip:      { fontSize:'0.63rem', fontFamily:'var(--font-mono)', padding:'0.1rem 0.35rem', borderRadius:'4px', whiteSpace:'nowrap' },
  simEmpty:          { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'0.5rem', color:'var(--text-muted)', fontSize:'0.78rem', textAlign:'center' },
  tabsBar:           { display:'flex', borderBottom:'1px solid var(--border)', background:'var(--bg-elevated)', flexShrink:0 },
  tab:               { flex:1, padding:'0.6rem 0.4rem', background:'none', border:'none', color:'var(--text-muted)', fontSize:'0.72rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.3rem', borderBottom:'2px solid transparent', transition:'all 0.2s' },
  tabActive:         { color:'var(--accent)', borderBottomColor:'var(--accent)', background:'rgba(56,189,248,0.05)' },
  tabBadge:          { borderRadius:'10px', padding:'0 5px', fontSize:'0.65rem', fontWeight:'700', minWidth:'16px', textAlign:'center' },
  outputContent:     { flex:1, overflowY:'auto', padding:'0.75rem', fontFamily:'var(--font-mono)', fontSize:'0.78rem' },
  outputEmpty:       { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'0.75rem', color:'var(--text-muted)', textAlign:'center' },
  outputLine:        { display:'flex', gap:'0.75rem', padding:'0.15rem 0', lineHeight:'1.6' },
  outputLineNum:     { color:'var(--text-muted)', userSelect:'none', minWidth:'20px' },
  table:             { width:'100%', borderCollapse:'collapse', fontSize:'0.75rem' },
  th:                { color:'var(--text-muted)', textAlign:'left', padding:'0.4rem 0.5rem', borderBottom:'1px solid var(--border)', fontWeight:'600', textTransform:'uppercase', fontSize:'0.65rem', letterSpacing:'0.5px' },
  td:                { color:'var(--text-secondary)', padding:'0.35rem 0.5rem', borderBottom:'1px solid rgba(255,255,255,0.03)' },
  codeBlock:         { margin:0, color:'var(--accent3)', lineHeight:'1.7', whiteSpace:'pre-wrap', wordBreak:'break-word' },
  astLeyenda:        { display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.75rem', padding:'0.5rem 0.4rem', borderBottom:'1px solid var(--border)' },
  astLeyendaItem:    { display:'flex', alignItems:'center', gap:'0.3rem' },
  astLeyendaDot:     { width:'8px', height:'8px', borderRadius:'50%', flexShrink:0 },
};

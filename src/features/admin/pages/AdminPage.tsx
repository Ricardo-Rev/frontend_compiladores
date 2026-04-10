import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useAuth } from '../../auth/context/AuthContext';
import { logoutUser } from '../../auth/services/authServices';
import { registrarLenguajeUmgpp } from '../../../shared/utils/umgppLanguage';

// ── API ───────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5123';

function authHeaders() {
  const token = localStorage.getItem('rover_token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders(), ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Tipos ─────────────────────────────────────────────────────
interface Stats {
  conductores: { total: number; activos: number; inactivos: number; nuevos_7dias: number };
  compilaciones: { total: number; hoy: number; exitosas: number; tasa_exito: number };
  sesiones: { activas_ahora: number; total_accesos: number; accesos_hoy: number };
  rover: { total_envios: number; envios_exitosos: number; coreografias_activas: number };
  grafica_compilaciones: { fecha: string; total: number }[];
}
interface Acceso {
  id_ingreso: number; nickname: string; nombre_completo: string;
  avatar_base64?: string; metodo_login: string; ip_origen?: string;
  fecha_ingreso: string; fecha_salida?: string;
}
interface Conductor {
  id_elegido: number; nickname: string; nombre_completo: string; email: string;
  avatar_base64?: string; activo: boolean; email_confirmado: boolean;
  fecha_creacion: string; total_compilaciones: number;
}
interface Compilacion {
  id: number; conductor: string; modo_compilacion: string; resultado: string;
  tiempo_compilacion_ms: number; fecha_compilacion: string;
  total_errores: number; total_instrucciones: number;
}
interface Coreografia {
  id: number; nombre: string; descripcion?: string; codigo_fuente: string;
  cancion_url?: string; cancion_nombre?: string;
  duracion_min: number; duracion_seg: number; activa: boolean;
  fecha_creacion: string; veces_ejecutada: number;
}
interface Notificacion {
  id: number; conductor: string; tipo: string; canal: string;
  asunto?: string; estado: string; fecha_envio: string;
}

// ── Modal de confirmación ─────────────────────────────────────
interface ConfirmModalProps {
  titulo: string; mensaje: string; labelConfirm: string; colorConfirm: string;
  onConfirm: () => void; onCancel: () => void;
}
function ConfirmModal({ titulo, mensaje, labelConfirm, colorConfirm, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0d1b36', border: '1px solid rgba(69,123,157,0.3)', borderRadius: 16, padding: '28px 32px', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>⚠️</div>
        <div style={{ color: '#e1e1e1', fontWeight: 700, fontSize: '1rem', marginBottom: 10 }}>{titulo}</div>
        <div style={{ color: '#a8dadc88', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 24 }}>{mensaje}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(168,218,220,0.2)', background: 'transparent', color: '#a8dadc', cursor: 'pointer', fontSize: '0.82rem' }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: colorConfirm, color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>{labelConfirm}</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de Coreografía (crear / editar) ─────────────────────
interface ChoreoModalProps {
  inicial?: Coreografia | null;
  onGuardar: () => void;
  onCerrar: () => void;
}

function ChoreoModal({ inicial, onGuardar, onCerrar }: ChoreoModalProps) {
  const esEdicion = !!inicial;
  const monaco = useMonaco();

  const [nombre, setNombre]               = useState(inicial?.nombre ?? '');
  const [descripcion, setDescripcion]     = useState(inicial?.descripcion ?? '');
  const [codigo, setCodigo]               = useState(
    inicial?.codigo_fuente ?? 'PROGRAM mi_coreografia\nBEGIN\n  avanzar_mts(1);\nEND.'
  );
  const [cancionNombre, setCancionNombre] = useState(inicial?.cancion_nombre ?? '');
  const [cancionUrl, setCancionUrl]       = useState(inicial?.cancion_url ?? '');
  const [duracion, setDuracion]           = useState(
    inicial ? inicial.duracion_min * 60 + inicial.duracion_seg : 180
  );
  const [guardando, setGuardando]         = useState(false);

  // Registrar lenguaje UMG++ cuando Monaco esté disponible
  useEffect(() => {
    if (monaco) {
      registrarLenguajeUmgpp(monaco);
    }
  }, [monaco]);

  const guardar = async () => {
    if (!nombre.trim())  { toast.error('El nombre es requerido.'); return; }
    if (!codigo.trim())  { toast.error('El código fuente es requerido.'); return; }
    if (duracion < 180)  { toast.error('La duración mínima es 3 minutos (180 s).'); return; }

    setGuardando(true);
    try {
      const body = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        codigo_fuente: codigo.trim(),
        cancion_nombre: cancionNombre.trim() || null,
        cancion_url: cancionUrl.trim() || null,
        duracion_min_seg: duracion,
      };

      if (esEdicion) {
        await apiFetch(`/api/Dashboard/choreographies/${inicial!.id}`, {
          method: 'PUT', body: JSON.stringify(body),
        });
        toast.success('Coreografía actualizada.');
      } else {
        await apiFetch('/api/Dashboard/choreographies', {
          method: 'POST', body: JSON.stringify(body),
        });
        toast.success('Coreografía creada exitosamente.');
      }
      onGuardar();
    } catch {
      toast.error('Error al guardar la coreografía.');
    } finally {
      setGuardando(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid rgba(168,218,220,0.2)', background: 'rgba(29,53,87,0.6)',
    color: '#e1e1e1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    color: '#a8dadc', fontSize: '0.72rem', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'block',
  };

  return (
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0d1b36', border: '1px solid rgba(69,123,157,0.3)', borderRadius: 16, width: '100%', maxWidth: 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(69,123,157,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ color: '#e1e1e1', fontWeight: 700, fontSize: '1rem' }}>
            {esEdicion ? `✏️ Editar — ${inicial!.nombre}` : '🎵 Nueva coreografía'}
          </div>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', color: '#a8dadc88', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Nombre + Duración */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input style={inputStyle} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Moonwalk Galaxy" />
            </div>
            <div>
              <label style={labelStyle}>Duración (segundos) *</label>
              <input style={inputStyle} type="number" min={180} value={duracion} onChange={e => setDuracion(Number(e.target.value))} />
              <div style={{ color: '#a8dadc55', fontSize: '0.65rem', marginTop: 3 }}>
                Mínimo 180 s ({Math.floor(duracion / 60)}m {duracion % 60}s)
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describe brevemente la coreografía..." />
          </div>

          {/* Canción */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre de la canción</label>
              <input style={inputStyle} value={cancionNombre} onChange={e => setCancionNombre(e.target.value)} placeholder="Ej: Thriller" />
            </div>
            <div>
              <label style={labelStyle}>URL de la canción</label>
              <input style={inputStyle} value={cancionUrl} onChange={e => setCancionUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {/* Editor Monaco con lenguaje UMG++ */}
          <div>
            <label style={labelStyle}>Código UMG++ *</label>
            {/* Leyenda de colores — igual que el EditorPage */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              {[
                { color: '#4A9EFF', label: 'Keywords (PROGRAM, BEGIN, END)' },
                { color: '#38BDF8', label: 'Comandos' },
                { color: '#4ADE80', label: 'Paréntesis' },
                { color: '#F87171', label: 'Números' },
              ].map(item => (
                <div key={item.color} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ color: '#a8dadc66', fontSize: '0.65rem' }}>{item.label}</span>
                </div>
              ))}
            </div>
            <div style={{ border: '1px solid rgba(168,218,220,0.2)', borderRadius: 8, overflow: 'hidden', height: 280 }}>
              <Editor
                height="280px"
                language="umgpp"
                theme="umgpp-dark"
                value={codigo}
                onChange={v => setCodigo(v ?? '')}
                onMount={(_editor, monacoInstance) => {
                  registrarLenguajeUmgpp(monacoInstance);
                }}
                options={{
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, Fira Code, monospace',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  renderLineHighlight: 'line',
                  cursorBlinking: 'smooth',
                  padding: { top: 10, bottom: 10 },
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(69,123,157,0.2)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onCerrar} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(168,218,220,0.2)', background: 'transparent', color: '#a8dadc', cursor: 'pointer', fontSize: '0.82rem' }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: guardando ? '#1d3557' : '#457b9d', color: '#fff', cursor: guardando ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear coreografía'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Íconos ────────────────────────────────────────────────────
const IconDash   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const IconUsers  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconLog    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const IconCode   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const IconMusic  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const IconBell   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IconLogout = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconShield = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconChev   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>;
const IconPlus   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

// ── Helpers ───────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function Avatar({ b64, nick, size = 36 }: { b64?: string; nick: string; size?: number }) {
  if (b64) {
    const src = b64.startsWith('data:') ? b64 : `data:image/svg+xml;base64,${b64}`;
    return <img src={src} alt={nick} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(69,123,157,0.4)', background: '#1d3557', flexShrink: 0 }} />;
  }
  return <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#1d3557,#457b9d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.38, border: '2px solid rgba(69,123,157,0.4)', flexShrink: 0 }}>{nick[0]?.toUpperCase()}</div>;
}
function Badge({ text, color }: { text: string; color: string }) {
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: `${color}22`, color, border: `1px solid ${color}44` }}>{text}</span>;
}
function BarChart({ data }: { data: { fecha: string; total: number }[] }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div title={`${new Date(d.fecha).toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric' })}: ${d.total}`} style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${(d.total / max) * 52}px`, minHeight: 3, background: 'linear-gradient(to top, #457b9d, #a8dadc)' }} />
          <span style={{ fontSize: '0.55rem', color: '#a8dadc66', whiteSpace: 'nowrap' }}>{new Date(d.fecha).toLocaleDateString('es-GT', { weekday: 'short' })}</span>
        </div>
      ))}
    </div>
  );
}
function Pagination({ page, total, size, onPage }: { page: number; total: number; size: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / size);
  if (pages <= 1) return null;
  const btnPage: React.CSSProperties = { width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(168,218,220,0.2)', background: 'transparent', color: '#a8dadc', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 16 }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} style={btnPage}>‹</button>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => { const p = i + 1; return <button key={p} onClick={() => onPage(p)} style={{ ...btnPage, background: p === page ? '#457b9d' : 'transparent', color: p === page ? '#fff' : '#a8dadc' }}>{p}</button>; })}
      <button onClick={() => onPage(page + 1)} disabled={page >= pages} style={btnPage}>›</button>
      <span style={{ color: '#a8dadc66', fontSize: '0.72rem' }}>{total} registros</span>
    </div>
  );
}
function Loader() { return <div style={{ padding: '40px', textAlign: 'center', color: '#a8dadc88', fontSize: '0.85rem' }}><div style={{ fontSize: '1.5rem', marginBottom: 8, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</div><div>Cargando...</div></div>; }
function Vacio({ texto }: { texto: string }) { return <div style={{ padding: '40px', textAlign: 'center', color: '#a8dadc44', fontSize: '0.82rem' }}>{texto}</div>; }

// ════════════════════════════════════════════════════════════
//  SECCIÓN: STATS
// ════════════════════════════════════════════════════════════
function SeccionStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    apiFetch<Stats>('/api/Dashboard/stats').then(setStats).catch(() => toast.error('Error al cargar estadísticas')).finally(() => setCargando(false));
  }, []);
  if (cargando) return <Loader />;
  if (!stats) return <Vacio texto="No se pudieron cargar las estadísticas." />;
  const cards = [
    { label: 'Conductores', valor: stats.conductores.total, sub: `${stats.conductores.activos} activos`, color: '#a8dadc', icon: '👤' },
    { label: 'Compilaciones', valor: stats.compilaciones.total, sub: `${stats.compilaciones.tasa_exito}% éxito`, color: '#57cc99', icon: '⚙️' },
    { label: 'Accesos hoy', valor: stats.sesiones.accesos_hoy, sub: `${stats.sesiones.activas_ahora} en línea`, color: '#fbbf24', icon: '🔐' },
    { label: 'Envíos al Rover', valor: stats.rover.total_envios, sub: `${stats.rover.envios_exitosos} entregados`, color: '#f87171', icon: '🚗' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: 'rgba(29,53,87,0.6)', border: `1px solid ${c.color}33`, borderRadius: 14, padding: '20px 24px', boxShadow: `0 0 20px ${c.color}11` }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: c.color, fontFamily: 'monospace', lineHeight: 1 }}>{c.valor.toLocaleString()}</div>
            <div style={{ color: '#e1e1e1', fontSize: '0.82rem', marginTop: 4 }}>{c.label}</div>
            <div style={{ color: '#a8dadc88', fontSize: '0.72rem', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'rgba(29,53,87,0.6)', border: '1px solid rgba(168,218,220,0.15)', borderRadius: 14, padding: 20 }}>
          <div style={{ color: '#a8dadc', fontSize: '0.78rem', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Compilaciones — últimos 7 días</div>
          {stats.grafica_compilaciones.length > 0 ? <BarChart data={stats.grafica_compilaciones} /> : <Vacio texto="Sin actividad en los últimos 7 días." />}
        </div>
        <div style={{ background: 'rgba(29,53,87,0.6)', border: '1px solid rgba(168,218,220,0.15)', borderRadius: 14, padding: 20 }}>
          <div style={{ color: '#a8dadc', fontSize: '0.78rem', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estado del sistema</div>
          {[
            { label: 'Conductores nuevos (7d)', valor: stats.conductores.nuevos_7dias, color: '#57cc99' },
            { label: 'Conductores inactivos', valor: stats.conductores.inactivos, color: '#f87171' },
            { label: 'Compilaciones hoy', valor: stats.compilaciones.hoy, color: '#fbbf24' },
            { label: 'Coreografías activas', valor: stats.rover.coreografias_activas, color: '#a8dadc' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(168,218,220,0.08)' : 'none' }}>
              <span style={{ color: '#ccc', fontSize: '0.82rem' }}>{r.label}</span>
              <span style={{ color: r.color, fontWeight: 700, fontSize: '1rem', fontFamily: 'monospace' }}>{r.valor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  SECCIÓN: CONDUCTORES
// ════════════════════════════════════════════════════════════
function SeccionConductores() {
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [filtro, setFiltro]           = useState('todos');
  const [cargando, setCargando]       = useState(true);
  const [toggling, setToggling]       = useState<number | null>(null);
  const [confirm, setConfirm]         = useState<{ id: number; activo: boolean } | null>(null);
  const SIZE = 10;

  const cargar = useCallback(async (p: number, f: string) => {
    setCargando(true);
    try { const data = await apiFetch<{ total: number; data: Conductor[] }>(`/api/Dashboard/users?page=${p}&size=${SIZE}&filtro=${f}`); setConductores(data.data); setTotal(data.total); }
    catch { toast.error('Error al cargar conductores'); } finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(page, filtro); }, [page, filtro, cargar]);

  const ejecutarToggle = async (id: number, activo: boolean) => {
    setConfirm(null); setToggling(id);
    try {
      await apiFetch(`/api/Dashboard/users/${id}/toggle`, { method: 'PUT' });
      toast.success(activo ? 'Conductor dado de baja.' : 'Conductor reactivado.');
      cargar(page, filtro);
    } catch { toast.error('Error al cambiar el estado del conductor.'); }
    finally { setToggling(null); }
  };

  return (
    <>
      {confirm && (
        <ConfirmModal
          titulo={confirm.activo ? 'Dar de baja al conductor' : 'Reactivar conductor'}
          mensaje={confirm.activo ? 'Esta acción dará de baja al conductor y revocará todas sus sesiones activas. ¿Deseás continuar?' : '¿Deseás reactivar a este conductor? Podrá volver a iniciar sesión normalmente.'}
          labelConfirm={confirm.activo ? 'Dar de baja' : 'Reactivar'}
          colorConfirm={confirm.activo ? '#f87171' : '#57cc99'}
          onConfirm={() => ejecutarToggle(confirm.id, confirm.activo)}
          onCancel={() => setConfirm(null)}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['todos', 'activos', 'inactivos'].map(f => (
            <button key={f} onClick={() => { setFiltro(f); setPage(1); }} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(168,218,220,0.25)', background: filtro === f ? '#457b9d' : 'transparent', color: filtro === f ? '#fff' : '#a8dadc', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' }}>{f}</button>
          ))}
          <span style={{ marginLeft: 'auto', color: '#a8dadc66', fontSize: '0.78rem', alignSelf: 'center' }}>{total} conductor{total !== 1 ? 'es' : ''}</span>
        </div>
        <div style={{ background: 'rgba(29,53,87,0.5)', border: '1px solid rgba(168,218,220,0.12)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(69,123,157,0.2)', borderBottom: '1px solid rgba(168,218,220,0.15)' }}>
                  {['#', 'Conductor', 'Email', 'Compilaciones', 'Registro', 'Estado', 'Acción'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#a8dadc', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {cargando
                  ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={7} style={{ padding: '14px 16px' }}><div style={{ height: 14, background: 'rgba(168,218,220,0.08)', borderRadius: 4 }} /></td></tr>)
                  : conductores.map((c, i) => (
                    <tr key={c.id_elegido} style={{ borderBottom: '1px solid rgba(168,218,220,0.06)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(69,123,157,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px 16px', color: '#a8dadc66' }}>{(page - 1) * SIZE + i + 1}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar b64={c.avatar_base64} nick={c.nickname} size={32} />
                          <div><div style={{ color: '#e1e1e1', fontWeight: 600 }}>{c.nickname}</div><div style={{ color: '#a8dadc66', fontSize: '0.68rem' }}>{c.nombre_completo}</div></div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#a8dadc88', fontSize: '0.78rem' }}>
                        <div>{c.email}</div>
                        {c.email_confirmado ? <span style={{ color: '#57cc99', fontSize: '0.65rem' }}>✓ confirmado</span> : <span style={{ color: '#fbbf24', fontSize: '0.65rem' }}>⚠ sin confirmar</span>}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#a8dadc', fontWeight: 600, fontFamily: 'monospace', textAlign: 'center' }}>{c.total_compilaciones}</td>
                      <td style={{ padding: '12px 16px', color: '#a8dadc88', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{fmtDate(c.fecha_creacion)}</td>
                      <td style={{ padding: '12px 16px' }}><Badge text={c.activo ? 'Activo' : 'Inactivo'} color={c.activo ? '#57cc99' : '#f87171'} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => setConfirm({ id: c.id_elegido, activo: c.activo })} disabled={toggling === c.id_elegido}
                          style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: c.activo ? 'rgba(248,113,113,0.15)' : 'rgba(87,204,153,0.15)', color: c.activo ? '#f87171' : '#57cc99', fontSize: '0.72rem', fontWeight: 700, opacity: toggling === c.id_elegido ? 0.5 : 1 }}>
                          {toggling === c.id_elegido ? '...' : c.activo ? 'Dar de baja' : 'Reactivar'}
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          {conductores.length === 0 && !cargando && <Vacio texto="No hay conductores en este filtro." />}
        </div>
        <Pagination page={page} total={total} size={SIZE} onPage={p => setPage(p)} />
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════
//  SECCIÓN: ACCESOS
// ════════════════════════════════════════════════════════════
function SeccionAccesos() {
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [cargando, setCargando] = useState(true);
  const SIZE = 20;
  const cargar = useCallback(async (p: number) => {
    setCargando(true);
    try { const data = await apiFetch<{ total: number; data: Acceso[] }>(`/api/Dashboard/sessions?page=${p}&size=${SIZE}`); setAccesos(data.data); setTotal(data.total); }
    catch { toast.error('Error al cargar la bitácora'); } finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(page); }, [page, cargar]);
  const metodoColor: Record<string, string> = { password: '#a8dadc', facial: '#fbbf24', qr: '#57cc99' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><span style={{ color: '#a8dadc66', fontSize: '0.78rem' }}>{total} registros en total</span></div>
      <div style={{ background: 'rgba(29,53,87,0.5)', border: '1px solid rgba(168,218,220,0.12)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'rgba(69,123,157,0.2)', borderBottom: '1px solid rgba(168,218,220,0.15)' }}>
                {['#', 'Conductor', 'Método', 'IP Origen', 'Ingreso', 'Salida', 'Estado'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#a8dadc', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {cargando
                ? Array.from({ length: 8 }).map((_, i) => <tr key={i}><td colSpan={7} style={{ padding: '14px 16px' }}><div style={{ height: 14, background: 'rgba(168,218,220,0.08)', borderRadius: 4 }} /></td></tr>)
                : accesos.map((a, i) => (
                  <tr key={a.id_ingreso} style={{ borderBottom: '1px solid rgba(168,218,220,0.06)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(69,123,157,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 16px', color: '#a8dadc44', fontSize: '0.72rem' }}>{(page - 1) * SIZE + i + 1}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar b64={a.avatar_base64} nick={a.nickname} size={28} />
                        <div><div style={{ color: '#e1e1e1', fontWeight: 600 }}>{a.nickname}</div><div style={{ color: '#a8dadc55', fontSize: '0.65rem' }}>{a.nombre_completo}</div></div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}><Badge text={a.metodo_login} color={metodoColor[a.metodo_login] ?? '#a8dadc'} /></td>
                    <td style={{ padding: '12px 16px', color: '#a8dadc66', fontSize: '0.75rem', fontFamily: 'monospace' }}>{a.ip_origen ?? '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#a8dadc', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{fmtDate(a.fecha_ingreso)}</td>
                    <td style={{ padding: '12px 16px', color: '#a8dadc88', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{a.fecha_salida ? fmtDate(a.fecha_salida) : '—'}</td>
                    <td style={{ padding: '12px 16px' }}><Badge text={a.fecha_salida ? 'Cerrada' : 'Activa'} color={a.fecha_salida ? '#a8dadc66' : '#57cc99'} /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {accesos.length === 0 && !cargando && <Vacio texto="No hay registros en la bitácora." />}
      </div>
      <Pagination page={page} total={total} size={SIZE} onPage={p => setPage(p)} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  SECCIÓN: COMPILACIONES
// ════════════════════════════════════════════════════════════
function SeccionCompilaciones() {
  const [data, setData]         = useState<Compilacion[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filtro, setFiltro]     = useState('todos');
  const [cargando, setCargando] = useState(true);
  const SIZE = 15;
  const cargar = useCallback(async (p: number, f: string) => {
    setCargando(true);
    try { const res = await apiFetch<{ total: number; data: Compilacion[] }>(`/api/Dashboard/compilations?page=${p}&size=${SIZE}&filtro=${f}`); setData(res.data); setTotal(res.total); }
    catch { toast.error('Error al cargar compilaciones'); } finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(page, filtro); }, [page, filtro, cargar]);
  const resultadoColor: Record<string, string> = { exito: '#57cc99', error_lexico: '#f87171', error_sintactico: '#fbbf24', error_semantico: '#fb923c' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {['todos', 'exito', 'error'].map(f => <button key={f} onClick={() => { setFiltro(f); setPage(1); }} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(168,218,220,0.25)', background: filtro === f ? '#457b9d' : 'transparent', color: filtro === f ? '#fff' : '#a8dadc', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>{f === 'exito' ? 'Exitosas' : f === 'error' ? 'Con error' : 'Todas'}</button>)}
        <span style={{ marginLeft: 'auto', color: '#a8dadc66', fontSize: '0.78rem' }}>{total} compilaciones</span>
      </div>
      <div style={{ background: 'rgba(29,53,87,0.5)', border: '1px solid rgba(168,218,220,0.12)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'rgba(69,123,157,0.2)', borderBottom: '1px solid rgba(168,218,220,0.15)' }}>
                {['#', 'Conductor', 'Modo', 'Resultado', 'Instrucciones', 'Errores', 'Tiempo (ms)', 'Fecha'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#a8dadc', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {cargando
                ? Array.from({ length: 8 }).map((_, i) => <tr key={i}><td colSpan={8} style={{ padding: '14px 16px' }}><div style={{ height: 14, background: 'rgba(168,218,220,0.08)', borderRadius: 4 }} /></td></tr>)
                : data.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(168,218,220,0.06)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(69,123,157,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 16px', color: '#a8dadc44', fontSize: '0.72rem' }}>{(page - 1) * SIZE + i + 1}</td>
                    <td style={{ padding: '12px 16px', color: '#e1e1e1', fontWeight: 600 }}>{c.conductor}</td>
                    <td style={{ padding: '12px 16px', color: '#a8dadc88', fontSize: '0.75rem' }}>{c.modo_compilacion.replace('_', ' ')}</td>
                    <td style={{ padding: '12px 16px' }}><Badge text={c.resultado.replace('_', ' ')} color={resultadoColor[c.resultado] ?? '#a8dadc'} /></td>
                    <td style={{ padding: '12px 16px', color: '#a8dadc', fontFamily: 'monospace', textAlign: 'center' }}>{c.total_instrucciones}</td>
                    <td style={{ padding: '12px 16px', color: c.total_errores > 0 ? '#f87171' : '#a8dadc44', fontFamily: 'monospace', textAlign: 'center' }}>{c.total_errores}</td>
                    <td style={{ padding: '12px 16px', color: '#fbbf2488', fontFamily: 'monospace', textAlign: 'right' }}>{c.tiempo_compilacion_ms ?? '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#a8dadc88', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{fmtDate(c.fecha_compilacion)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {data.length === 0 && !cargando && <Vacio texto="No hay compilaciones en este filtro." />}
      </div>
      <Pagination page={page} total={total} size={SIZE} onPage={p => setPage(p)} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  SECCIÓN: COREOGRAFÍAS
// ════════════════════════════════════════════════════════════
function SeccionCoreografias() {
  const [data, setData]                   = useState<Coreografia[]>([]);
  const [cargando, setCargando]           = useState(true);
  const [toggling, setToggling]           = useState<number | null>(null);
  const [modalCrear, setModalCrear]       = useState(false);
  const [modalEditar, setModalEditar]     = useState<Coreografia | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Coreografia | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try { const res = await apiFetch<{ data: Coreografia[] }>('/api/Dashboard/choreographies'); setData(res.data); }
    catch { toast.error('Error al cargar coreografías'); } finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const ejecutarToggle = async (c: Coreografia) => {
    setConfirmToggle(null); setToggling(c.id);
    try {
      await apiFetch(`/api/Dashboard/choreographies/${c.id}/toggle`, { method: 'PUT' });
      toast.success(c.activa ? 'Coreografía desactivada.' : 'Coreografía activada.');
      cargar();
    } catch { toast.error('Error al cambiar el estado.'); }
    finally { setToggling(null); }
  };

  if (cargando) return <Loader />;

  return (
    <>
      {confirmToggle && (
        <ConfirmModal
          titulo={confirmToggle.activa ? 'Desactivar coreografía' : 'Activar coreografía'}
          mensaje={confirmToggle.activa ? `¿Desactivar "${confirmToggle.nombre}"? Los conductores no podrán verla ni usarla.` : `¿Activar "${confirmToggle.nombre}"? Estará disponible para todos los conductores.`}
          labelConfirm={confirmToggle.activa ? 'Desactivar' : 'Activar'}
          colorConfirm={confirmToggle.activa ? '#f87171' : '#57cc99'}
          onConfirm={() => ejecutarToggle(confirmToggle)}
          onCancel={() => setConfirmToggle(null)}
        />
      )}
      {modalCrear && <ChoreoModal onGuardar={() => { setModalCrear(false); cargar(); }} onCerrar={() => setModalCrear(false)} />}
      {modalEditar && <ChoreoModal inicial={modalEditar} onGuardar={() => { setModalEditar(null); cargar(); }} onCerrar={() => setModalEditar(null)} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#a8dadc66', fontSize: '0.78rem' }}>{data.length} coreografía{data.length !== 1 ? 's' : ''}</span>
          <button onClick={() => setModalCrear(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#457b9d', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
            <IconPlus /> Nueva coreografía
          </button>
        </div>
        {data.length === 0
          ? <Vacio texto="No hay coreografías registradas. ¡Crea la primera!" />
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {data.map(c => (
                <div key={c.id} style={{ background: 'rgba(29,53,87,0.6)', border: `1px solid ${c.activa ? 'rgba(168,218,220,0.2)' : 'rgba(248,113,113,0.2)'}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.4rem' }}>🎵</div>
                    <Badge text={c.activa ? 'Activa' : 'Inactiva'} color={c.activa ? '#57cc99' : '#f87171'} />
                  </div>
                  <div style={{ color: '#e1e1e1', fontWeight: 700, fontSize: '0.95rem' }}>{c.nombre}</div>
                  {c.descripcion && <div style={{ color: '#a8dadc88', fontSize: '0.78rem', lineHeight: 1.5 }}>{c.descripcion}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {c.cancion_nombre && <div style={{ color: '#a8dadc', fontSize: '0.75rem' }}>🎤 {c.cancion_nombre}</div>}
                    <div style={{ color: '#fbbf24', fontSize: '0.75rem' }}>⏱ {c.duracion_min}m {c.duracion_seg}s</div>
                    <div style={{ color: '#57cc99', fontSize: '0.75rem' }}>▶ Ejecutada {c.veces_ejecutada} {c.veces_ejecutada === 1 ? 'vez' : 'veces'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={() => setModalEditar(c)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 0', borderRadius: 8, border: '1px solid rgba(168,218,220,0.2)', background: 'rgba(69,123,157,0.15)', color: '#a8dadc', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                      <IconEdit /> Editar
                    </button>
                    <button onClick={() => setConfirmToggle(c)} disabled={toggling === c.id} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: c.activa ? 'rgba(248,113,113,0.15)' : 'rgba(87,204,153,0.15)', color: c.activa ? '#f87171' : '#57cc99', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, opacity: toggling === c.id ? 0.5 : 1 }}>
                      {toggling === c.id ? '...' : c.activa ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════
//  SECCIÓN: NOTIFICACIONES
// ════════════════════════════════════════════════════════════
function SeccionNotificaciones() {
  const [data, setData]         = useState<Notificacion[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [cargando, setCargando] = useState(true);
  const SIZE = 20;
  const cargar = useCallback(async (p: number) => {
    setCargando(true);
    try { const res = await apiFetch<{ total: number; data: Notificacion[] }>(`/api/Dashboard/notifications?page=${p}&size=${SIZE}`); setData(res.data); setTotal(res.total); }
    catch { toast.error('Error al cargar notificaciones'); } finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(page); }, [page, cargar]);
  const estadoColor: Record<string, string> = { enviado: '#57cc99', error: '#f87171', pendiente: '#fbbf24' };
  const canalIcon: Record<string, string>   = { email: '✉️', whatsapp: '💬' };
  const tipoLabel: Record<string, string>   = { bienvenida: 'Bienvenida', credencial_pdf: 'Credencial PDF', alerta_error: 'Alerta', otro: 'Otro' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <span style={{ color: '#a8dadc66', fontSize: '0.78rem', textAlign: 'right' }}>{total} notificaciones</span>
      <div style={{ background: 'rgba(29,53,87,0.5)', border: '1px solid rgba(168,218,220,0.12)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'rgba(69,123,157,0.2)', borderBottom: '1px solid rgba(168,218,220,0.15)' }}>
                {['Conductor', 'Tipo', 'Canal', 'Asunto', 'Estado', 'Fecha'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#a8dadc', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {cargando
                ? Array.from({ length: 6 }).map((_, i) => <tr key={i}><td colSpan={6} style={{ padding: '14px 16px' }}><div style={{ height: 14, background: 'rgba(168,218,220,0.08)', borderRadius: 4 }} /></td></tr>)
                : data.map(n => (
                  <tr key={n.id} style={{ borderBottom: '1px solid rgba(168,218,220,0.06)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(69,123,157,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 16px', color: '#e1e1e1', fontWeight: 600 }}>{n.conductor}</td>
                    <td style={{ padding: '12px 16px', color: '#a8dadc88' }}>{tipoLabel[n.tipo] ?? n.tipo}</td>
                    <td style={{ padding: '12px 16px', fontSize: '1rem' }}>{canalIcon[n.canal] ?? n.canal}</td>
                    <td style={{ padding: '12px 16px', color: '#a8dadc88', fontSize: '0.78rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.asunto ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}><Badge text={n.estado} color={estadoColor[n.estado] ?? '#a8dadc'} /></td>
                    <td style={{ padding: '12px 16px', color: '#a8dadc88', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{fmtDate(n.fecha_envio)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {data.length === 0 && !cargando && <Vacio texto="No hay notificaciones registradas." />}
      </div>
      <Pagination page={page} total={total} size={SIZE} onPage={p => setPage(p)} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
type Seccion = 'stats' | 'conductores' | 'accesos' | 'compilaciones' | 'coreografias' | 'notificaciones';
const SECCIONES: { id: Seccion; label: string; icon: React.ReactNode }[] = [
  { id: 'stats',          label: 'Dashboard',      icon: <IconDash /> },
  { id: 'conductores',    label: 'Conductores',    icon: <IconUsers /> },
  { id: 'accesos',        label: 'Bitácora',       icon: <IconLog /> },
  { id: 'compilaciones',  label: 'Compilaciones',  icon: <IconCode /> },
  { id: 'coreografias',   label: 'Coreografías',   icon: <IconMusic /> },
  { id: 'notificaciones', label: 'Notificaciones', icon: <IconBell /> },
];

export function AdminPage() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [seccion, setSeccion] = useState<Seccion>('stats');

  const handleLogout = async () => {
    try { await logoutUser(); } catch { /* silencioso */ }
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0a1628', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(29,53,87,0.3); }
        ::-webkit-scrollbar-thumb { background: #457b9d; border-radius: 3px; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 220, flexShrink: 0, background: 'rgba(13,27,54,0.95)', borderRight: '1px solid rgba(69,123,157,0.2)', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(69,123,157,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1d3557,#457b9d)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(69,123,157,0.4)' }}><IconShield /></div>
            <div>
              <div style={{ color: '#e1e1e1', fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.04em' }}>UMG ROVER</div>
              <div style={{ color: '#457b9d', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin Panel</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SECCIONES.map(s => {
            const activo = seccion === s.id;
            return (
              <button key={s.id} onClick={() => setSeccion(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: activo ? 'rgba(69,123,157,0.25)' : 'transparent', color: activo ? '#a8dadc' : '#a8dadc66', fontSize: '0.78rem', fontWeight: activo ? 700 : 400, textAlign: 'left', width: '100%', borderLeft: activo ? '3px solid #457b9d' : '3px solid transparent', transition: 'all 0.15s ease' }}>
                {s.icon}{s.label}{activo && <span style={{ marginLeft: 'auto' }}><IconChev /></span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(69,123,157,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar b64={user?.avatar_url ?? undefined} nick={user?.usuario ?? 'A'} size={34} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#e1e1e1', fontSize: '0.78rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.usuario}</div>
              <div style={{ color: '#f87171', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Administrador</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)', color: '#f87171', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
            <IconLogout /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        <header style={{ padding: '20px 32px', borderBottom: '1px solid rgba(69,123,157,0.15)', background: 'rgba(10,22,40,0.8)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, color: '#e1e1e1', fontSize: '1.1rem', fontWeight: 800 }}>{SECCIONES.find(s => s.id === seccion)?.label}</h1>
            <p style={{ margin: 0, color: '#a8dadc55', fontSize: '0.72rem', marginTop: 2 }}>UMG Basic Rover 2.0 — Panel de Administración</p>
          </div>
          <div style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em' }}>🔴 ADMIN</div>
        </header>
        <div style={{ padding: '28px 32px', flex: 1, animation: 'fadeIn 0.25s ease' }} key={seccion}>
          {seccion === 'stats'          && <SeccionStats />}
          {seccion === 'conductores'    && <SeccionConductores />}
          {seccion === 'accesos'        && <SeccionAccesos />}
          {seccion === 'compilaciones'  && <SeccionCompilaciones />}
          {seccion === 'coreografias'   && <SeccionCoreografias />}
          {seccion === 'notificaciones' && <SeccionNotificaciones />}
        </div>
      </main>
    </div>
  );
}
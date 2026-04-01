import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { toast } from 'sonner';
import { useAuth } from '../../auth/context/AuthContext';
import { logoutUser } from '../../auth/services/authServices';
import { compilarCodigo, type LenguajeDestino, type ErrorDto, type TokenDto, type InstruccionDto } from '../services/compilerService';
import { generarAst, type AstNodoDto } from '../services/astService';
import { listarCoreografias, obtenerCoreografia, type ChoreoListItem } from '../services/choreoService';

// ── Íconos ──────────────────────────────────────────────────
const IconGrid = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>);
const IconCode = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>);
const IconUser = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconLogout = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const IconCpu = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>);
const IconPlay = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>);
const IconTrash = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>);
const IconDownload = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);
const IconZap = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
const IconList = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>);
const IconTree = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M5 9l7-6 7 6M5 15l7-6 7 6"/></svg>);
const IconMusic = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>);
const IconChevronRight = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>);
const IconChevronDown = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>);
const IconSimulate = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>);
const IconRover = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="8" width="20" height="10" rx="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M7 8V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3"/></svg>);
const IconCamera = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);


// ── Colores AST ──────────────────────────────────────────────
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

// ── Tipos simulación ─────────────────────────────────────────
interface SimPoint { x: number; y: number; angle: number; }
interface SimSegment { points: SimPoint[]; instrIdx: number; }

// Escala base: 1 metro = 60px en espacio mundial
const METRO_PX = 60;

function calcularTrayectoria(instrucciones: InstruccionDto[]): SimSegment[] {
  const segments: SimSegment[] = [];
  let x = 0, y = 0, angle = -Math.PI / 2; // origen en 0,0 apuntando arriba

  for (let idx = 0; idx < instrucciones.length; idx++) {
    const inst = instrucciones[idx];
    const n = inst.parametro_n ?? inst.parametro_r ?? inst.parametro_l ?? 1;
    const nombre = inst.nombre.toLowerCase();
    const pts: SimPoint[] = [{ x, y, angle }];

    const pasos = (dist: number, dir: number, steps: number) => {
      for (let s = 1; s <= steps; s++) {
        x += Math.cos(angle) * (dist / steps) * dir;
        y += Math.sin(angle) * (dist / steps) * dir;
        pts.push({ x, y, angle });
      }
    };

    if (nombre === 'avanzar_mts') {
      pasos(Math.abs(n) * METRO_PX, n > 0 ? 1 : -1, 40);
    } else if (nombre === 'avanzar_ctms') {
      pasos(Math.abs(n) * METRO_PX / 100, n > 0 ? 1 : -1, 20);
    } else if (nombre === 'avanzar_vlts') {
      pasos(Math.abs(n) * METRO_PX * 0.25, n > 0 ? 1 : -1, 20);
    } else if (nombre === 'girar') {
      pts.push({ x, y, angle });
    } else if (nombre === 'circulo') {
      const r = Math.abs(n) * METRO_PX / 100;
      const steps = 80;
      const sa = angle;
      for (let s = 1; s <= steps; s++) {
        const a = sa + (Math.PI * 2 * s) / steps;
        const nx = x + Math.cos(a) * r - Math.cos(sa) * r;
        const ny = y + Math.sin(a) * r - Math.sin(sa) * r;
        pts.push({ x: nx, y: ny, angle: a + Math.PI / 2 });
      }
    } else if (nombre === 'cuadrado') {
      const lado = Math.abs(n) * METRO_PX / 100;
      for (let side = 0; side < 4; side++) {
        for (let s = 1; s <= 15; s++) {
          x += Math.cos(angle) * (lado / 15);
          y += Math.sin(angle) * (lado / 15);
          pts.push({ x, y, angle });
        }
        angle += Math.PI / 2;
        pts.push({ x, y, angle });
      }
    } else if (nombre === 'rotar') {
      const vueltas = Math.abs(n); const steps = 40; const dir = n > 0 ? 1 : -1;
      for (let s = 1; s <= steps; s++) {
        angle += (Math.PI * 2 * vueltas * dir) / steps;
        pts.push({ x, y, angle });
      }
    } else if (nombre === 'caminar') {
      pasos(Math.abs(n) * METRO_PX * 0.18, n > 0 ? 1 : -1, 25);
    } else if (nombre === 'moonwalk') {
      pasos(Math.abs(n) * METRO_PX * 0.18, n > 0 ? -1 : 1, 25);
    } else {
      pts.push({ x, y, angle });
    }

    segments.push({ points: pts, instrIdx: idx });
  }
  return segments;
}

// ── Componente Simulador ─────────────────────────────────────
interface SimuladorProps {
  instrucciones: InstruccionDto[];
  activeInstrIdx: number;
  animProgress: number; // 0..1 dentro del segmento activo
}

function Simulador({ instrucciones, activeInstrIdx, animProgress }: SimuladorProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const segRef      = useRef<SimSegment[]>([]);
  const zoomRef     = useRef(1);
  const offsetRef   = useRef({ x: 0, y: 0 });
  const autoZoomRef = useRef(1);
  const autoOffRef  = useRef({ x: 0, y: 0 });
  const [zoomDisplay, setZoomDisplay] = useState(100);

  // Recalcular trayectoria cuando cambian instrucciones
  useEffect(() => {
    segRef.current = calcularTrayectoria(instrucciones);
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    // Calcular auto-zoom para que toda la trayectoria quepa
    if (segRef.current.length > 0) {
      const allPts = segRef.current.flatMap(s => s.points);
      const xs = allPts.map(p => p.x);
      const ys = allPts.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const W = canvasRef.current?.width ?? 320;
      const H = canvasRef.current?.height ?? 240;
      const pad = 40;
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      const scale = Math.min((W - pad * 2) / rangeX, (H - pad * 2) / rangeY, 3);
      autoZoomRef.current = scale;
      autoOffRef.current = {
        x: W / 2 - ((minX + maxX) / 2) * scale,
        y: H / 2 - ((minY + maxY) / 2) * scale,
      };
    }
    setZoomDisplay(Math.round(zoomRef.current * 100));
  }, [instrucciones]);

  // Wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.88;
      zoomRef.current = Math.min(Math.max(zoomRef.current * factor, 0.1), 10);
      setZoomDisplay(Math.round(zoomRef.current * 100));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  const changeZoom = (factor: number) => {
    zoomRef.current = Math.min(Math.max(zoomRef.current * factor, 0.1), 10);
    setZoomDisplay(Math.round(zoomRef.current * 100));
  };

  const resetZoom = () => {
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setZoomDisplay(100);
  };

  // Dibujar
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, W, H);

    // Transformación combinada: auto-zoom del bounding box × zoom manual del usuario
    const totalZoom = autoZoomRef.current * zoomRef.current;
    const ox = autoOffRef.current.x + offsetRef.current.x;
    const oy = autoOffRef.current.y + offsetRef.current.y;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(totalZoom, totalZoom);

    // Grid en espacio mundo (se escala con el zoom)
    const gridStep = METRO_PX / 2;
    ctx.strokeStyle = 'rgba(56,189,248,0.05)';
    ctx.lineWidth = 0.5 / totalZoom;
    const gx0 = -ox / totalZoom, gy0 = -oy / totalZoom;
    const gxN = (W - ox) / totalZoom, gyN = (H - oy) / totalZoom;
    for (let gx = Math.floor(gx0 / gridStep) * gridStep; gx <= gxN; gx += gridStep) {
      ctx.beginPath(); ctx.moveTo(gx, gy0); ctx.lineTo(gx, gyN); ctx.stroke();
    }
    for (let gy = Math.floor(gy0 / gridStep) * gridStep; gy <= gyN; gy += gridStep) {
      ctx.beginPath(); ctx.moveTo(gx0, gy); ctx.lineTo(gxN, gy); ctx.stroke();
    }

    // Origen
    ctx.beginPath(); ctx.arc(0, 0, 4 / totalZoom, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56,189,248,0.6)'; ctx.fill();
    ctx.strokeStyle = 'rgba(56,189,248,0.4)'; ctx.lineWidth = 1 / totalZoom;
    ctx.beginPath(); ctx.arc(0, 0, 10 / totalZoom, 0, Math.PI * 2); ctx.stroke();

    if (segRef.current.length === 0) { ctx.restore(); return; }

    // Trayectoria anticipada completa (punteada gris)
    ctx.setLineDash([4 / totalZoom, 4 / totalZoom]);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1 / totalZoom;
    ctx.beginPath();
    let firstPt = true;
    for (const seg of segRef.current) {
      for (const pt of seg.points) {
        if (firstPt) { ctx.moveTo(pt.x, pt.y); firstPt = false; } else ctx.lineTo(pt.x, pt.y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Segmentos recorridos (sólidos)
    for (let i = 0; i <= Math.min(activeInstrIdx, segRef.current.length - 1); i++) {
      const seg = segRef.current[i];
      if (!seg) continue;
      const isActive = i === activeInstrIdx;
      // Para el segmento activo, solo dibujar hasta animProgress
      const pts = isActive
        ? seg.points.slice(0, Math.max(2, Math.round(seg.points.length * animProgress)))
        : seg.points;

      ctx.beginPath();
      ctx.lineWidth = (isActive ? 2 : 1.5) / totalZoom;
      ctx.strokeStyle = isActive ? '#38bdf8' : 'rgba(56,189,248,0.55)';
      let f = true;
      for (const pt of pts) { if (f) { ctx.moveTo(pt.x, pt.y); f = false; } else ctx.lineTo(pt.x, pt.y); }
      ctx.stroke();

      // Punto de inicio del segmento
      const p0 = seg.points[0];
      ctx.beginPath(); ctx.arc(p0.x, p0.y, (isActive ? 3 : 2) / totalZoom, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#38bdf8' : 'rgba(56,189,248,0.5)'; ctx.fill();
    }

    // Posición del rover: interpolamos dentro del segmento activo
    const activeSeg = segRef.current[Math.min(activeInstrIdx, segRef.current.length - 1)];
    if (activeSeg && activeInstrIdx >= 0) {
      const pts = activeSeg.points;
      const rawIdx = animProgress * (pts.length - 1);
      const i0 = Math.floor(rawIdx), i1 = Math.min(i0 + 1, pts.length - 1);
      const t = rawIdx - i0;
      const rx = pts[i0].x + (pts[i1].x - pts[i0].x) * t;
      const ry = pts[i0].y + (pts[i1].y - pts[i0].y) * t;
      const ra = pts[i0].angle + (pts[i1].angle - pts[i0].angle) * t;

      const s = 1 / totalZoom;
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(ra + Math.PI / 2);

      // Sombra/halo
      ctx.beginPath(); ctx.arc(0, 0, 14 * s, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56,189,248,0.08)'; ctx.fill();

      // Cuerpo del rover
      ctx.fillStyle = '#1e3a5f'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      const bw = 8 * s, bh = 12 * s;
      ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 2 * s);
      ctx.fill(); ctx.stroke();

      // Ruedas
      ctx.fillStyle = '#38bdf8';
      [[-bw / 2 - 2 * s, -bh * 0.3], [bw / 2 - 2 * s, -bh * 0.3],
       [-bw / 2 - 2 * s, bh * 0.15],  [bw / 2 - 2 * s, bh * 0.15]].forEach(([wx, wy]) => {
        ctx.beginPath(); ctx.rect(wx, wy as number, 4 * s, 5 * s); ctx.fill();
      });

      // Indicador de frente
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath(); ctx.arc(0, -bh / 2 - 1 * s, 2.5 * s, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }, [activeInstrIdx, animProgress, instrucciones]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} width={320} height={240} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Controles de zoom */}
      <div style={{
        position: 'absolute', bottom: '8px', right: '8px',
        display: 'flex', alignItems: 'center', gap: '4px',
        background: 'rgba(10,15,26,0.85)', border: '1px solid rgba(56,189,248,0.2)',
        borderRadius: '8px', padding: '4px 6px',
      }}>
        <button onClick={() => changeZoom(0.8)} style={zoomBtn}>−</button>
        <span onClick={resetZoom} style={{ color: '#38bdf8', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', minWidth: '36px', textAlign: 'center' }}>
          {zoomDisplay}%
        </span>
        <button onClick={() => changeZoom(1.25)} style={zoomBtn}>+</button>
      </div>
    </div>
  );
}

const zoomBtn: React.CSSProperties = {
  background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
  color: '#38bdf8', borderRadius: '4px', width: '22px', height: '22px',
  cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1, padding: 0,
};

// ── Constantes ───────────────────────────────────────────────
const CODIGO_EJEMPLO = `PROGRAM mi_ruta\nBEGIN\n  avanzar_mts(3);\n  girar(1);\n  circulo(50);\nEND.\n`;
type OutputTab  = 'consola' | 'tokens' | 'instrucciones' | 'codigo' | 'ast';
type OutputLine = { type: 'info' | 'success' | 'error' | 'warn'; text: string };

// ── Componente principal ─────────────────────────────────────
export function EditorPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [code, setCode]                   = useState(CODIGO_EJEMPLO);
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

  const [astData, setAstData]           = useState<AstNodoDto | null>(null);
  const [isLoadingAst, setIsLoadingAst] = useState(false);

  const [choreoOpen, setChoreoOpen]           = useState(false);
  const [choreoList, setChoreoList]           = useState<ChoreoListItem[]>([]);
  const [choreoLoading, setChoreoLoading]     = useState(false);
  const [choreoLoadingId, setChoreoLoadingId] = useState<number | null>(null);
  const choreoRef = useRef<HTMLDivElement>(null);

  // Simulación con animación suave
  const [isSimulating, setIsSimulating]   = useState(false);
  const [simActiveIdx, setSimActiveIdx]   = useState(-1);
  const [animProgress, setAnimProgress]   = useState(0); // 0..1 dentro del segmento
  const rafRef      = useRef<number>(0);
  const simStateRef = useRef({ idx: -1, running: false });
  

  const [isSendingRover, setIsSendingRover] = useState(false);

  const initials = user?.usuario?.charAt(0).toUpperCase() ?? '?';

   useEffect(() => {
    const handler = (e: MouseEvent) => { if (choreoRef.current && !choreoRef.current.contains(e.target as Node)) setChoreoOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    wsRoverRef.current?.close();
  }, []);

  const handleLogout = async () => {
    try { await logoutUser(); } finally { logout(); toast.success('Sesión cerrada.'); navigate('/login'); }
  };

  const addLine = (type: OutputLine['type'], text: string) =>
    setConsolaLines(prev => [...prev, { type, text }]);

  // ── Compilar ────────────────────────────────────────────────
  const handleCompile = async () => {
    if (!code.trim()) { toast.error('El editor está vacío.'); return; }
    setIsCompiling(true);
    setConsolaLines([]); setTokens([]); setInstrucciones([]); setCodigoTranspilado('');
    setAstData(null); setSimActiveIdx(-1); setAnimProgress(0);
    setActiveTab('consola');
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
        setCodigoTranspilado(result.codigo_transpilado);
        setLastCompilacionId(result.compilacion_id);
        setCompilaciones(c => c + 1);
        toast.success(`Compilación exitosa en ${result.tiempo_ms}ms 🚀`);
        setTimeout(() => setActiveTab('codigo'), 600);
      } else {
        addLine('error', `❌ Compilación fallida: ${result.resultado}`);
        result.errores.forEach((e: ErrorDto) => {
          addLine('error', `  [${e.tipo.toUpperCase()}] Línea ${e.linea ?? '?'}, Col ${e.columna ?? '?'}: ${e.mensaje}`);
          if (e.sugerencia) addLine('warn', `  💡 ${e.sugerencia}`);
        });
        setTokens(result.tokens);
        toast.error('Error de compilación — revisa la consola');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
      const status = axiosErr.response?.status;
      const msg = axiosErr.response?.data?.error ?? 'Error al conectar con el compilador.';
      if (status === 401) { addLine('error', '❌ Sesión expirada.'); toast.error('Sesión expirada.'); logout(); navigate('/login'); }
      else { addLine('error', `❌ ${msg}`); toast.error(msg); }
    } finally { setIsCompiling(false); }
  };

  // ── Simulación suave con requestAnimationFrame ───────────────
  const handleSimular = useCallback(() => {
    if (instrucciones.length === 0) { toast.error('Compila primero para simular.'); return; }

    if (isSimulating) {
      simStateRef.current.running = false;
      cancelAnimationFrame(rafRef.current);
      setIsSimulating(false);
      setSimActiveIdx(-1);
      setAnimProgress(0);
      toast.info('Simulación detenida.');
      return;
    }

    // Duración por segmento en ms (más largo = más suave y lento)
    const SEG_DURATION = 900;

    simStateRef.current = { idx: 0, running: true };
    setIsSimulating(true);
    setSimActiveIdx(0);
    setAnimProgress(0);
    toast.success('Simulación iniciada 🚗');

    let startTime: number | null = null;

    const animate = (ts: number) => {
      if (!simStateRef.current.running) return;
      if (startTime === null) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / SEG_DURATION, 1);
      // Easing suave: ease-in-out
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      setAnimProgress(eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Avanzar al siguiente segmento
        const nextIdx = simStateRef.current.idx + 1;
        if (nextIdx >= instrucciones.length) {
          simStateRef.current.running = false;
          setIsSimulating(false);
          setAnimProgress(1);
          toast.success('Simulación completada ✅');
        } else {
          simStateRef.current.idx = nextIdx;
          setSimActiveIdx(nextIdx);
          setAnimProgress(0);
          startTime = null;
          rafRef.current = requestAnimationFrame(animate);
        }
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [instrucciones, isSimulating]);

  // ── Enviar al Rover ─────────────────────────────────────────
    const wsRoverRef = useRef<WebSocket | null>(null);

    const handleEnviarRover = async () => {
      if (!lastCompilacionId) { toast.error('Compila primero antes de enviar al rover.'); return; }
      setIsSendingRover(true);
      try {
        const token = localStorage.getItem('rover_token');
        const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5123';

        const res = await fetch(`${API_URL}/api/Rover/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ compilacion_id: lastCompilacionId }),
        });
        const data = await res.json();

        if (res.ok && data.exitoso) {
          addLine('success', `🚀 Instrucciones enviadas al rover (transmisión #${data.transmision_id})`);
          addLine('info', `📡 ${data.total_instrucciones} instrucciones publicadas vía MQTT`);
          addLine('info', `🔗 Conectando al rover para recibir actualizaciones...`);
          toast.success('¡Instrucciones enviadas al rover! 🤖');
          setActiveTab('consola');

          // Cerrar WebSocket anterior si existía
          if (wsRoverRef.current) wsRoverRef.current.close();

          const WS_URL = API_URL.replace('https', 'wss').replace('http', 'ws');
          const ws = new WebSocket(`${WS_URL}/ws/rover?token=${token}`);
          wsRoverRef.current = ws;

          ws.onopen = () => addLine('info', '📶 Conexión en tiempo real establecida con el rover');

          ws.onmessage = (event) => {
            try {
              const msg = JSON.parse(event.data);
              if (msg.tipo === 'progreso') {
                addLine('info', `🤖 Rover → instrucción ${msg.instruccion_actual}/${msg.total}: ${msg.comando ?? ''}`);
              } else if (msg.tipo === 'ack') {
                addLine('success', `✅ ACK recibido: ${msg.mensaje ?? 'instrucción ejecutada'}`);
              } else if (msg.tipo === 'completado') {
                addLine('success', '🏁 Rover completó la ejecución correctamente');
                toast.success('Rover completó la ejecución 🏁');
                ws.close();
              } else if (msg.tipo === 'error') {
                addLine('error', `❌ Error en rover: ${msg.mensaje}`);
                toast.error(`Error en rover: ${msg.mensaje}`);
                ws.close();
              }
            } catch {
              addLine('warn', `⚠️ Mensaje no reconocido del rover`);
            }
          };

          ws.onerror = () => addLine('error', '❌ Error en la conexión WebSocket con el rover');
          ws.onclose = () => addLine('info', '🔌 Conexión con el rover cerrada');

        } else {
          addLine('error', `❌ ${data.error ?? 'Error al enviar al rover'}`);
          toast.error(data.error ?? 'Error al enviar al rover');
        }
      } catch {
        addLine('error', '❌ No se pudo conectar con el servidor.');
        toast.error('Error de conexión al enviar al rover.');
      } finally {
        setIsSendingRover(false);
        setActiveTab('consola');
      }
    };

  // ── AST ─────────────────────────────────────────────────────
  const handleGenerarAst = async () => {
    if (!code.trim()) { toast.error('El editor está vacío.'); return; }
    setIsLoadingAst(true); setActiveTab('ast'); setAstData(null);
    try {
      const result = await generarAst(code);
      if (result.exitoso && result.arbol) { setAstData(result.arbol); toast.success(`AST generado — programa: ${result.programa}`); }
      else {
        const primer = result.errores[0];
        toast.error(primer ? `Error ${primer.tipo}: ${primer.mensaje}` : 'No se pudo generar el AST.');
        setActiveTab('consola');
        if (primer) { addLine('error', `[AST] ${primer.tipo.toUpperCase()} L${primer.linea ?? '?'}: ${primer.mensaje}`); if (primer.sugerencia) addLine('warn', `  💡 ${primer.sugerencia}`); }
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 401) { logout(); navigate('/login'); }
      toast.error('Error al generar el AST.'); setActiveTab('consola');
    } finally { setIsLoadingAst(false); }
  };

  // ── Coreografías ────────────────────────────────────────────
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
      setCode(detalle.codigo_fuente); setChoreoOpen(false);
      setConsolaLines([]); setTokens([]); setInstrucciones([]); setCodigoTranspilado('');
      setAstData(null); setSimActiveIdx(-1); setAnimProgress(0);
      setActiveTab('consola');
      addLine('info', `🎵 Coreografía cargada: ${nombre}`);
      if (detalle.cancion_nombre) addLine('info', `🎶 Canción: ${detalle.cancion_nombre}`);
      toast.success(`Coreografía "${nombre}" cargada en el editor`);
    } catch { toast.error('Error al cargar la coreografía.'); }
    finally { setChoreoLoadingId(null); }
  };

  const handleClear = () => {
    setCode(''); setConsolaLines([]); setTokens([]); setInstrucciones([]);
    setCodigoTranspilado(''); setAstData(null); setSimActiveIdx(-1); setAnimProgress(0);
    cancelAnimationFrame(rafRef.current); setIsSimulating(false);
    simStateRef.current.running = false;
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'programa_rover.umgpp'; a.click();
    URL.revokeObjectURL(url); toast.success('Archivo descargado.');
  };

  const handleDownloadTranspilado = () => {
    if (!codigoTranspilado) return;
    const ext = selectedLang === 'python' ? 'py' : 'cs';
    const blob = new Blob([codigoTranspilado], { type: 'text/plain' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `programa_rover.${ext}`; a.click();
    URL.revokeObjectURL(url); toast.success(`Código ${selectedLang.toUpperCase()} descargado.`);
  };

  const outputColor = (type: OutputLine['type']) => {
    if (type === 'success') return 'var(--accent3)';
    if (type === 'error')   return 'var(--danger)';
    if (type === 'warn')    return 'var(--warning)';
    return 'var(--text-secondary)';
  };

  const formatDuracion = (seg: number) => { const m = Math.floor(seg / 60); const s = seg % 60; return m > 0 ? `${m}m ${s}s` : `${s}s`; };

  const tabs: { id: OutputTab; label: string; count?: number }[] = [
    { id: 'consola', label: 'Consola', count: consolaLines.length },
    { id: 'tokens', label: 'Tokens', count: tokens.length },
    { id: 'instrucciones', label: 'Instrucciones', count: instrucciones.length },
    { id: 'codigo', label: selectedLang === 'python' ? 'Python' : 'C#' },
    { id: 'ast', label: 'AST' },
  ];

  return (
    <div style={styles.shell}>
      <div style={styles.bgOrb1} /><div style={styles.bgOrb2} />

      {/* SIDEBAR */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? '240px' : '68px' }}>
        <div style={styles.sidebarLogo}>
          <div style={styles.logoIcon}><IconCpu /></div>
          {sidebarOpen && <span style={styles.logoText}>UMG ++</span>}
        </div>
        <div style={styles.sidebarDivider} />
        <nav style={styles.nav}>
          {[{ to: '/dashboard', icon: <IconGrid />, label: 'Dashboard' }, { to: '/editor', icon: <IconCode />, label: 'Editor' }, { to: '/profile', icon: <IconUser />, label: 'Perfil' }].map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}>
              <span style={styles.navIcon}>{icon}</span>
              {sidebarOpen && <span style={styles.navLabel}>{label}</span>}
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
          <div>
            <p style={styles.topbarSub}>Compilador UMG++ — Motor v2.0</p>
            <h1 style={styles.topbarTitle}>Editor de Código</h1>
          </div>
          <div style={styles.topbarRight}>
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
            <select value={selectedLang} onChange={e => setSelectedLang(e.target.value as LenguajeDestino)} style={styles.langSelect}>
              <option value="python">Python</option><option value="csharp">C#</option>
            </select>
            <button onClick={handleDownload} style={styles.btnSecondary}><IconDownload /> Descargar</button>
            {codigoTranspilado && <button onClick={handleDownloadTranspilado} style={styles.btnSecondary}><IconDownload /> .{selectedLang === 'python' ? 'py' : 'cs'}</button>}
            <button onClick={handleGenerarAst} disabled={isLoadingAst} style={{ ...styles.btnAst, opacity: isLoadingAst ? 0.7 : 1, cursor: isLoadingAst ? 'not-allowed' : 'pointer' }}>
              <IconTree />{isLoadingAst ? 'Generando...' : 'Ver AST'}
            </button>
            <div style={styles.topbarSep} />
            <button onClick={handleSimular} style={{ ...styles.btnSimular, background: isSimulating ? 'rgba(251,191,36,0.18)' : 'rgba(251,191,36,0.08)', borderColor: isSimulating ? 'rgba(251,191,36,0.6)' : 'rgba(251,191,36,0.3)' }}>
              <IconSimulate />{isSimulating ? 'Detener' : 'Simular'}
            </button>
            <button onClick={handleEnviarRover} disabled={isSendingRover || !lastCompilacionId} style={{ ...styles.btnRover, opacity: (isSendingRover || !lastCompilacionId) ? 0.5 : 1, cursor: (isSendingRover || !lastCompilacionId) ? 'not-allowed' : 'pointer' }}>
              <IconRover />{isSendingRover ? 'Enviando...' : 'Enviar al Rover'}
            </button>
            <button onClick={handleClear} style={styles.btnDanger}><IconTrash /> Limpiar</button>
            <button onClick={handleCompile} disabled={isCompiling} style={{ ...styles.btnPrimary, opacity: isCompiling ? 0.7 : 1, cursor: isCompiling ? 'not-allowed' : 'pointer' }}>
              <IconPlay />{isCompiling ? 'Compilando...' : 'Compilar'}
            </button>
          </div>
        </header>

        {/* STATS */}
        <div style={styles.statsRow}>
          {[
            { label: 'Compilaciones', value: compilaciones, color: 'var(--accent)' },
            { label: 'Lenguaje destino', value: selectedLang.toUpperCase(), color: 'var(--accent2)' },
            { label: 'Estado', value: isCompiling ? 'Compilando...' : isSimulating ? 'Simulando...' : 'Listo', color: isSimulating ? '#fbbf24' : 'var(--accent3)' },
            { label: 'Líneas', value: code.split('\n').length, color: 'var(--warning)' },
            { label: 'Tiempo', value: lastTiempoMs !== null ? `${lastTiempoMs}ms` : '—', color: 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} style={styles.statChip}>
              <span style={styles.statChipLabel}>{s.label}</span>
              <span style={{ ...styles.statChipValue, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* LAYOUT 30% | 30% | 40% */}
        <div style={styles.mainLayout}>

          {/* COL 1 — Editor */}
          <div style={styles.editorPanel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelDots}>
                <span style={{ ...styles.dot, background: '#f87171' }} />
                <span style={{ ...styles.dot, background: '#fbbf24' }} />
                <span style={{ ...styles.dot, background: '#34d399' }} />
              </div>
              <span style={styles.panelLabel}>programa_rover.umgpp</span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Editor height="100%" defaultLanguage="plaintext" theme="vs-dark" value={code} onChange={val => setCode(val ?? '')}
                options={{ fontSize: 13, fontFamily: 'JetBrains Mono, Fira Code, monospace', minimap: { enabled: false }, lineNumbers: 'on', scrollBeyondLastLine: false, padding: { top: 12, bottom: 12 }, renderLineHighlight: 'line', cursorBlinking: 'smooth', smoothScrolling: true, wordWrap: 'on' }}
              />
            </div>
          </div>

          {/* COL 2 — Cámara + Simulación */}
          <div style={styles.visualCol}>
            {/* Cámara */}
            <div style={styles.cameraPanel}>
              <div style={styles.visualPanelHeader}>
                <IconCamera />
                <span style={styles.visualPanelLabel}>Cámara Rover — RPi 5MP</span>
                <span style={styles.liveBadge}>LIVE</span>
              </div>
              <div style={styles.cameraBody}>
                <img
  src="https://rover.nexttechsolutionspc.xyz/?action=stream"
  alt="Cámara Rover en vivo"
  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
  onError={(e) => {
    (e.target as HTMLImageElement).style.display = 'none';
  }}
/>
              </div>
            </div>

            {/* Simulación */}
            <div style={styles.simPanel}>
              <div style={styles.visualPanelHeader}>
                <IconSimulate />
                <span style={styles.visualPanelLabel}>Simulación de trayectoria</span>
                {isSimulating && <span style={{ ...styles.liveBadge, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)' }}>EN CURSO</span>}
                {!isSimulating && simActiveIdx >= 0 && instrucciones.length > 0 && simActiveIdx >= instrucciones.length - 1 && animProgress >= 1 && (
                  <span style={{ ...styles.liveBadge, background: 'rgba(52,211,153,0.15)', color: 'var(--accent3)', borderColor: 'rgba(52,211,153,0.3)' }}>COMPLETADO</span>
                )}
              </div>

              {/* Instrucciones con highlight */}
              {instrucciones.length > 0 && (
                <div style={styles.simInstrRow}>
                  {instrucciones.map((inst, i) => (
                    <span key={i} style={{
                      ...styles.simInstrChip,
                      color: i === simActiveIdx ? '#fbbf24' : i < simActiveIdx ? 'var(--accent3)' : 'var(--text-muted)',
                      background: i === simActiveIdx ? 'rgba(251,191,36,0.12)' : 'transparent',
                      border: `1px solid ${i === simActiveIdx ? 'rgba(251,191,36,0.3)' : 'transparent'}`,
                      fontWeight: i === simActiveIdx ? 700 : 400,
                      transition: 'all 0.3s ease',
                    }}>{inst.raw}</span>
                  ))}
                </div>
              )}

              <div style={styles.simCanvas}>
                {instrucciones.length === 0
                  ? <div style={styles.simEmpty}><IconSimulate /><p>Compila y presiona <strong style={{ color: '#fbbf24' }}>Simular</strong></p><p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '-0.3rem' }}>Rueda del mouse o botones ± para zoom</p></div>
                  : <Simulador instrucciones={instrucciones} activeInstrIdx={simActiveIdx} animProgress={animProgress} />
                }
              </div>
            </div>
          </div>

          {/* COL 3 — Output tabs */}
          <div style={styles.outputPanel}>
            <div style={styles.tabsBar}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}>
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span style={{ ...styles.tabBadge, background: activeTab === tab.id ? 'var(--accent)' : 'var(--bg-elevated)', color: activeTab === tab.id ? '#000' : 'var(--text-muted)' }}>{tab.count}</span>
                  )}
                  {tab.id === 'ast' && astData && (
                    <span style={{ ...styles.tabBadge, background: activeTab === 'ast' ? 'var(--accent)' : 'rgba(56,189,248,0.15)', color: activeTab === 'ast' ? '#000' : 'var(--accent)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
            <div style={styles.outputContent}>
              {activeTab === 'consola' && (consolaLines.length === 0
                ? <div style={styles.outputEmpty}><IconZap /><p>Presiona <strong style={{ color: 'var(--accent)' }}>Compilar</strong> para ver los resultados</p></div>
                : consolaLines.map((line, i) => (
                    <div key={i} style={{ ...styles.outputLine, color: outputColor(line.type) }}>
                      <span style={styles.outputLineNum}>{String(i + 1).padStart(2, '0')}</span>
                      <span>{line.text}</span>
                    </div>
                  ))
              )}
              {activeTab === 'tokens' && (tokens.length === 0
                ? <div style={styles.outputEmpty}><IconList /><p>Sin tokens — compila primero</p></div>
                : <table style={styles.table}><thead><tr>{['Línea','Col','Tipo','Lexema'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead><tbody>{tokens.map((t, i) => (<tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}><td style={styles.td}>{t.linea}</td><td style={styles.td}>{t.columna}</td><td style={{ ...styles.td, color: 'var(--accent2)', fontFamily: 'var(--font-mono)' }}>{t.tipo}</td><td style={{ ...styles.td, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{t.lexema}</td></tr>))}</tbody></table>
              )}
              {activeTab === 'instrucciones' && (instrucciones.length === 0
                ? <div style={styles.outputEmpty}><IconList /><p>Sin instrucciones — compila primero</p></div>
                : <table style={styles.table}><thead><tr>{['#','Instrucción','Raw','N','R','L'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead><tbody>{instrucciones.map((inst, i) => (<tr key={i} style={{ background: i === simActiveIdx ? 'rgba(251,191,36,0.07)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}><td style={styles.td}>{inst.orden}</td><td style={{ ...styles.td, color: i === simActiveIdx ? '#fbbf24' : 'var(--accent2)', fontFamily: 'var(--font-mono)' }}>{inst.nombre}</td><td style={{ ...styles.td, fontFamily: 'var(--font-mono)', color: i === simActiveIdx ? '#fbbf24' : 'var(--accent)' }}>{inst.raw}</td><td style={styles.td}>{inst.parametro_n ?? '—'}</td><td style={styles.td}>{inst.parametro_r ?? '—'}</td><td style={styles.td}>{inst.parametro_l ?? '—'}</td></tr>))}</tbody></table>
              )}
              {activeTab === 'codigo' && (!codigoTranspilado
                ? <div style={styles.outputEmpty}><IconCode /><p>Sin código generado — compila primero</p></div>
                : <pre style={styles.codeBlock}>{codigoTranspilado}</pre>
              )}
              {activeTab === 'ast' && (isLoadingAst
                ? <div style={styles.outputEmpty}><IconTree /><p style={{ color: 'var(--accent)' }}>Generando árbol sintáctico...</p></div>
                : !astData
                  ? <div style={styles.outputEmpty}><IconTree /><p>Presiona <strong style={{ color: 'var(--accent)' }}>Ver AST</strong></p><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>No requiere compilar primero</p></div>
                  : <div>
                      <div style={styles.astLeyenda}>{Object.entries(NODE_COLORS).map(([tipo, color]) => (<span key={tipo} style={styles.astLeyendaItem}><span style={{ ...styles.astLeyendaDot, background: color }} /><span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{tipo}</span></span>))}</div>
                      <AstNodo nodo={astData} depth={0} />
                    </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', height: '100vh', background: 'var(--bg-deep)', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-ui)' },
  bgOrb1: { position: 'fixed', top: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  bgOrb2: { position: 'fixed', bottom: '-20%', right: '-10%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  sidebar: { display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRight: '1px solid var(--border)', padding: '1.25rem 0.75rem', position: 'relative', zIndex: 10, transition: 'width 0.25s ease', flexShrink: 0, overflow: 'hidden' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem 0.5rem', whiteSpace: 'nowrap' },
  logoIcon: { width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 },
  logoText: { fontFamily: 'var(--font-brand)', color: 'var(--accent)', fontSize: '1.1rem', fontWeight: '700', letterSpacing: '2px' },
  sidebarDivider: { height: '1px', background: 'var(--border)', margin: '0.75rem 0' },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  navLink: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '8px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap', border: '1px solid transparent' },
  navLinkActive: { background: 'rgba(56,189,248,0.1)', color: 'var(--accent)', borderColor: 'rgba(56,189,248,0.2)' },
  navIcon: { flexShrink: 0 },
  navLabel: { fontSize: '0.875rem', fontWeight: '500' },
  sidebarFooter: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border)' },
  sidebarUser: { display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, overflow: 'hidden' },
  avatarSmall: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '0.875rem', flexShrink: 0 },
  sidebarUserInfo: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidebarUserName: { color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  sidebarUserRole: { color: 'var(--text-muted)', fontSize: '0.7rem' },
  logoutBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', display: 'flex', alignItems: 'center', flexShrink: 0 },
  collapseBtn: { position: 'absolute', top: '50%', right: '-12px', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', zIndex: 20 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem', overflow: 'hidden', position: 'relative', zIndex: 1 },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 },
  topbarSub: { color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 },
  topbarTitle: { color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: '700', margin: '0.2rem 0 0', fontFamily: 'var(--font-brand)', letterSpacing: '1px' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  topbarSep: { width: '1px', height: '22px', background: 'var(--border)', margin: '0 0.15rem' },
  langSelect: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.825rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', padding: '0.55rem 1.1rem', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' },
  btnSecondary: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '0.55rem 0.9rem', fontSize: '0.825rem', cursor: 'pointer' },
  btnDanger: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--danger)', borderRadius: '8px', padding: '0.55rem 0.9rem', fontSize: '0.825rem', cursor: 'pointer' },
  btnAst: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)', color: 'var(--accent2)', borderRadius: '8px', padding: '0.55rem 0.9rem', fontSize: '0.825rem', fontWeight: '600', cursor: 'pointer' },
  btnChoreo: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.3)', color: '#f472b6', borderRadius: '8px', padding: '0.55rem 0.9rem', fontSize: '0.825rem', cursor: 'pointer', fontWeight: '600' },
  btnSimular: { display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid', color: '#fbbf24', borderRadius: '8px', padding: '0.55rem 0.9rem', fontSize: '0.825rem', fontWeight: '600', cursor: 'pointer' },
  btnRover: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: 'var(--accent3)', borderRadius: '8px', padding: '0.55rem 0.9rem', fontSize: '0.825rem', fontWeight: '600', cursor: 'pointer' },
  choreoDropdown: { position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: '280px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', zIndex: 100, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  choreoDropdownHeader: { padding: '0.65rem 0.9rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' },
  choreoLoading: { padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' },
  choreoItem: { width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', padding: '0.65rem 0.9rem', cursor: 'pointer', display: 'block' },
  choreoItemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' },
  choreoItemNombre: { color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: '600' },
  choreoItemDur: { color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' },
  choreoItemDesc: { color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.15rem' },
  choreoItemCancion: { color: '#f472b6', fontSize: '0.7rem' },
  choreoItemLoading: { color: 'var(--accent)', fontSize: '0.7rem', marginTop: '0.25rem' },
  statsRow: { display: 'flex', gap: '0.75rem', flexShrink: 0 },
  statChip: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  statChipLabel: { color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statChipValue: { fontSize: '0.9rem', fontWeight: '700', fontFamily: 'var(--font-mono)' },
  mainLayout: { display: 'flex', flexDirection: 'row', gap: '0.75rem', flex: 1, minHeight: 0 },
  editorPanel: { flex: '0 0 30%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  visualCol: { flex: '0 0 30%', display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0, minHeight: 0 },
  cameraPanel: { flex: '0 0 auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  cameraBody: { height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' },
  simPanel: { flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 },
  simInstrRow: { display: 'flex', flexWrap: 'wrap', gap: '0.25rem', padding: '0.35rem 0.65rem', borderBottom: '1px solid var(--border)', maxHeight: '48px', overflowY: 'auto' },
  simInstrChip: { fontSize: '0.63rem', fontFamily: 'var(--font-mono)', padding: '0.1rem 0.35rem', borderRadius: '4px', whiteSpace: 'nowrap' },
  simCanvas: { flex: 1, position: 'relative', overflow: 'hidden' },
  simEmpty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center' },
  visualPanelHeader: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', flexShrink: 0 },
  visualPanelLabel: { color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, flex: 1 },
  liveBadge: { fontSize: '0.58rem', fontWeight: 700, padding: '0.12rem 0.35rem', borderRadius: '4px', background: 'rgba(248,113,113,0.15)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.3)', letterSpacing: '0.5px' },
  outputPanel: { flex: '0 0 40%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  panelHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', flexShrink: 0 },
  panelDots: { display: 'flex', gap: '5px' },
  dot: { width: '10px', height: '10px', borderRadius: '50%' },
  panelLabel: { color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', flex: 1 },
  tabsBar: { display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', flexShrink: 0 },
  tab: { flex: 1, padding: '0.6rem 0.4rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', borderBottom: '2px solid transparent', transition: 'all 0.2s' },
  tabActive: { color: 'var(--accent)', borderBottomColor: 'var(--accent)', background: 'rgba(56,189,248,0.05)' },
  tabBadge: { borderRadius: '10px', padding: '0 5px', fontSize: '0.65rem', fontWeight: '700', minWidth: '16px', textAlign: 'center' },
  outputContent: { flex: 1, overflowY: 'auto', padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' },
  outputEmpty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' },
  outputLine: { display: 'flex', gap: '0.75rem', padding: '0.15rem 0', lineHeight: '1.6' },
  outputLineNum: { color: 'var(--text-muted)', userSelect: 'none', minWidth: '20px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' },
  th: { color: 'var(--text-muted)', textAlign: 'left', padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.5px' },
  td: { color: 'var(--text-secondary)', padding: '0.35rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' },
  codeBlock: { margin: 0, color: 'var(--accent3)', lineHeight: '1.7', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  astLeyenda: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.5rem 0.4rem', borderBottom: '1px solid var(--border)' },
  astLeyendaItem: { display: 'flex', alignItems: 'center', gap: '0.3rem' },
  astLeyendaDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
};
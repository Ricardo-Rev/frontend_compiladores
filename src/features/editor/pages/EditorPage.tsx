import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { toast } from 'sonner';
import { useAuth } from '../../auth/context/AuthContext';
import { logoutUser } from '../../auth/services/authServices';
import { compilarCodigo, type LenguajeDestino, type ErrorDto, type TokenDto, type InstruccionDto } from '../services/compilerService';

// ── Íconos ──────────────────────────────────────────────────
const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const IconCode = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconCpu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
);
const IconPlay = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconZap = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconList = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const CODIGO_EJEMPLO = `PROGRAM mi_ruta
BEGIN
  avanzar_mts(3);
  girar(1);
  circulo(50);
END.
`;

type OutputTab  = 'consola' | 'tokens' | 'instrucciones' | 'codigo';
type OutputLine = { type: 'info' | 'success' | 'error' | 'warn'; text: string };

export function EditorPage() {
  const { logout, user } = useAuth();
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
  const navigate = useNavigate();

  const initials = user?.usuario?.charAt(0).toUpperCase() ?? '?';

  const handleLogout = async () => {
    try { await logoutUser(); } finally {
      logout(); toast.success('Sesión cerrada.'); navigate('/login');
    }
  };

  const addLine = (type: OutputLine['type'], text: string) =>
    setConsolaLines(prev => [...prev, { type, text }]);

  const handleCompile = async () => {
    if (!code.trim()) { toast.error('El editor está vacío.'); return; }
    setIsCompiling(true);
    setConsolaLines([]); setTokens([]); setInstrucciones([]); setCodigoTranspilado('');
    setActiveTab('consola');
    addLine('info', '🔍 Conectando con el compilador UMG++...');

    try {
      const result = await compilarCodigo(code, selectedLang);
      setLastTiempoMs(result.tiempo_ms);

      if (result.exitoso) {
        addLine('success', `✅ Compilación exitosa en ${result.tiempo_ms}ms (ID: ${result.compilacion_id})`);
        addLine('info',    `📦 ${result.tokens.length} tokens reconocidos`);
        addLine('info',    `🎯 ${result.instrucciones.length} instrucciones validadas`);
        addLine('success', `🐍 Código ${selectedLang.toUpperCase()} generado correctamente`);
        setTokens(result.tokens);
        setInstrucciones(result.instrucciones);
        setCodigoTranspilado(result.codigo_transpilado);
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
      const msg    = axiosErr.response?.data?.error ?? 'Error al conectar con el compilador.';
      if (status === 401) {
        addLine('error', '❌ Sesión expirada. Por favor vuelve a iniciar sesión.');
        toast.error('Sesión expirada.');
        logout(); navigate('/login');
      } else {
        addLine('error', `❌ ${msg}`);
        toast.error(msg);
      }
    } finally {
      setIsCompiling(false);
    }
  };

  const handleClear = () => {
    setCode(''); setConsolaLines([]); setTokens([]); setInstrucciones([]); setCodigoTranspilado('');
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'programa_rover.umgpp'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Archivo descargado.');
  };

  const handleDownloadTranspilado = () => {
    if (!codigoTranspilado) return;
    const ext  = selectedLang === 'python' ? 'py' : 'cs';
    const blob = new Blob([codigoTranspilado], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `programa_rover.${ext}`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Código ${selectedLang.toUpperCase()} descargado.`);
  };

  const outputColor = (type: OutputLine['type']) => {
    if (type === 'success') return 'var(--accent3)';
    if (type === 'error')   return 'var(--danger)';
    if (type === 'warn')    return 'var(--warning)';
    return 'var(--text-secondary)';
  };

  const tabs: { id: OutputTab; label: string; count?: number }[] = [
    { id: 'consola',       label: 'Consola',      count: consolaLines.length },
    { id: 'tokens',        label: 'Tokens',        count: tokens.length },
    { id: 'instrucciones', label: 'Instrucciones', count: instrucciones.length },
    { id: 'codigo',        label: selectedLang === 'python' ? 'Python' : 'C#' },
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
          {[
            { to: '/dashboard', icon: <IconGrid />, label: 'Dashboard' },
            { to: '/editor',    icon: <IconCode />, label: 'Editor' },
            { to: '/profile',   icon: <IconUser />, label: 'Perfil' },
          ].map(({ to, icon, label }) => (
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
            {sidebarOpen && (
              <div style={styles.sidebarUserInfo}>
                <span style={styles.sidebarUserName}>{user?.usuario}</span>
                <span style={styles.sidebarUserRole}>{user?.rol}</span>
              </div>
            )}
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}><IconLogout /></button>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.collapseBtn}>
          {sidebarOpen ? '‹' : '›'}
        </button>
      </aside>

      {/* MAIN */}
      <main style={styles.main}>
        <header style={styles.topbar}>
          <div>
            <p style={styles.topbarSub}>Compilador UMG++ — Motor v2.0</p>
            <h1 style={styles.topbarTitle}>Editor de Código</h1>
          </div>
          <div style={styles.topbarRight}>
            <select value={selectedLang} onChange={e => setSelectedLang(e.target.value as LenguajeDestino)} style={styles.langSelect}>
              <option value="python">Python</option>
              <option value="csharp">C#</option>
            </select>
            <button onClick={handleDownload} style={styles.btnSecondary}><IconDownload /> Descargar</button>
            {codigoTranspilado && (
              <button onClick={handleDownloadTranspilado} style={styles.btnSecondary}>
                <IconDownload /> .{selectedLang === 'python' ? 'py' : 'cs'}
              </button>
            )}
            <button onClick={handleClear} style={styles.btnDanger}><IconTrash /> Limpiar</button>
            <button onClick={handleCompile} disabled={isCompiling} style={{ ...styles.btnPrimary, opacity: isCompiling ? 0.7 : 1, cursor: isCompiling ? 'not-allowed' : 'pointer' }}>
              <IconPlay />{isCompiling ? 'Compilando...' : 'Compilar'}
            </button>
          </div>
        </header>

        {/* STATS */}
        <div style={styles.statsRow}>
          {[
            { label: 'Compilaciones',    value: compilaciones,                           color: 'var(--accent)' },
            { label: 'Lenguaje destino', value: selectedLang.toUpperCase(),               color: 'var(--accent2)' },
            { label: 'Estado',           value: isCompiling ? 'Compilando...' : 'Listo', color: 'var(--accent3)' },
            { label: 'Líneas',           value: code.split('\n').length,                 color: 'var(--warning)' },
            { label: 'Tiempo',           value: lastTiempoMs !== null ? `${lastTiempoMs}ms` : '—', color: 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} style={styles.statChip}>
              <span style={styles.statChipLabel}>{s.label}</span>
              <span style={{ ...styles.statChipValue, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* EDITOR + OUTPUT */}
        <div style={styles.editorLayout}>
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
              <Editor
                height="100%"
                defaultLanguage="plaintext"
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val ?? '')}
                options={{ fontSize: 14, fontFamily: 'JetBrains Mono, Fira Code, monospace', minimap: { enabled: false }, lineNumbers: 'on', scrollBeyondLastLine: false, padding: { top: 16, bottom: 16 }, renderLineHighlight: 'line', cursorBlinking: 'smooth', smoothScrolling: true, wordWrap: 'on' }}
              />
            </div>
          </div>

          {/* Output con tabs */}
          <div style={styles.outputPanel}>
            <div style={styles.tabsBar}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}>
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span style={{ ...styles.tabBadge, background: activeTab === tab.id ? 'var(--accent)' : 'var(--bg-elevated)', color: activeTab === tab.id ? '#000' : 'var(--text-muted)' }}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            <div style={styles.outputContent}>
              {activeTab === 'consola' && (
                consolaLines.length === 0
                  ? <div style={styles.outputEmpty}><IconZap /><p>Presiona <strong style={{ color: 'var(--accent)' }}>Compilar</strong> para ver los resultados</p></div>
                  : consolaLines.map((line, i) => (
                      <div key={i} style={{ ...styles.outputLine, color: outputColor(line.type) }}>
                        <span style={styles.outputLineNum}>{String(i + 1).padStart(2, '0')}</span>
                        <span>{line.text}</span>
                      </div>
                    ))
              )}

              {activeTab === 'tokens' && (
                tokens.length === 0
                  ? <div style={styles.outputEmpty}><IconList /><p>Sin tokens — compila primero</p></div>
                  : <table style={styles.table}>
                      <thead><tr>{['Línea','Col','Tipo','Lexema'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {tokens.map((t, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                            <td style={styles.td}>{t.linea}</td>
                            <td style={styles.td}>{t.columna}</td>
                            <td style={{ ...styles.td, color: 'var(--accent2)', fontFamily: 'var(--font-mono)' }}>{t.tipo}</td>
                            <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{t.lexema}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              )}

              {activeTab === 'instrucciones' && (
                instrucciones.length === 0
                  ? <div style={styles.outputEmpty}><IconList /><p>Sin instrucciones — compila primero</p></div>
                  : <table style={styles.table}>
                      <thead><tr>{['#','Instrucción','Raw','N','R','L'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {instrucciones.map((inst, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                            <td style={styles.td}>{inst.orden}</td>
                            <td style={{ ...styles.td, color: 'var(--accent2)', fontFamily: 'var(--font-mono)' }}>{inst.nombre}</td>
                            <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{inst.raw}</td>
                            <td style={styles.td}>{inst.parametro_n ?? '—'}</td>
                            <td style={styles.td}>{inst.parametro_r ?? '—'}</td>
                            <td style={styles.td}>{inst.parametro_l ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              )}

              {activeTab === 'codigo' && (
                !codigoTranspilado
                  ? <div style={styles.outputEmpty}><IconCode /><p>Sin código generado — compila primero</p></div>
                  : <pre style={styles.codeBlock}>{codigoTranspilado}</pre>
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
  topbarRight: { display: 'flex', alignItems: 'center', gap: '0.65rem' },
  langSelect: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.825rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', padding: '0.55rem 1.1rem', fontWeight: '700', fontSize: '0.85rem' },
  btnSecondary: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '0.55rem 0.9rem', fontSize: '0.825rem', cursor: 'pointer' },
  btnDanger: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--danger)', borderRadius: '8px', padding: '0.55rem 0.9rem', fontSize: '0.825rem', cursor: 'pointer' },
  statsRow: { display: 'flex', gap: '0.75rem', flexShrink: 0 },
  statChip: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  statChipLabel: { color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statChipValue: { fontSize: '0.9rem', fontWeight: '700', fontFamily: 'var(--font-mono)' },
  editorLayout: { display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1rem', flex: 1, minHeight: 0 },
  editorPanel: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  outputPanel: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
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
};
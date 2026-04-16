import { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../auth/context/AuthContext';
import { getMe, logoutUser, resendCredential } from '../../auth/services/authServices';
import type { UserDto } from '../../auth/types/auth.types';

const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const IconCode = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconZap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconCpu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

const IconActivity = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export function DashboardPage() {
  const { logout, user: cachedUser } = useAuth();
  const [user, setUser] = useState<UserDto | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!cachedUser);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [resendingCredential, setResendingCredential] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getMe()
      .then((data) => setUser(data as UserDto))
      .catch(() => {
        logout();
        navigate('/login');
      })
      .finally(() => setIsLoading(false));
  }, [logout, navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      logout();
      toast.success('Sesión cerrada correctamente.');
      navigate('/login');
    }
  };

  const handleResendCredential = async () => {
    setResendingCredential(true);

    try {
      const result = await resendCredential();

      if (result.email_enviado || result.whatsapp_enviado) {
        toast.success('✅ Credencial reenviada correctamente a tu correo y WhatsApp.');
      } else {
        toast.warning('⚠️ Credencial generada pero hubo un problema al enviarla.');
      }
    } catch {
      toast.error('❌ Error al reenviar la credencial. Intenta de nuevo.');
    } finally {
      setResendingCredential(false);
    }
  };

  const initials = user?.usuario?.charAt(0).toUpperCase() ?? '?';
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  if (isLoading) {
    return (
      <div style={styles.loadingScreen}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />

      <aside style={{ ...styles.sidebar, width: sidebarOpen ? '240px' : '68px' }}>
        <div style={styles.sidebarLogo}>
          <div style={styles.logoIcon}>
            <IconCpu />
          </div>
          {sidebarOpen && <span style={styles.logoText}>UMG ++</span>}
        </div>

        <div style={styles.sidebarDivider} />

        <nav style={styles.nav}>
          {[
            { to: '/dashboard', icon: <IconGrid />, label: 'Dashboard' },
            { to: '/editor', icon: <IconCode />, label: 'Editor' },
            { to: '/profile', icon: <IconUser />, label: 'Perfil' },
          ].map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
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

          <button onClick={handleLogout} style={styles.logoutBtn} title="Cerrar sesión">
            <IconLogout />
          </button>
        </div>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.collapseBtn}>
          {sidebarOpen ? '‹' : '›'}
        </button>
      </aside>

      <main style={styles.main}>
        <header style={styles.topbar}>
          <div>
            <p style={styles.topbarGreeting}>{saludo},</p>
            <h1 style={styles.topbarName}>{user?.nombre_completo}</h1>
          </div>

          <div style={styles.topbarBadge}>
            <span style={styles.statusDot} />
            Sistema operativo
          </div>
        </header>

        <section style={styles.statsGrid}>
          {[
            {
              icon: <IconZap />,
              label: 'Compilaciones',
              value: '0',
              sub: 'Esta sesión',
              color: 'var(--accent)',
            },
            {
              icon: <IconActivity />,
              label: 'Estado del rover',
              value: 'En espera',
              sub: 'Sin instrucciones',
              color: 'var(--accent3)',
            },
            {
              icon: <IconShield />,
              label: 'Rol',
              value: user?.rol ?? '—',
              sub: 'Acceso actual',
              color: 'var(--accent2)',
            },
            {
              icon: <IconCpu />,
              label: 'Motor',
              value: 'UMG++ v2',
              sub: 'Compilador activo',
              color: 'var(--warning)',
            },
          ].map((card) => (
            <div key={card.label} style={{ ...styles.statCard, borderColor: `${card.color}44` }}>
              <div style={{ ...styles.statIcon, color: card.color }}>{card.icon}</div>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>{card.label}</span>
                <span style={{ ...styles.statValue, color: card.color }}>{card.value}</span>
                <span style={styles.statSub}>{card.sub}</span>
              </div>
            </div>
          ))}
        </section>

        <section style={styles.bottomGrid}>
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Acciones rápidas</h2>

            <div style={styles.actionsList}>
              {[
                {
                  icon: <IconCode />,
                  title: 'Abrir editor',
                  desc: 'Escribe y compila código UMG++',
                  color: 'var(--accent)',
                  to: '/editor',
                },
                {
                  icon: <IconUser />,
                  title: 'Ver perfil',
                  desc: 'Gestiona tu cuenta y preferencias',
                  color: 'var(--accent2)',
                  to: '/profile',
                },
                {
                  icon: <IconZap />,
                  title: 'Nueva compilación',
                  desc: 'Inicia un nuevo programa rover',
                  color: 'var(--accent3)',
                  to: '/editor',
                },
              ].map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.to)}
                  style={styles.actionItem}
                >
                  <div style={{ ...styles.actionIcon, color: action.color }}>{action.icon}</div>
                  <div style={styles.actionText}>
                    <span style={styles.actionTitle}>{action.title}</span>
                    <span style={styles.actionDesc}>{action.desc}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>›</span>
                </button>
              ))}

              <button
                onClick={handleResendCredential}
                disabled={resendingCredential}
                style={{
                  ...styles.actionItem,
                  opacity: resendingCredential ? 0.6 : 1,
                  cursor: resendingCredential ? 'not-allowed' : 'pointer',
                  border: '1px solid rgba(109,40,217,0.3)',
                  background: 'rgba(109,40,217,0.08)',
                }}
              >
                <div style={{ ...styles.actionIcon, color: '#6D28D9' }}>
                  <IconShield />
                </div>
                <div style={styles.actionText}>
                  <span style={styles.actionTitle}>
                    {resendingCredential ? 'Enviando...' : 'Reenviar credencial'}
                  </span>
                  <span style={styles.actionDesc}>Recibe tu PDF firmado electrónicamente</span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>›</span>
              </button>
            </div>
          </div>

          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Estado del sistema</h2>

            <div style={styles.systemList}>
              {[
                { label: 'Backend API', value: 'Conectado', ok: true },
                { label: 'Base de datos', value: 'Local (SQL Server)', ok: true },
                { label: 'Compilador UMG++', value: 'Listo', ok: true },
                { label: 'Autenticación JWT', value: 'Activa', ok: true },
                { label: 'reCAPTCHA', value: 'Modo prueba', ok: false },
              ].map((item) => (
                <div key={item.label} style={styles.systemRow}>
                  <span style={styles.systemLabel}>{item.label}</span>
                  <span
                    style={{
                      ...styles.systemBadge,
                      background: item.ok
                        ? 'rgba(52,211,153,0.12)'
                        : 'rgba(251,191,36,0.12)',
                      color: item.ok ? 'var(--accent3)' : 'var(--warning)',
                      border: `1px solid ${
                        item.ok ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'
                      }`,
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div style={styles.userInfoBox}>
              <div style={styles.avatarLarge}>{initials}</div>
              <div>
                <p style={styles.userInfoName}>{user?.nombre_completo}</p>
                <p style={styles.userInfoEmail}>{user?.email}</p>
                <p style={styles.userInfoDate}>
                  Miembro desde {new Date(user?.fecha_creacion ?? '').toLocaleDateString('es-GT')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg-deep)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'var(--font-ui)',
  },
  bgOrb1: {
    position: 'fixed',
    top: '-20%',
    left: '-10%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  bgOrb2: {
    position: 'fixed',
    bottom: '-20%',
    right: '-10%',
    width: '700px',
    height: '700px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--bg-deep)',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-card)',
    borderRight: '1px solid var(--border)',
    padding: '1.25rem 0.75rem',
    position: 'relative',
    zIndex: 10,
    transition: 'width 0.25s ease',
    flexShrink: 0,
    overflow: 'hidden',
  },
  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0 0.5rem 0.5rem',
    whiteSpace: 'nowrap',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: 'var(--font-brand)',
    color: 'var(--accent)',
    fontSize: '1.1rem',
    fontWeight: '700',
    letterSpacing: '2px',
  },
  sidebarDivider: {
    height: '1px',
    background: 'var(--border)',
    margin: '0.75rem 0',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.65rem 0.75rem',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    border: '1px solid transparent',
  },
  navLinkActive: {
    background: 'rgba(56,189,248,0.1)',
    color: 'var(--accent)',
    borderColor: 'rgba(56,189,248,0.2)',
  },
  navIcon: {
    flexShrink: 0,
  },
  navLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  sidebarFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 0.5rem',
    marginTop: '0.5rem',
    borderTop: '1px solid var(--border)',
  },
  sidebarUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    flex: 1,
    overflow: 'hidden',
  },
  avatarSmall: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: '0.875rem',
    flexShrink: 0,
  },
  sidebarUserInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarUserName: {
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sidebarUserRole: {
    color: 'var(--text-muted)',
    fontSize: '0.7rem',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0.4rem',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  collapseBtn: {
    position: 'absolute',
    top: '50%',
    right: '-12px',
    transform: 'translateY(-50%)',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    zIndex: 20,
  },
  main: {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
    position: 'relative',
    zIndex: 1,
  },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '2rem',
  },
  topbarGreeting: {
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
    margin: 0,
  },
  topbarName: {
    color: 'var(--text-primary)',
    fontSize: '1.75rem',
    fontWeight: '700',
    margin: '0.25rem 0 0',
    fontFamily: 'var(--font-brand)',
    letterSpacing: '1px',
  },
  topbarBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(52,211,153,0.1)',
    border: '1px solid rgba(52,211,153,0.25)',
    color: 'var(--accent3)',
    borderRadius: '20px',
    padding: '0.4rem 1rem',
    fontSize: '0.8rem',
    fontWeight: '500',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--accent3)',
    boxShadow: '0 0 8px var(--accent3)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'var(--bg-card)',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid',
  },
  statIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    background: 'var(--bg-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  },
  statLabel: {
    color: 'var(--text-muted)',
    fontSize: '0.72rem',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '1.25rem',
    fontWeight: '700',
    fontFamily: 'var(--font-mono)',
  },
  statSub: {
    color: 'var(--text-muted)',
    fontSize: '0.72rem',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  panel: {
    background: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    padding: '1.5rem',
  },
  panelTitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '1.25rem',
    marginTop: 0,
  },
  actionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '0.9rem 1rem',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  actionIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'var(--bg-panel)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  actionTitle: {
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  actionDesc: {
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    marginTop: '0.1rem',
  },
  systemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
    marginBottom: '1.25rem',
  },
  systemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  systemLabel: {
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
  },
  systemBadge: {
    borderRadius: '20px',
    padding: '0.2rem 0.75rem',
    fontSize: '0.72rem',
    fontWeight: '500',
  },
  userInfoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'var(--bg-elevated)',
    borderRadius: '10px',
    padding: '1rem',
    border: '1px solid var(--border)',
    marginTop: '1rem',
  },
  avatarLarge: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: '1.25rem',
    flexShrink: 0,
  },
  userInfoName: {
    color: 'var(--text-primary)',
    fontWeight: '600',
    margin: 0,
    fontSize: '0.9rem',
  },
  userInfoEmail: {
    color: 'var(--text-secondary)',
    margin: '0.15rem 0 0',
    fontSize: '0.8rem',
  },
  userInfoDate: {
    color: 'var(--text-muted)',
    margin: '0.15rem 0 0',
    fontSize: '0.75rem',
  },
};
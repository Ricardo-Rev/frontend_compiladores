import { useEffect, useState, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../auth/context/AuthContext';
import { getMe, logoutUser } from '../../auth/services/authServices';
import type { UserDto } from '../../auth/types/auth.types';

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
const IconCamera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
// ✅ FIX: IconPhone e IconCalendar eliminados — no se usan en el JSX
const IconShield = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export function ProfilePage() {
  const { logout, user: cachedUser } = useAuth();
  const [user, setUser] = useState<UserDto | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!cachedUser);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMe()
      .then((data) => setUser(data as UserDto))
      .catch(() => { logout(); navigate('/login'); })
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try { await logoutUser(); } finally {
      logout();
      toast.success('Sesión cerrada correctamente.');
      navigate('/login');
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no debe superar 2MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
      toast.success('Avatar actualizado (vista previa)');
    };
    reader.readAsDataURL(file);
  };

  const initials = user?.usuario?.charAt(0).toUpperCase() ?? '?';
  const avatarSrc = avatarPreview ?? user?.avatar_url ?? null;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}>
        Cargando perfil...
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />

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
            <NavLink key={to} to={to} style={({ isActive }) => ({
              ...styles.navLink, ...(isActive ? styles.navLinkActive : {}),
            })}>
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
            <p style={styles.topbarSub}>Gestiona tu información personal</p>
            <h1 style={styles.topbarTitle}>Mi Perfil</h1>
          </div>
        </header>

        <div style={styles.profileGrid}>
          <div style={styles.avatarCard}>
            <div style={styles.avatarWrapper}>
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" style={styles.avatarImg} />
              ) : (
                <div style={styles.avatarFallback}>{initials}</div>
              )}
              <button onClick={handleAvatarClick} style={styles.avatarEditBtn} title="Cambiar foto">
                <IconCamera />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
            <h2 style={styles.avatarName}>{user?.nombre_completo}</h2>
            <p style={styles.avatarUsername}>@{user?.usuario}</p>
            <div style={styles.roleBadge}><IconShield />{user?.rol}</div>
            <div style={styles.avatarDivider} />
            <p style={styles.avatarJoined}>
              Miembro desde<br />
              <strong style={{ color: 'var(--text-primary)' }}>
                {new Date(user?.fecha_creacion ?? '').toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
              </strong>
            </p>
            <button onClick={handleLogout} style={styles.logoutFullBtn}><IconLogout />Cerrar sesión</button>
          </div>

          <div style={styles.infoPanel}>
            <h3 style={styles.infoPanelTitle}>Información de la cuenta</h3>
            <div style={styles.infoGrid}>
              {[
                { icon: <IconUser />,   label: 'Nombre completo',    value: user?.nombre_completo ?? '—' },
                { icon: <IconUser />,   label: 'Usuario',            value: `@${user?.usuario}` },
                { icon: <IconMail />,   label: 'Correo electrónico', value: user?.email ?? '—' },
                { icon: <IconShield />, label: 'Rol',                value: user?.rol ?? '—' },
              ].map((field) => (
                <div key={field.label} style={styles.infoField}>
                  <div style={styles.infoFieldIcon}>{field.icon}</div>
                  <div style={styles.infoFieldContent}>
                    <span style={styles.infoFieldLabel}>{field.label}</span>
                    <span style={styles.infoFieldValue}>{field.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ ...styles.infoPanelTitle, marginTop: '2rem' }}>Estado de verificación</h3>
            <div style={styles.verifyGrid}>
              {[
                { label: 'Correo electrónico', verified: false },
                { label: 'Teléfono',           verified: false },
              ].map((item) => (
                <div key={item.label} style={styles.verifyRow}>
                  <span style={styles.verifyLabel}>{item.label}</span>
                  <span style={{ ...styles.verifyBadge, background: item.verified ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: item.verified ? 'var(--accent3)' : 'var(--danger)', border: `1px solid ${item.verified ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
                    {item.verified ? '✓ Verificado' : '✗ Sin verificar'}
                  </span>
                </div>
              ))}
            </div>

            <h3 style={{ ...styles.infoPanelTitle, marginTop: '2rem' }}>Preferencias del editor</h3>
            <div style={styles.prefsGrid}>
              {[
                { label: 'Tema',                 value: 'Dark' },
                { label: 'Fuente',               value: 'Fira Code' },
                { label: 'Tamaño',               value: '14px' },
                { label: 'Lenguaje por defecto', value: 'Python' },
              ].map((pref) => (
                <div key={pref.label} style={styles.prefItem}>
                  <span style={styles.prefLabel}>{pref.label}</span>
                  <span style={styles.prefValue}>{pref.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-ui)' },
  bgOrb1: { position: 'fixed', top: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  bgOrb2: { position: 'fixed', bottom: '-20%', right: '-10%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
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
  main: { flex: 1, padding: '2rem', overflowY: 'auto', position: 'relative', zIndex: 1 },
  topbar: { marginBottom: '2rem' },
  topbarSub: { color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 },
  topbarTitle: { color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: '700', margin: '0.25rem 0 0', fontFamily: 'var(--font-brand)', letterSpacing: '1px' },
  profileGrid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' },
  avatarCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'sticky', top: '2rem' },
  avatarWrapper: { position: 'relative', marginBottom: '1.25rem' },
  avatarImg: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' },
  avatarFallback: { width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '2.5rem', border: '3px solid rgba(56,189,248,0.3)' },
  avatarEditBtn: { position: 'absolute', bottom: '2px', right: '2px', width: '30px', height: '30px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarName: { color: 'var(--text-primary)', fontWeight: '700', fontSize: '1.1rem', margin: 0 },
  avatarUsername: { color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.3rem 0 0.75rem' },
  roleBadge: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', color: 'var(--accent)', borderRadius: '20px', padding: '0.3rem 1rem', fontSize: '0.8rem', fontWeight: '600', textTransform: 'capitalize' },
  avatarDivider: { width: '100%', height: '1px', background: 'var(--border)', margin: '1.25rem 0' },
  avatarJoined: { color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.6', margin: '0 0 1.25rem' },
  logoutFullBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--danger)', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' },
  infoPanel: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem' },
  infoPanelTitle: { color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1.25rem' },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  infoField: { display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '0.9rem 1rem', border: '1px solid var(--border)' },
  infoFieldIcon: { color: 'var(--accent)', flexShrink: 0 },
  infoFieldContent: { display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  infoFieldLabel: { color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoFieldValue: { color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '500' },
  verifyGrid: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  verifyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' },
  verifyLabel: { color: 'var(--text-secondary)', fontSize: '0.85rem' },
  verifyBadge: { borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.75rem', fontWeight: '600' },
  prefsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' },
  prefItem: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  prefLabel: { color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  prefValue: { color: 'var(--accent)', fontSize: '0.875rem', fontWeight: '600', fontFamily: 'var(--font-mono)' },
};
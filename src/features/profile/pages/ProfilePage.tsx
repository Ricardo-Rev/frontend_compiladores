import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { getMe, logoutUser } from '../../auth/services/authServices';
import type { UserDto } from '../../auth/types/auth.types';

export function ProfilePage() {
  const { logout, user: cachedUser } = useAuth();
  const [user, setUser] = useState<UserDto | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMe()
      .then((data) => setUser(data))
      .catch(() => {
        logout();
        navigate('/login');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      logout();
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="auth-shell">
        <p style={{ color: 'white', textAlign: 'center' }}>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-shell__background" />
      <div className="auth-shell__content">
        <div className="ui-panel">
          <div className="auth-card">
            <div className="auth-card__brand">UMG ++</div>
            <h1 className="auth-card__title">Mi Perfil</h1>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  style={{ width: 80, height: 80, borderRadius: '50%' }}
                />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'var(--accent)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', margin: '0 auto',
                }}>
                  {user?.usuario?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Usuario: </span>
                <span style={{ color: 'var(--text-primary)' }}>{user?.usuario}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Nombre: </span>
                <span style={{ color: 'var(--text-primary)' }}>{user?.nombre_completo}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Correo: </span>
                <span style={{ color: 'var(--text-primary)' }}>{user?.email}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rol: </span>
                <span style={{ color: 'var(--accent)' }}>{user?.rol}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '0.75rem',
                background: 'var(--danger)', color: 'white',
                border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontWeight: '600',
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
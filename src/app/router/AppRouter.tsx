import { Navigate, Route, Routes } from 'react-router-dom';
import { FaceLoginPage } from '../../features/auth/pages/FaceLoginPage';
import { LoginPage } from '../../features/auth/pages/Loginpage';
import { QrLoginPage } from '../../features/auth/pages/QrLoginPage';
import { RegisterPage } from '../../features/auth/pages/Registerpage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { EditorPage } from '../../features/editor/pages/EditorPage';
import { AdminPage } from '../../features/admin/pages/AdminPage';
import { useAuth } from '../../features/auth/context/AuthContext';
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage';
import { VerifyCredentialPage } from '../../features/credential/pages/VerifyCredentialPage';

// Ruta protegida para cualquier usuario autenticado
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-secondary)',
      fontFamily: 'var(--font-ui)'
    }}>
      Cargando...
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Ruta exclusiva para administradores
// Si el usuario está autenticado pero NO es admin, lo manda al dashboard
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-secondary)',
      fontFamily: 'var(--font-ui)'
    }}>
      Cargando...
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.rol !== 'administrador') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login/qr" element={<QrLoginPage />} />
      <Route path="/login/face" element={<FaceLoginPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/editor"    element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
      <Route path="/verify-credential" element={<VerifyCredentialPage />} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
    </Routes>
  );
}
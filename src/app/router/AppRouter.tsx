import { Navigate, Route, Routes } from 'react-router-dom';
import { FaceLoginPage } from '../../features/auth/pages/FaceLoginPage';
import { LoginPage } from '../../features/auth/pages/Loginpage';
import { QrLoginPage } from '../../features/auth/pages/QrLoginPage';
import { RegisterPage } from '../../features/auth/pages/Registerpage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage';
import { useAuth } from '../../features/auth/context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login/qr" element={<QrLoginPage />} />
      <Route path="/login/face" element={<FaceLoginPage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
import { Navigate, Route, Routes } from 'react-router-dom';
import { FaceLoginPage } from '../../features/auth/pages/FaceLoginPage';
import { LoginPage } from '../../features/auth/pages/Loginpage';
import { QrLoginPage } from '../../features/auth/pages/QrLoginPage';
import { RegisterPage } from '../../features/auth/pages/Registerpage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login/qr" element={<QrLoginPage />} />
      <Route path="/login/face" element={<FaceLoginPage />} />
    </Routes>
  );
}
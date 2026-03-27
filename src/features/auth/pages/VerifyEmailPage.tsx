import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../services/authServices';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [estado, setEstado] = useState<'esperando' | 'cargando' | 'ok' | 'error'>('esperando');
  const [mensaje, setMensaje] = useState('');

  const handleVerificar = async () => {
    const token = searchParams.get('token');
    if (!token) { setEstado('error'); setMensaje('Token no encontrado.'); return; }

    setEstado('cargando');
    verifyEmail(token)
      .then((res) => { setEstado('ok'); setMensaje(res.mensaje); })
      .catch(() => { setEstado('error'); setMensaje('El link no es válido o ya expiró.'); });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0D1B2A', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#111827', borderRadius: '12px', padding: '40px', maxWidth: '420px', width: '100%', textAlign: 'center', border: '1px solid #1E3A5F' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          {estado === 'esperando' ? '✉️' : estado === 'cargando' ? '⏳' : estado === 'ok' ? '✅' : '❌'}
        </div>
        <h2 style={{ color: estado === 'ok' ? '#06B6D4' : estado === 'error' ? '#f87171' : '#9CA3AF', marginBottom: '12px' }}>
          {estado === 'esperando' ? 'Confirma tu correo' :
           estado === 'cargando' ? 'Verificando...' :
           estado === 'ok' ? '¡Correo verificado!' : 'Error de verificación'}
        </h2>
        <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '24px' }}>
          {estado === 'esperando' ? 'Haz click en el botón para confirmar tu dirección de correo electrónico.' : mensaje}
        </p>
        {estado === 'esperando' && (
          <button
            onClick={handleVerificar}
            style={{ background: '#06B6D4', color: '#111827', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', width: '100%' }}
          >
            Confirmar mi correo
          </button>
        )}
        {estado === 'cargando' && (
          <p style={{ color: '#6B7280', fontSize: '13px' }}>Por favor espera...</p>
        )}
        {(estado === 'ok' || estado === 'error') && (
          <Link to="/login" style={{ background: '#06B6D4', color: '#111827', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', display: 'inline-block', marginTop: '8px' }}>
            Ir al login
          </Link>
        )}
      </div>
    </div>
  );
}
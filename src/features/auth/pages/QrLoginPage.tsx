import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '../../../shared/components/ui/Button';
import { AuthCard } from '../components/AuthCard';
import { AuthLayout } from '../components/AuthLayout';
import { useLoginForm } from '../hooks/useAuthForm';

export function QrLoginPage() {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { handleLoginQr, isLoading, error } = useLoginForm();

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // QR detectado — detener cámara y hacer login
          await scanner.stop();
          setScanning(false);
          setScanned(true);
          await handleLoginQr(decodedText);
        },
        () => {} // error silencioso mientras escanea
      );
    } catch {
      alert('No se pudo acceder a la cámara');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch { /* ya estaba detenido */ }
    }
    setScanning(false);
  };

  // Limpiar cámara si el usuario navega fuera
  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <AuthLayout>
      <AuthCard
        title="Acceso con QR"
        subtitle="Apunta la cámara al código QR de tu credencial."
      >
        {/* Contenedor del scanner — html5-qrcode lo necesita en el DOM */}
        <div
          id="qr-reader"
          style={{
            width: '100%',
            display: scanning ? 'block' : 'none',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        />

        {!scanning && !scanned && (
          <div className="auth-placeholder-box">
            Presiona "Escanear QR" para activar la cámara
          </div>
        )}

        {scanned && !isLoading && !error && (
          <div className="auth-placeholder-box">
            ✅ QR detectado — verificando...
          </div>
        )}

        {!scanning ? (
          <Button fullWidth onClick={startScanner} disabled={isLoading}>
            {isLoading ? 'Verificando...' : 'Escanear QR'}
          </Button>
        ) : (
          <Button fullWidth variant="secondary" onClick={stopScanner}>
            Cancelar
          </Button>
        )}

        {error && <p className="auth-form__message">{error}</p>}

        <Link to="/login">
          <Button type="button" variant="secondary" fullWidth>
            Volver al login
          </Button>
        </Link>
      </AuthCard>
    </AuthLayout>
  );
}
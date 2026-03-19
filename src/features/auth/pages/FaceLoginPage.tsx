import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { AuthCard } from '../components/AuthCard';
import { AuthLayout } from '../components/AuthLayout';
import { useLoginForm } from '../hooks/useAuthForm';

export function FaceLoginPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);

  const { handleLoginFacial, isLoading, error } = useLoginForm();

  // 🔹 Abrir cámara
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });

      streamRef.current = stream;
      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      alert('No se pudo acceder a la cámara');
    }
  };

  // 🔹 Capturar y enviar
  const captureAndLogin = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    await handleLoginFacial(dataUrl);
  };

  // 🔹 Detener cámara
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Reconocimiento facial"
        subtitle="Activa la cámara y valida tu identidad."
      >
        {/* 🎥 VIDEO */}
        {!cameraActive && (
          <div className="auth-placeholder-box">
            Presiona "Activar cámara"
          </div>
        )}

        {cameraActive && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxWidth: '300px',
                borderRadius: '8px',
                border: '2px solid #38bdf8',
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}

        {/* 🔘 BOTONES */}
        {!cameraActive ? (
          <Button fullWidth onClick={startCamera}>
            Activar cámara
          </Button>
        ) : (
          <>
            <Button fullWidth onClick={captureAndLogin} disabled={isLoading}>
              {isLoading ? 'Verificando...' : 'Iniciar con rostro'}
            </Button>

            <Button type="button" variant="secondary" fullWidth onClick={stopCamera}>
              Cancelar
            </Button>
          </>
        )}

        {/* ❌ ERROR */}
        {error && (
          <p className="auth-form__message">{error}</p>
        )}

        <Link to="/login">
          <Button type="button" variant="secondary" fullWidth>
            Volver al login
          </Button>
        </Link>
      </AuthCard>
    </AuthLayout>
  );
}
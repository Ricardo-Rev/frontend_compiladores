import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { RecaptchaPlaceholder } from './RecaptchaPlaceholder';
import { useRegisterForm } from '../hooks/useAuthForm';
import { segmentFace } from '../services/authServices';

type FotoMode = 'none' | 'camera' | 'preview';
type Step = 1 | 2 | 3;

export function RegisterForm() {
  const [step, setStep] = useState<Step>(1);

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [localError, setLocalError] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [fotoMode, setFotoMode] = useState<FotoMode>('none');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { handleRegister, isLoading, error } = useRegisterForm();

  const abrirCamara = async () => {
    try {
      console.log("📷 Abriendo cámara...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });

      streamRef.current = stream;
      setFotoMode('camera');

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 300);

    } catch (err) {
      console.error("❌ Error cámara:", err);
      setCameraError('No se pudo acceder a la cámara');
    }
  };

  const cerrarCamara = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const capturarFoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      console.log("❌ No hay video o canvas");
      return;
    }

    console.log("📸 Capturando...");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    const fullData = canvas.toDataURL('image/jpeg', 0.9);
    const base64 = fullData.split(',')[1]; // 🔥 FIX CLAVE

    console.log("📦 Base64 generado");

    try {
      console.log("🚀 Enviando al backend...");

      const segmented = await segmentFace({ image_base64: base64 });

      console.log("✅ RESPUESTA BACKEND:", segmented);

      setAvatarBase64(`data:image/png;base64,${segmented.resultado}`);
      setCameraError(null);

    } catch (err: unknown) {
      console.error("❌ ERROR BACKEND:", err);

      setAvatarBase64(fullData);
      setCameraError("Error backend o no detecta rostro");
    }

    setFotoMode('preview');
    cerrarCamara();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log("📝 Enviando registro...");

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    if (!recaptchaToken) {
      setLocalError('Completa el reCAPTCHA');
      return;
    }

    try {
      const payload = {
        usuario,
        email,
        nombre_completo: nombreCompleto,
        password,
        telefono,
        recaptcha_token: recaptchaToken,
        avatar_base64: avatarBase64 ?? undefined,
      };

      console.log("📤 DATA:", payload);

      await handleRegister(payload);

      console.log("✅ Registro enviado correctamente");

    } catch (err) {
      console.error("❌ Error registro:", err);
    }
  }

  return (
    <div style={s.container}>
      <form style={s.form} onSubmit={handleSubmit}>

        <h2 style={s.title}>Crear cuenta</h2>

        <div style={s.steps}>
          {[1,2,3].map(n => (
            <span key={n} style={step === n ? s.activeStep : s.step}>{n}</span>
          ))}
        </div>

        {step === 1 && (
          <div style={s.grid}>
            <Input label="Nombre" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
            <Input label="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
            <Input label="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input label="Confirmar" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

            <div style={{ gridColumn: 'span 2' }}>
              <Button type="button" onClick={() => setStep(2)}>
                Siguiente →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={s.section}>
            <h3 style={{ textAlign: 'center' }}>Foto de perfil</h3>

            {fotoMode === 'none' && (
              <div style={s.row}>
                <button onClick={abrirCamara} type="button" style={s.btn}>📷 Cámara</button>
                <button onClick={() => fileRef.current?.click()} type="button" style={s.btn}>🖼 Subir</button>
              </div>
            )}

            {fotoMode === 'camera' && (
              <div style={s.cameraBox}>
                <video ref={videoRef} style={s.video} autoPlay />

                {/* 🔥 ESTE ES EL FIX */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                <button type="button" onClick={capturarFoto} style={s.captureBtn}>
                  📸 Capturar foto
                </button>
              </div>
            )}

            {fotoMode === 'preview' && avatarBase64 && (
              <div style={s.cameraBox}>
                <img src={avatarBase64} style={s.previewImg} />
              </div>
            )}

            {cameraError && <p style={s.error}>{cameraError}</p>}

            <div style={s.row}>
              <Button type="button" onClick={() => setStep(1)}>← Atrás</Button>
              <Button type="button" onClick={() => setStep(3)}>Siguiente →</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={s.section}>
            <RecaptchaPlaceholder onChange={setRecaptchaToken} />

            {localError && <p style={s.error}>{localError}</p>}
            {error && <p style={s.error}>{error}</p>}

            <div style={s.row}>
              <Button type="button" onClick={() => setStep(2)}>← Atrás</Button>
              <Button type="submit">
                {isLoading ? 'Registrando...' : 'Crear cuenta'}
              </Button>
            </div>
          </div>
        )}

        <p style={s.login}>
          ¿Ya tienes cuenta? <Link to="/login">Login</Link>
        </p>

      </form>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
  },

  form: {
    width: '100%',
    maxWidth: '900px',
    background: '#1e293b',
    padding: '25px',
    borderRadius: '12px',
  },

  title: {
    textAlign: 'center',
    marginBottom: '10px',
  },

  steps: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
  },

  step: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeStep: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: '#38bdf8',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },

  row: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'space-between',
  },

  cameraBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
  },

  btn: {
    flex: 1,
    padding: '12px',
    background: '#334155',
    borderRadius: '8px',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },

  video: {
    width: '100%',
    maxWidth: '500px',
    borderRadius: '12px',
  },

  captureBtn: {
    padding: '12px 25px',
    borderRadius: '10px',
    border: 'none',
    fontWeight: 'bold',
    background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
    color: '#000',
    cursor: 'pointer',
  },

  previewImg: {
    width: '200px',
    borderRadius: '12px',
  },

  login: {
    textAlign: 'center',
    marginTop: '15px',
  },

  error: {
    color: '#f87171',
    textAlign: 'center',
  },
};
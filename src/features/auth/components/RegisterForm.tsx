import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { RecaptchaPlaceholder } from './RecaptchaPlaceholder';
import { useRegisterForm } from '../hooks/useAuthForm';
import { segmentFace, getAvatares } from '../services/authServices';
import type { AvatarDto } from '../types/auth.types';

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

  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  const [localError, setLocalError] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [fotoMode, setFotoMode] = useState<FotoMode>('none');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [avatares, setAvatares] = useState<AvatarDto[]>([]);
  const [avatarSeleccionado, setAvatarSeleccionado] = useState<AvatarDto | null>(null);

  const { handleRegister, isLoading, error } = useRegisterForm();

  useEffect(() => {
    getAvatares().then(res => setAvatares(res.avatares)).catch(() => {});
  }, []);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function getPasswordStrength(password: string) {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) return 'Débil';
    if (strength <= 3) return 'Media';
    return 'Fuerte';
  }

  const abrirCamara = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setFotoMode('camera');

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 300);
    } catch {
      setCameraError('No se pudo acceder a la cámara');
    }
  };

  const cerrarCamara = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };
   useEffect(() => {
    return () => cerrarCamara();
  }, []);

  const capturarFoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    const fullData = canvas.toDataURL('image/jpeg', 0.9);

    try {
      const segmented = await segmentFace({ image_base64: fullData });
      setAvatarBase64(`data:image/png;base64,${segmented.resultado}`);
      setCameraError(null);
    } catch {
      setAvatarBase64(fullData);
      setCameraError("Error backend o no detecta rostro");
    }

    setFotoMode('preview');
    cerrarCamara();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!emailRegex.test(email)) {
      setLocalError('Correo inválido');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    if (!recaptchaToken) {
      setLocalError('Completa el reCAPTCHA');
      return;
    }

    const payload = {
      usuario,
      email,
      nombre_completo: nombreCompleto,
      password,
      telefono,
      recaptcha_token: recaptchaToken,

      // 🔥 SOLO ESTO SE ENVÍA (como antes)
      avatar_base64: avatarBase64 ?? undefined,
    };

    console.log("📤 DATA:", payload);

    await handleRegister(payload);
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

            <div style={{ position: 'relative' }}>
              <Input
                label="Correo"
                value={email}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  setEmailError(emailRegex.test(val) ? '' : 'Correo inválido');
                }}
              />
              {emailError && <div style={s.inputErrorOverlay} />}
            </div>

            <Input label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />

            <div style={s.inputWrapper}>
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  setPasswordStrength(getPasswordStrength(val));
                }}
              />
              <span onClick={() => setShowPassword(!showPassword)} style={s.eyeInside}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>

              <div style={s.strengthBarContainer}>
                <div
                  style={{
                    ...s.strengthBar,
                    width:
                      passwordStrength === 'Débil'
                        ? '33%'
                        : passwordStrength === 'Media'
                        ? '66%'
                        : '100%',
                    background:
                      passwordStrength === 'Débil'
                        ? '#ef4444'
                        : passwordStrength === 'Media'
                        ? '#f59e0b'
                        : '#22c55e',
                  }}
                />
              </div>
            </div>

            <Input
              label="Confirmar"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div style={{ gridColumn: 'span 2' }}>
              <Button type="button" onClick={() => setStep(2)}>
                Siguiente →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={s.section}>

            <h3 style={{ textAlign: 'center' }}>📸 Foto facial</h3>

            {fotoMode === 'none' && (
              <div style={s.row}>
                <button onClick={abrirCamara} type="button" style={s.btn}>📷 Cámara</button>
                <button onClick={() => fileRef.current?.click()} type="button" style={s.btn}>🖼 Subir</button>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (ev) => {
                  setAvatarBase64(ev.target?.result as string);
                  setFotoMode('preview');
                };
                reader.readAsDataURL(file);
              }}
            />

            {fotoMode === 'camera' && (
              <div style={s.cameraBox}>
                <video ref={videoRef} style={s.video} autoPlay />
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

            {/* AVATARES SE MANTIENEN PERO NO SE ENVÍAN */}
            <h3 style={{ textAlign: 'center' }}>🎭 Elige avatar (visual)</h3>

            <div style={s.avatarGrid}>
              {avatares.map(av => (
                <div
                  key={av.id}
                  onClick={() => setAvatarSeleccionado(av)}
                  style={{
                    ...s.avatarItem,
                    border: avatarSeleccionado?.id === av.id
                      ? '3px solid #38bdf8'
                      : '3px solid transparent',
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: av.svg }} style={{ width: '70px', height: '70px' }} />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{av.nombre}</span>
                </div>
              ))}
            </div>

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
  container: { display: 'flex', justifyContent: 'center', padding: '20px' },
  form: { width: '100%', maxWidth: '900px', background: '#1e293b', padding: '25px', borderRadius: '12px' },
  title: { textAlign: 'center', marginBottom: '10px' },
  steps: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' },
  step: { width: '30px', height: '30px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  activeStep: { width: '30px', height: '30px', borderRadius: '50%', background: '#38bdf8', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  section: { display: 'flex', flexDirection: 'column', gap: '15px' },
  row: { display: 'flex', gap: '10px', justifyContent: 'space-between' },
  cameraBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' },
  btn: { flex: 1, padding: '12px', background: '#334155', borderRadius: '8px', color: 'white', border: 'none', cursor: 'pointer' },
  video: { width: '100%', maxWidth: '500px', borderRadius: '12px' },
  captureBtn: { padding: '12px 25px', borderRadius: '10px', border: 'none', fontWeight: 'bold', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', color: '#000', cursor: 'pointer' },
  previewImg: { width: '200px', borderRadius: '12px' },
  login: { textAlign: 'center', marginTop: '15px' },
  error: { color: '#f87171', textAlign: 'center' },
  avatarGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  avatarItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: '#334155', cursor: 'pointer' },

  inputWrapper: { position: 'relative', display: 'flex', flexDirection: 'column' },
  eyeInside: { position: 'absolute', right: '10px', top: '60%', transform: 'translateY(-50%)', cursor: 'pointer', padding: '6px', color: '#94a3b8' },

  strengthBarContainer: { width: '100%', height: '6px', background: '#334155', borderRadius: '4px', marginTop: '6px', overflow: 'hidden' },
  strengthBar: { height: '100%', transition: 'all 0.3s ease', borderRadius: '4px' },

  inputErrorOverlay: { position: 'absolute', top: '32px', left: 0, right: 0, bottom: 0, borderRadius: '10px', border: '2px solid #ef4444' },
};
import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { RecaptchaPlaceholder } from './RecaptchaPlaceholder';
import { useRegisterForm } from '../hooks/useAuthForm';

type FotoMode = 'none' | 'camera' | 'preview';

export function RegisterForm() {
  const [nombreCompleto, setNombreCompleto]     = useState('');
  const [usuario, setUsuario]                   = useState('');
  const [email, setEmail]                       = useState('');
  const [telefono, setTelefono]                 = useState('');
  const [password, setPassword]                 = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [localError, setLocalError]             = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64]         = useState<string | null>(null);
  const [fotoMode, setFotoMode]                 = useState<FotoMode>('none');
  const [cameraError, setCameraError]           = useState<string | null>(null);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { handleRegister, isLoading, error } = useRegisterForm();

  // ── Abrir cámara ──────────────────────────────────────────
  const abrirCamara = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setFotoMode('camera');
      // El video se asigna después de que el elemento se monte
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      setCameraError('No se pudo acceder a la cámara. Usa "Subir foto" en su lugar.');
    }
  }, []);

  const cerrarCamara = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setFotoMode('none');
  }, []);

  // ── Capturar foto desde cámara ───────────────────────────
  const capturarFoto = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setAvatarBase64(dataUrl);
    setFotoMode('preview');
    cerrarCamara();
  }, [cerrarCamara]);

  // ── Subir foto desde archivo ─────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setCameraError('La imagen no debe superar 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarBase64(ev.target?.result as string);
      setFotoMode('preview');
    };
    reader.readAsDataURL(file);
  };

  const eliminarFoto = () => {
    setAvatarBase64(null);
    setFotoMode('none');
    setCameraError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }

    await handleRegister({
      usuario,
      email,
      nombre_completo: nombreCompleto,
      password,
      telefono,
      recaptcha_token: 'test-token-bypass',
      avatar_base64: avatarBase64 ?? undefined,
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Input
        id="register-nombre"
        label="Nombre completo"
        placeholder="Ingresa tu nombre completo"
        value={nombreCompleto}
        onChange={(e) => setNombreCompleto(e.target.value)}
      />
      <Input
        id="register-usuario"
        label="Usuario"
        placeholder="Crea un nombre de usuario"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
      />
      <Input
        id="register-email"
        label="Correo electrónico"
        type="email"
        placeholder="Ingresa tu correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        id="register-telefono"
        label="Teléfono"
        placeholder="+502 1234-5678"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
      />
      <Input
        id="register-password"
        label="Contraseña"
        type="password"
        placeholder="Mínimo 8 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        id="register-confirm-password"
        label="Confirmar contraseña"
        type="password"
        placeholder="Repite tu contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      {/* ── SECCIÓN FOTO ── */}
      <div style={s.fotoSection}>
        <label style={s.fotoLabel}>
          Foto de perfil
          <span style={s.fotoOptional}>(opcional — aparece en tu credencial PDF)</span>
        </label>

        {/* Estado: sin foto y sin cámara */}
        {fotoMode === 'none' && (
          <div style={s.fotoBtns}>
            <button type="button" onClick={abrirCamara} style={s.fotoBtn}>
              📷 Tomar foto
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} style={s.fotoBtn}>
              🖼 Subir foto
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Estado: cámara activa */}
        {fotoMode === 'camera' && (
          <div style={s.cameraBox}>
            <video ref={videoRef} autoPlay playsInline muted style={s.video} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={s.cameraBtns}>
              <button type="button" onClick={capturarFoto} style={s.btnCapture}>
                📸 Capturar
              </button>
              <button type="button" onClick={cerrarCamara} style={s.btnCancel}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Estado: foto tomada */}
        {fotoMode === 'preview' && avatarBase64 && (
          <div style={s.previewBox}>
            <img src={avatarBase64} alt="Vista previa" style={s.previewImg} />
            <button type="button" onClick={eliminarFoto} style={s.btnCancel}>
              ✕ Quitar foto
            </button>
          </div>
        )}

        {cameraError && <p style={s.cameraError}>{cameraError}</p>}
      </div>

      <RecaptchaPlaceholder />

      {localError && <p className="auth-form__message">{localError}</p>}
      {error     && <p className="auth-form__message">{error}</p>}

      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? 'Registrando...' : 'Registrarse'}
      </Button>

      <p className="auth-form__footer">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </form>
  );
}

// ── Estilos inline ────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  fotoSection:  { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' },
  fotoLabel:    { fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary, #e2e8f0)', display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  fotoOptional: { fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-muted, #94a3b8)' },
  fotoBtns:     { display: 'flex', gap: '0.5rem' },
  fotoBtn:      { flex: 1, padding: '0.55rem 0.75rem', background: 'var(--bg-elevated, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.825rem', cursor: 'pointer' },
  cameraBox:    { display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' },
  video:        { width: '100%', maxWidth: '320px', borderRadius: '8px', border: '2px solid var(--accent, #38bdf8)' },
  cameraBtns:   { display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '320px' },
  btnCapture:   { flex: 1, padding: '0.6rem', background: 'var(--accent, #38bdf8)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' },
  btnCancel:    { padding: '0.6rem 1rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--danger, #f87171)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem' },
  previewBox:   { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  previewImg:   { width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent, #38bdf8)' },
  cameraError:  { color: 'var(--danger, #f87171)', fontSize: '0.78rem', margin: 0 },
};
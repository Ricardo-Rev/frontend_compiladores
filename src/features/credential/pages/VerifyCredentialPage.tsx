import { useRef, useState } from 'react';
import { verifyCredential } from '../../auth/services/authServices';

const IconShield = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IconCheck = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconX = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const IconFile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

type ResultState = {
  valido: boolean;
  mensaje: string;
  algoritmo: string;
  fecha_firma: string | null;
} | null;

export function VerifyCredentialPage() {
  const [file, setFile]           = useState<File | null>(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<ResultState>(null);
  const [dragOver, setDragOver]   = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.pdf')) return;
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleVerify = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await verifyCredential(file);
      setResult(data);
    } catch {
      setResult({
        valido: false,
        mensaje: '❌ Error al conectar con el servicio de verificación.',
        algoritmo: 'RSA-2048 SHA-256 PKCS1',
        fecha_firma: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div style={s.shell}>
      <div style={s.orb1} />
      <div style={s.orb2} />

      <div style={s.container}>

        {/* HEADER */}
        <div style={s.header}>
          <div style={s.iconWrap}><IconShield /></div>
          <h1 style={s.title}>Verificar Credencial</h1>
          <p style={s.subtitle}>
            Sube tu credencial PDF para comprobar su autenticidad.<br />
            Firmada con <strong style={{ color: 'var(--accent2)' }}>RSA-2048 SHA-256</strong> — UMG Basic Rover 2.0
          </p>
        </div>

        {/* CARD */}
        <div style={s.card}>

          {/* ZONA DE SUBIDA */}
          {!result && (
            <>
              <div
                style={{
                  ...s.dropZone,
                  borderColor: dragOver
                    ? 'var(--accent)'
                    : file
                    ? 'var(--accent2)'
                    : 'var(--border)',
                  background: dragOver
                    ? 'rgba(56,189,248,0.06)'
                    : file
                    ? 'rgba(129,140,248,0.06)'
                    : 'var(--bg-elevated)',
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !file && inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />

                {file ? (
                  <div style={s.fileInfo}>
                    <div style={s.fileIcon}><IconFile /></div>
                    <div style={s.fileDetails}>
                      <span style={s.fileName}>{file.name}</span>
                      <span style={s.fileSize}>
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReset(); }}
                      style={s.removeBtn}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={s.dropContent}>
                    <div style={s.uploadIcon}><IconUpload /></div>
                    <p style={s.dropTitle}>Arrastra tu PDF aquí</p>
                    <p style={s.dropSub}>o haz clic para seleccionar</p>
                    <span style={s.dropBadge}>Solo archivos .pdf</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleVerify}
                disabled={!file || loading}
                style={{
                  ...s.verifyBtn,
                  opacity: !file || loading ? 0.5 : 1,
                  cursor: !file || loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <>
                    <span style={s.spinner} />
                    Verificando firma RSA...
                  </>
                ) : (
                  <>
                    <IconShield />
                    Verificar autenticidad
                  </>
                )}
              </button>
            </>
          )}

          {/* RESULTADO */}
          {result && (
            <div style={s.resultWrap}>
              <div style={{
                ...s.resultIcon,
                color: result.valido ? 'var(--accent3)' : 'var(--danger)',
              }}>
                {result.valido ? <IconCheck /> : <IconX />}
              </div>

              <h2 style={{
                ...s.resultTitle,
                color: result.valido ? 'var(--accent3)' : 'var(--danger)',
              }}>
                {result.valido ? 'Documento Auténtico' : 'Documento No Válido'}
              </h2>

              <p style={s.resultMsg}>{result.mensaje}</p>

              <div style={s.resultMeta}>
                <div style={s.metaRow}>
                  <span style={s.metaLabel}>Algoritmo</span>
                  <span style={s.metaValue}>{result.algoritmo}</span>
                </div>
                {result.fecha_firma && (
                  <div style={s.metaRow}>
                    <span style={s.metaLabel}>Fecha de firma</span>
                    <span style={s.metaValue}>
                      {new Date(result.fecha_firma).toLocaleString('es-GT')}
                    </span>
                  </div>
                )}
                <div style={s.metaRow}>
                  <span style={s.metaLabel}>Archivo</span>
                  <span style={s.metaValue}>{file?.name}</span>
                </div>
              </div>

              <button onClick={handleReset} style={s.resetBtn}>
                Verificar otro PDF
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <p style={s.footer}>
          Universidad Mariano Gálvez de Guatemala — Ingeniería en Sistemas 2026
        </p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  shell:      { minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)', position: 'relative', overflow: 'hidden', padding: '2rem' },
  orb1:       { position: 'fixed', top: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)', pointerEvents: 'none' },
  orb2:       { position: 'fixed', bottom: '-20%', right: '-10%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.07) 0%, transparent 70%)', pointerEvents: 'none' },
  container:  { width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: 1 },
  header:     { textAlign: 'center' },
  iconWrap:   { width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto 1.25rem' },
  title:      { color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: '700', fontFamily: 'var(--font-brand)', letterSpacing: '1px', margin: '0 0 0.5rem' },
  subtitle:   { color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 },
  card:       { width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem' },
  dropZone:   { border: '2px dashed', borderRadius: '12px', padding: '2rem', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '1.25rem', minHeight: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropContent:{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  uploadIcon: { color: 'var(--text-muted)', marginBottom: '0.25rem' },
  dropTitle:  { color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem', margin: 0 },
  dropSub:    { color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 },
  dropBadge:  { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.75rem', marginTop: '0.25rem' },
  fileInfo:   { display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' },
  fileIcon:   { color: 'var(--accent2)', flexShrink: 0 },
  fileDetails:{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  fileName:   { color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileSize:   { color: 'var(--text-muted)', fontSize: '0.75rem' },
  removeBtn:  { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', flexShrink: 0, padding: '0.25rem' },
  verifyBtn:  { width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'opacity 0.2s' },
  spinner:    { width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' },
  resultWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' },
  resultIcon: { marginBottom: '0.5rem' },
  resultTitle:{ fontSize: '1.4rem', fontWeight: '700', margin: 0 },
  resultMsg:  { color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' },
  resultMeta: { width: '100%', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  metaRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel:  { color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  metaValue:  { color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: '600', fontFamily: 'var(--font-mono)', maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  resetBtn:   { marginTop: '0.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '10px', padding: '0.65rem 1.5rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' },
  footer:     { color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' },
};
import ReCAPTCHA from 'react-google-recaptcha';
import { useRef } from 'react';

type Props = {
  onChange: (token: string | null) => void;
};

const IS_DEV = import.meta.env.DEV;


export function RecaptchaPlaceholder({ onChange }: Props) {
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);

  if (IS_DEV) {
    return (
      <div style={{ margin: '10px 0', textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => onChange('test-token-bypass')}
          style={{
            padding: '10px 20px',
            background: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ✅ Verificar (modo desarrollo)
        </button>
      </div>
    );
  }

  return (
    <div style={{ margin: '10px 0' }}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey="6LdofoUsAAAAABqxUKNqOJuRKxhAtP_2OfENLcJ6"
        onChange={(token) => {
          console.log("TOKEN CAPTCHA:", token);
          onChange(token);
        }}
      />
    </div>
  );
}
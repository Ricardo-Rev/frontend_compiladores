import ReCAPTCHA from 'react-google-recaptcha';
import { useRef } from 'react';

type Props = {
  onChange: (token: string | null) => void;
};

export function RecaptchaPlaceholder({ onChange }: Props) {
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);
  return (
    <div style={{ margin: '10px 0' }}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey="6LdofoUsAAAAABqxUKNqOJuRKxhAtP_2OfENLcJ6"
        onChange={onChange}
      />
    </div>
  );
}
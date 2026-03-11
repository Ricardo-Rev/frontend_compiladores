import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, id, ...props }: InputProps) {
  return (
    <div className="ui-field">
      <label htmlFor={id} className="ui-field__label">
        {label}
      </label>
      <input id={id} className="ui-field__input" {...props} />
    </div>
  );
}
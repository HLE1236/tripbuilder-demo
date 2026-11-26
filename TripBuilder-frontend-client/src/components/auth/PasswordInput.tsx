import { useState, type InputHTMLAttributes } from 'react';
import { EyeIcon, EyeOffIcon } from '../icon';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string;
}

export function PasswordInput({ className = '', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative flex items-center">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`field !pr-11 ${className}`.trim()}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        className="absolute right-2.5 h-8 w-8 rounded-md flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
      >
        {visible ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
      </button>
    </div>
  );
}

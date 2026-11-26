import { useState, type FormEvent } from 'react';
import type { AuthResponse } from '../../api/types';
import { useLoginMutation } from '../../hooks/api';
import { AlertIcon, ArrowRightIcon, CheckCircleIcon } from '../icon';
import { PasswordInput } from './PasswordInput';

interface LoginFormProps {
  onSuccess: (data: AuthResponse, rememberMe: boolean) => void;
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
  successMessage?: string;
}

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  onSwitchToForgot,
  successMessage,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const loginMutation = useLoginMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
        rememberMe,
      });
      onSuccess(data, rememberMe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMessage && (
        <div className="rounded-xl border border-emerald/30 bg-emerald-soft px-4 py-3 text-sm font-medium text-emerald flex items-start gap-2.5">
          <CheckCircleIcon size={18} className="mt-0.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-crimson/30 bg-crimson-soft px-4 py-3 text-sm font-medium text-crimson flex items-start gap-2.5">
          <AlertIcon size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="login-email" className="editorial-kicker text-ink-2 block">
          Email khách hàng
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ban@example.com"
          className="field"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-password" className="editorial-kicker text-ink-2 block">
          Mật khẩu
        </label>
        <PasswordInput
          id="login-password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu"
          className="num"
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-0.5">
        <label className="inline-flex items-center gap-2 text-sm text-ink-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-rule-strong accent-[var(--accent)] cursor-pointer"
          />
          <span>Ghi nhớ đăng nhập</span>
        </label>

        <button
          type="button"
          onClick={onSwitchToForgot}
          className="text-sm font-medium text-coral hover:text-coral-deep transition-colors cursor-pointer"
        >
          Quên mật khẩu?
        </button>
      </div>

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="btn btn-primary w-full justify-center font-semibold"
      >
        <span>{loginMutation.isPending ? 'Đang xác thực...' : 'Đăng nhập'}</span>
        <ArrowRightIcon size={16} />
      </button>

      <div className="pt-2 border-t border-rule text-center text-sm text-ink-2">
        Chưa có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-coral hover:text-coral-deep transition-colors cursor-pointer"
        >
          Đăng ký ngay
        </button>
      </div>
    </form>
  );
}

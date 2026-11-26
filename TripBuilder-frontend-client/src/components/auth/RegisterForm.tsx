import { useState, type FormEvent } from 'react';
import type { AuthResponse } from '../../api/types';
import { useRegisterMutation } from '../../hooks/api';
import { checkPasswordStrength, isValidVnPhone } from '../../utils/validation';
import { AlertIcon, ArrowRightIcon } from '../icon';
import { PasswordInput } from './PasswordInput';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { TermsModal } from './TermsModal';

interface RegisterFormProps {
  onSuccess: (data: AuthResponse) => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [error, setError] = useState('');

  const registerMutation = useRegisterMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }

    if (!isValidVnPhone(phone)) {
      setError('Số điện thoại không đúng định dạng Việt Nam (vd: 0901234567 hoặc +84901234567).');
      return;
    }

    const strength = checkPasswordStrength(password);
    if (!strength.isValid) {
      setError('Mật khẩu cần tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại chưa khớp.');
      return;
    }

    if (!acceptedTerms) {
      setError('Bạn cần đồng ý với Điều khoản sử dụng & Chính sách bảo mật.');
      return;
    }

    try {
      const data = await registerMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
        acceptedTerms,
      });
      onSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký tài khoản thất bại');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-crimson/30 bg-crimson-soft px-4 py-3 text-sm font-medium text-crimson flex items-start gap-2.5">
            <AlertIcon size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="reg-fullname" className="editorial-kicker text-ink-2 block">
            Họ và tên
          </label>
          <input
            id="reg-fullname"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Minh An"
            className="field"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label htmlFor="reg-email" className="editorial-kicker text-ink-2 block">
              Email
            </label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-phone" className="editorial-kicker text-ink-2 block">
              Số điện thoại
            </label>
            <input
              id="reg-phone"
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901 234 567"
              className="field num"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-password" className="editorial-kicker text-ink-2 block">
            Mật khẩu
          </label>
          <PasswordInput
            id="reg-password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự"
            className="num"
          />
          <PasswordStrengthMeter password={password} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-confirm-password" className="editorial-kicker text-ink-2 block">
            Nhập lại mật khẩu
          </label>
          <PasswordInput
            id="reg-confirm-password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu"
            className="num"
          />
        </div>

        <label className="flex items-start gap-2.5 text-sm text-ink-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-rule-strong accent-[var(--accent)] cursor-pointer shrink-0"
          />
          <span>
            Tôi đồng ý với{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setTermsOpen(true);
              }}
              className="font-semibold text-coral hover:text-coral-deep underline underline-offset-2 cursor-pointer"
            >
              Điều khoản sử dụng &amp; Chính sách bảo mật
            </button>
          </span>
        </label>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="btn btn-primary w-full justify-center font-semibold"
        >
          <span>{registerMutation.isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản & Bắt đầu'}</span>
          <ArrowRightIcon size={16} />
        </button>

        <div className="pt-2 border-t border-rule text-center text-sm text-ink-2">
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-coral hover:text-coral-deep transition-colors cursor-pointer"
          >
            Đăng nhập
          </button>
        </div>
      </form>

      <TermsModal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAccept={() => setAcceptedTerms(true)}
      />
    </>
  );
}

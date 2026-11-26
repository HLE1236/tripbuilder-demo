import { useState, type FormEvent } from 'react';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../../hooks/api';
import { checkPasswordStrength } from '../../utils/validation';
import { AlertIcon, ArrowLeftIcon, ArrowRightIcon } from '../icon';
import { PasswordInput } from './PasswordInput';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

interface ForgotPasswordFormProps {
  onSuccessReset: (message: string) => void;
  onSwitchToLogin: () => void;
}

export function ForgotPasswordForm({
  onSuccessReset,
  onSwitchToLogin,
}: ForgotPasswordFormProps) {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const forgotMutation = useForgotPasswordMutation();
  const resetMutation = useResetPasswordMutation();

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await forgotMutation.mutateAsync(email.trim());
      setDevOtp(res.devOtp ?? null);
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi mã xác thực');
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Mã OTP gồm đúng 6 chữ số.');
      return;
    }

    const strength = checkPasswordStrength(newPassword);
    if (!strength.isValid) {
      setError('Mật khẩu mới cần tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    try {
      await resetMutation.mutateAsync({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
        confirmPassword,
      });
      onSuccessReset('Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-crimson/30 bg-crimson-soft px-4 py-3 text-sm font-medium text-crimson flex items-start gap-2.5">
          <AlertIcon size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <p className="text-sm text-ink-2 leading-relaxed">
            Nhập email tài khoản của bạn để nhận mã OTP 6 chữ số đặt lại mật khẩu.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="forgot-email" className="editorial-kicker text-ink-2 block">
              Email đã đăng ký
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@example.com"
              className="field"
            />
          </div>

          <button
            type="submit"
            disabled={forgotMutation.isPending}
            className="btn btn-primary w-full justify-center font-semibold"
          >
            <span>{forgotMutation.isPending ? 'Đang gửi mã OTP...' : 'Gửi mã xác thực OTP'}</span>
            <ArrowRightIcon size={16} />
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetSubmit} className="space-y-4">
          {devOtp && (
            <div className="rounded-xl border border-amber/35 bg-amber-soft px-4 py-3 text-sm text-ink">
              <div className="font-semibold text-amber">Mã OTP dùng thử (Dev mode)</div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span>
                  Mã OTP của bạn là:{' '}
                  <strong className="num text-base font-semibold text-ink">{devOtp}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setOtp(devOtp)}
                  className="btn btn-ghost !py-1 !px-2.5 text-sm font-medium"
                >
                  Điền nhanh
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 text-sm text-ink-2">
            <span>
              Email: <strong className="text-ink">{email}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setError('');
              }}
              className="text-coral hover:text-coral-deep font-medium cursor-pointer"
            >
              Đổi email
            </button>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reset-otp" className="editorial-kicker text-ink-2 block">
              Mã OTP (6 chữ số)
            </label>
            <input
              id="reset-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="field num tracking-widest"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reset-new-password" className="editorial-kicker text-ink-2 block">
              Mật khẩu mới
            </label>
            <PasswordInput
              id="reset-new-password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="num"
            />
            <PasswordStrengthMeter password={newPassword} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reset-confirm-password" className="editorial-kicker text-ink-2 block">
              Xác nhận mật khẩu mới
            </label>
            <PasswordInput
              id="reset-confirm-password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="num"
            />
          </div>

          <button
            type="submit"
            disabled={resetMutation.isPending}
            className="btn btn-primary w-full justify-center font-semibold"
          >
            <span>{resetMutation.isPending ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}</span>
            <ArrowRightIcon size={16} />
          </button>
        </form>
      )}

      <div className="pt-2 border-t border-rule text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeftIcon size={15} />
          <span>Quay lại đăng nhập</span>
        </button>
      </div>
    </div>
  );
}

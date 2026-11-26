import { useEffect, useRef, useState } from 'react';
import type { AuthResponse } from '../../api/types';
import { useAuthStore, type AuthModalMode } from '../../stores/useAuthStore';
import { CompassIcon, XIcon } from '../icon';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthModalProps {
  onAuthSuccess: (data: AuthResponse, rememberMe: boolean) => void;
}

const MODE_TITLES: Record<AuthModalMode, { title: string; subtitle: string }> = {
  login: {
    title: 'Đăng nhập TripBuilder',
    subtitle: 'Tiếp tục tuỳ chỉnh lịch trình và lưu hành trình yêu thích của bạn.',
  },
  register: {
    title: 'Tạo tài khoản khách hàng',
    subtitle: 'Chỉ mất 1 phút để đặt chuyến và nhận báo giá trực tiếp từ Guide.',
  },
  forgot: {
    title: 'Khôi phục mật khẩu',
    subtitle: 'Xác thực email để đặt lại mật khẩu mới an toàn.',
  },
};

export function AuthModal({ onAuthSuccess }: AuthModalProps) {
  const authModal = useAuthStore((s) => s.authModal);
  const setAuthModalMode = useAuthStore((s) => s.setAuthModalMode);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleClose = () => {
    setLoginSuccessMsg('');
    closeAuthModal();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (authModal.open) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [authModal.open]);

  const meta = MODE_TITLES[authModal.mode];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="auth-modal-title"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      className="p-0 m-auto bg-transparent border-0 max-w-md w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto backdrop:bg-black/55 backdrop:backdrop-blur-xs"
    >
      {authModal.open && (
        <div
          className="flagship-card w-full bg-surface"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-rule bg-surface-2">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-lg bg-coral text-white flex items-center justify-center shrink-0">
                <CompassIcon size={18} />
              </span>
              <div>
                <h2 id="auth-modal-title" className="text-lg font-semibold text-ink leading-tight">
                  {meta.title}
                </h2>
                <p className="text-sm text-ink-2 mt-0.5">{meta.subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Đóng hộp thoại đăng nhập"
              className="h-8 w-8 rounded-lg border border-rule bg-surface hover:bg-surface-2 text-ink-2 flex items-center justify-center cursor-pointer shrink-0"
            >
              <XIcon size={16} />
            </button>
          </div>

          <div className="p-6">
            {authModal.mode === 'login' && (
              <LoginForm
                successMessage={loginSuccessMsg}
                onSuccess={(data, rememberMe) => {
                  setLoginSuccessMsg('');
                  onAuthSuccess(data, rememberMe);
                }}
                onSwitchToRegister={() => {
                  setLoginSuccessMsg('');
                  setAuthModalMode('register');
                }}
                onSwitchToForgot={() => {
                  setLoginSuccessMsg('');
                  setAuthModalMode('forgot');
                }}
              />
            )}

            {authModal.mode === 'register' && (
              <RegisterForm
                onSuccess={(data) => onAuthSuccess(data, true)}
                onSwitchToLogin={() => setAuthModalMode('login')}
              />
            )}

            {authModal.mode === 'forgot' && (
              <ForgotPasswordForm
                onSuccessReset={(msg) => {
                  setLoginSuccessMsg(msg);
                  setAuthModalMode('login');
                }}
                onSwitchToLogin={() => setAuthModalMode('login')}
              />
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

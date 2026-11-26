import type { AuthResponse } from '../../api';
import {
  AlertIcon,
  ArrowRightIcon,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
} from '../../components/icon';
import { useLoginForm } from '../../hooks';

export interface LoginPageProps {
  onSuccess: (auth: AuthResponse, rememberMe: boolean) => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    showPassword,
    setShowPassword,
    submitting,
    error,
    handleFormSubmit,
  } = useLoginForm(onSuccess);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between px-4 py-8 sm:px-6">
      <header className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-rule">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D9381E] text-white flex items-center justify-center font-display font-semibold text-base">
            TB
          </div>
          <div>
            <div className="font-display font-semibold text-base text-ink tracking-tight">
              TripBuilder Admin
            </div>
            <div className="text-xs text-ink-3">
              Bàn điều hành Hệ thống · Cổng Quản trị Tổng
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto my-auto py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <section className="lg:col-span-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-coral">
            <ShieldCheckIcon size={15} />
            <span>Quản trị viên hệ thống</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink leading-tight">
            Điều phối toàn sàn &amp; quản trị kho dịch vụ
          </h1>
          <p className="text-sm text-ink-2 leading-relaxed max-w-lg">
            Theo dõi doanh thu chốt đơn, quản lý tài khoản Tour Guide theo vùng, giám sát lịch trình và chuẩn hoá danh mục dịch vụ trên toàn hệ thống.
          </p>
        </section>

        <section className="lg:col-span-6">
          <div className="flagship-card p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">
                Đăng nhập Quản trị viên
              </h2>
              <p className="text-xs text-ink-3 mt-1">
                Phiên làm việc yêu cầu tài khoản có vai trò quản trị hệ thống
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-crimson/35 bg-crimson-soft px-3.5 py-2.5 text-xs text-crimson flex items-start gap-2"
              >
                <AlertIcon size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="admin-email" className="block text-xs font-medium text-ink-2">
                  Email quản trị
                </label>
                <div className="relative">
                  <MailIcon
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                  />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@tripbuilder.vn"
                    autoComplete="email"
                    className="field pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="admin-password" className="block text-xs font-medium text-ink-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <LockIcon
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                  />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="field pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1 rounded cursor-pointer transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-ink-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-rule accent-coral cursor-pointer"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn btn-primary py-2.5 text-sm font-medium"
              >
                <span>{submitting ? 'Đang xác thực...' : 'Vào Bàn điều hành'}</span>
                <ArrowRightIcon size={16} />
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl w-full mx-auto pt-6 border-t border-rule flex flex-wrap items-center justify-between gap-2 text-xs text-ink-3">
        <span>TripBuilder Platform · Cổng Điều hành Hệ thống</span>
      </footer>
    </div>
  );
}

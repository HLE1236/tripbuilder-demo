import type { User } from '../../api';
import {
  AlertIcon,
  ArrowRightIcon,
  ExternalIcon,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
} from '../../components/icon';
import { PORTAL_LINKS } from '../../config/constants/meta';
import { useLoginForm } from '../../hooks';

export interface LoginPageProps {
  onSuccess: (token: string, user: User) => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const {
    accounts,
    loadingAccounts,
    email,
    setEmail,
    password,
    setPassword,
    submitting,
    error,
    handleFormSubmit,
    handleQuickLogin,
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

        <div className="flex items-center gap-2 text-xs">
          <a
            href={PORTAL_LINKS.client}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost py-1.5 px-3 text-xs"
          >
            <span>Cổng Khách hàng</span>
            <ExternalIcon size={13} />
          </a>
          <a
            href={PORTAL_LINKS.guide}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost py-1.5 px-3 text-xs"
          >
            <span>Cổng Tour Guide</span>
            <ExternalIcon size={13} />
          </a>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto my-auto py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
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
          </div>

          <div className="flagship-card p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-2">
                Chọn nhanh tài khoản Admin mẫu
              </span>
              <span className="num text-xs text-ink-3">Mật khẩu: 123456</span>
            </div>

            {loadingAccounts ? (
              <div className="text-xs text-ink-3 py-3">Đang tải danh sách tài khoản mẫu...</div>
            ) : accounts.length === 0 ? (
              <div className="text-xs text-ink-2 py-2">
                Đăng nhập trực tiếp bằng{' '}
                <span className="num font-medium text-ink">admin@tripbuilder.vn</span> hoặc{' '}
                <span className="num font-medium text-ink">operator@tripbuilder.vn</span>.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickLogin(acc)}
                    className="text-left p-3.5 rounded-lg border border-rule bg-surface-2 hover:border-rule-strong transition-colors flex items-start justify-between gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-ink truncate">
                        {acc.fullName}
                      </div>
                      <div className="num text-xs text-ink-3 truncate mt-0.5">
                        {acc.email}
                      </div>
                    </div>
                    <ArrowRightIcon size={15} className="text-coral shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
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
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="field pl-9"
                  />
                </div>
              </div>

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

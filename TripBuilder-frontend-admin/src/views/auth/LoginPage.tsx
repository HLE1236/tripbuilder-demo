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
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between px-4 py-8 sm:px-6">
      {/* Top Bar */}
      <header className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D9381E] text-white flex items-center justify-center font-display font-semibold text-base">
            TB
          </div>
          <div>
            <div className="font-display font-semibold text-base text-white tracking-tight">
              TripBuilder Admin
            </div>
            <div className="text-xs text-slate-400">
              Bàn điều hành Hệ thống · Cổng Quản trị Tổng
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <a
            href={PORTAL_LINKS.client}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 transition"
          >
            <span>Cổng Khách hàng</span>
            <span className="num text-slate-400">:5173</span>
            <ExternalIcon size={13} />
          </a>
          <a
            href={PORTAL_LINKS.guide}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 transition"
          >
            <span>Cổng Tour Guide</span>
            <span className="num text-slate-400">:5174</span>
            <ExternalIcon size={13} />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto my-auto py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Executive Context & 1-Tap Demo Accounts */}
        <section className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#D9381E]/15 border border-[#D9381E]/30 text-[#F87171] text-xs font-medium">
              <ShieldCheckIcon size={14} />
              <span>Quyền hạn ADMIN</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight tracking-tight">
              Điều phối toàn sàn &amp; quản trị kho dịch vụ
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
              Theo dõi doanh thu chốt đơn, quản lý tài khoản Tour Guide theo vùng, giám sát lịch trình và chuẩn hoá danh mục dịch vụ PresetOption trên toàn hệ thống.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                Chọn nhanh 1-chạm tài khoản Admin mẫu
              </span>
              <span className="num text-xs text-slate-400">Mật khẩu: 123456</span>
            </div>

            {loadingAccounts ? (
              <div className="text-xs text-slate-400 py-3">Đang tải danh sách tài khoản mẫu...</div>
            ) : accounts.length === 0 ? (
              <div className="text-xs text-slate-400 py-2">
                Không lấy được danh sách mẫu từ máy chủ. Bạn vẫn có thể đăng nhập trực tiếp bằng{' '}
                <span className="num text-slate-200">admin@tripbuilder.vn</span> hoặc{' '}
                <span className="num text-slate-200">operator@tripbuilder.vn</span>.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickLogin(acc)}
                    className="text-left p-3.5 rounded-lg border border-white/12 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#D9381E]/60 transition flex items-start justify-between gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-white truncate">
                        {acc.fullName}
                      </div>
                      <div className="num text-xs text-slate-400 truncate mt-0.5">
                        {acc.email}
                      </div>
                    </div>
                    <ArrowRightIcon size={15} className="text-[#D9381E] shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right: Login Form */}
        <section className="lg:col-span-6">
          <div className="rounded-xl border border-white/12 bg-[#161F33] p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-white">
                Đăng nhập Quản trị viên
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Phiên làm việc yêu cầu tài khoản có vai trò <span className="num text-slate-200">ADMIN</span>
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/35 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200 flex items-start gap-2">
                <AlertIcon size={15} className="shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="admin-email" className="block text-xs font-medium text-slate-300">
                  Email quản trị
                </label>
                <div className="relative">
                  <MailIcon
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@tripbuilder.vn"
                    autoComplete="email"
                    className="w-full rounded-lg border border-white/15 bg-[#0F172A] pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D9381E]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="admin-password" className="block text-xs font-medium text-slate-300">
                  Mật khẩu
                </label>
                <div className="relative">
                  <LockIcon
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-white/15 bg-[#0F172A] pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D9381E]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn btn-primary py-2.5 text-sm font-medium"
              >
                {submitting ? 'Đang xác thực...' : 'Vào Bàn điều hành'}
                <ArrowRightIcon size={16} />
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl w-full mx-auto pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>TripBuilder Platform · Cổng Điều hành Hệ thống</span>
        <span className="num">Port :5175</span>
      </footer>
    </div>
  );
}

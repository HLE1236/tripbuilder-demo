import { useEffect, useState, type FormEvent } from 'react';
import { authLogin, getDemoAccounts, resolveMediaUrl, type DemoAccount, type User } from '../api';
import { Icon } from './Icon';

interface LoginPageProps {
  onSuccess: (token: string, user: User) => void;
}

const DEFAULT_CLIENT_URL = import.meta.env.VITE_CLIENT_PORT_URL || 'http://localhost:5173';

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('binh.guide@tripbuilder.vn');
  const [password, setPassword] = useState('123456');
  const [demos, setDemos] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getDemoAccounts()
      .then(setDemos)
      .catch(() => setDemos([]));
  }, []);

  const submitLogin = async (targetEmail: string, targetPassword: string) => {
    setError('');
    setLoading(true);
    try {
      const data = await authLogin(targetEmail.trim(), targetPassword);
      onSuccess(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitLogin(email, password);
  };

  return (
    <div className="min-h-[calc(100vh-44px)] bg-canvas text-ink flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[1280px] grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
        {/* Cột trái: Bàn làm việc tối giản */}
        <section className="lg:col-span-5 rounded-xl bg-[#141415] text-white border border-white/10 shadow-[var(--shadow-editorial)] overflow-hidden flex flex-col justify-between">
          <div className="px-7 py-5 border-b border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-lg bg-coral text-white flex items-center justify-center shrink-0">
                <Icon name="compass" size={20} />
              </span>
              <div>
                <div className="font-display text-xl font-semibold text-white leading-none">
                  TripBuilder Studio
                </div>
                <div className="editorial-kicker text-[#A1A1AA] mt-1">
                  Cổng Hướng dẫn viên
                </div>
              </div>
            </div>
            <span className="tag bg-white/10 text-[#E4E4E7] border-white/15">
              Điều phối viên
            </span>
          </div>

          <div className="p-7 flex-1 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="editorial-kicker text-[#E04B32]">
                Bàn điều phối báo giá thực tế
              </div>
              <h1 className="font-display text-3xl sm:text-[2.25rem] font-semibold leading-[1.16] text-white">
                Rà soát lịch trình &amp; chốt báo giá từng chặng cùng khách
              </h1>
              <p className="text-base text-[#D4D4D8] leading-relaxed font-normal">
                Xem chi tiết từng thay đổi của khách, định giá yêu cầu phát sinh, đề xuất phương án
                thay thế và quản lý phiên bản tour mẫu bản địa.
              </p>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-5 text-sm font-normal text-[#E4E4E7]">
              <div className="flex items-center gap-2.5">
                <Icon name="shield-check" size={18} className="text-[#4CC38A] shrink-0" />
                <span>Tài khoản mẫu có sẵn quyền Tour Guide theo từng vùng.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Icon name="clipboard" size={18} className="text-[#E3B263] shrink-0" />
                <span>Mọi thay đổi đều lưu dấu vết theo từng vòng đàm phán.</span>
              </div>
            </div>
          </div>

          <div className="px-7 py-4 bg-black/25 border-t border-white/10 flex items-center justify-between gap-3 text-sm">
            <span className="text-[#A1A1AA] font-normal">Cổng dành cho khách du lịch</span>
            <a
              href={DEFAULT_CLIENT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-[#E04B32] hover:underline underline-offset-4 transition-colors"
            >
              <span>Mở Cổng Khách hàng</span>
              <Icon name="external" size={15} />
            </a>
          </div>
        </section>

        {/* Cột phải: Chọn nhanh 1-chạm + Form đăng nhập */}
        <div className="lg:col-span-7 flex flex-col justify-center gap-5">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-crimson/35 bg-crimson-soft px-5 py-3.5 flex items-start gap-3 text-base text-crimson"
            >
              <Icon name="alert" size={20} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Từ chối truy cập</div>
                <div className="text-sm font-normal">{error}</div>
              </div>
            </div>
          )}

          {demos.length > 0 && (
            <div className="flagship-card">
              <div className="bg-surface-2 px-6 py-3.5 border-b border-rule flex items-center justify-between gap-2">
                <span className="editorial-kicker text-ink-2">
                  Vào nhanh Guide mẫu (1 chạm)
                </span>
                <span className="num text-sm font-medium text-ink-3">Mật khẩu: 123456</span>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {demos.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword('123456');
                      submitLogin(acc.email, '123456');
                    }}
                    className="flagship-card flagship-card-interactive p-3.5 text-left cursor-pointer disabled:opacity-60 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {acc.avatarUrl ? (
                        <img
                          src={resolveMediaUrl(acc.avatarUrl)}
                          alt={acc.fullName}
                          className="h-10 w-10 rounded-full object-cover border border-rule shrink-0"
                        />
                      ) : (
                        <span className="h-10 w-10 rounded-full bg-flagship-dark text-white flex items-center justify-center shrink-0 text-sm font-medium">
                          {acc.fullName.slice(0, 1)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-ink truncate">
                          {acc.fullName}
                        </div>
                        <div className="text-[13px] font-normal text-ink-3 truncate">
                          {acc.regionName || 'Tour Guide'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-rule text-[13px] font-medium text-coral">
                      <span className="truncate">{acc.email.split('@')[0]}</span>
                      <Icon name="arrow-right" size={14} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flagship-card">
            <div className="bg-surface-2 px-6 py-3.5 border-b border-rule flex items-center justify-between">
              <span className="editorial-kicker text-ink-2">
                Đăng nhập tài khoản Tour Guide
              </span>
              <span className="tag tag-jade">Quyền Guide</span>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="guide-login-email" className="block text-sm font-medium text-ink-2">
                  Email Tour Guide
                </label>
                <input
                  id="guide-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="binh.guide@tripbuilder.vn"
                  className="field text-base"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="guide-login-pass" className="block text-sm font-medium text-ink-2">
                  Mật khẩu
                </label>
                <input
                  id="guide-login-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="field text-base"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-base"
              >
                <span>{loading ? 'Đang xác thực...' : 'Mở Bảng điều phối'}</span>
                <Icon name="arrow-right" size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

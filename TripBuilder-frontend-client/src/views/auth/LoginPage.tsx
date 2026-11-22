import { Avatar } from '@astryxdesign/core/Avatar';
import {
  ADMIN_PORT_URL,
  DEFAULT_TRAVEL_IMAGE,
  GUIDE_PORT_URL,
  type User,
} from '../../api';
import {
  AlertIcon,
  ArrowRightIcon,
  CompassIcon,
  ExternalIcon,
  ShieldCheckIcon,
} from '../../components/icon';
import { SafeImage } from '../../components/ui/SafeImage';
import { useLoginForm } from '../../hooks/useLoginForm';

interface LoginPageProps {
  onSuccess: (token: string, user: User) => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const {
    activeTab,
    switchTab,
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    regEmail,
    setRegEmail,
    phone,
    setPhone,
    regPassword,
    setRegPassword,
    demos,
    loading,
    switchingEmail,
    error,
    handleLoginSubmit,
    handleDemoLogin,
    handleRegisterSubmit,
  } = useLoginForm(onSuccess);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col lg:flex-row">
      {/* Cột trái (55%): Ảnh toàn cảnh Việt Nam & Tuyên ngôn Flagship */}
      <div className="relative lg:w-[55%] min-h-[380px] lg:min-h-screen overflow-hidden border-b lg:border-b-0 lg:border-r border-rule bg-flagship-dark text-white">
        <SafeImage
          src={DEFAULT_TRAVEL_IMAGE}
          alt="Vịnh Hạ Long từ trên cao"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/92 via-[#0F172A]/50 to-[#0F172A]/25" />

        <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-10 lg:p-14 gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-coral text-white flex items-center justify-center">
                <CompassIcon size={22} />
              </span>
              <div>
                <div className="font-display text-2xl font-semibold text-white leading-none">
                  TripBuilder
                </div>
                <div className="text-[13px] font-medium text-[#E2E8F0] mt-1">
                  Hành trình may đo bản địa
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={GUIDE_PORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-black/35 backdrop-blur-md px-3.5 py-2 text-sm font-medium text-white hover:bg-black/55 transition-colors"
              >
                <span>Cổng Tour Guide</span>
                <ExternalIcon size={14} />
              </a>
              <a
                href={ADMIN_PORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-black/35 backdrop-blur-md px-3.5 py-2 text-sm font-medium text-white hover:bg-black/55 transition-colors"
              >
                <span>Cổng Admin Tổng</span>
                <ExternalIcon size={14} />
              </a>
            </div>
          </div>

          <div className="space-y-8 max-w-2xl">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-md bg-coral px-3 py-1 text-[13px] font-medium text-white">
                Trải nghiệm bản địa Việt Nam
              </span>
              <h1 className="font-display text-[40px] sm:text-[48px] font-semibold leading-[1.08] text-white">
                Đi theo nhịp riêng, cùng người hiểu đất
              </h1>
              <p className="text-base sm:text-lg text-[#E2E8F0] leading-relaxed max-w-xl">
                Mỗi hành trình bắt đầu từ lịch trình chuẩn có sẵn đơn giá rõ ràng. Bạn tự do đổi
                nơi ở, bớt hoạt động hoặc thêm trải nghiệm riêng và đối chiếu trực tiếp với Guide.
              </p>
            </div>

            <div className="border-t border-white/20 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <span className="num text-xl font-semibold text-[#F59E8B]">01</span>
                <p className="text-sm font-normal text-[#E2E8F0] leading-relaxed">
                  Xem trước đơn giá từng chặng theo ngày
                </p>
              </div>
              <div className="space-y-1.5">
                <span className="num text-xl font-semibold text-[#F59E8B]">02</span>
                <p className="text-sm font-normal text-[#E2E8F0] leading-relaxed">
                  Đổi, bỏ hoặc thêm yêu cầu có dấu đối chiếu
                </p>
              </div>
              <div className="space-y-1.5">
                <span className="num text-xl font-semibold text-[#F59E8B]">03</span>
                <p className="text-sm font-normal text-[#E2E8F0] leading-relaxed">
                  Guide báo giá từng mục trước khi chốt chuyến
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cột phải (45%): Chọn nhanh 1-chạm & Form đăng nhập / đăng ký */}
      <div className="lg:w-[45%] flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="space-y-2">
            <p className="editorial-kicker text-coral">Cổng Khách hàng · TripBuilder</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
              Mở sổ hành trình của bạn
            </h2>
            <p className="text-base text-ink-2">
              Chọn nhanh hành khách mẫu để trải nghiệm ngay, hoặc đăng nhập / tạo tài khoản mới.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-crimson/30 bg-crimson-soft px-4 py-3.5 text-sm font-medium text-crimson flex items-start gap-3">
              <AlertIcon size={18} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">
                  {activeTab === 'register' ? 'Không thể đăng ký' : 'Không thể đăng nhập'}
                </div>
                <div className="mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {demos.length > 0 && (
            <section className="flagship-card" aria-label="Đăng nhập nhanh tài khoản mẫu">
              <div className="bg-surface-2 px-5 py-3.5 border-b border-rule flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CompassIcon size={17} className="text-coral" />
                  <span className="editorial-kicker text-ink">Chọn nhanh 1 chạm · Khách mẫu</span>
                </div>
                <span className="num text-[13px] font-medium text-ink-3">Mật khẩu: 123456</span>
              </div>

              <div className="divide-y divide-rule">
                {demos.map((acc, index) => {
                  const isBusy = loading && switchingEmail === acc.email;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin(acc.email)}
                      className="w-full px-5 py-4 flex items-center justify-between gap-3 bg-surface hover:bg-surface-2 transition-colors text-left cursor-pointer disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="num text-base font-medium text-coral w-7 shrink-0">
                          0{index + 1}
                        </span>
                        <Avatar src={acc.avatarUrl || undefined} name={acc.fullName} size="md" />
                        <div className="min-w-0">
                          <div className="text-base font-semibold text-ink truncate">
                            {acc.fullName}
                          </div>
                          <div className="num text-sm font-normal text-ink-2 truncate">
                            {acc.email}
                          </div>
                        </div>
                      </div>

                      <span className="btn btn-ghost !py-1.5 !px-3.5 !text-sm shrink-0">
                        <span>{isBusy ? 'Đang vào...' : 'Khám phá'}</span>
                        <ArrowRightIcon size={15} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="flagship-card">
            <div className="bg-surface-2 px-3 py-2 border-b border-rule flex items-center justify-between gap-2">
              <div className="grid grid-cols-2 gap-1.5 flex-1">
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-surface text-ink shadow-xs border border-rule'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-surface text-ink shadow-xs border border-rule'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  Đăng ký tài khoản mới
                </button>
              </div>
              <ShieldCheckIcon size={16} className="text-ink-3 mr-2 hidden sm:block" />
            </div>

            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="editorial-kicker text-ink-2 block">
                    Email khách hàng
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="an.nguyen@gmail.com"
                    className="field"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="editorial-kicker text-ink-2 block">
                    Mật khẩu
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="field num"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full justify-center font-semibold"
                >
                  <span>{loading && !switchingEmail ? 'Đang xác thực...' : 'Đăng nhập'}</span>
                  <ArrowRightIcon size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="reg-fullname" className="editorial-kicker text-ink-2 block">
                    Họ và tên
                  </label>
                  <input
                    id="reg-fullname"
                    type="text"
                    required
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
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="ban@example.com"
                      className="field"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reg-phone" className="editorial-kicker text-ink-2 block">
                      Số điện thoại <span className="text-ink-3 font-normal">(tuỳ chọn)</span>
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
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
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="field num"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full justify-center"
                >
                  <span>{loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản & Bắt đầu'}</span>
                  <ArrowRightIcon size={16} />
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

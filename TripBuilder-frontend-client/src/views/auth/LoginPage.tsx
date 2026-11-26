import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DEFAULT_TRAVEL_IMAGE, type AuthResponse } from '../../api';
import { ForgotPasswordForm, LoginForm, RegisterForm } from '../../components/auth';
import { ArrowLeftIcon, CompassIcon, ShieldCheckIcon } from '../../components/icon';
import { SafeImage } from '../../components/ui/SafeImage';
import type { AuthModalMode } from '../../stores/useAuthStore';

interface LoginPageProps {
  initialMode?: AuthModalMode;
  onSuccess: (data: AuthResponse, rememberMe: boolean) => void;
}

export function LoginPage({ initialMode = 'login', onSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const switchMode = (nextMode: AuthModalMode) => {
    setMode(nextMode);
    if (nextMode === 'login') navigate('/login');
    else if (nextMode === 'register') navigate('/register');
    else navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col lg:flex-row">
      {/* Cột trái (55%): Ảnh toàn cảnh Việt Nam & Tuyên ngôn Flagship */}
      <div className="relative lg:w-[55%] min-h-[340px] lg:min-h-screen overflow-hidden border-b lg:border-b-0 lg:border-r border-rule bg-flagship-dark text-white">
        <SafeImage
          src={DEFAULT_TRAVEL_IMAGE}
          alt="Vịnh Hạ Long từ trên cao"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/92 via-[#0F172A]/50 to-[#0F172A]/25" />

        <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-10 lg:p-14 gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-3">
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
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-black/35 backdrop-blur-md px-3.5 py-2 text-sm font-medium text-white hover:bg-black/55 transition-colors"
            >
              <ArrowLeftIcon size={15} />
              <span>Quay lại khám phá tour</span>
            </Link>
          </div>

          <div className="space-y-8 max-w-2xl">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-md bg-coral px-3 py-1 text-[13px] font-medium text-white">
                Trải nghiệm bản địa Việt Nam
              </span>
              <h1 className="font-display text-[36px] sm:text-[48px] font-semibold leading-[1.08] text-white">
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

      {/* Cột phải (45%): Form đăng nhập / đăng ký / quên mật khẩu */}
      <div className="lg:w-[45%] flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="space-y-2">
            <p className="editorial-kicker text-coral">Cổng Khách hàng · TripBuilder</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
              {mode === 'register'
                ? 'Tạo tài khoản hành khách'
                : mode === 'forgot'
                  ? 'Khôi phục mật khẩu'
                  : 'Mở sổ hành trình của bạn'}
            </h2>
            <p className="text-base text-ink-2">
              {mode === 'register'
                ? 'Đăng ký để tuỳ chỉnh lịch trình, lưu tuyến đi yêu thích và theo dõi báo giá.'
                : mode === 'forgot'
                  ? 'Nhập email đã đăng ký để nhận mã xác thực OTP đặt lại mật khẩu.'
                  : 'Đăng nhập để quản lý các chuyến đi và yêu cầu tuỳ chỉnh của bạn.'}
            </p>
          </div>

          <section className="flagship-card">
            <div className="bg-surface-2 px-3 py-2 border-b border-rule flex items-center justify-between gap-2">
              <div className="grid grid-cols-2 gap-1.5 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginSuccessMsg('');
                    switchMode('login');
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    mode === 'login'
                      ? 'bg-surface text-ink shadow-xs border border-rule'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginSuccessMsg('');
                    switchMode('register');
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    mode === 'register'
                      ? 'bg-surface text-ink shadow-xs border border-rule'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  Đăng ký tài khoản mới
                </button>
              </div>
              <ShieldCheckIcon size={16} className="text-ink-3 mr-2 hidden sm:block" />
            </div>

            <div className="p-5 sm:p-6">
              {mode === 'login' && (
                <LoginForm
                  successMessage={loginSuccessMsg}
                  onSuccess={onSuccess}
                  onSwitchToRegister={() => {
                    setLoginSuccessMsg('');
                    switchMode('register');
                  }}
                  onSwitchToForgot={() => {
                    setLoginSuccessMsg('');
                    switchMode('forgot');
                  }}
                />
              )}

              {mode === 'register' && (
                <RegisterForm
                  onSuccess={(data) => onSuccess(data, true)}
                  onSwitchToLogin={() => switchMode('login')}
                />
              )}

              {mode === 'forgot' && (
                <ForgotPasswordForm
                  onSuccessReset={(msg) => {
                    setLoginSuccessMsg(msg);
                    switchMode('login');
                  }}
                  onSwitchToLogin={() => switchMode('login')}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

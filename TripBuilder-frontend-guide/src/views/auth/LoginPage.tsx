import { useState } from 'react';
import type { AuthResponse } from '@/api/types';
import { GuideApplyForm } from '@/components/auth/GuideApplyForm';
import { GuideLookupForm } from '@/components/auth/GuideLookupForm';
import {
  AlertIcon,
  ArrowRightIcon,
  ClipboardIcon,
  CompassIcon,
  ShieldCheckIcon,
} from '@/components/icon';
import { useLoginForm } from '@/hooks';

type AuthMode = 'login' | 'apply' | 'lookup';

interface LoginPageProps {
  onSuccess: (auth: AuthResponse, rememberMe: boolean) => void;
}

function getInitialMode(): AuthMode {
  if (typeof window === 'undefined') return 'login';
  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode === 'apply' || mode === 'lookup') return mode;
  return 'login';
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>(getInitialMode);
  const [lookupPrefill, setLookupPrefill] = useState<{ email: string; code: string }>({
    email: '',
    code: '',
  });

  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    showPassword,
    setShowPassword,
    loading,
    error,
    handleSubmit,
  } = useLoginForm({ onSuccess });

  const modeTitle =
    mode === 'login'
      ? 'Đăng nhập tài khoản Tour Guide'
      : mode === 'apply'
      ? 'Đăng ký làm Hướng dẫn viên bản địa'
      : 'Tra cứu trạng thái hồ sơ HDV';

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[1280px] grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
        {/* Cột trái: Bàn làm việc tối giản */}
        <section className="lg:col-span-5 rounded-xl bg-[#141415] text-white border border-white/10 shadow-[var(--shadow-editorial)] overflow-hidden flex flex-col justify-between">
          <div className="px-7 py-5 border-b border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-lg bg-coral text-white flex items-center justify-center shrink-0">
                <CompassIcon size={20} />
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
                {mode === 'apply' ? 'Gia nhập mạng lưới thổ địa' : 'Bàn điều phối báo giá thực tế'}
              </div>
              <h1 className="font-display text-3xl sm:text-[2.25rem] font-semibold leading-[1.16] text-white">
                {mode === 'apply'
                  ? 'Thiết kế hành trình chuẩn bản địa tại vùng đất bạn am hiểu nhất'
                  : 'Rà soát lịch trình & chốt báo giá từng chặng cùng khách'}
              </h1>
              <p className="text-base text-[#D4D4D8] leading-relaxed font-normal">
                {mode === 'apply'
                  ? 'Mỗi Hướng dẫn viên gắn bó với 1 vùng điểm đến duy nhất để đảm bảo chất lượng phục vụ và mức độ am hiểu thực tế.'
                  : 'Xem chi tiết từng thay đổi của khách, định giá yêu cầu phát sinh, đề xuất phương án thay thế và quản lý phiên bản tour mẫu bản địa.'}
              </p>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-5 text-sm font-normal text-[#E4E4E7]">
              <div className="flex items-center gap-2.5">
                <ShieldCheckIcon size={18} className="text-[#4CC38A] shrink-0" />
                <span>Hồ sơ đăng ký được Admin thẩm định theo đúng vùng trước khi kích hoạt.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ClipboardIcon size={18} className="text-[#E3B263] shrink-0" />
                <span>Mọi thay đổi đều lưu dấu vết theo từng vòng đàm phán.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Cột phải: Chuyển đổi Đăng nhập / Đăng ký HDV / Tra cứu */}
        <div className="lg:col-span-7 flex flex-col justify-center gap-5">
          {mode === 'login' && error && (
            <div
              role="alert"
              className="rounded-xl border border-crimson/35 bg-crimson-soft px-5 py-3.5 flex items-start gap-3 text-base text-crimson"
            >
              <AlertIcon size={20} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Từ chối truy cập</div>
                <div className="text-sm font-normal">{error}</div>
              </div>
            </div>
          )}

          <div className="flagship-card">
            <div className="bg-surface-2 px-6 py-3.5 border-b border-rule flex flex-wrap items-center justify-between gap-3">
              <span className="editorial-kicker text-ink-2">{modeTitle}</span>
              <div className="inline-flex rounded-lg border border-rule bg-surface p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    mode === 'login' ? 'bg-coral text-white' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => setMode('apply')}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    mode === 'apply' ? 'bg-coral text-white' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  Đăng ký làm HDV
                </button>
                <button
                  type="button"
                  onClick={() => setMode('lookup')}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    mode === 'lookup' ? 'bg-coral text-white' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  Tra cứu hồ sơ
                </button>
              </div>
            </div>

            {mode === 'login' && (
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
                    autoComplete="email"
                    className="field text-base"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="guide-login-pass" className="block text-sm font-medium text-ink-2">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="guide-login-pass"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      autoComplete="current-password"
                      className="field text-base pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1 rounded-md cursor-pointer transition-colors"
                    >
                      {showPassword ? (
                        <svg
                          width="18"
                          height="18"
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
                          width="18"
                          height="18"
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

                <label className="inline-flex items-center gap-2.5 text-sm text-ink-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-rule accent-coral cursor-pointer"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full py-3 text-base"
                >
                  <span>{loading ? 'Đang xác thực...' : 'Mở Bảng điều phối'}</span>
                  <ArrowRightIcon size={18} />
                </button>

                <div className="pt-2 border-t border-rule flex flex-wrap items-center justify-between gap-2 text-xs text-ink-2">
                  <span>Bạn là Hướng dẫn viên bản địa muốn hợp tác?</span>
                  <button
                    type="button"
                    onClick={() => setMode('apply')}
                    className="font-semibold text-coral hover:underline cursor-pointer"
                  >
                    Đăng ký ngay →
                  </button>
                </div>
              </form>
            )}

            {mode === 'apply' && (
              <GuideApplyForm
                onGoToLookup={(targetEmail, targetCode) => {
                  setLookupPrefill({ email: targetEmail, code: targetCode });
                  setMode('lookup');
                }}
                onGoToLogin={() => setMode('login')}
              />
            )}

            {mode === 'lookup' && (
              <GuideLookupForm
                initialEmail={lookupPrefill.email}
                initialCode={lookupPrefill.code}
                onGoToLogin={(approvedEmail) => {
                  if (approvedEmail) {
                    setEmail(approvedEmail);
                    setPassword('');
                  }
                  setMode('login');
                }}
                onGoToApply={() => setMode('apply')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

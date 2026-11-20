import { useEffect, useMemo, useState } from 'react';
import {
  authLogin,
  getDemoAccounts,
  setAuthToken,
  type Booking,
  type DemoAccount,
  type User,
} from '../api';
import { Icon } from './Icon';

export interface DemoSwitcherBarProps {
  currentUser: User | null;
  onSwitchUser: (user: User) => void;
  activeBooking?: Booking | null;
  counterpartPortUrl?: string;
  className?: string;
}

const DEFAULT_ADMIN_URL = import.meta.env.VITE_ADMIN_PORT_URL || 'http://localhost:5174';

export function DemoSwitcherBar({
  currentUser,
  onSwitchUser,
  activeBooking = null,
  counterpartPortUrl = DEFAULT_ADMIN_URL,
  className = '',
}: DemoSwitcherBarProps) {
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState('');

  useEffect(() => {
    let active = true;
    getDemoAccounts()
      .then((list) => {
        if (active) setAccounts(list);
      })
      .catch(() => {
        if (active) setAccounts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSwitch = async (email: string) => {
    if (switchingEmail) return;
    setSwitchingEmail(email);
    setSwitchError('');
    try {
      const res = await authLogin(email, '123456');
      setAuthToken(res.token);
      onSwitchUser(res.user);
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : 'Không thể chuyển tài khoản');
    } finally {
      setSwitchingEmail(null);
    }
  };

  const crossPortalHref = useMemo(() => {
    const base = counterpartPortUrl.replace(/\/+$/, '');
    if (activeBooking?.guide?.email && activeBooking?.code) {
      const params = new URLSearchParams({
        demoEmail: activeBooking.guide.email,
        bookingCode: activeBooking.code,
      });
      return `${base}/?${params.toString()}`;
    }
    return base;
  }, [activeBooking, counterpartPortUrl]);

  return (
    <div
      className={`min-h-[44px] w-full bg-flagship-dark text-white border-b border-white/10 ${className}`.trim()}
      role="region"
      aria-label="Thanh chuyển nhanh tài khoản demo"
    >
      <div className="mx-auto flex min-h-[44px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 py-1.5 text-[14px]">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="shrink-0 text-[13px] font-medium text-[#C7C0B6] pr-1">
            Tài khoản mẫu
          </span>
          {loading ? (
            <span className="text-[13px] font-normal text-[#C7C0B6]">Đang tải tài khoản...</span>
          ) : (
            accounts.map((acc) => {
              const isActive = currentUser?.email === acc.email;
              const isBusy = switchingEmail === acc.email;
              return (
                <button
                  key={acc.id}
                  type="button"
                  disabled={Boolean(switchingEmail)}
                  onClick={() => handleSwitch(acc.email)}
                  aria-pressed={isActive}
                  title={`Đăng nhập nhanh: ${acc.fullName} (${acc.email})`}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1 text-[13px] font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-coral text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  } disabled:opacity-60`}
                >
                  <Icon name="user" size={14} />
                  <span>{isBusy ? 'Đang đổi...' : acc.fullName}</span>
                </button>
              );
            })
          )}
          {switchError && (
            <span className="shrink-0 text-[13px] font-medium text-[#E5484D] pl-1">
              {switchError}
            </span>
          )}
        </div>

        <a
          href={crossPortalHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white/12 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-white/20 border border-white/15 transition-colors"
          title={
            activeBooking?.guide?.email
              ? `Mở Cổng Guide với tài khoản ${activeBooking.guide.fullName} tại đơn ${activeBooking.code}`
              : 'Mở Cổng Tour Guide (:5174)'
          }
        >
          <span>Mở Cổng Guide</span>
          {activeBooking?.code && (
            <span className="num rounded bg-coral px-2 py-0.5 text-[13px] font-medium text-white">
              {activeBooking.code}
            </span>
          )}
          <Icon name="external" size={14} />
        </a>
      </div>
    </div>
  );
}

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

const DEFAULT_CLIENT_URL = import.meta.env.VITE_CLIENT_PORT_URL || 'http://localhost:5173';

export function DemoSwitcherBar({
  currentUser,
  onSwitchUser,
  activeBooking = null,
  counterpartPortUrl = DEFAULT_CLIENT_URL,
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
    if (activeBooking?.customer?.email && activeBooking?.code) {
      const params = new URLSearchParams({
        demoEmail: activeBooking.customer.email,
        bookingCode: activeBooking.code,
      });
      return `${base}/?${params.toString()}`;
    }
    return base;
  }, [activeBooking, counterpartPortUrl]);

  return (
    <div
      className={`min-h-[44px] w-full bg-flagship-dark text-white border-b border-white/15 ${className}`.trim()}
      role="region"
      aria-label="Thanh chuyển nhanh tài khoản Guide demo"
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-3 px-5 py-1.5 text-[14px]">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="shrink-0 text-[13px] font-medium text-[#A1A1AA] pr-1">
            Guide mẫu
          </span>
          {loading ? (
            <span className="text-[13px] text-[#A1A1AA]">Đang tải tài khoản...</span>
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
                  title={`Đăng nhập nhanh: ${acc.fullName}${acc.regionName ? ` · ${acc.regionName}` : ''} (${acc.email})`}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#141415] font-semibold'
                      : 'bg-white/10 text-[#F4F4F5] hover:bg-white/20'
                  } disabled:opacity-60`}
                >
                  <Icon name="user" size={14} />
                  <span>{isBusy ? 'Đang đổi...' : acc.fullName}</span>
                  {acc.regionName && (
                    <span
                      className={`hidden xl:inline text-[13px] ${
                        isActive ? 'text-[#52525B]' : 'text-[#A1A1AA]'
                      }`}
                    >
                      · {acc.regionName}
                    </span>
                  )}
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
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-coral hover:bg-coral-deep px-3 py-1 text-[13px] font-medium text-white transition-colors whitespace-nowrap"
          title={
            activeBooking?.customer?.email
              ? `Mở Cổng Khách với tài khoản ${activeBooking.customer.fullName} tại đơn ${activeBooking.code}`
              : 'Mở Cổng Khách hàng (:5173)'
          }
        >
          <span>Mở Cổng Khách</span>
          {activeBooking?.code && (
            <span className="num rounded bg-black/25 px-1.5 py-0.5 text-[13px] font-medium text-white">
              {activeBooking.code}
            </span>
          )}
          <Icon name="external" size={13} />
        </a>
      </div>
    </div>
  );
}

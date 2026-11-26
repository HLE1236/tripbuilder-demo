import { useEffect, useRef, useState } from 'react';
import { BellIcon, CheckIcon } from '@/components/icon';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/hooks/api';

interface NotificationBellProps {
  enabled: boolean;
  onOpenBooking: (bookingId: number) => void;
}

export function NotificationBell({
  enabled,
  onOpenBooking,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useNotificationsQuery(enabled);
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Thông báo"
        title="Thông báo"
        className="relative h-9 w-9 rounded-xl border border-white/20 bg-white/10 inline-flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/20 cursor-pointer transition-colors duration-150"
      >
        <BellIcon size={16} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="num absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-white text-[11px] font-semibold flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-rule bg-surface text-ink shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 bg-surface-2 border-b border-rule flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-ink">
              Thông báo {unreadCount > 0 ? `(${unreadCount} chưa đọc)` : ''}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={markAllReadMutation.isPending}
                onClick={() => markAllReadMutation.mutate()}
                className="inline-flex items-center gap-1 text-xs font-medium text-coral hover:underline cursor-pointer disabled:opacity-50"
              >
                <CheckIcon size={14} strokeWidth={1.75} />
                <span>Đánh dấu đã đọc hết</span>
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-rule">
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-ink-3">
                Chưa có thông báo nào
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!item.read) {
                      markReadMutation.mutate(item.id);
                    }
                    if (item.relatedBookingId) {
                      onOpenBooking(item.relatedBookingId);
                      setOpen(false);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 transition-colors duration-150 hover:bg-surface-2 cursor-pointer flex items-start gap-2.5 ${
                    !item.read ? 'bg-coral-soft/35' : ''
                  }`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      !item.read ? 'bg-coral' : 'bg-transparent'
                    }`}
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-sm font-semibold text-ink leading-snug">
                      {item.title}
                    </div>
                    <div className="text-xs text-ink-2 leading-relaxed">
                      {item.message}
                    </div>
                    <div className="text-[11px] text-ink-3 num">
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

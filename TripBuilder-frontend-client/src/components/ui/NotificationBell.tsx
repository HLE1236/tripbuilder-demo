import { useEffect, useRef, useState } from 'react';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '../../hooks/api';

interface NotificationBellProps {
  enabled: boolean;
  onNavigateBooking: (bookingId: number) => void;
}

export function NotificationBell({ enabled, onNavigateBooking }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useNotificationsQuery(enabled);
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  if (!enabled) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Thông báo"
        title="Thông báo"
        className="relative h-9 w-9 rounded-lg border border-rule bg-surface hover:bg-surface-2 text-ink-2 flex items-center justify-center transition-colors duration-150 cursor-pointer"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="num absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-white text-[11px] font-semibold flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-rule bg-surface shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 bg-surface-2 border-b border-rule flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">
              Thông báo {unreadCount > 0 ? `(${unreadCount})` : ''}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={markAllReadMutation.isPending}
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs font-medium text-coral hover:underline cursor-pointer disabled:opacity-50"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-rule">
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-ink-3">
                Bạn chưa có thông báo nào.
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
                    setOpen(false);
                    if (item.relatedBookingId) {
                      onNavigateBooking(item.relatedBookingId);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 transition-colors duration-150 cursor-pointer flex items-start gap-2.5 ${
                    item.read ? 'bg-surface hover:bg-surface-2' : 'bg-coral-soft/40 hover:bg-coral-soft/70'
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      item.read ? 'bg-transparent' : 'bg-coral'
                    }`}
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-sm font-semibold text-ink leading-snug">
                      {item.title}
                    </div>
                    <p className="text-xs text-ink-2 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                    <div className="text-[11px] text-ink-3 num">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
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

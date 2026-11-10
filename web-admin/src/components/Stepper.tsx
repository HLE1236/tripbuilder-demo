import type { BookingStatus } from '../api';
import Icon from './Icon';

const LEGS = [
  { idx: 1, title: 'Khách gửi yêu cầu', sub: 'Chọn ngày, số khách, lịch trình' },
  { idx: 2, title: 'Tuỳ chỉnh lịch trình', sub: 'Đổi, bỏ, thêm mục (nếu có)' },
  { idx: 3, title: 'Guide báo giá chốt', sub: 'Điền giá mục mới, ưu đãi đoàn' },
  { idx: 4, title: 'Khách đồng ý', sub: 'Xác nhận tổng chi phí' },
];

const NEXT_ACTION: Record<BookingStatus, { who: string; text: string; tone: string }> = {
  BOOKED_ORIGINAL: {
    who: 'Khách hàng',
    text: 'Đơn đang giữ nguyên lịch trình chuẩn. Bấm “Đồng ý & hoàn tất” để chốt, hoặc “Tuỳ chỉnh lịch trình” nếu muốn đổi dịch vụ.',
    tone: 'text-navy dark:text-navy-ink',
  },
  WAITING_REQUOTE: {
    who: 'Tour Guide',
    text: 'Khách đã tuỳ chỉnh lịch trình. Guide kiểm tra các mục đổi/thêm, điền giá rồi gửi báo giá chốt.',
    tone: 'text-amber',
  },
  REQUOTED: {
    who: 'Khách hàng',
    text: 'Guide đã gửi báo giá chốt. Khách xem bảng so sánh trước/sau bên dưới rồi bấm “Đồng ý & hoàn tất”.',
    tone: 'text-carbon',
  },
  CONFIRMED: {
    who: 'Hoàn tất',
    text: 'Khách đã đồng ý với báo giá. Chuyến đi đã sẵn sàng khởi hành.',
    tone: 'text-green',
  },
  CANCELLED: { who: '', text: '', tone: '' },
};

export default function Stepper({
  status,
  stepIndex,
}: {
  status: BookingStatus;
  stepIndex: number;
}) {
  if (status === 'CANCELLED') {
    return (
      <div className="rounded-lg border border-hairline bg-stock px-5 py-4 flex items-center gap-3 shadow-coupon">
        <span className="stamp text-red anim-stamp">Void · Đã huỷ</span>
        <p className="text-sm text-ink-2">Đơn đặt tour này đã được huỷ. Các coupon bên dưới chỉ còn giá trị tham khảo.</p>
      </div>
    );
  }

  const next = NEXT_ACTION[status];
  const isConfirmed = status === 'CONFIRMED';

  return (
    <section aria-label="Tiến trình đơn đặt tour" className="rounded-lg border border-hairline bg-stock shadow-coupon overflow-hidden">
      <ol className="grid grid-cols-2 lg:grid-cols-4">
        {LEGS.map((leg, i) => {
          const done = isConfirmed || stepIndex > leg.idx;
          const current = !isConfirmed && stepIndex === leg.idx;
          return (
            <li
              key={leg.idx}
              aria-current={current ? 'step' : undefined}
              className={`relative px-4 py-3.5 flex items-start gap-3 ${
                i % 2 === 1 ? 'perf-y' : i === 2 ? 'lg:perf-y' : ''
              } ${i >= 2 ? 'border-t border-hairline lg:border-t-0' : ''} ${
                current ? 'bg-carbon-soft' : ''
              }`}
            >
              <span
                className={`num mt-0.5 grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                  done
                    ? 'bg-green text-stock'
                    : current
                    ? 'bg-carbon text-stock'
                    : 'border border-hairline-strong text-ink-3'
                }`}
              >
                {done ? <Icon name="check" size={14} strokeWidth={2.5} /> : leg.idx}
              </span>
              <div className="min-w-0">
                <p className="coupon-head text-[0.7rem] text-ink-3">Chặng {leg.idx}</p>
                <p className={`text-sm font-semibold leading-snug ${done || current ? 'text-ink' : 'text-ink-3'}`}>
                  {leg.title}
                </p>
                <p className="text-xs text-ink-3 mt-0.5 hidden sm:block">{leg.sub}</p>
              </div>
              {done && (
                <span key={`${status}-${leg.idx}`} className="stamp text-green absolute right-3 top-3 hidden xl:inline-flex anim-stamp">
                  Đã qua
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div key={status} className="perf-x mx-0 px-5 py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 anim-tear">
        <span className={`coupon-head text-sm ${next.tone}`}>
          {isConfirmed ? 'Hoàn tất' : `Việc tiếp theo · ${next.who}`}
        </span>
        <p className="text-sm text-ink-2">{next.text}</p>
      </div>
    </section>
  );
}

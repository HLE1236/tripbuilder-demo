import type { BookingStatus } from '../api';

const STEPS = [
  { idx: 1, title: '1. Đặt Tour', sub: 'Chọn từ Tour Preset gốc' },
  { idx: 2, title: '2. Khách chỉnh sửa', sub: 'Tuỳ chỉnh theo ý muốn' },
  { idx: 3, title: '3. Guide báo giá lại', sub: 'Cập nhật giá từng mục' },
  { idx: 4, title: '4. Khách đồng ý chốt', sub: 'Hoàn tất lịch trình' },
];

export default function Stepper({
  status,
  stepIndex,
}: {
  status: BookingStatus;
  stepIndex: number;
}) {
  if (status === 'CANCELLED') {
    return (
      <div className="bg-gray-100 border border-gray-300 text-gray-600 px-4 py-3 rounded-lg text-sm font-medium text-center">
        Đơn đặt tour này đã bị huỷ.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {STEPS.map((s) => {
          const isDone = stepIndex > s.idx || status === 'CONFIRMED';
          const isCurrent = stepIndex === s.idx && status !== 'CONFIRMED';
          return (
            <div
              key={s.idx}
              className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
                isCurrent
                  ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-300 text-gray-700'
                }`}
              >
                {isDone ? '✓' : s.idx}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-xs font-bold truncate ${
                    isCurrent
                      ? 'text-blue-900'
                      : isDone
                      ? 'text-emerald-900'
                      : 'text-gray-600'
                  }`}
                >
                  {s.title}
                </p>
                <p className="text-[11px] text-gray-500 truncate">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

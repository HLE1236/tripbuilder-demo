import type { BookingStatus } from '../api';

const STEPS = [
  {
    idx: 1,
    title: '1. Khách gửi yêu cầu đặt tour',
    sub: 'Chọn ngày đi, số khách & lịch trình',
  },
  {
    idx: 2,
    title: '2. Tuỳ chỉnh lịch trình (Nếu có)',
    sub: 'Đổi khách sạn, thêm/bớt hoạt động',
  },
  {
    idx: 3,
    title: '3. Guide kiểm tra & Báo giá chốt',
    sub: 'Cập nhật giá mục mới & ưu đãi đoàn',
  },
  {
    idx: 4,
    title: '4. Khách đồng ý & Hoàn tất',
    sub: 'Xác nhận tổng chi phí cuối cùng',
  },
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
      <div className="bg-gray-100 border border-gray-300 text-gray-600 px-4 py-3 rounded-xl text-sm font-semibold text-center">
        ✕ Đơn đặt tour này đã được huỷ.
      </div>
    );
  }

  let nextActionHint = '';
  let hintStyle = 'bg-blue-50 border-blue-200 text-blue-900';

  if (status === 'BOOKED_ORIGINAL') {
    nextActionHint =
      '💡 Đang ở Bước 1: Khách giữ nguyên lịch trình chuẩn. Khách có thể bấm "Đồng ý chốt Tour" ngay hoặc bấm "Tuỳ chỉnh lịch trình" nếu muốn đổi dịch vụ.';
    hintStyle = 'bg-blue-50 border-blue-200 text-blue-900';
  } else if (status === 'WAITING_REQUOTE') {
    nextActionHint =
      '⏳ Đang ở Bước 2 → Chờ Bước 3: Khách đã tuỳ chỉnh lịch trình theo ý muốn. Việc tiếp theo: Tour Guide kiểm tra các mục khách đổi/thêm và gửi Báo giá chốt.';
    hintStyle = 'bg-amber-50 border-amber-300 text-amber-900';
  } else if (status === 'REQUOTED') {
    nextActionHint =
      '📨 Đang ở Bước 3 → Chờ Bước 4: Tour Guide đã gửi Báo giá chốt kèm phản hồi. Việc tiếp theo: Khách hàng xem bảng so sánh giá bên dưới và bấm "Đồng ý & Hoàn tất".';
    hintStyle = 'bg-purple-50 border-purple-300 text-purple-900';
  } else if (status === 'CONFIRMED') {
    nextActionHint =
      '🎉 Hoàn tất cả 4 bước! Khách hàng đã đồng ý với Báo giá chốt của Tour Guide. Chuyến đi đã sẵn sàng khởi hành.';
    hintStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900';
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {STEPS.map((s) => {
          const isDone = stepIndex > s.idx || status === 'CONFIRMED';
          const isCurrent = stepIndex === s.idx && status !== 'CONFIRMED';
          return (
            <div
              key={s.idx}
              className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
                isCurrent
                  ? 'border-blue-500 bg-blue-50/90 ring-2 ring-blue-500/20'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50/60'
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

      {nextActionHint && (
        <div className={`px-3.5 py-2.5 rounded-lg border text-xs font-medium ${hintStyle}`}>
          {nextActionHint}
        </div>
      )}
    </div>
  );
}

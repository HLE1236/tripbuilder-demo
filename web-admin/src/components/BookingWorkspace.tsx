import { useEffect, useState } from 'react';
import {
  cancelBooking,
  confirmBooking,
  formatVnd,
  getBooking,
  getOptionsByRegion,
  noteTypeBadge,
  requoteBooking,
  statusBadge,
  type Booking,
  type BookingStep,
  type PresetOption,
} from '../api';
import Stepper from './Stepper';
import CustomerCustomizeModal from './CustomerCustomizeModal';

interface Props {
  bookingId: number;
  roleMode: 'CUSTOMER' | 'GUIDE';
  onBack: () => void;
  onChanged: (updatedBooking?: Booking) => void;
  onSwitchRoleWithSync?: (targetRole: 'CUSTOMER' | 'GUIDE', booking: Booking) => void;
}

const CATEGORIES = ['Di chuyển', 'Khách sạn', 'Trải nghiệm', 'Ăn uống', 'Yêu cầu thêm'];

const QUICK_ITEM_PRICES = [0, 150000, 300000, 500000, 1000000];
const QUICK_GROUP_AMOUNTS = [100000, 200000, 300000, 500000, 1000000];

const QUICK_GUIDE_NOTES = [
  'Mình đã kiểm tra phòng và cập nhật báo giá chi tiết kèm ưu đãi riêng cho đoàn, bạn xem và xác nhận nhé!',
  'Đã giữ dịch vụ nâng cấp theo đúng yêu cầu của gia đình và tặng kèm phần quà kỷ niệm tại phòng.',
  'Lịch trình đã được điều chỉnh thư thả phù hợp cho người lớn tuổi và trẻ nhỏ trong đoàn.',
];

export default function BookingWorkspace({
  bookingId,
  roleMode,
  onBack,
  onChanged,
  onSwitchRoleWithSync,
}: Props) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [options, setOptions] = useState<PresetOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // State cho Khách hàng mở modal chỉnh sửa
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // State cho Tour Guide chỉnh sửa giá từng mục để Báo giá lại
  const [guideDays, setGuideDays] = useState(2);
  const [guideGuests, setGuideGuests] = useState(2);
  const [guideSteps, setGuideSteps] = useState<BookingStep[]>([]);

  // Chế độ điều chỉnh giá đoàn thân thiện: 'NONE' | 'DISCOUNT' | 'SURCHARGE'
  const [adjustmentMode, setAdjustmentMode] = useState<'NONE' | 'DISCOUNT' | 'SURCHARGE'>('NONE');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);

  const [guideNote, setGuideNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const syncAdjustmentState = (rawAdj: number) => {
    if (rawAdj < 0) {
      setAdjustmentMode('DISCOUNT');
      setAdjustmentAmount(Math.abs(rawAdj));
    } else if (rawAdj > 0) {
      setAdjustmentMode('SURCHARGE');
      setAdjustmentAmount(Math.abs(rawAdj));
    } else {
      setAdjustmentMode('NONE');
      setAdjustmentAmount(0);
    }
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const b = await getBooking(bookingId);
      setBooking(b);
      setGuideDays(b.days);
      setGuideGuests(b.guests);
      setGuideSteps(b.steps.map((s) => ({ ...s })));
      syncAdjustmentState(b.groupAdjustment || 0);
      setGuideNote(b.guideNote || '');
      const opts = await getOptionsByRegion(b.tour.regionId);
      setOptions(opts);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [bookingId]);

  const showMessage = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 5000);
  };

  if (loading) return <p className="text-gray-500 py-8">Đang tải thông tin đơn đặt tour...</p>;
  if (!booking) return <p className="text-red-600 py-8">{error || 'Không tìm thấy đơn'}</p>;

  const badge = statusBadge(booking.status);
  const isFinal = booking.status === 'CONFIRMED' || booking.status === 'CANCELLED';

  // Tính toán số tiền điều chỉnh thực tế gửi về backend (âm nếu giảm giá, dương nếu phụ thu)
  const signedGroupAdjustment =
    adjustmentMode === 'DISCOUNT'
      ? -Math.abs(adjustmentAmount)
      : adjustmentMode === 'SURCHARGE'
      ? Math.abs(adjustmentAmount)
      : 0;

  // Tính toán trực tiếp trên bảng của Guide khi Guide đang sửa giá từng dòng
  const guidePerPerson = guideSteps
    .filter((s) => s.dayNumber <= guideDays && s.noteType !== 'REMOVED')
    .reduce((sum, s) => sum + (Number(s.pricePerPerson) || 0), 0);
  const guideTotal = Math.max(0, guidePerPerson * guideGuests + signedGroupAdjustment);

  const dayNumbers = Array.from(
    { length: roleMode === 'GUIDE' ? guideDays : booking.days },
    (_, i) => i + 1
  );

  // Số mục đã thay đổi để hiển thị trong bảng Tóm tắt Trước & Sau
  const modifiedCount = booking.steps.filter((s) => s.noteType === 'MODIFIED').length;
  const removedCount = booking.steps.filter((s) => s.noteType === 'REMOVED').length;
  const customOrGuideCount = booking.steps.filter(
    (s) => s.noteType === 'CUSTOM' || s.noteType === 'GUIDE'
  ).length;
  const scheduleDeltaTotal =
    (booking.currentPricePerPerson - booking.originalPricePerPerson) * booking.guests;

  // Các hàm thao tác dòng của Guide
  const updateGuideStep = (idx: number, patch: Partial<BookingStep>) => {
    setGuideSteps((prev) =>
      prev.map((s, i) =>
        i === idx
          ? {
              ...s,
              ...patch,
              noteType:
                s.noteType === 'PRESET'
                  ? 'GUIDE'
                  : s.noteType === 'REMOVED' && patch.pricePerPerson && patch.pricePerPerson > 0
                  ? 'GUIDE'
                  : s.noteType,
            }
          : s
      )
    );
  };

  const addGuideStep = (dayNumber: number, opt?: PresetOption) => {
    setGuideSteps((prev) => [
      ...prev,
      opt
        ? {
            dayNumber,
            category: opt.category,
            title: opt.title,
            pricePerPerson: opt.pricePerPerson,
            originalTitle: null,
            originalPricePerPerson: null,
            noteType: 'GUIDE',
          }
        : {
            dayNumber,
            category: 'Trải nghiệm',
            title: '',
            pricePerPerson: 300000,
            originalTitle: null,
            originalPricePerPerson: null,
            noteType: 'GUIDE',
          },
    ]);
  };

  const removeOrRestoreGuideStep = (idx: number) => {
    setGuideSteps((prev) => {
      const target = prev[idx];
      if (!target) return prev;
      if (target.noteType === 'REMOVED') {
        // Khôi phục lại mục khách đã bỏ
        return prev.map((s, i) =>
          i === idx
            ? {
                ...s,
                pricePerPerson: s.originalPricePerPerson ?? 200000,
                noteType: 'PRESET',
              }
            : s
        );
      }
      if (target.originalTitle) {
        // Đánh dấu REMOVED (0đ)
        return prev.map((s, i) =>
          i === idx
            ? {
                ...s,
                pricePerPerson: 0,
                noteType: 'REMOVED',
              }
            : s
        );
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleGuideRequote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const updated = await requoteBooking(booking.id, {
        days: guideDays,
        guests: guideGuests,
        groupAdjustment: signedGroupAdjustment,
        guideNote,
        steps: guideSteps,
      });
      setBooking(updated);
      setGuideSteps(updated.steps.map((s) => ({ ...s })));
      syncAdjustmentState(updated.groupAdjustment || 0);
      showMessage(
        `Đã gửi Báo giá chốt cho khách hàng ${updated.customer.fullName}! Bạn có thể bấm nút "Chuyển sang góc nhìn Khách hàng" ngay bên dưới để duyệt và chốt đơn.`
      );
      onChanged(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerConfirm = async () => {
    setError('');
    setSubmitting(true);
    try {
      const updated = await confirmBooking(booking.id);
      setBooking(updated);
      showMessage('🎉 Chúc mừng! Bạn đã đồng ý chốt Tour và hoàn tất đơn đặt.');
      onChanged(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Bạn chắc chắn muốn huỷ đơn đặt tour này?')) return;
    setError('');
    setSubmitting(true);
    try {
      const updated = await cancelBooking(booking.id);
      setBooking(updated);
      showMessage('Đã huỷ đơn đặt tour.');
      onChanged(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Thanh điều hướng trên + Nút chuyển nhanh đúng tài khoản của đơn này */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-2xs">
        <button
          onClick={onBack}
          className="text-sm font-bold text-blue-700 hover:underline cursor-pointer"
        >
          ← Quay lại danh sách chuyến đi
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-600">
            Đang xem ở chế độ:{' '}
            <strong className={roleMode === 'GUIDE' ? 'text-emerald-700' : 'text-blue-700'}>
              {roleMode === 'GUIDE'
                ? `🧭 Tour Guide (${booking.guide.fullName})`
                : `👤 Khách hàng (${booking.customer.fullName})`}
            </strong>
          </span>

          {onSwitchRoleWithSync && (
            <button
              type="button"
              onClick={() =>
                onSwitchRoleWithSync(
                  roleMode === 'CUSTOMER' ? 'GUIDE' : 'CUSTOMER',
                  booking
                )
              }
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                roleMode === 'CUSTOMER'
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300'
              }`}
            >
              {roleMode === 'CUSTOMER'
                ? `⇄ Đổi sang góc nhìn Guide ${booking.guide.fullName}`
                : `⇄ Đổi sang góc nhìn Khách ${booking.customer.fullName}`}
            </button>
          )}

          <button
            onClick={load}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer"
          >
            ↻ Làm mới
          </button>
        </div>
      </div>

      {/* 1. Thanh tiến trình 4 bước (Stepper) kèm hướng dẫn bước tiếp theo */}
      <Stepper status={booking.status} stepIndex={booking.stepIndex} />

      {toast && (
        <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-900 px-4 py-3 rounded-xl text-sm font-bold flex flex-wrap items-center justify-between gap-2">
          <span>✓ {toast}</span>
          {onSwitchRoleWithSync && booking.status === 'REQUOTED' && roleMode === 'GUIDE' && (
            <button
              type="button"
              onClick={() => onSwitchRoleWithSync('CUSTOMER', booking)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              👤 Sang vai Khách {booking.customer.fullName} để Đồng ý chốt →
            </button>
          )}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* 2. Thẻ thông tin chung & BẢNG SO SÁNH TRƯỚC / SAU (Before & After Comparison) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-extrabold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {booking.code}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${badge.bg}`}>
                {badge.text}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mt-1.5">
              {booking.tour.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              👤 Khách hàng: <strong>{booking.customer.fullName}</strong> ({booking.customer.phone})
              {' · '}
              🧭 Tour Guide: <strong>{booking.guide.fullName}</strong> ({booking.guide.phone})
            </p>
            <p className="text-xs text-gray-500 mt-1">
              📅 Khởi hành: <strong>{booking.startDate}</strong> · ⏱ Thời lượng:{' '}
              <strong>{booking.days} ngày</strong> · 👥 Đoàn:{' '}
              <strong>{booking.guests} khách</strong>
            </p>
          </div>
        </div>

        {/* BẢNG TÓM TẮT SO SÁNH GIÁ TRƯỚC & SAU (4 Ô TRỰC QUAN) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Ô 1: Giá chuẩn ban đầu */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
            <span className="text-[11px] font-bold uppercase text-gray-500 block">
              1. Giá lịch trình chuẩn
            </span>
            <p className="text-lg font-extrabold text-gray-700 mt-1">
              {formatVnd(booking.originalTotalPrice)}
            </p>
            <span className="text-xs text-gray-500 block mt-0.5">
              {formatVnd(booking.originalPricePerPerson)}/khách × {booking.guests} khách
            </span>
          </div>

          {/* Ô 2: Chênh lệch do tuỳ chỉnh lịch trình */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
            <span className="text-[11px] font-bold uppercase text-amber-900 block">
              2. Thay đổi lịch trình
            </span>
            <p
              className={`text-lg font-extrabold mt-1 ${
                scheduleDeltaTotal > 0
                  ? 'text-amber-800'
                  : scheduleDeltaTotal < 0
                  ? 'text-emerald-700'
                  : 'text-gray-700'
              }`}
            >
              {scheduleDeltaTotal > 0
                ? `+${formatVnd(scheduleDeltaTotal)}`
                : scheduleDeltaTotal < 0
                ? formatVnd(scheduleDeltaTotal)
                : '0đ (Giữ nguyên)'}
            </p>
            <span className="text-xs text-gray-600 block mt-0.5">
              {modifiedCount + removedCount + customOrGuideCount === 0
                ? '100% theo lịch trình gốc'
                : [
                    modifiedCount > 0 ? `${modifiedCount} mục đổi` : '',
                    removedCount > 0 ? `${removedCount} mục bỏ` : '',
                    customOrGuideCount > 0 ? `${customOrGuideCount} mục thêm` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
            </span>
          </div>

          {/* Ô 3: Ưu đãi giảm giá / Phụ thu từ Guide */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
            <span className="text-[11px] font-bold uppercase text-emerald-900 block">
              3. Ưu đãi / Điều chỉnh đoàn
            </span>
            <p
              className={`text-lg font-extrabold mt-1 ${
                booking.groupAdjustment < 0
                  ? 'text-emerald-700'
                  : booking.groupAdjustment > 0
                  ? 'text-amber-800'
                  : 'text-gray-600'
              }`}
            >
              {booking.groupAdjustment < 0
                ? `🎁 Giảm ${formatVnd(Math.abs(booking.groupAdjustment))}`
                : booking.groupAdjustment > 0
                ? `➕ Phụ thu ${formatVnd(booking.groupAdjustment)}`
                : '0đ (Không có)'}
            </p>
            <span className="text-xs text-gray-600 block mt-0.5">
              {booking.groupAdjustment < 0
                ? 'Ưu đãi trực tiếp từ Tour Guide'
                : booking.groupAdjustment > 0
                ? 'Phụ thu dịch vụ riêng cho đoàn'
                : 'Áp dụng theo đúng đơn giá từng mục'}
            </span>
          </div>

          {/* Ô 4: Tổng thanh toán cuối cùng */}
          <div className="bg-blue-600 text-white rounded-xl p-3.5 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-blue-100 block">
              4. Tổng chi phí ({booking.guests} khách)
            </span>
            <p className="text-2xl font-extrabold mt-0.5">{formatVnd(booking.totalPrice)}</p>
            <span className="text-xs text-blue-100 block mt-0.5">
              {formatVnd(booking.currentPricePerPerson)}/khách × {booking.guests} khách
              {booking.groupAdjustment !== 0
                ? booking.groupAdjustment < 0
                  ? ` − ${formatVnd(Math.abs(booking.groupAdjustment))}`
                  : ` + ${formatVnd(booking.groupAdjustment)}`
                : ''}
            </span>
          </div>
        </div>

        {/* Hộp hiển thị lời nhắn của Khách và phản hồi của Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
            <span className="text-xs font-bold uppercase text-amber-900 block mb-1">
              👤 Lời nhắn / Ghi chú của Khách hàng ({booking.customer.fullName}):
            </span>
            <p className="text-gray-800">
              {booking.customerNote ? (
                <em>"{booking.customerNote}"</em>
              ) : (
                <span className="text-gray-400">Không có lời nhắn dặn dò thêm.</span>
              )}
            </p>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5">
            <span className="text-xs font-bold uppercase text-blue-900 block mb-1">
              🧭 Phản hồi kèm Báo giá của Tour Guide ({booking.guide.fullName}):
            </span>
            <p className="text-gray-800">
              {booking.guideNote ? (
                <em>"{booking.guideNote}"</em>
              ) : (
                <span className="text-gray-400">
                  {booking.status === 'WAITING_REQUOTE'
                    ? '⏳ Đang chờ Tour Guide kiểm tra các mục tuỳ chỉnh và gửi báo giá chốt...'
                    : 'Chưa có phản hồi thêm từ Tour Guide.'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Thanh nút hành động dành cho KHÁCH HÀNG */}
        {roleMode === 'CUSTOMER' && !isFinal && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-700">
              {booking.status === 'WAITING_REQUOTE' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-amber-900 font-semibold">
                    ⏳ Đơn của bạn đang chờ Tour Guide <strong>{booking.guide.fullName}</strong> kiểm tra và báo giá chốt.
                  </span>
                  {onSwitchRoleWithSync && (
                    <button
                      type="button"
                      onClick={() => onSwitchRoleWithSync('GUIDE', booking)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                    >
                      🧭 Chuyển sang vai Guide {booking.guide.fullName} để Báo giá ngay →
                    </button>
                  )}
                </div>
              ) : (
                <span>
                  Bạn có thể bấm <strong>Tuỳ chỉnh lịch trình</strong> nếu muốn đổi thêm dịch vụ, hoặc bấm{' '}
                  <strong>Đồng ý & Hoàn tất</strong> để chốt chuyến đi với mức giá hiện tại.
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowCustomizeModal(true)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-xs cursor-pointer"
              >
                ✎ Tuỳ chỉnh lại lịch trình
              </button>

              {booking.status !== 'WAITING_REQUOTE' && (
                <button
                  onClick={handleCustomerConfirm}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-xs cursor-pointer"
                >
                  ✓ Đồng ý & Hoàn tất ({formatVnd(booking.totalPrice)})
                </button>
              )}

              <button
                onClick={handleCancel}
                disabled={submitting}
                className="px-3.5 py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer"
              >
                Huỷ đơn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3A. NẾU ĐANG Ở GÓC NHÌN KHÁCH HÀNG: Hiển thị bảng lịch trình kèm so sánh Trước / Sau */}
      {roleMode === 'CUSTOMER' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Chi tiết lịch trình & So sánh đơn giá từng hạng mục
              </h3>
              <p className="text-xs text-gray-500">
                Các mục bạn đã đổi, đã bỏ hoặc yêu cầu thêm đều được hiển thị rõ ràng kèm mức chênh lệch so với lịch trình chuẩn.
              </p>
            </div>
            {!isFinal && (
              <button
                onClick={() => setShowCustomizeModal(true)}
                className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
              >
                ✎ Đổi khách sạn / Thêm hoặc bớt hoạt động
              </button>
            )}
          </div>

          <div className="space-y-3">
            {dayNumbers.map((day) => {
              const daySteps = booking.steps.filter((s) => s.dayNumber === day);
              return (
                <div key={day} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 font-extrabold text-xs text-gray-800 uppercase flex items-center justify-between">
                    <span>NGÀY {day}</span>
                    <span className="text-[11px] font-medium text-gray-500">
                      {daySteps.filter((s) => s.noteType !== 'REMOVED').length} hoạt động
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100 text-sm">
                    {daySteps.map((st, idx) => {
                      const nb = noteTypeBadge(st.noteType);
                      const isRemoved = st.noteType === 'REMOVED';
                      const hasOriginalComparison =
                        st.originalTitle &&
                        (st.originalTitle !== st.title ||
                          (st.originalPricePerPerson != null &&
                            st.originalPricePerPerson !== st.pricePerPerson));

                      return (
                        <div
                          key={idx}
                          className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
                            isRemoved ? 'bg-gray-50/80 opacity-65' : 'bg-white'
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold">
                                {st.category}
                              </span>
                              <span
                                className={`font-bold ${
                                  isRemoved
                                    ? 'line-through text-gray-400'
                                    : 'text-gray-900'
                                }`}
                              >
                                {st.title}
                              </span>
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded border font-bold ${nb.cls}`}
                              >
                                {nb.label}
                              </span>
                            </div>

                            {/* Hiển thị rõ Trước & Sau ngay dưới mục đã thay đổi */}
                            {hasOriginalComparison && !isRemoved && (
                              <p className="text-xs text-gray-500">
                                Đã đổi từ mặc định:{' '}
                                <span className="line-through">
                                  {st.originalTitle} (
                                  {formatVnd(st.originalPricePerPerson)}/khách)
                                </span>
                              </p>
                            )}
                            {isRemoved && st.originalPricePerPerson != null && (
                              <p className="text-xs text-rose-600">
                                Mục gốc đã được bỏ khỏi lịch trình (Giảm trừ{' '}
                                {formatVnd(st.originalPricePerPerson)}/khách)
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            {isRemoved ? (
                              <span className="text-xs font-bold text-gray-400">
                                0đ (Đã bỏ)
                              </span>
                            ) : st.noteType === 'CUSTOM' && st.pricePerPerson === 0 ? (
                              <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200">
                                ⏳ Chờ Guide điền giá
                              </span>
                            ) : (
                              <div>
                                {st.originalPricePerPerson != null &&
                                  st.originalPricePerPerson !== st.pricePerPerson && (
                                    <span className="text-xs text-gray-400 line-through mr-2">
                                      {formatVnd(st.originalPricePerPerson)}
                                    </span>
                                  )}
                                <span className="font-extrabold text-blue-700">
                                  {formatVnd(st.pricePerPerson)} / khách
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3B. NẾU ĐANG Ở GÓC NHÌN TOUR GUIDE: Bảng điều chỉnh Foolproof & Báo giá chốt */}
      {roleMode === 'GUIDE' && (
        <form
          onSubmit={handleGuideRequote}
          className="bg-emerald-50/40 border-2 border-emerald-300 rounded-xl p-5 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-3">
            <div>
              <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-emerald-600 text-white">
                🧭 Bảng Báo giá dành cho Tour Guide ({booking.guide.fullName})
              </span>
              <h3 className="text-lg font-extrabold text-gray-900 mt-1">
                Kiểm tra các mục khách tuỳ chỉnh & Gửi Báo giá chốt
              </h3>
              <p className="text-xs text-gray-600">
                Các mục khách yêu cầu thêm chưa có giá được đóng khung <strong className="text-purple-800">màu tím nổi bật</strong>. Bạn có thể bấm chọn mức giá gợi ý 1 chạm hoặc nhập số tiền cụ thể rồi bấm <strong>Gửi Báo giá chốt</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {dayNumbers.map((day) => {
              const daySteps = guideSteps
                .map((s, idx) => ({ ...s, idx }))
                .filter((s) => s.dayNumber === day);

              return (
                <div
                  key={day}
                  className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-lg bg-gray-900 text-white text-xs font-extrabold">
                      NGÀY {day}
                    </span>
                    <button
                      type="button"
                      onClick={() => addGuideStep(day)}
                      className="text-xs font-bold text-emerald-700 hover:bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-lg cursor-pointer"
                    >
                      + Thêm dòng dịch vụ đề xuất vào Ngày {day}
                    </button>
                  </div>

                  {/* Chèn nhanh dịch vụ gợi ý của khu vực */}
                  {options.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-gray-500">
                        Chèn nhanh dịch vụ tại {booking.tour.regionName}:
                      </span>
                      {options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => addGuideStep(day, opt)}
                          className="text-[11px] bg-gray-50 hover:bg-emerald-50 border border-gray-300 text-gray-700 px-2.5 py-0.5 rounded-full cursor-pointer"
                        >
                          + {opt.title} ({formatVnd(opt.pricePerPerson)})
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {daySteps.map((st) => {
                      const nb = noteTypeBadge(st.noteType);
                      const isRemoved = st.noteType === 'REMOVED';
                      const isNeedsPricing =
                        st.noteType === 'CUSTOM' && st.pricePerPerson === 0;

                      return (
                        <div
                          key={st.idx}
                          className={`p-3 rounded-xl border transition-all space-y-2 ${
                            isRemoved
                              ? 'bg-gray-50 border-gray-200 opacity-65'
                              : isNeedsPricing
                              ? 'bg-purple-50 border-2 border-purple-400 ring-2 ring-purple-400/20'
                              : st.noteType === 'CUSTOM'
                              ? 'bg-purple-50/60 border-purple-300'
                              : st.noteType === 'MODIFIED'
                              ? 'bg-amber-50/70 border-amber-300'
                              : 'bg-gray-50/60 border-gray-200'
                          }`}
                        >
                          {/* Nếu là mục khách yêu cầu thêm chưa có giá -> Hiện thanh nhắc nhở nổi bật + nút chọn giá nhanh */}
                          {st.noteType === 'CUSTOM' && !isRemoved && (
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-purple-200">
                              <span className="text-xs font-extrabold text-purple-900">
                                {st.pricePerPerson === 0
                                  ? '⚠️ Khách yêu cầu thêm mục này — Vui lòng chọn nhanh hoặc nhập đơn giá/khách:'
                                  : '✨ Mục khách yêu cầu thêm — Đã điền đơn giá:'}
                              </span>
                              <div className="flex flex-wrap items-center gap-1">
                                {QUICK_ITEM_PRICES.map((p) => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() =>
                                      updateGuideStep(st.idx, { pricePerPerson: p })
                                    }
                                    className={`text-[11px] px-2 py-0.5 rounded-md font-bold border cursor-pointer ${
                                      st.pricePerPerson === p
                                        ? 'bg-purple-700 text-white border-purple-700'
                                        : 'bg-white hover:bg-purple-100 text-purple-800 border-purple-300'
                                    }`}
                                  >
                                    {p === 0 ? 'Miễn phí 0đ' : formatVnd(p)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 text-sm">
                            <span
                              className={`text-[11px] px-2 py-1 rounded border font-bold shrink-0 ${nb.cls}`}
                            >
                              {nb.label}
                            </span>

                            <select
                              value={st.category}
                              disabled={isRemoved}
                              onChange={(e) =>
                                updateGuideStep(st.idx, { category: e.target.value })
                              }
                              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white shrink-0 font-medium"
                            >
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>

                            <div className="flex-1 min-w-[200px]">
                              <input
                                type="text"
                                required
                                disabled={isRemoved}
                                value={st.title}
                                onChange={(e) =>
                                  updateGuideStep(st.idx, { title: e.target.value })
                                }
                                placeholder="Nhập tên hoạt động / dịch vụ..."
                                className={`w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                                  isRemoved ? 'line-through text-gray-400 bg-gray-100' : ''
                                }`}
                              />
                              {st.originalTitle && st.originalTitle !== st.title && (
                                <span className="text-[11px] text-gray-500 block mt-0.5">
                                  Mặc định ban đầu: <del>{st.originalTitle}</del> (
                                  {formatVnd(st.originalPricePerPerson)}/khách)
                                </span>
                              )}
                            </div>

                            {!isRemoved ? (
                              <div className="flex flex-col items-end shrink-0">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step={50000}
                                    min={0}
                                    value={st.pricePerPerson}
                                    onChange={(e) =>
                                      updateGuideStep(st.idx, {
                                        pricePerPerson: Math.max(
                                          0,
                                          Number(e.target.value) || 0
                                        ),
                                      })
                                    }
                                    className="w-28 bg-white border-2 border-blue-400 rounded-lg px-2.5 py-1 text-right font-extrabold text-blue-700"
                                  />
                                  <span className="text-xs text-gray-600 font-medium">
                                    đ/khách
                                  </span>
                                </div>
                                <span className="text-[11px] font-bold text-blue-700 mt-0.5">
                                  = {formatVnd(st.pricePerPerson)}/khách
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-rose-600 px-2">
                                Đã bỏ (0đ)
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => removeOrRestoreGuideStep(st.idx)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer shrink-0 border ${
                                isRemoved
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'text-rose-600 hover:bg-rose-50 border-rose-200'
                              }`}
                            >
                              {isRemoved ? '↺ Khôi phục' : '✕ Bỏ'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* KHU VỰC ƯU ĐÃI GIẢM GIÁ / PHỤ THU ĐOÀN (FOOLPROOF — KHÔNG BAO GIỜ CẦN GÕ DẤU TRỪ) */}
          <div className="bg-white border border-emerald-200 rounded-xl p-4 space-y-4 text-sm">
            <div className="space-y-2">
              <label className="block font-extrabold text-gray-800">
                1. Điều chỉnh ưu đãi giảm giá hoặc phụ thu cho cả đoàn ({guideGuests} khách):
              </label>

              {/* 3 nút chế độ rõ ràng */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustmentMode('NONE');
                    setAdjustmentAmount(0);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all ${
                    adjustmentMode === 'NONE'
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  Không điều chỉnh (0đ)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdjustmentMode('DISCOUNT');
                    if (adjustmentAmount === 0) setAdjustmentAmount(300000);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all ${
                    adjustmentMode === 'DISCOUNT'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  🎁 Giảm giá ưu đãi cho đoàn (−)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdjustmentMode('SURCHARGE');
                    if (adjustmentAmount === 0) setAdjustmentAmount(200000);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all ${
                    adjustmentMode === 'SURCHARGE'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  ➕ Cộng phụ thu phát sinh (+)
                </button>
              </div>

              {/* Nếu đang chọn Giảm giá hoặc Phụ thu -> Hiện nút chọn nhanh số tiền dương */}
              {adjustmentMode !== 'NONE' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-700 mr-1">
                      {adjustmentMode === 'DISCOUNT'
                        ? 'Chọn nhanh mức giảm giá:'
                        : 'Chọn nhanh mức phụ thu:'}
                    </span>
                    {QUICK_GROUP_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAdjustmentAmount(amt)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border cursor-pointer ${
                          adjustmentAmount === amt
                            ? adjustmentMode === 'DISCOUNT'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        {formatVnd(amt)}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-semibold">Hoặc nhập số tiền:</span>
                    <input
                      type="number"
                      min={0}
                      step={50000}
                      value={adjustmentAmount}
                      onChange={(e) =>
                        setAdjustmentAmount(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-32 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-right font-extrabold text-gray-900"
                    />
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                        adjustmentMode === 'DISCOUNT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {adjustmentMode === 'DISCOUNT'
                        ? `Giảm −${formatVnd(adjustmentAmount)}`
                        : `Cộng +${formatVnd(adjustmentAmount)}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Lời nhắn phản hồi của Tour Guide kèm gợi ý 1 chạm */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <label className="block font-extrabold text-gray-800">
                2. Lời nhắn phản hồi gửi kèm Báo giá chốt cho khách hàng {booking.customer.fullName}:
              </label>
              <div className="flex flex-wrap gap-1.5 pb-1">
                {QUICK_GUIDE_NOTES.map((sample, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setGuideNote(sample)}
                    className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full cursor-pointer text-left"
                  >
                    + Mẫu câu {i + 1}: "{sample.slice(0, 48)}..."
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={guideNote}
                onChange={(e) => setGuideNote(e.target.value)}
                placeholder="VD: Mình đã giữ phòng Du thuyền 5★ và thêm bánh kem tại cabin theo đúng ý vợ chồng bạn nhé!"
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2"
              />
            </div>
          </div>

          {/* Tổng kết Báo giá chốt & Nút gửi */}
          <div className="bg-emerald-600 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="text-xs uppercase font-bold text-emerald-100 block">
                Tổng Báo giá chốt gửi tới khách hàng {booking.customer.fullName}
              </span>
              <p className="text-2xl font-extrabold">
                {formatVnd(guidePerPerson)}/khách × {guideGuests} khách
                {signedGroupAdjustment !== 0
                  ? signedGroupAdjustment > 0
                    ? ` + phụ thu ${formatVnd(signedGroupAdjustment)}`
                    : ` − ưu đãi ${formatVnd(Math.abs(signedGroupAdjustment))}`
                  : ''}{' '}
                = <span className="underline">{formatVnd(guideTotal)}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || isFinal}
              className="px-6 py-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 text-sm font-extrabold shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Đang gửi báo giá...' : '📨 Gửi Báo giá chốt cho Khách hàng'}
            </button>
          </div>
        </form>
      )}

      {/* Modal khi Khách bấm "Tuỳ chỉnh lại lịch trình" trên đơn hiện tại */}
      {showCustomizeModal && (
        <CustomerCustomizeModal
          tour={booking.tour}
          customer={booking.customer}
          existingBooking={booking}
          onClose={() => setShowCustomizeModal(false)}
          onSubmitted={(updated) => {
            setShowCustomizeModal(false);
            setBooking(updated);
            setGuideSteps(updated.steps.map((s) => ({ ...s })));
            syncAdjustmentState(updated.groupAdjustment || 0);
            showMessage(
              'Đã cập nhật lịch trình theo ý muốn và gửi tới Tour Guide để báo giá chốt!'
            );
            onChanged(updated);
          }}
        />
      )}
    </div>
  );
}

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
  onChanged: () => void;
}

const CATEGORIES = ['Di chuyển', 'Khách sạn', 'Trải nghiệm', 'Ăn uống', 'Yêu cầu thêm'];

export default function BookingWorkspace({
  bookingId,
  roleMode,
  onBack,
  onChanged,
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
  const [groupAdjustment, setGroupAdjustment] = useState(0);
  const [guideNote, setGuideNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const b = await getBooking(bookingId);
      setBooking(b);
      setGuideDays(b.days);
      setGuideGuests(b.guests);
      setGuideSteps(b.steps.map((s) => ({ ...s })));
      setGroupAdjustment(b.groupAdjustment || 0);
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
    setTimeout(() => setToast(''), 4000);
  };

  if (loading) return <p className="text-gray-500 py-8">Đang tải thông tin đơn...</p>;
  if (!booking) return <p className="text-red-600 py-8">{error || 'Không tìm thấy đơn'}</p>;

  const badge = statusBadge(booking.status);
  const isFinal = booking.status === 'CONFIRMED' || booking.status === 'CANCELLED';

  // Tính toán trực tiếp trên bảng của Guide khi Guide đang sửa giá từng dòng
  const guidePerPerson = guideSteps.reduce(
    (sum, s) => sum + (Number(s.pricePerPerson) || 0),
    0
  );
  const guideTotal = Math.max(0, guidePerPerson * guideGuests + groupAdjustment);
  const dayNumbers = Array.from(
    { length: roleMode === 'GUIDE' ? guideDays : booking.days },
    (_, i) => i + 1
  );

  // Các hàm thao tác dòng của Guide
  const updateGuideStep = (idx: number, patch: Partial<BookingStep>) => {
    setGuideSteps((prev) =>
      prev.map((s, i) =>
        i === idx
          ? {
              ...s,
              ...patch,
              noteType: s.noteType === 'PRESET' ? 'GUIDE' : s.noteType,
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
            noteType: 'GUIDE',
          }
        : {
            dayNumber,
            category: 'Trải nghiệm',
            title: '',
            pricePerPerson: 300000,
            noteType: 'GUIDE',
          },
    ]);
  };

  const removeGuideStep = (idx: number) => {
    setGuideSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGuideRequote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const updated = await requoteBooking(booking.id, {
        days: guideDays,
        guests: guideGuests,
        groupAdjustment,
        guideNote,
        steps: guideSteps,
      });
      setBooking(updated);
      showMessage(
        'Đã gửi Báo giá lại cho khách hàng! Bạn có thể chuyển sang góc nhìn Khách hàng trên thanh Header để xem và bấm Đồng ý chốt.'
      );
      onChanged();
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
      showMessage('Chúc mừng! Khách hàng đã đồng ý chốt Tour thành công.');
      onChanged();
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
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Thanh điều hướng trên */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer"
        >
          ← Quay lại danh sách đơn đặt tour
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Đang xem dưới góc nhìn:{' '}
            <strong className={roleMode === 'GUIDE' ? 'text-emerald-700' : 'text-blue-700'}>
              {roleMode === 'GUIDE' ? '🧭 Tour Guide' : '👤 Khách hàng'}
            </strong>
          </span>
          <button
            onClick={load}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer"
          >
            ↻ Làm mới
          </button>
        </div>
      </div>

      {/* 1. Thanh tiến trình 4 bước (Stepper) */}
      <Stepper status={booking.status} stepIndex={booking.stepIndex} />

      {toast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-sm font-semibold">
          ✓ {toast}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* 2. Thẻ thông tin chung & So sánh Giá gốc vs Giá hiện tại/báo lại */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-gray-500">{booking.code}</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${badge.bg}`}>
                {badge.text}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-1">{booking.tour.title}</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Khách hàng: <strong>{booking.customer.fullName}</strong> ({booking.customer.phone}) ·
              Tour Guide: <strong>{booking.guide.fullName}</strong> ({booking.guide.phone})
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Ngày khởi hành: <strong>{booking.startDate}</strong> · Thời lượng:{' '}
              <strong>{booking.days} ngày</strong> · Số lượng:{' '}
              <strong>{booking.guests} khách</strong>
            </p>
          </div>

          {/* Hộp so sánh Giá gốc vs Giá báo lại */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-right">
              <span className="text-[11px] text-gray-500 block">
                Giá gốc Tour Preset ({booking.guests} khách)
              </span>
              <span className="text-base font-bold text-gray-600 line-through">
                {formatVnd(booking.originalTotalPrice)}
              </span>
              <span className="block text-[11px] text-gray-400">
                ({formatVnd(booking.originalPricePerPerson)}/khách)
              </span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-right">
              <span className="text-[11px] font-semibold text-blue-700 block">
                {booking.status === 'REQUOTED' || booking.status === 'CONFIRMED'
                  ? 'Tổng Giá Guide báo lại'
                  : 'Tổng Giá theo lịch trình hiện tại'}
              </span>
              <span className="text-2xl font-extrabold text-blue-700">
                {formatVnd(booking.totalPrice)}
              </span>
              <span className="block text-[11px] text-blue-600">
                ({formatVnd(booking.currentPricePerPerson)}/khách × {booking.guests} khách
                {booking.groupAdjustment !== 0
                  ? booking.groupAdjustment > 0
                    ? ` + phụ thu ${formatVnd(booking.groupAdjustment)}`
                    : ` - giảm ${formatVnd(-booking.groupAdjustment)}`
                  : ''}
                )
              </span>
            </div>
          </div>
        </div>

        {/* Hộp hiển thị lời nhắn của Khách và phản hồi của Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3">
            <span className="text-xs font-bold uppercase text-amber-800 block mb-1">
              👤 Yêu cầu / Ghi chú của Khách hàng:
            </span>
            <p className="text-gray-800">
              {booking.customerNote ? (
                <em>"{booking.customerNote}"</em>
              ) : (
                <span className="text-gray-400">Không có ghi chú thêm.</span>
              )}
            </p>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3">
            <span className="text-xs font-bold uppercase text-blue-800 block mb-1">
              🧭 Phản hồi / Ghi chú Báo giá của Tour Guide:
            </span>
            <p className="text-gray-800">
              {booking.guideNote ? (
                <em>"{booking.guideNote}"</em>
              ) : (
                <span className="text-gray-400">
                  {booking.status === 'WAITING_REQUOTE'
                    ? 'Đang chờ Tour Guide kiểm tra và gửi báo giá lại...'
                    : 'Chưa có ghi chú phản hồi.'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Nút thao tác dành cho KHÁCH HÀNG */}
        {roleMode === 'CUSTOMER' && !isFinal && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-600">
              {booking.status === 'WAITING_REQUOTE' ? (
                <span className="text-amber-800 font-semibold">
                  ⏳ Đơn của bạn đang chờ Tour Guide báo giá lại. (Mẹo demo: bấm nút chuyển sang vai 🧭 Tour Guide ở góc trên để báo giá lại ngay!)
                </span>
              ) : (
                <span>
                  Bạn có thể bấm <strong>Chỉnh sửa theo ý muốn</strong> để thay đổi lịch trình, hoặc bấm{' '}
                  <strong>Đồng ý chốt</strong> nếu đã ưng ý với mức giá hiện tại.
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowCustomizeModal(true)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-xs cursor-pointer"
              >
                ✎ Chỉnh sửa theo ý muốn
              </button>

              {booking.status !== 'WAITING_REQUOTE' && (
                <button
                  onClick={handleCustomerConfirm}
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs cursor-pointer"
                >
                  ✓ Đồng ý chốt Tour ({formatVnd(booking.totalPrice)})
                </button>
              )}

              <button
                onClick={handleCancel}
                disabled={submitting}
                className="px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-medium cursor-pointer"
              >
                Huỷ đơn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3A. NẾU ĐANG Ở GÓC NHÌN KHÁCH HÀNG: Hiển thị bảng lịch trình & giá từng mục sạch sẽ */}
      {roleMode === 'CUSTOMER' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-base">
              Chi tiết lịch trình & Đơn giá từng hạng mục ({booking.steps.length} mục)
            </h3>
            <button
              onClick={() => setShowCustomizeModal(true)}
              className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
            >
              ✎ Bấm vào đây nếu muốn thêm/bớt hoặc sửa lịch trình
            </button>
          </div>

          <div className="space-y-3">
            {dayNumbers.map((day) => {
              const daySteps = booking.steps.filter((s) => s.dayNumber === day);
              return (
                <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 font-bold text-xs text-gray-800 uppercase">
                    Ngày {day}
                  </div>
                  <div className="divide-y divide-gray-100 text-sm">
                    {daySteps.map((st, idx) => {
                      const nb = noteTypeBadge(st.noteType);
                      return (
                        <div
                          key={idx}
                          className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-white"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                              {st.category}
                            </span>
                            <span className="font-medium text-gray-900">{st.title}</span>
                            {st.noteType !== 'PRESET' && (
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${nb.cls}`}
                              >
                                {nb.label}
                              </span>
                            )}
                          </div>

                          <div className="font-semibold text-gray-800">
                            {st.noteType === 'CUSTOM' && st.pricePerPerson === 0 ? (
                              <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                Chờ Guide điền giá
                              </span>
                            ) : (
                              <span>{formatVnd(st.pricePerPerson)} / khách</span>
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

      {/* 3B. NẾU ĐANG Ở GÓC NHÌN TOUR GUIDE: Bảng điều chỉnh từng dòng & Báo giá lại */}
      {roleMode === 'GUIDE' && (
        <form
          onSubmit={handleGuideRequote}
          className="bg-emerald-50/40 border-2 border-emerald-300 rounded-xl p-5 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-3">
            <div>
              <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-600 text-white">
                Công cụ dành cho Tour Guide
              </span>
              <h3 className="text-lg font-bold text-gray-900 mt-1">
                Kiểm tra lịch trình khách yêu cầu & Báo giá lại từng mục
              </h3>
              <p className="text-xs text-gray-600">
                Các dòng màu vàng/tím là phần khách đã sửa hoặc tự gõ thêm. Bạn có thể sửa trực tiếp nội dung và giá tiền từng dòng bên dưới rồi bấm <strong>Gửi Báo giá lại</strong>.
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
                  className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded bg-gray-900 text-white text-xs font-bold">
                      NGÀY {day}
                    </span>
                    <button
                      type="button"
                      onClick={() => addGuideStep(day)}
                      className="text-xs font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-lg cursor-pointer"
                    >
                      + Thêm mục đề xuất vào Ngày {day}
                    </button>
                  </div>

                  {/* Chèn nhanh dịch vụ gợi ý của khu vực */}
                  {options.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-gray-500">Đề xuất nhanh:</span>
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

                  <div className="space-y-2">
                    {daySteps.map((st) => {
                      const nb = noteTypeBadge(st.noteType);
                      return (
                        <div
                          key={st.idx}
                          className={`p-2.5 rounded-lg border flex flex-wrap sm:flex-nowrap items-center gap-2 text-sm ${
                            st.noteType === 'CUSTOM'
                              ? 'bg-purple-50 border-purple-300'
                              : st.noteType === 'MODIFIED'
                              ? 'bg-amber-50 border-amber-300'
                              : 'bg-gray-50/70 border-gray-200'
                          }`}
                        >
                          <span
                            className={`text-[11px] px-2 py-1 rounded border font-semibold shrink-0 ${nb.cls}`}
                          >
                            {nb.label}
                          </span>

                          <select
                            value={st.category}
                            onChange={(e) =>
                              updateGuideStep(st.idx, { category: e.target.value })
                            }
                            className="border border-gray-300 rounded px-2 py-1.5 text-xs bg-white shrink-0"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            required
                            value={st.title}
                            onChange={(e) => updateGuideStep(st.idx, { title: e.target.value })}
                            className="flex-1 min-w-[200px] bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-medium"
                          />

                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              type="number"
                              step={50000}
                              min={0}
                              value={st.pricePerPerson}
                              onChange={(e) =>
                                updateGuideStep(st.idx, {
                                  pricePerPerson: Number(e.target.value) || 0,
                                })
                              }
                              className="w-28 bg-white border border-blue-400 rounded px-2.5 py-1.5 text-right font-bold text-blue-700"
                            />
                            <span className="text-xs text-gray-500">đ/khách</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeGuideStep(st.idx)}
                            className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded cursor-pointer shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phụ thu / Giảm giá đoàn & Lời nhắn của Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white border border-emerald-200 rounded-xl p-4 text-sm">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Ưu đãi giảm giá (-) hoặc Phụ thu (+) cả đoàn (VNĐ)
              </label>
              <input
                type="number"
                step={50000}
                value={groupAdjustment}
                onChange={(e) => setGroupAdjustment(Number(e.target.value) || 0)}
                placeholder="VD: -300000 (giảm 300k)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 font-semibold"
              />
              <span className="text-[11px] text-gray-500">
                Nhập số âm (VD: -300000) để giảm giá cho đoàn, số dương để cộng phụ thu.
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 mb-1">
                Lời nhắn phản hồi của Tour Guide kèm theo Báo giá lại
              </label>
              <input
                type="text"
                value={guideNote}
                onChange={(e) => setGuideNote(e.target.value)}
                placeholder="VD: Mình đã giữ phòng Du thuyền 5★ và thêm bánh kem tại cabin theo đúng ý vợ chồng bạn nhé!"
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2"
              />
            </div>
          </div>

          {/* Tổng kết Báo giá lại & Nút gửi */}
          <div className="bg-emerald-600 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-emerald-100 block">
                Tổng Báo giá lại sẽ gửi cho khách hàng {booking.customer.fullName}
              </span>
              <p className="text-2xl font-extrabold">
                {formatVnd(guidePerPerson)}/khách × {guideGuests} khách
                {groupAdjustment !== 0
                  ? groupAdjustment > 0
                    ? ` + ${formatVnd(groupAdjustment)}`
                    : ` - ${formatVnd(-groupAdjustment)}`
                  : ''}{' '}
                = <span className="underline">{formatVnd(guideTotal)}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || isFinal}
              className="px-6 py-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 text-sm font-extrabold shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Đang gửi báo giá...' : '📨 Gửi Báo giá lại cho Khách hàng'}
            </button>
          </div>
        </form>
      )}

      {/* Modal khi Khách bấm "Chỉnh sửa theo ý muốn" trên đơn hiện tại */}
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
            showMessage(
              'Đã cập nhật lịch trình theo ý muốn và gửi yêu cầu Báo giá lại cho Tour Guide!'
            );
            onChanged();
          }}
        />
      )}
    </div>
  );
}

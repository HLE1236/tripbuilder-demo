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
import Icon, { categoryIconName } from './Icon';

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

  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const [guideDays, setGuideDays] = useState(2);
  const [guideGuests, setGuideGuests] = useState(2);
  const [guideSteps, setGuideSteps] = useState<BookingStep[]>([]);

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

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-24 rounded-lg border border-hairline bg-stock animate-pulse" />
        <div className="h-64 rounded-lg border border-hairline bg-stock animate-pulse" />
      </div>
    );
  }
  if (!booking) {
    return (
      <div role="alert" className="rounded-lg border border-red/40 bg-red-soft p-5 text-sm text-ink">
        <p className="font-semibold text-red">{error || 'Không tìm thấy đơn đặt tour.'}</p>
        <button type="button" onClick={onBack} className="btn btn-ghost btn-sm mt-3">
          <Icon name="arrow-left" size={14} />
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const badge = statusBadge(booking.status);
  const isFinal = booking.status === 'CONFIRMED' || booking.status === 'CANCELLED';

  const signedGroupAdjustment =
    adjustmentMode === 'DISCOUNT'
      ? -Math.abs(adjustmentAmount)
      : adjustmentMode === 'SURCHARGE'
      ? Math.abs(adjustmentAmount)
      : 0;

  const guidePerPerson = guideSteps
    .filter((s) => s.dayNumber <= guideDays && s.noteType !== 'REMOVED')
    .reduce((sum, s) => sum + (Number(s.pricePerPerson) || 0), 0);
  const guideTotal = Math.max(0, guidePerPerson * guideGuests + signedGroupAdjustment);

  const dayNumbers = Array.from(
    { length: roleMode === 'GUIDE' ? guideDays : booking.days },
    (_, i) => i + 1
  );

  const modifiedCount = booking.steps.filter((s) => s.noteType === 'MODIFIED').length;
  const removedCount = booking.steps.filter((s) => s.noteType === 'REMOVED').length;
  const customOrGuideCount = booking.steps.filter(
    (s) => s.noteType === 'CUSTOM' || s.noteType === 'GUIDE'
  ).length;
  const scheduleDeltaTotal =
    (booking.currentPricePerPerson - booking.originalPricePerPerson) * booking.guests;

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
      showMessage(`Đã gửi báo giá chốt cho khách hàng ${updated.customer.fullName}.`);
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
      showMessage('Bạn đã đồng ý chốt tour và hoàn tất đơn đặt.');
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
    <div className="space-y-6">
      {/* Thanh điều hướng trên */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="btn btn-ghost btn-sm">
          <Icon name="arrow-left" size={14} />
          Quay lại danh sách
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-2">
            Góc nhìn hiện tại:{' '}
            <strong className="text-ink">
              {roleMode === 'GUIDE'
                ? `Tour Guide (${booking.guide.fullName})`
                : `Khách hàng (${booking.customer.fullName})`}
            </strong>
          </span>

          {onSwitchRoleWithSync && (
            <button
              type="button"
              onClick={() =>
                onSwitchRoleWithSync(roleMode === 'CUSTOMER' ? 'GUIDE' : 'CUSTOMER', booking)
              }
              className="btn btn-ghost btn-sm"
            >
              <Icon name="swap" size={14} />
              {roleMode === 'CUSTOMER'
                ? `Sang góc nhìn Guide ${booking.guide.fullName}`
                : `Sang góc nhìn Khách ${booking.customer.fullName}`}
            </button>
          )}

          <button type="button" onClick={load} className="btn btn-ghost btn-sm">
            <Icon name="refresh" size={14} />
            Làm mới
          </button>
        </div>
      </div>

      {/* 1. Tiến trình 4 chặng */}
      <Stepper status={booking.status} stepIndex={booking.stepIndex} />

      {toast && (
        <div
          role="status"
          className="rounded-lg border border-green/40 bg-green-soft px-4 py-3 text-sm font-semibold text-ink flex flex-wrap items-center justify-between gap-2 anim-rise"
        >
          <span className="inline-flex items-center gap-2">
            <Icon name="check" size={16} className="text-green" />
            {toast}
          </span>
          {onSwitchRoleWithSync && booking.status === 'REQUOTED' && roleMode === 'GUIDE' && (
            <button
              type="button"
              onClick={() => onSwitchRoleWithSync('CUSTOMER', booking)}
              className="btn btn-primary btn-sm"
            >
              Sang vai Khách {booking.customer.fullName} để đồng ý chốt
              <Icon name="arrow-right" size={14} />
            </button>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red/40 bg-red-soft px-4 py-3 text-sm text-ink flex items-center gap-2">
          <Icon name="alert" size={16} className="text-red" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Tờ vé chính: Thông tin chuyến + Bảng so sánh giá 4 ô + Lời nhắn 2 bên */}
      <section aria-label="Thông tin vé và bảng giá" className="rounded-lg border border-hairline bg-stock shadow-coupon overflow-hidden">
        {/* Đầu vé */}
        <div className="p-5 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="num rounded bg-stock-2 border border-hairline px-2 py-0.5 text-xs font-bold text-ink">
                {booking.code}
              </span>
              <span key={booking.status} className={`stamp ${badge.bg} anim-stamp`}>
                {badge.stamp}
              </span>
              <span className="text-xs text-ink-3">{badge.text}</span>
            </div>

            <h1 className="font-head text-3xl font-bold uppercase tracking-wide text-ink">
              {booking.tour.title}
            </h1>

            <p className="text-sm text-ink-2 flex flex-wrap gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="user" size={14} className="text-ink-3" />
                Khách: <strong className="text-ink">{booking.customer.fullName}</strong> ({booking.customer.phone})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="compass" size={14} className="text-ink-3" />
                Guide: <strong className="text-ink">{booking.guide.fullName}</strong> ({booking.guide.phone})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="calendar" size={14} className="text-ink-3" />
                Khởi hành: <strong className="num text-ink">{booking.startDate}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="users" size={14} className="text-ink-3" />
                <strong className="num text-ink">{booking.days}</strong> ngày ·{' '}
                <strong className="num text-ink">{booking.guests}</strong> khách
              </span>
            </p>
          </div>
        </div>

        {/* 4 ô so sánh Trước / Sau kẻ hairline */}
        <div className="perf-x grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-hairline bg-stock-2">
          <div className="p-4">
            <span className="coupon-head block text-[0.7rem] text-ink-3">1. Giá lịch trình chuẩn</span>
            <p className="num mt-1 text-lg font-bold text-ink">{formatVnd(booking.originalTotalPrice)}</p>
            <span className="num text-xs text-ink-3">
              {formatVnd(booking.originalPricePerPerson)}/khách × {booking.guests} khách
            </span>
          </div>

          <div className="p-4">
            <span className="coupon-head block text-[0.7rem] text-ink-3">2. Thay đổi lịch trình</span>
            <p
              className={`num mt-1 text-lg font-bold ${
                scheduleDeltaTotal > 0
                  ? 'text-amber'
                  : scheduleDeltaTotal < 0
                  ? 'text-green'
                  : 'text-ink-2'
              }`}
            >
              {scheduleDeltaTotal > 0
                ? `+${formatVnd(scheduleDeltaTotal)}`
                : scheduleDeltaTotal < 0
                ? formatVnd(scheduleDeltaTotal)
                : '0đ (giữ nguyên)'}
            </p>
            <span className="text-xs text-ink-3">
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

          <div className="p-4">
            <span className="coupon-head block text-[0.7rem] text-ink-3">3. Ưu đãi / điều chỉnh đoàn</span>
            <p
              className={`num mt-1 text-lg font-bold ${
                booking.groupAdjustment < 0
                  ? 'text-green'
                  : booking.groupAdjustment > 0
                  ? 'text-amber'
                  : 'text-ink-2'
              }`}
            >
              {booking.groupAdjustment < 0
                ? `−${formatVnd(Math.abs(booking.groupAdjustment))}`
                : booking.groupAdjustment > 0
                ? `+${formatVnd(booking.groupAdjustment)}`
                : '0đ'}
            </p>
            <span className="text-xs text-ink-3">
              {booking.groupAdjustment < 0
                ? 'Ưu đãi trực tiếp từ Tour Guide'
                : booking.groupAdjustment > 0
                ? 'Phụ thu dịch vụ riêng cho đoàn'
                : 'Không phát sinh điều chỉnh'}
            </span>
          </div>

          <div className="p-4 bg-carbon-soft">
            <span className="coupon-head block text-[0.7rem] text-carbon">
              4. Tổng thanh toán ({booking.guests} khách)
            </span>
            <p className="num mt-1 text-2xl font-bold text-carbon">{formatVnd(booking.totalPrice)}</p>
            <span className="num text-xs text-ink-2">
              {formatVnd(booking.currentPricePerPerson)}/khách × {booking.guests}
              {booking.groupAdjustment !== 0
                ? booking.groupAdjustment < 0
                  ? ` − ${formatVnd(Math.abs(booking.groupAdjustment))}`
                  : ` + ${formatVnd(booking.groupAdjustment)}`
                : ''}
            </span>
          </div>
        </div>

        {/* Lời nhắn của Khách và Phản hồi của Guide */}
        <div className="border-t border-hairline grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-hairline text-sm">
          <div className="p-4">
            <span className="coupon-head block text-[0.7rem] text-ink-3 mb-1">
              Lời nhắn của khách ({booking.customer.fullName})
            </span>
            <p className="text-ink">
              {booking.customerNote ? (
                `“${booking.customerNote}”`
              ) : (
                <span className="text-ink-3">Không có lời nhắn dặn dò thêm.</span>
              )}
            </p>
          </div>

          <div className="p-4">
            <span className="coupon-head block text-[0.7rem] text-ink-3 mb-1">
              Phản hồi kèm báo giá của Guide ({booking.guide.fullName})
            </span>
            <p className="text-ink">
              {booking.guideNote ? (
                `“${booking.guideNote}”`
              ) : (
                <span className="text-ink-3">
                  {booking.status === 'WAITING_REQUOTE'
                    ? 'Đang chờ Guide kiểm tra các mục tuỳ chỉnh và gửi báo giá chốt...'
                    : 'Chưa có phản hồi thêm từ Guide.'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Hàng nút thao tác cho Khách hàng */}
        {roleMode === 'CUSTOMER' && !isFinal && (
          <div className="perf-x p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-ink-2">
              {booking.status === 'WAITING_REQUOTE' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span>
                    Đơn đang chờ Guide <strong className="text-ink">{booking.guide.fullName}</strong> kiểm tra và báo giá chốt.
                  </span>
                  {onSwitchRoleWithSync && (
                    <button
                      type="button"
                      onClick={() => onSwitchRoleWithSync('GUIDE', booking)}
                      className="btn btn-primary btn-sm"
                    >
                      <Icon name="compass" size={14} />
                      Sang vai Guide {booking.guide.fullName} để báo giá ngay
                    </button>
                  )}
                </div>
              ) : (
                <span>
                  Bấm <strong className="text-ink">Tuỳ chỉnh lại lịch trình</strong> nếu muốn đổi thêm dịch vụ, hoặc{' '}
                  <strong className="text-ink">Đồng ý & hoàn tất</strong> để chốt chuyến đi.
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowCustomizeModal(true)}
                disabled={submitting}
                className="btn btn-ghost"
              >
                <Icon name="pencil" size={15} />
                Tuỳ chỉnh lại lịch trình
              </button>

              {booking.status !== 'WAITING_REQUOTE' && (
                <button
                  type="button"
                  onClick={handleCustomerConfirm}
                  disabled={submitting}
                  className="btn btn-confirm btn-lg"
                >
                  <Icon name="check" size={16} />
                  Đồng ý & hoàn tất ({formatVnd(booking.totalPrice)})
                </button>
              )}

              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="btn btn-danger"
              >
                Huỷ đơn
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3A. GÓC NHÌN KHÁCH HÀNG: Danh sách coupon theo ngày */}
      {roleMode === 'CUSTOMER' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-head text-2xl font-bold uppercase tracking-wide text-ink">
                Chi tiết các coupon theo ngày
              </h2>
              <p className="text-xs text-ink-2">
                Mọi mục đã đổi, đã bỏ hoặc yêu cầu thêm đều có con dấu đối chiếu với lịch trình chuẩn.
              </p>
            </div>
            {!isFinal && (
              <button type="button" onClick={() => setShowCustomizeModal(true)} className="btn btn-ghost btn-sm">
                <Icon name="pencil" size={14} />
                Đổi khách sạn / thêm bớt hoạt động
              </button>
            )}
          </div>

          {dayNumbers.map((day) => {
            const daySteps = booking.steps.filter((s) => s.dayNumber === day);
            return (
              <section
                key={day}
                aria-label={`Chi tiết ngày ${day}`}
                className="rounded-lg border border-hairline bg-stock shadow-coupon overflow-hidden"
              >
                <div className="bg-stock-2 px-4 py-2.5 border-b border-hairline flex items-center justify-between">
                  <span className="coupon-head text-sm text-ink">Coupon ngày {day}</span>
                  <span className="num text-xs text-ink-3">
                    {daySteps.filter((s) => s.noteType !== 'REMOVED').length} hoạt động
                  </span>
                </div>

                <div className="divide-y divide-hairline">
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
                          isRemoved ? 'bg-stock-2/70' : ''
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded border border-hairline bg-stock-2 px-2 py-0.5 text-xs font-medium text-ink-2">
                              <Icon name={categoryIconName(st.category)} size={13} />
                              {st.category}
                            </span>
                            <span
                              className={`text-sm font-semibold ${
                                isRemoved ? 'line-through text-ink-3' : 'text-ink'
                              }`}
                            >
                              {st.title}
                            </span>
                            {st.noteType !== 'PRESET' && (
                              <span className={`stamp ${nb.cls}`}>{nb.label}</span>
                            )}
                          </div>

                          {hasOriginalComparison && !isRemoved && (
                            <p className="text-xs text-ink-3">
                              Đã đổi từ mặc định:{' '}
                              <span className="line-through">
                                {st.originalTitle} ({formatVnd(st.originalPricePerPerson)}/khách)
                              </span>
                            </p>
                          )}
                          {isRemoved && st.originalPricePerPerson != null && (
                            <p className="text-xs text-red">
                              Đã bỏ khỏi lịch trình (trừ <span className="num">{formatVnd(st.originalPricePerPerson)}</span>/khách)
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          {isRemoved ? (
                            <span className="num text-xs font-semibold text-ink-3">0đ</span>
                          ) : st.noteType === 'CUSTOM' && st.pricePerPerson === 0 ? (
                            <span className="text-xs font-semibold text-carbon">
                              Chờ Guide điền giá
                            </span>
                          ) : (
                            <div>
                              {st.originalPricePerPerson != null &&
                                st.originalPricePerPerson !== st.pricePerPerson && (
                                  <span className="num text-xs text-ink-3 line-through mr-2">
                                    {formatVnd(st.originalPricePerPerson)}
                                  </span>
                                )}
                              <span className="num text-sm font-bold text-carbon">
                                {formatVnd(st.pricePerPerson)}
                              </span>
                              <span className="text-xs text-ink-3">/khách</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* 3B. GÓC NHÌN TOUR GUIDE: Bảng kiểm tra & Báo giá chốt */}
      {roleMode === 'GUIDE' && (
        <form onSubmit={handleGuideRequote} className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-head text-2xl font-bold uppercase tracking-wide text-ink">
                Bảng báo giá dành cho Guide {booking.guide.fullName}
              </h2>
              <p className="text-xs text-ink-2">
                Các mục khách yêu cầu thêm chưa có giá được đánh dấu nổi bật. Chọn mức giá gợi ý hoặc nhập số tiền rồi bấm <strong>Gửi báo giá chốt</strong>.
              </p>
            </div>
          </div>

          {dayNumbers.map((day) => {
            const daySteps = guideSteps
              .map((s, idx) => ({ ...s, idx }))
              .filter((s) => s.dayNumber === day);

            return (
              <section
                key={day}
                aria-label={`Báo giá ngày ${day}`}
                className="rounded-lg border border-hairline bg-stock shadow-coupon overflow-hidden"
              >
                <div className="bg-stock-2 px-4 py-2.5 border-b border-hairline flex flex-wrap items-center justify-between gap-2">
                  <span className="coupon-head text-sm text-ink">Coupon ngày {day}</span>
                  <button
                    type="button"
                    onClick={() => addGuideStep(day)}
                    className="btn btn-ghost btn-sm"
                  >
                    <Icon name="plus" size={14} />
                    Thêm dòng dịch vụ vào Ngày {day}
                  </button>
                </div>

                {options.length > 0 && (
                  <div className="px-4 py-2.5 bg-stock-2/60 border-b border-hairline flex flex-wrap items-center gap-1.5">
                    <span className="coupon-head text-[0.7rem] text-ink-3 mr-1">
                      Chèn nhanh tại {booking.tour.regionName}:
                    </span>
                    {options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => addGuideStep(day, opt)}
                        className="chip"
                      >
                        <Icon name="plus" size={12} />
                        {opt.title}
                        <span className="num text-xs text-carbon">{formatVnd(opt.pricePerPerson)}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="divide-y divide-hairline">
                  {daySteps.map((st) => {
                    const nb = noteTypeBadge(st.noteType);
                    const isRemoved = st.noteType === 'REMOVED';
                    const isNeedsPricing = st.noteType === 'CUSTOM' && st.pricePerPerson === 0;

                    return (
                      <div
                        key={st.idx}
                        className={`p-4 space-y-2.5 ${
                          isRemoved
                            ? 'bg-stock-2/70'
                            : isNeedsPricing
                            ? 'bg-carbon-soft'
                            : st.noteType === 'MODIFIED'
                            ? 'bg-amber-soft/50'
                            : ''
                        }`}
                      >
                        {st.noteType === 'CUSTOM' && !isRemoved && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-hairline">
                            <span className="text-xs font-semibold text-carbon flex items-center gap-1.5">
                              <Icon name="sparkle" size={14} />
                              {st.pricePerPerson === 0
                                ? 'Khách yêu cầu thêm mục này — chọn nhanh hoặc nhập đơn giá/khách:'
                                : 'Mục khách yêu cầu thêm — đã điền đơn giá:'}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {QUICK_ITEM_PRICES.map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  aria-pressed={st.pricePerPerson === p}
                                  onClick={() => updateGuideStep(st.idx, { pricePerPerson: p })}
                                  className="chip"
                                >
                                  <span className="num">{p === 0 ? 'Miễn phí 0đ' : formatVnd(p)}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                          <span className={`stamp ${nb.cls} shrink-0`}>{nb.label}</span>

                          <label className="sr-only" htmlFor={`cat-${st.idx}`}>Danh mục</label>
                          <select
                            id={`cat-${st.idx}`}
                            value={st.category}
                            disabled={isRemoved}
                            onChange={(e) => updateGuideStep(st.idx, { category: e.target.value })}
                            className="field w-auto py-1.5 text-xs font-medium shrink-0"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>

                          <div className="flex-1 min-w-[200px]">
                            <label className="sr-only" htmlFor={`title-${st.idx}`}>Tên hoạt động</label>
                            <input
                              id={`title-${st.idx}`}
                              type="text"
                              required
                              disabled={isRemoved}
                              value={st.title}
                              onChange={(e) => updateGuideStep(st.idx, { title: e.target.value })}
                              placeholder="Nhập tên hoạt động / dịch vụ..."
                              className={`field py-1.5 text-sm font-medium ${
                                isRemoved ? 'line-through text-ink-3' : ''
                              }`}
                            />
                            {st.originalTitle && st.originalTitle !== st.title && (
                              <span className="text-xs text-ink-3 block mt-0.5">
                                Mặc định ban đầu: <del>{st.originalTitle}</del> (
                                {formatVnd(st.originalPricePerPerson)}/khách)
                              </span>
                            )}
                          </div>

                          {!isRemoved ? (
                            <div className="flex flex-col items-end shrink-0">
                              <div className="flex items-center gap-1.5">
                                <label className="sr-only" htmlFor={`price-${st.idx}`}>Đơn giá mỗi khách</label>
                                <input
                                  id={`price-${st.idx}`}
                                  type="number"
                                  step={50000}
                                  min={0}
                                  value={st.pricePerPerson}
                                  onChange={(e) =>
                                    updateGuideStep(st.idx, {
                                      pricePerPerson: Math.max(0, Number(e.target.value) || 0),
                                    })
                                  }
                                  className="field num w-32 py-1.5 text-right font-bold text-carbon"
                                />
                                <span className="text-xs text-ink-3">đ/khách</span>
                              </div>
                              <span className="num text-[0.72rem] text-carbon mt-0.5">
                                = {formatVnd(st.pricePerPerson)}/khách
                              </span>
                            </div>
                          ) : (
                            <span className="num text-xs font-semibold text-red px-2">Đã bỏ (0đ)</span>
                          )}

                          <button
                            type="button"
                            onClick={() => removeOrRestoreGuideStep(st.idx)}
                            className={`btn btn-sm ${isRemoved ? 'btn-confirm' : 'btn-danger'}`}
                          >
                            <Icon name={isRemoved ? 'undo' : 'x'} size={13} />
                            {isRemoved ? 'Khôi phục' : 'Bỏ'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Ưu đãi giảm giá / Phụ thu đoàn (không bao giờ cần nhập dấu trừ) */}
          <section className="rounded-lg border border-hairline bg-stock shadow-coupon p-5 space-y-5">
            <div className="space-y-2.5">
              <span className="block text-sm font-semibold text-ink">
                1. Điều chỉnh ưu đãi giảm giá hoặc phụ thu cho cả đoàn ({guideGuests} khách)
              </span>

              <div role="group" aria-label="Chế độ điều chỉnh giá đoàn" className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={adjustmentMode === 'NONE'}
                  onClick={() => {
                    setAdjustmentMode('NONE');
                    setAdjustmentAmount(0);
                  }}
                  className="chip"
                >
                  Không điều chỉnh (0đ)
                </button>

                <button
                  type="button"
                  aria-pressed={adjustmentMode === 'DISCOUNT'}
                  onClick={() => {
                    setAdjustmentMode('DISCOUNT');
                    if (adjustmentAmount === 0) setAdjustmentAmount(300000);
                  }}
                  className="chip"
                >
                  <Icon name="gift" size={14} />
                  Giảm giá ưu đãi cho đoàn (−)
                </button>

                <button
                  type="button"
                  aria-pressed={adjustmentMode === 'SURCHARGE'}
                  onClick={() => {
                    setAdjustmentMode('SURCHARGE');
                    if (adjustmentAmount === 0) setAdjustmentAmount(200000);
                  }}
                  className="chip"
                >
                  <Icon name="plus" size={14} />
                  Cộng phụ thu phát sinh (+)
                </button>
              </div>

              {adjustmentMode !== 'NONE' && (
                <div className="rounded-md border border-hairline bg-stock-2 p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium text-ink-2 mr-1">
                      {adjustmentMode === 'DISCOUNT' ? 'Chọn nhanh mức giảm:' : 'Chọn nhanh mức phụ thu:'}
                    </span>
                    {QUICK_GROUP_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        aria-pressed={adjustmentAmount === amt}
                        onClick={() => setAdjustmentAmount(amt)}
                        className="chip"
                      >
                        <span className="num">{formatVnd(amt)}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <label htmlFor="adj-amount" className="text-xs text-ink-2">
                      Số tiền:
                    </label>
                    <input
                      id="adj-amount"
                      type="number"
                      min={0}
                      step={50000}
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(Math.max(0, Number(e.target.value) || 0))}
                      className="field num w-32 py-1 text-right font-bold"
                    />
                    <span className={`stamp ${adjustmentMode === 'DISCOUNT' ? 'text-green' : 'text-amber'}`}>
                      {adjustmentMode === 'DISCOUNT'
                        ? `−${formatVnd(adjustmentAmount)}`
                        : `+${formatVnd(adjustmentAmount)}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="perf-x pt-4 space-y-2">
              <label htmlFor="guide-note" className="block text-sm font-semibold text-ink">
                2. Lời nhắn phản hồi gửi kèm báo giá cho {booking.customer.fullName}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_GUIDE_NOTES.map((sample, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setGuideNote(sample)}
                    className="chip"
                  >
                    Mẫu {i + 1}: “{sample.slice(0, 44)}...”
                  </button>
                ))}
              </div>
              <input
                id="guide-note"
                type="text"
                value={guideNote}
                onChange={(e) => setGuideNote(e.target.value)}
                placeholder="VD: Mình đã giữ phòng Du thuyền 5★ và thêm bánh kem tại cabin theo đúng ý gia đình bạn nhé!"
                className="field"
              />
            </div>

            <div className="perf-x pt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="coupon-head block text-[0.7rem] text-ink-3">
                  Tổng báo giá chốt sẽ gửi tới {booking.customer.fullName}
                </span>
                <p className="text-lg font-bold text-ink mt-0.5">
                  <span className="num">{formatVnd(guidePerPerson)}</span>/khách ×{' '}
                  <span className="num">{guideGuests}</span> khách
                  {signedGroupAdjustment !== 0
                    ? signedGroupAdjustment > 0
                      ? ` + phụ thu ${formatVnd(signedGroupAdjustment)}`
                      : ` − ưu đãi ${formatVnd(Math.abs(signedGroupAdjustment))}`
                    : ''}{' '}
                  = <span className="num text-2xl text-carbon">{formatVnd(guideTotal)}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || isFinal}
                className="btn btn-primary btn-lg"
              >
                <Icon name="send" size={16} />
                {submitting ? 'Đang gửi báo giá...' : 'Gửi báo giá chốt cho khách hàng'}
              </button>
            </div>
          </section>
        </form>
      )}

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
            showMessage('Đã cập nhật lịch trình và gửi yêu cầu báo giá tới Tour Guide.');
            onChanged(updated);
          }}
        />
      )}
    </div>
  );
}

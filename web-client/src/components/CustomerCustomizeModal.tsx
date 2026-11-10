import { useEffect, useState } from 'react';
import {
  createBooking,
  customizeBooking,
  formatVnd,
  getOptionsByRegion,
  type Booking,
  type BookingStep,
  type PresetOption,
  type Tour,
  type User,
} from '../api';
import Icon, { categoryIconName, type IconName } from './Icon';

interface Props {
  tour: Tour;
  customer: User;
  /** Nếu truyền existingBooking vào -> Khách đang sửa lại một đơn đã đặt trước đó. */
  existingBooking?: Booking | null;
  onClose: () => void;
  onSubmitted: (booking: Booking) => void;
}

const QUICK_CUSTOM_CHIPS: { icon: IconName; text: string }[] = [
  { icon: 'cake', text: 'Tổ chức sinh nhật / kỷ niệm tại phòng' },
  { icon: 'flame', text: 'Thêm tiệc nướng BBQ tối riêng cho đoàn' },
  { icon: 'camera', text: 'Thuê thợ chụp ảnh đi cùng đoàn' },
  { icon: 'leaf', text: 'Thực đơn ăn chay / kiêng hải sản' },
];

export default function CustomerCustomizeModal({
  tour,
  customer,
  existingBooking,
  onClose,
  onSubmitted,
}: Props) {
  const defaultDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const [options, setOptions] = useState<PresetOption[]>([]);
  const [startDate, setStartDate] = useState(existingBooking?.startDate || defaultDate);
  const [days, setDays] = useState(existingBooking?.days || tour.days);
  const [guests, setGuests] = useState(existingBooking?.guests || 2);
  const [customerNote, setCustomerNote] = useState(existingBooking?.customerNote || '');

  const [steps, setSteps] = useState<BookingStep[]>(() => {
    if (existingBooking) {
      return existingBooking.steps.map((s) => ({
        ...s,
        originalTitle: s.originalTitle ?? s.title,
        originalPricePerPerson: s.originalPricePerPerson ?? s.pricePerPerson,
      }));
    }
    return tour.steps.map((s) => ({
      dayNumber: s.dayNumber,
      category: s.category,
      title: s.title,
      pricePerPerson: s.pricePerPerson,
      originalTitle: s.title,
      originalPricePerPerson: s.pricePerPerson,
      noteType: 'PRESET',
    }));
  });

  const [swappingIdx, setSwappingIdx] = useState<number | null>(null);
  const [addingPresetDay, setAddingPresetDay] = useState<number | null>(null);
  const [customDraft, setCustomDraft] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getOptionsByRegion(tour.regionId)
      .then(setOptions)
      .catch(() => setOptions([]));
  }, [tour.regionId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const activeSteps = steps.filter((s) => s.dayNumber <= days);

  const hasPendingDraft = Object.entries(customDraft).some(
    ([d, text]) => Number(d) <= days && text.trim().length > 0
  );

  const isModifiedFromOriginal =
    days !== tour.days ||
    activeSteps.length !== tour.steps.length ||
    activeSteps.some((s) => s.noteType !== 'PRESET') ||
    hasPendingDraft;

  const estimatedPerPerson = activeSteps
    .filter((s) => s.noteType !== 'REMOVED')
    .reduce((sum, s) => sum + (Number(s.pricePerPerson) || 0), 0);
  const estimatedTotal = estimatedPerPerson * guests;
  const priceDiffPerPerson = estimatedPerPerson - tour.basePricePerPerson;

  const hasCustomUnpriced =
    activeSteps.some((s) => s.noteType === 'CUSTOM' && s.pricePerPerson === 0) ||
    hasPendingDraft;

  const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

  const handleSwapStepWithOption = (idx: number, opt: PresetOption) => {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const origTitle = s.originalTitle ?? s.title;
        const origPrice = s.originalPricePerPerson ?? s.pricePerPerson;
        const isSameAsOriginal = opt.title === origTitle && opt.pricePerPerson === origPrice;
        return {
          ...s,
          category: opt.category,
          title: opt.title,
          pricePerPerson: opt.pricePerPerson,
          originalTitle: origTitle,
          originalPricePerPerson: origPrice,
          noteType: isSameAsOriginal ? 'PRESET' : 'MODIFIED',
        };
      })
    );
    setSwappingIdx(null);
  };

  const handleRestoreStepToOriginal = (idx: number) => {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        return {
          ...s,
          title: s.originalTitle || s.title,
          pricePerPerson: s.originalPricePerPerson ?? s.pricePerPerson,
          noteType: 'PRESET',
        };
      })
    );
    if (swappingIdx === idx) setSwappingIdx(null);
  };

  const handleSoftRemoveOrDeleteStep = (idx: number) => {
    setSteps((prev) => {
      const target = prev[idx];
      if (!target) return prev;
      if (target.noteType === 'CUSTOM' || !target.originalTitle) {
        return prev.filter((_, i) => i !== idx);
      }
      return prev.map((s, i) =>
        i === idx
          ? {
              ...s,
              originalTitle: s.originalTitle ?? s.title,
              originalPricePerPerson: s.originalPricePerPerson ?? s.pricePerPerson,
              pricePerPerson: 0,
              noteType: 'REMOVED',
            }
          : s
      );
    });
    if (swappingIdx === idx) setSwappingIdx(null);
  };

  const handleAddExtraPresetOption = (dayNumber: number, opt: PresetOption) => {
    setSteps((prev) => [
      ...prev,
      {
        dayNumber,
        category: opt.category,
        title: opt.title,
        pricePerPerson: opt.pricePerPerson,
        originalTitle: null,
        originalPricePerPerson: null,
        noteType: 'MODIFIED',
      },
    ]);
    setAddingPresetDay(null);
  };

  const handleAddCustomRequestText = (dayNumber: number, rawText: string) => {
    const text = rawText.trim();
    if (!text) return;
    setSteps((prev) => [
      ...prev,
      {
        dayNumber,
        category: 'Yêu cầu thêm',
        title: text,
        pricePerPerson: 0,
        originalTitle: null,
        originalPricePerPerson: null,
        noteType: 'CUSTOM',
      },
    ]);
    setCustomDraft((prev) => ({ ...prev, [dayNumber]: '' }));
  };

  const handleResetToPreset = () => {
    setDays(tour.days);
    setSwappingIdx(null);
    setAddingPresetDay(null);
    setCustomDraft({});
    setSteps(
      tour.steps.map((s) => ({
        dayNumber: s.dayNumber,
        category: s.category,
        title: s.title,
        pricePerPerson: s.pricePerPerson,
        originalTitle: s.title,
        originalPricePerPerson: s.pricePerPerson,
        noteType: 'PRESET',
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const autoSavedDraftSteps: BookingStep[] = [];
      for (let d = 1; d <= days; d++) {
        const draftText = (customDraft[d] || '').trim();
        if (draftText.length > 0) {
          autoSavedDraftSteps.push({
            dayNumber: d,
            category: 'Yêu cầu thêm',
            title: draftText,
            pricePerPerson: 0,
            originalTitle: null,
            originalPricePerPerson: null,
            noteType: 'CUSTOM',
          });
        }
      }

      const finalSteps = [
        ...steps.filter((s) => s.dayNumber <= days && s.title.trim().length > 0),
        ...autoSavedDraftSteps,
      ];

      const nonRemovedCount = finalSteps.filter((s) => s.noteType !== 'REMOVED').length;
      if (nonRemovedCount === 0) {
        throw new Error('Lịch trình cần giữ lại ít nhất 1 hoạt động.');
      }

      const finalCustomized =
        days !== tour.days ||
        finalSteps.length !== tour.steps.length ||
        finalSteps.some((s) => s.noteType !== 'PRESET');

      if (existingBooking) {
        const updated = await customizeBooking(existingBooking.id, {
          startDate,
          days,
          guests,
          customerNote,
          steps: finalSteps,
        });
        onSubmitted(updated);
      } else {
        const created = await createBooking({
          tourId: tour.id,
          customerId: customer.id,
          startDate,
          days,
          guests,
          customerNote,
          customized: finalCustomized,
          steps: finalSteps,
        });
        onSubmitted(created);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customize-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-2 sm:p-4 anim-backdrop"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-hairline bg-stock shadow-lift anim-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Đầu vé (navy header) */}
        <div className="bg-navy text-navy-ink px-5 py-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-navy-ink-2">
              <span className="coupon-head text-[#f2c14e]">
                {tour.regionName} ({tour.province}) · Chuẩn {tour.days}N{tour.days > 1 ? `${tour.days - 1}Đ` : ''}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Icon name="compass" size={13} />
                Guide {tour.guide.fullName} ({tour.guide.phone})
              </span>
            </div>
            <h2 id="customize-modal-title" className="font-head text-2xl font-bold uppercase tracking-wide text-white">
              {tour.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block text-[0.7rem] text-navy-ink-2">Giá lịch trình chuẩn</span>
              <span className="num text-lg font-bold text-[#f2c14e]">
                {formatVnd(tour.basePricePerPerson)}
              </span>
              <span className="text-xs text-navy-ink-2">/khách</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng hộp thoại"
              className="btn btn-sm border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <Icon name="x" size={15} />
              Đóng
            </button>
          </div>
        </div>

        {/* Thân vé (cuộn) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-md border border-red/40 bg-red-soft px-4 py-3 text-sm text-ink">
              <Icon name="alert" size={16} className="text-red" />
              <span>{error}</span>
            </div>
          )}

          {/* Hàng thông số chuyến đi (4 ô kẻ hairline như cuống vé) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 rounded-lg border border-hairline bg-stock-2 divide-y sm:divide-y-0 sm:divide-x divide-hairline">
            <div className="p-3.5">
              <span className="coupon-head block text-[0.7rem] text-ink-3">Hành khách</span>
              <p className="mt-1 flex items-center gap-1.5 font-semibold text-sm text-ink truncate">
                <Icon name="user" size={15} className="text-ink-3" />
                {customer.fullName}
              </p>
            </div>

            <div className="p-3.5">
              <label htmlFor="booking-start-date" className="coupon-head block text-[0.7rem] text-ink-3">
                Ngày khởi hành
              </label>
              <input
                id="booking-start-date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="field mt-1 py-1 text-sm num"
              />
            </div>

            <div className="p-3.5">
              <span className="coupon-head block text-[0.7rem] text-ink-3">Số khách tham gia</span>
              <div className="mt-1 flex items-center justify-between rounded-md border border-hairline-strong bg-stock px-1.5 py-0.5">
                <button
                  type="button"
                  aria-label="Giảm số khách"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  className="grid h-7 w-7 place-items-center rounded text-ink-2 hover:bg-stock-2 cursor-pointer"
                >
                  <Icon name="minus" size={14} />
                </button>
                <span className="num text-sm font-bold text-carbon">{guests} khách</span>
                <button
                  type="button"
                  aria-label="Tăng số khách"
                  onClick={() => setGuests((g) => Math.min(30, g + 1))}
                  className="grid h-7 w-7 place-items-center rounded text-ink-2 hover:bg-stock-2 cursor-pointer"
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
            </div>

            <div className="p-3.5">
              <span className="coupon-head block text-[0.7rem] text-ink-3">
                Thời lượng (chuẩn {tour.days} ngày)
              </span>
              <div className="mt-1 flex items-center justify-between rounded-md border border-hairline-strong bg-stock px-1.5 py-0.5">
                <button
                  type="button"
                  aria-label="Giảm số ngày"
                  onClick={() => setDays((d) => Math.max(1, d - 1))}
                  className="grid h-7 w-7 place-items-center rounded text-ink-2 hover:bg-stock-2 cursor-pointer"
                >
                  <Icon name="minus" size={14} />
                </button>
                <span className="num text-sm font-bold text-ink">{days} ngày</span>
                <button
                  type="button"
                  aria-label="Tăng số ngày"
                  onClick={() => setDays((d) => Math.min(7, d + 1))}
                  className="grid h-7 w-7 place-items-center rounded text-ink-2 hover:bg-stock-2 cursor-pointer"
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Danh sách các tờ coupon theo từng ngày */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="font-head text-xl font-bold uppercase tracking-wide text-ink">
                  Các chặng trong lịch trình
                </h3>
                <p className="text-xs text-ink-2">
                  Ưng ý lịch trình chuẩn? Bấm <strong>Đặt ngay</strong> ở cuối phiếu. Muốn đổi khách sạn hay bỏ mục nào, bấm nút ngay trên dòng đó.
                </p>
              </div>
              {isModifiedFromOriginal && (
                <button type="button" onClick={handleResetToPreset} className="btn btn-ghost btn-sm">
                  <Icon name="undo" size={14} />
                  Khôi phục lịch trình gốc
                </button>
              )}
            </div>

            {dayNumbers.map((day) => {
              const daySteps = steps
                .map((s, idx) => ({ ...s, idx }))
                .filter((s) => s.dayNumber === day);

              return (
                <section
                  key={day}
                  aria-label={`Lịch trình ngày ${day}`}
                  className="rounded-lg border border-hairline bg-stock shadow-coupon overflow-hidden"
                >
                  <div className="bg-stock-2 px-4 py-2.5 border-b border-hairline flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="coupon-head text-sm text-ink">Coupon ngày {day}</span>
                      {day > tour.days && (
                        <span className="stamp text-amber">Ngày mở rộng</span>
                      )}
                    </div>
                    <span className="num text-xs text-ink-3">
                      {daySteps.filter((s) => s.noteType !== 'REMOVED').length} hoạt động
                    </span>
                  </div>

                  {daySteps.length === 0 && (
                    <div className="px-4 py-4 text-sm text-amber bg-amber-soft">
                      Bạn vừa thêm Ngày {day}. Hãy chọn hoạt động gợi ý bên dưới hoặc ghi yêu cầu để Guide sắp xếp lịch trình cho Ngày {day}.
                    </div>
                  )}

                  <div className="divide-y divide-hairline">
                    {daySteps.map((st) => {
                      const isRemoved = st.noteType === 'REMOVED';
                      const isModified = st.noteType === 'MODIFIED';
                      const isCustom = st.noteType === 'CUSTOM';
                      const isSwappingThis = swappingIdx === st.idx;

                      const sameCategoryOptions = options.filter(
                        (o) => o.category.toLowerCase() === st.category.toLowerCase()
                      );
                      const swapCandidates =
                        sameCategoryOptions.length > 0 ? sameCategoryOptions : options;
                      const basePriceForDiff = st.originalPricePerPerson ?? st.pricePerPerson;

                      return (
                        <div
                          key={st.idx}
                          className={`px-4 py-3 ${
                            isRemoved
                              ? 'bg-stock-2/70'
                              : isCustom
                              ? 'bg-carbon-soft/60'
                              : isModified
                              ? 'bg-amber-soft/60'
                              : ''
                          }`}
                        >
                          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <span className="mt-0.5 inline-flex items-center gap-1 rounded border border-hairline bg-stock-2 px-2 py-0.5 text-xs font-medium text-ink-2 shrink-0">
                                <Icon name={categoryIconName(st.category)} size={13} />
                                {st.category}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`text-sm font-semibold ${
                                      isRemoved ? 'line-through text-ink-3' : 'text-ink'
                                    }`}
                                  >
                                    {st.title}
                                  </span>
                                  {isModified && <span className="stamp text-amber">Đã đổi</span>}
                                  {isRemoved && <span className="stamp text-red">Void · Đã bỏ</span>}
                                  {isCustom && <span className="stamp text-carbon">Yêu cầu thêm</span>}
                                </div>

                                {isModified && st.originalTitle && (
                                  <p className="text-xs text-ink-3 mt-0.5">
                                    Thay cho mặc định:{' '}
                                    <span className="line-through">
                                      {st.originalTitle} ({formatVnd(st.originalPricePerPerson)}/khách)
                                    </span>
                                  </p>
                                )}
                                {isRemoved && st.originalPricePerPerson != null && (
                                  <p className="text-xs text-red mt-0.5">
                                    Đã trừ <span className="num">{formatVnd(st.originalPricePerPerson)}</span>/khách khỏi lịch trình chuẩn
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <div className="text-right mr-1">
                                {isRemoved ? (
                                  <span className="num text-xs font-semibold text-ink-3">0đ</span>
                                ) : isCustom && st.pricePerPerson === 0 ? (
                                  <span className="text-xs font-semibold text-carbon">
                                    Chờ Guide báo giá
                                  </span>
                                ) : (
                                  <span className="num text-sm font-bold text-carbon">
                                    {formatVnd(st.pricePerPerson)}
                                    <span className="font-sans text-xs font-normal text-ink-3">/khách</span>
                                  </span>
                                )}
                              </div>

                              {!isRemoved && !isCustom && swapCandidates.length > 0 && (
                                <button
                                  type="button"
                                  aria-expanded={isSwappingThis}
                                  onClick={() => setSwappingIdx(isSwappingThis ? null : st.idx)}
                                  className="btn btn-ghost btn-sm"
                                >
                                  <Icon name="swap" size={13} />
                                  {isSwappingThis ? 'Đóng' : 'Đổi lựa chọn'}
                                </button>
                              )}

                              {isModified && st.originalTitle && (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreStepToOriginal(st.idx)}
                                  className="btn btn-ghost btn-sm"
                                  title="Quay lại lựa chọn mặc định"
                                >
                                  <Icon name="undo" size={13} />
                                  Mặc định
                                </button>
                              )}

                              {isRemoved ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreStepToOriginal(st.idx)}
                                  className="btn btn-confirm btn-sm"
                                >
                                  <Icon name="undo" size={13} />
                                  Giữ lại
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSoftRemoveOrDeleteStep(st.idx)}
                                  className="btn btn-danger btn-sm"
                                >
                                  <Icon name="x" size={13} />
                                  Bỏ mục này
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Bảng chọn dịch vụ thay thế */}
                          {isSwappingThis && (
                            <div className="mt-3 rounded-md border border-hairline-strong bg-stock-2 p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-ink">
                                  Chọn dịch vụ thay cho “{st.originalTitle || st.title}” (thay thế trực tiếp, không cộng trùng):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSwappingIdx(null)}
                                  className="text-xs text-ink-3 hover:text-ink cursor-pointer"
                                >
                                  Đóng
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {swapCandidates.map((opt) => {
                                  const diff = opt.pricePerPerson - basePriceForDiff;
                                  const isSelected = st.title === opt.title;
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => handleSwapStepWithOption(st.idx, opt)}
                                      className={`text-left rounded-md border p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'border-carbon bg-carbon-soft text-ink'
                                          : 'border-hairline bg-stock hover:border-ink-3 text-ink'
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <span className="block text-xs font-semibold truncate">{opt.title}</span>
                                        <span className="num text-[0.72rem] text-ink-3">
                                          {formatVnd(opt.pricePerPerson)}/khách
                                        </span>
                                      </div>
                                      <span
                                        className={`num text-xs font-bold shrink-0 ${
                                          diff > 0 ? 'text-amber' : diff < 0 ? 'text-green' : 'text-ink-3'
                                        }`}
                                      >
                                        {diff > 0 ? `+${formatVnd(diff)}` : diff < 0 ? formatVnd(diff) : '0đ'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Cuống thêm hoạt động / yêu cầu riêng của ngày */}
                  <div className="perf-x bg-stock-2 px-4 py-3 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="coupon-head text-[0.7rem] text-ink-3 mr-1">
                        Thêm nhanh vào Ngày {day}:
                      </span>
                      {options.length > 0 && (
                        <button
                          type="button"
                          aria-pressed={addingPresetDay === day}
                          onClick={() => setAddingPresetDay(addingPresetDay === day ? null : day)}
                          className="chip"
                        >
                          <Icon name="plus" size={13} />
                          Dịch vụ có sẵn tại {tour.regionName}
                        </button>
                      )}
                      {QUICK_CUSTOM_CHIPS.map((c) => (
                        <button
                          key={c.text}
                          type="button"
                          onClick={() => handleAddCustomRequestText(day, c.text)}
                          className="chip"
                        >
                          <Icon name={c.icon} size={13} />
                          {c.text}
                        </button>
                      ))}
                    </div>

                    {addingPresetDay === day && options.length > 0 && (
                      <div className="rounded-md border border-hairline bg-stock p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-ink">
                            Chọn dịch vụ cộng thêm vào Ngày {day}:
                          </span>
                          <button
                            type="button"
                            onClick={() => setAddingPresetDay(null)}
                            className="text-xs text-ink-3 hover:text-ink cursor-pointer"
                          >
                            Đóng
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {options.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleAddExtraPresetOption(day, opt)}
                              className="chip"
                            >
                              <Icon name="plus" size={12} />
                              {opt.title}
                              <span className="num text-xs text-carbon">{formatVnd(opt.pricePerPerson)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <label className="sr-only" htmlFor={`custom-day-${day}`}>
                        Yêu cầu riêng cho Ngày {day}
                      </label>
                      <input
                        id={`custom-day-${day}`}
                        type="text"
                        value={customDraft[day] || ''}
                        onChange={(e) => setCustomDraft((prev) => ({ ...prev, [day]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomRequestText(day, customDraft[day] || '');
                          }
                        }}
                        placeholder={`Hoặc tự gõ yêu cầu riêng cho Ngày ${day} (VD: ghé chợ hải sản, thuê xe máy riêng...)`}
                        className="field text-xs py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomRequestText(day, customDraft[day] || '')}
                        className="btn btn-ghost btn-sm"
                      >
                        <Icon name="plus" size={14} />
                        Thêm
                      </button>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          {/* Lời nhắn dặn dò chung */}
          <div>
            <label htmlFor="customer-note" className="block text-sm font-semibold text-ink mb-1">
              Lời nhắn dặn dò gửi Guide {tour.guide.fullName} (không bắt buộc)
            </label>
            <textarea
              id="customer-note"
              rows={2}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="VD: Đoàn có trẻ nhỏ và người lớn tuổi, nhờ Guide sắp xếp giờ giấc thư thả..."
              className="field"
            />
            <p className="mt-1 text-xs text-ink-3">
              Nếu bạn giữ nguyên lịch trình chuẩn và chỉ ghi lời nhắn dặn dò tại đây, đơn vẫn giữ nguyên giá chuẩn.
            </p>
          </div>

          {/* Cuống tổng kết giá & nút gửi */}
          <div className="perf-x pt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`stamp ${isModifiedFromOriginal ? 'text-amber' : 'text-green'}`}>
                  {isModifiedFromOriginal ? 'Đã tuỳ chỉnh · Chờ báo giá' : 'Giữ lịch trình chuẩn'}
                </span>
                {isModifiedFromOriginal && priceDiffPerPerson !== 0 && (
                  <span className="text-xs text-ink-2">
                    Chênh lệch tạm tính:{' '}
                    <strong className="num text-carbon">
                      {priceDiffPerPerson > 0 ? `+${formatVnd(priceDiffPerPerson)}` : formatVnd(priceDiffPerPerson)}
                    </strong>
                    /khách
                  </span>
                )}
              </div>

              <p className="text-lg font-bold text-ink">
                Tạm tính:{' '}
                <span className="num">{formatVnd(estimatedPerPerson)}</span>/khách ×{' '}
                <span className="num">{guests}</span> khách ={' '}
                <span className="num text-xl text-carbon">{formatVnd(estimatedTotal)}</span>
              </p>

              {hasCustomUnpriced && (
                <p className="text-xs text-carbon">
                  Mục bạn yêu cầu thêm sẽ được Guide {tour.guide.fullName} điền giá và gửi lại để bạn duyệt.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onClose} className="btn btn-ghost">
                Huỷ
              </button>
              <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
                <Icon name={isModifiedFromOriginal ? 'send' : 'check'} size={16} />
                {submitting
                  ? 'Đang gửi...'
                  : existingBooking
                  ? 'Lưu & gửi Guide báo giá lại'
                  : isModifiedFromOriginal
                  ? 'Gửi lịch trình & nhờ Guide báo giá'
                  : 'Đặt ngay theo lịch trình chuẩn'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

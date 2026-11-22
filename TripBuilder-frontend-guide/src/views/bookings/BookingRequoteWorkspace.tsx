import { Avatar } from '@astryxdesign/core/Avatar';
import type { Booking } from '@/api/types';
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  CategoryIcon,
  CheckCircleIcon,
  ClockIcon,
  CustomIcon,
  MinusIcon,
  PhoneIcon,
  PlusIcon,
  RestoreIcon,
  SwapIcon,
  TagIcon,
  UsersIcon,
  VoidIcon,
  XIcon,
} from '@/components/icon';
import { SafeImage } from '@/components/ui/SafeImage';
import { noteTypeMeta } from '@/config/constants/meta';
import {
  QUICK_CUSTOM_PRICES,
  QUICK_GROUP_ADJ,
  REQUOTE_CATEGORIES,
  useBookingRequote,
} from '@/hooks';
import { formatVnd } from '@/utils/format';

interface BookingRequoteWorkspaceProps {
  booking: Booking;
  onBack: () => void;
  onUpdated: (booking: Booking) => void;
}

function categoryBadgeClass(category: string): string {
  switch (category) {
    case 'Khách sạn':
      return 'category-badge-hotel';
    case 'Ăn uống':
      return 'category-badge-food';
    case 'Di chuyển':
      return 'category-badge-transport';
    case 'Trải nghiệm':
      return 'category-badge-activity';
    default:
      return 'category-badge-custom';
  }
}

function formatSignedDelta(delta: number): string {
  if (delta === 0) return '0đ';
  return `${delta > 0 ? '+' : ''}${formatVnd(delta)}`;
}

export function BookingRequoteWorkspace({
  booking,
  onBack,
  onUpdated,
}: BookingRequoteWorkspaceProps) {
  const {
    days,
    guests,
    setGuests,
    adjMode,
    setAdjMode,
    adjAmount,
    setAdjAmount,
    guideNote,
    setGuideNote,
    steps,
    expandedKeys,
    expandStep,
    collapseStep,
    pendingDayShrink,
    setPendingDayShrink,
    confirmCancelOpen,
    setConfirmCancelOpen,
    options,
    busy,
    error,
    st,
    mode,
    isCancelled,
    groupAdjustmentSigned,
    perPerson,
    rawTotalPreview,
    totalPreview,
    diffOrig,
    unpricedCustomSteps,
    activeLeg,
    canSubmitRequote,
    updateStepByKey,
    handlePriceChange,
    replaceWithAlternative,
    addGuideStepForDay,
    handleVoidOrDeleteStep,
    handleRestoreStep,
    handleRequestDaysChange,
    applyDayShrink,
    handleSendRequote,
    handleCancel,
  } = useBookingRequote({ booking, onUpdated });

  return (
    <div className="space-y-6 pb-12">
      {/* Thanh điều hướng & Mã đơn */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-ghost text-sm font-medium py-2 px-4"
        >
          <ArrowLeftIcon size={16} strokeWidth={1.5} />
          <span>Danh sách đơn</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="num text-base font-semibold px-3 py-1.5 rounded-xl border border-rule bg-surface text-coral">
            {booking.code}
          </span>
          <span className={`tag normal-case tracking-normal font-medium ${st.tagClass}`}>
            {st.short}
          </span>
          <span className="num text-[13px] font-medium px-3 py-1.5 rounded-xl border border-rule bg-surface-2 text-ink-2">
            Bản chụp tour v{booking.tourVersionSnapshot}
          </span>
          {booking.postConfirmAdjustment && (
            <span className="tag tag-ochre normal-case tracking-normal font-medium">
              Điều chỉnh sau chốt
            </span>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-crimson bg-crimson-soft px-5 py-3.5 flex items-start gap-3 text-base text-crimson"
        >
          <AlertIcon size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Không thể gửi báo giá</div>
            <div className="text-sm font-normal">{error}</div>
          </div>
        </div>
      )}

      {booking.status === 'CHANGE_REQUESTED' && (
        <div className="rounded-xl border border-amber bg-amber-soft px-5 py-3.5 flex items-start gap-3 text-base text-amber">
          <AlertIcon size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Khách vừa xin điều chỉnh sau khi đã chốt</div>
            <div className="text-sm font-normal">
              Giá đã chốt trước đó:{' '}
              <span className="num font-semibold">{formatVnd(booking.confirmedTotalPrice)}</span>.
              Cập nhật đơn giá từng chặng rồi bấm Gửi báo giá lại.
            </div>
          </div>
        </div>
      )}

      {!isCancelled && unpricedCustomSteps.length > 0 && (
        <div className="rounded-xl border border-coral bg-coral-soft px-5 py-3.5 flex items-start gap-3 text-base text-coral">
          <CustomIcon size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">
              Có {unpricedCustomSteps.length} yêu cầu khách tự thêm cần nhập giá báo khách
            </div>
            <div className="text-sm font-normal">
              Chọn nhanh mức giá hoặc nhập số tiền cụ thể (&gt; 0đ) bên dưới để kích hoạt nút
              gửi báo giá.
            </div>
          </div>
        </div>
      )}

      {/* Tóm tắt hồ sơ khách + 4-Leg Stepper */}
      <section className="flagship-card">
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 flex items-center gap-4 min-w-0">
            <SafeImage
              src={booking.tour.imageUrl}
              alt={booking.tourTitleSnapshot}
              className="w-28 h-24 rounded-xl object-cover border border-rule shrink-0"
            />
            <div className="min-w-0 space-y-2">
              <div className="text-sm font-medium text-ink-3">{st.hint}</div>
              <h1 className="font-display text-2xl sm:text-[26px] font-semibold text-ink leading-tight truncate">
                {booking.tourTitleSnapshot}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 text-sm">
                <Avatar
                  src={booking.customer.avatarUrl || undefined}
                  name={booking.customer.fullName}
                  size="xsm"
                />
                <span className="font-semibold text-ink">{booking.customer.fullName}</span>
                {booking.customer.phone && (
                  <span className="inline-flex items-center gap-1 num font-medium text-ink-2">
                    <PhoneIcon size={16} strokeWidth={1.5} className="text-ink-3" />
                    {booking.customer.phone}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-medium text-ink-2">
                <span className="inline-flex items-center gap-1.5 num">
                  <CalendarIcon size={16} strokeWidth={1.5} className="text-ink-3" />
                  {booking.startDate}
                </span>
                <span className="inline-flex items-center gap-1.5 num">
                  <ClockIcon size={16} strokeWidth={1.5} className="text-ink-3" />
                  {days} ngày
                </span>
                <span className="inline-flex items-center gap-1.5 num">
                  <UsersIcon size={16} strokeWidth={1.5} className="text-ink-3" />
                  {guests} khách
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <TagIcon size={16} strokeWidth={1.5} className="text-ink-3" />
                  {mode.label}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            {!isCancelled ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['Nhận yêu cầu', 'Kiểm tra chỗ', 'Gửi báo giá', 'Khách chốt'].map(
                  (label, idx) => {
                    const isDone = idx < activeLeg;
                    const isCurrent = idx === activeLeg;
                    return (
                      <div
                        key={label}
                        className={`rounded-xl border p-3 text-center transition-colors duration-150 ${
                          isDone
                            ? 'border-emerald/40 bg-emerald-soft text-emerald'
                            : isCurrent
                            ? 'border-coral bg-coral-soft text-coral'
                            : 'border-rule bg-surface-2 text-ink-3'
                        }`}
                      >
                        <div className="num text-[13px] font-semibold">Chặng 0{idx + 1}</div>
                        <div className="text-[13px] font-medium mt-1 leading-tight">
                          {label}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-crimson bg-crimson-soft text-crimson text-sm font-medium flex items-center gap-2.5">
                <VoidIcon size={18} strokeWidth={1.5} />
                <span>Đơn đặt tour này đã được hủy và đóng sổ</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Requote Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái: Bảng kê lịch trình theo Ngày */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">
                Rà soát &amp; báo giá lịch trình theo ngày
              </h2>
              <p className="text-[15px] font-normal text-ink-2 mt-0.5">
                Mục lịch chuẩn giữ gọn 1 dòng; mục khách đổi, yêu cầu thêm hoặc đang sửa được mở
                sẵn để báo giá nhanh.
              </p>
            </div>
            {!isCancelled && (
              <button
                type="button"
                onClick={() => addGuideStepForDay(1)}
                className="btn btn-ghost text-sm font-medium py-2 px-4"
              >
                <PlusIcon size={16} strokeWidth={1.5} />
                <span>Thêm mục mới</span>
              </button>
            )}
          </div>

          {Array.from({ length: days }, (_, i) => i + 1).map((dayNum) => {
            const daySteps = steps.filter((s) => s.dayNumber === dayNum);
            const activeDaySteps = daySteps.filter((s) => s.noteType !== 'REMOVED');
            const voidDayCount = daySteps.length - activeDaySteps.length;
            const dayPerPerson = activeDaySteps.reduce(
              (acc, s) => acc + (Number(s.pricePerPerson) || 0),
              0
            );

            return (
              <section key={dayNum} className="flagship-card">
                <div className="bg-flagship-dark text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl font-semibold rounded-lg bg-coral text-white px-3 py-1 leading-none">
                      Ngày {String(dayNum).padStart(2, '0')}
                    </span>
                    <span className="num text-sm font-medium text-slate-300">
                      {activeDaySteps.length} hoạt động
                      {voidDayCount > 0 ? ` · ${voidDayCount} đã bỏ` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="num text-base font-semibold text-rose-300">
                      {formatVnd(dayPerPerson)}/khách
                    </span>
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => addGuideStepForDay(dayNum)}
                        className="btn bg-white/15 hover:bg-white/25 text-white border border-white/25 text-[13px] font-medium py-1.5 px-3"
                      >
                        <PlusIcon size={16} strokeWidth={1.5} />
                        <span>Thêm vào Ngày {dayNum}</span>
                      </button>
                    )}
                  </div>
                </div>

                {daySteps.length === 0 ? (
                  <div className="p-6 text-center text-[15px] font-normal text-ink-3">
                    Ngày {dayNum} chưa có hoạt động nào
                  </div>
                ) : (
                  <div className="divide-y divide-rule">
                    {daySteps.map((s) => {
                      const nt = noteTypeMeta(s.noteType);
                      const isRemoved = s.noteType === 'REMOVED';
                      const isCustomUnpriced =
                        s.noteType === 'CUSTOM' && (Number(s.pricePerPerson) || 0) <= 0;
                      const isExpanded =
                        !isRemoved &&
                        (s.noteType !== 'PRESET' || Boolean(expandedKeys[s._key]));
                      const sameCatOpts = options.filter((o) => o.category === s.category);
                      const diffVsOrig =
                        s.originalPricePerPerson != null
                          ? (Number(s.pricePerPerson) || 0) - s.originalPricePerPerson
                          : 0;

                      /* 1. Dòng VOID · ĐÃ BỎ (Void-Never-Vanishes) */
                      if (isRemoved) {
                        return (
                          <div
                            key={s._key}
                            className="px-5 py-4 bg-surface-2/75 flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <span className="h-10 w-10 rounded-xl border border-crimson/35 bg-crimson-soft text-crimson flex items-center justify-center shrink-0">
                                <VoidIcon size={18} strokeWidth={1.5} />
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="tag tag-crimson normal-case tracking-normal font-medium">
                                    {nt.label}
                                  </span>
                                  <span
                                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[13px] font-medium ${categoryBadgeClass(
                                      s.category
                                    )}`}
                                  >
                                    {s.category}
                                  </span>
                                </div>
                                <div className="text-[17px] font-medium text-ink-2 line-through truncate mt-1">
                                  {s.title}
                                </div>
                                {s.originalPricePerPerson != null && s.originalPricePerPerson > 0 && (
                                  <div className="num text-[13px] font-normal text-ink-3 mt-0.5">
                                    Giá gốc trước khi bỏ: {formatVnd(s.originalPricePerPerson)}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="num text-base font-semibold text-crimson">0đ</span>
                              {!isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreStep(s)}
                                  className="btn btn-ghost text-[13px] font-medium py-1.5 px-3 text-emerald border-emerald/40 hover:bg-emerald-soft"
                                >
                                  <RestoreIcon size={16} strokeWidth={1.5} />
                                  <span>Khôi phục</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      /* 2. Dòng PRESET giữ nguyên ở chế độ thu gọn 1 dòng sạch sẽ */
                      if (!isExpanded) {
                        return (
                          <div
                            key={s._key}
                            className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 hover:bg-surface-2/60 transition-colors duration-150"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <span
                                className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${categoryBadgeClass(
                                  s.category
                                )}`}
                              >
                                <CategoryIcon
                                  category={s.category}
                                  size={18}
                                  strokeWidth={1.5}
                                />
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[17px] font-semibold text-ink truncate">
                                    {s.title}
                                  </span>
                                  <span
                                    className={`tag normal-case tracking-normal font-medium ${nt.tagClass}`}
                                  >
                                    {nt.label}
                                  </span>
                                </div>
                                <div className="mt-1">
                                  <span
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[13px] font-medium ${categoryBadgeClass(
                                      s.category
                                    )}`}
                                  >
                                    {s.category}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="num text-lg font-semibold text-coral">
                                {formatVnd(s.pricePerPerson)}
                              </span>
                              {!isCancelled && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => expandStep(s._key)}
                                    className="btn btn-ghost text-[13px] font-medium py-1.5 px-3"
                                  >
                                    <SwapIcon size={16} strokeWidth={1.5} />
                                    <span>Đề xuất đổi / Sửa giá</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleVoidOrDeleteStep(s)}
                                    title="Đánh dấu bỏ chặng này (0đ)"
                                    className="btn btn-danger text-[13px] font-medium py-1.5 px-3"
                                  >
                                    <VoidIcon size={16} strokeWidth={1.5} />
                                    <span>Đánh dấu bỏ</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      }

                      /* 3. Dòng mở rộng: CUSTOM / MODIFIED / ALTERNATIVE / GUIDE / PRESET đang sửa */
                      const rowToneClass = isCustomUnpriced
                        ? 'bg-coral-soft border-2 border-coral rounded-xl m-2.5'
                        : s.noteType === 'MODIFIED'
                        ? 'bg-amber-soft/35 border-l-4 border-l-amber'
                        : s.noteType === 'GUIDE' || s.noteType === 'ALTERNATIVE'
                        ? 'bg-emerald-soft/25 border-l-4 border-l-emerald'
                        : 'bg-surface-2/60';

                      return (
                        <div key={s._key} className={`p-5 space-y-3.5 ${rowToneClass}`}>
                          <div className="flex flex-wrap items-start justify-between gap-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${categoryBadgeClass(
                                  s.category
                                )}`}
                              >
                                <CategoryIcon
                                  category={s.category}
                                  size={16}
                                  strokeWidth={1.5}
                                />
                              </span>
                              <span
                                className={`inline-flex items-center rounded-md px-2.5 py-1 text-[13px] font-medium ${categoryBadgeClass(
                                  s.category
                                )}`}
                              >
                                {s.category}
                              </span>
                              <span
                                className={`tag normal-case tracking-normal font-medium ${nt.tagClass}`}
                              >
                                {nt.label}
                              </span>
                              {isCustomUnpriced && (
                                <span className="rounded-md bg-coral text-white px-2.5 py-1 text-[13px] font-medium">
                                  Cần nhập giá báo khách
                                </span>
                              )}
                              {s._wasCustom && s.noteType === 'GUIDE' && (
                                <span className="text-sm font-medium text-emerald">
                                  Đã định giá từ yêu cầu khách
                                </span>
                              )}
                            </div>

                            {!isCancelled && (
                              <div className="flex items-center gap-2">
                                {s.noteType === 'PRESET' && (
                                  <button
                                    type="button"
                                    onClick={() => collapseStep(s._key)}
                                    className="btn btn-ghost text-[13px] font-medium py-1.5 px-3"
                                  >
                                    Thu gọn
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleVoidOrDeleteStep(s)}
                                  className="btn btn-danger text-[13px] font-medium py-1.5 px-3"
                                >
                                  <VoidIcon size={16} strokeWidth={1.5} />
                                  <span>{s._isNewDraft ? 'Xóa mục mới' : 'Đánh dấu bỏ'}</span>
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="text-lg font-semibold text-ink">{s.title}</div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                            <div className="sm:col-span-2">
                              <label className="block text-[13px] font-medium text-ink-2 mb-1">
                                Ngày
                              </label>
                              <select
                                disabled={isCancelled}
                                value={s.dayNumber}
                                onChange={(e) =>
                                  updateStepByKey(s._key, {
                                    dayNumber: Number(e.target.value) || 1,
                                  })
                                }
                                className="field py-2 text-sm font-medium"
                              >
                                {Array.from({ length: days }, (_, idx) => idx + 1).map((d) => (
                                  <option key={d} value={d}>
                                    Ngày {d}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[13px] font-medium text-ink-2 mb-1">
                                Nhóm dịch vụ
                              </label>
                              <select
                                disabled={isCancelled}
                                value={s.category}
                                onChange={(e) =>
                                  updateStepByKey(s._key, { category: e.target.value })
                                }
                                className="field py-2 text-sm font-medium"
                              >
                                {REQUOTE_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-4">
                              <label className="block text-[13px] font-medium text-ink-2 mb-1">
                                Tên hạng mục / phương án
                              </label>
                              <input
                                type="text"
                                disabled={isCancelled}
                                value={s.title}
                                onChange={(e) =>
                                  updateStepByKey(s._key, {
                                    title: e.target.value,
                                    noteType:
                                      s.noteType === 'PRESET' ? 'ALTERNATIVE' : s.noteType,
                                  })
                                }
                                className="field py-2 text-[15px] font-medium"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[13px] font-medium text-ink-2 mb-1 text-right">
                                Đơn giá / khách (đ)
                              </label>
                              <input
                                type="number"
                                step={50_000}
                                min={0}
                                disabled={isCancelled}
                                value={s.pricePerPerson}
                                onChange={(e) => handlePriceChange(s, Number(e.target.value))}
                                className={`field py-2 text-right num text-base font-semibold ${
                                  isCustomUnpriced ? 'border-2 border-coral text-coral' : 'text-coral'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Chip chọn giá nhanh cho dòng CUSTOM / phát sinh */}
                          {!isCancelled &&
                            (s.noteType === 'CUSTOM' ||
                              s._wasCustom ||
                              s.noteType === 'GUIDE') && (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13px] font-medium text-ink-2 mr-1">
                                  Chọn nhanh mức giá:
                                </span>
                                {QUICK_CUSTOM_PRICES.map((presetPrice) => (
                                  <button
                                    key={presetPrice}
                                    type="button"
                                    aria-pressed={s.pricePerPerson === presetPrice}
                                    onClick={() => handlePriceChange(s, presetPrice)}
                                    className="chip num text-sm font-medium py-1.5 px-3"
                                  >
                                    +{formatVnd(presetPrice)}
                                  </button>
                                ))}
                              </div>
                            )}

                          {/* Đối chiếu gốc + Đề xuất thay thế từ kho vùng */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-rule text-sm">
                            <div className="text-ink-2 space-y-1 font-normal">
                              {s.originalTitle && s.originalTitle !== s.title && (
                                <div>
                                  Phương án gốc:{' '}
                                  <span className="line-through">{s.originalTitle}</span> (
                                  <span className="num font-medium">
                                    {formatVnd(s.originalPricePerPerson)}
                                  </span>
                                  )
                                </div>
                              )}
                              {diffVsOrig !== 0 && (
                                <div className="num font-medium text-ink flex items-center gap-2">
                                  <span>Chênh so với gốc:</span>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-semibold border ${
                                      diffVsOrig > 0
                                        ? 'bg-amber-soft text-amber border-amber/30'
                                        : 'bg-emerald-soft text-emerald border-emerald/30'
                                    }`}
                                  >
                                    {formatSignedDelta(diffVsOrig)}/khách
                                  </span>
                                </div>
                              )}
                            </div>

                            {!isCancelled && sameCatOpts.length > 0 && (
                              <div className="sm:w-80">
                                <select
                                  value=""
                                  onChange={(e) => replaceWithAlternative(s, e.target.value)}
                                  aria-label="Đề xuất phương án thay thế từ kho vùng"
                                  className="field py-2 text-sm font-medium"
                                >
                                  <option value="">
                                    Đề xuất đổi từ kho vùng ({s.category})
                                  </option>
                                  {sameCatOpts.map((o) => {
                                    const delta =
                                      o.pricePerPerson - (Number(s.pricePerPerson) || 0);
                                    return (
                                      <option key={o.id} value={String(o.id)}>
                                        {o.title} — {formatVnd(o.pricePerPerson)} (
                                        {formatSignedDelta(delta)})
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Cột phải: Bảng tính giá sticky, Điều chỉnh đoàn 3 chế độ, Gửi báo giá & Lịch sử */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-[84px]">
          <div className="flagship-card">
            <div className="bg-flagship-dark text-white px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                Tổng hợp &amp; chốt báo giá
              </span>
              <span className="num text-[13px] font-medium text-slate-300">
                Vòng {booking.revisionCount}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Số ngày & Số khách */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-ink-2">Số ngày</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isCancelled || days <= 1}
                      onClick={() => handleRequestDaysChange(days - 1)}
                      aria-label="Giảm số ngày"
                      className="btn btn-ghost px-3 py-2 text-sm font-medium"
                    >
                      <MinusIcon size={16} strokeWidth={1.5} />
                    </button>
                    <span className="num flex-1 text-center text-base font-semibold text-ink">
                      {days}N
                    </span>
                    <button
                      type="button"
                      disabled={isCancelled || days >= 10}
                      onClick={() => handleRequestDaysChange(days + 1)}
                      aria-label="Tăng số ngày"
                      className="btn btn-ghost px-3 py-2 text-sm font-medium"
                    >
                      <PlusIcon size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="requote-guests"
                    className="block text-[13px] font-medium text-ink-2"
                  >
                    Số khách
                  </label>
                  <input
                    id="requote-guests"
                    type="number"
                    min={1}
                    max={30}
                    disabled={isCancelled}
                    value={guests}
                    onChange={(e) =>
                      setGuests(Math.min(30, Math.max(1, Number(e.target.value) || 1)))
                    }
                    className="field py-2 num text-base font-semibold text-center"
                  />
                </div>
              </div>

              {pendingDayShrink != null && (
                <div className="p-3.5 rounded-xl border border-amber bg-amber-soft text-sm space-y-2.5">
                  <div className="font-medium text-amber">
                    Ngày cuối đang có chặng hoạt động. Chọn cách xử lý khi giảm còn {pendingDayShrink}{' '}
                    ngày:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyDayShrink('move')}
                      className="btn btn-primary text-[13px] font-medium py-1.5 px-3"
                    >
                      Dời về Ngày {pendingDayShrink}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDayShrink('void')}
                      className="btn btn-danger text-[13px] font-medium py-1.5 px-3"
                    >
                      Đánh dấu bỏ
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDayShrink(null)}
                      className="btn btn-ghost text-[13px] font-medium py-1.5 px-3"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Bộ điều chỉnh đoàn 3 chế độ */}
              <div className="space-y-2.5">
                <span className="block text-[13px] font-medium text-ink-2">
                  Ưu đãi / Phụ thu cả đoàn
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={isCancelled}
                    aria-pressed={adjMode === 'none'}
                    onClick={() => {
                      setAdjMode('none');
                      setAdjAmount(0);
                    }}
                    className="chip text-[13px] font-medium py-1.5 px-3"
                  >
                    Không điều chỉnh (0đ)
                  </button>
                  <button
                    type="button"
                    disabled={isCancelled}
                    aria-pressed={adjMode === 'discount'}
                    onClick={() => setAdjMode('discount')}
                    className="chip text-[13px] font-medium py-1.5 px-3"
                  >
                    Giảm giá ưu đãi (−)
                  </button>
                  <button
                    type="button"
                    disabled={isCancelled}
                    aria-pressed={adjMode === 'surcharge'}
                    onClick={() => setAdjMode('surcharge')}
                    className="chip text-[13px] font-medium py-1.5 px-3"
                  >
                    Cộng phụ thu (+)
                  </button>
                </div>

                {adjMode !== 'none' && (
                  <div className="space-y-2.5 pt-1">
                    <div className="relative">
                      <span
                        className={`num absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-semibold ${
                          adjMode === 'discount' ? 'text-emerald' : 'text-amber'
                        }`}
                      >
                        {adjMode === 'discount' ? '−' : '+'}
                      </span>
                      <input
                        type="number"
                        step={50_000}
                        min={0}
                        disabled={isCancelled}
                        value={adjAmount}
                        onChange={(e) => setAdjAmount(Math.max(0, Number(e.target.value) || 0))}
                        className="field pl-8 text-right num text-base font-semibold"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_GROUP_ADJ.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          disabled={isCancelled}
                          aria-pressed={adjAmount === amt}
                          onClick={() => setAdjAmount(amt)}
                          className="chip num text-[13px] font-medium py-1 px-2.5"
                        >
                          {formatVnd(amt)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="editorial-divider" />

              {/* Tóm tắt tài chính */}
              <div className="bg-surface-2 rounded-xl border border-rule p-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-ink-2 font-normal">
                  <span>Đơn giá mới / khách</span>
                  <span className="num font-semibold text-ink">{formatVnd(perPerson)}</span>
                </div>
                <div className="flex justify-between text-ink-2 font-normal">
                  <span>Tạm tính ({guests} khách)</span>
                  <span className="num font-semibold text-ink">
                    {formatVnd(perPerson * guests)}
                  </span>
                </div>
                <div className="flex justify-between text-ink-2 font-normal">
                  <span>Điều chỉnh đoàn</span>
                  <span
                    className={`num font-semibold ${
                      groupAdjustmentSigned < 0
                        ? 'text-emerald'
                        : groupAdjustmentSigned > 0
                        ? 'text-amber'
                        : 'text-ink-3'
                    }`}
                  >
                    {formatSignedDelta(groupAdjustmentSigned)}
                  </span>
                </div>
                <div className="flex justify-between text-ink-3 font-normal">
                  <span>Phương án gốc ban đầu</span>
                  <span className="num">{formatVnd(booking.originalTotalPrice)}</span>
                </div>
                {booking.confirmedTotalPrice != null && (
                  <div className="flex justify-between text-ink-3 font-normal">
                    <span>Tổng đã chốt trước</span>
                    <span className="num">{formatVnd(booking.confirmedTotalPrice)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-rule flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-base text-ink">Tổng báo giá mới</span>
                  <span className="num text-[26px] sm:text-[28px] font-semibold text-coral leading-none">
                    {formatVnd(totalPreview)}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <span className="text-[13px] font-medium text-ink-2">Chênh so với gốc</span>
                  <span
                    className={`num inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-semibold border ${
                      diffOrig > 0
                        ? 'bg-amber-soft text-amber border-amber/35'
                        : 'bg-emerald-soft text-emerald border-emerald/35'
                    }`}
                  >
                    {formatSignedDelta(diffOrig)}
                  </span>
                </div>
              </div>

              {booking.customerNote && (
                <div className="p-3.5 rounded-xl border border-rule bg-surface-2 text-sm space-y-1">
                  <div className="text-[13px] font-medium text-ink-3">Lời nhắn từ khách</div>
                  <div className="text-ink font-normal">{booking.customerNote}</div>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="guide-requote-note"
                  className="block text-sm font-medium text-ink-2"
                >
                  Phản hồi gửi khách
                </label>
                <textarea
                  id="guide-requote-note"
                  rows={3}
                  disabled={isCancelled}
                  value={guideNote}
                  onChange={(e) => setGuideNote(e.target.value)}
                  placeholder="Ghi rõ lý do đổi phòng, nhà hàng hoặc chính sách ưu đãi"
                  className="field text-[15px]"
                />
              </div>

              {!isCancelled && (
                <div className="space-y-3">
                  {unpricedCustomSteps.length > 0 && (
                    <div className="p-3 rounded-xl border border-coral bg-coral-soft text-sm text-coral font-medium">
                      Chưa thể gửi vì còn {unpricedCustomSteps.length} yêu cầu thêm đang là 0đ. Hãy
                      nhập giá báo khách ở các mục viền đỏ bên trái.
                    </div>
                  )}

                  {rawTotalPreview < 0 && (
                    <div className="p-3 rounded-xl border border-crimson bg-crimson-soft text-sm text-crimson font-medium">
                      Tổng tiền sau giảm giá đang âm. Vui lòng giảm mức ưu đãi đoàn.
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!canSubmitRequote}
                    onClick={handleSendRequote}
                    className="btn btn-primary w-full py-3.5 text-base font-medium"
                  >
                    {booking.status === 'BOOKED_ORIGINAL' ? (
                      <CheckCircleIcon size={18} strokeWidth={1.5} />
                    ) : (
                      <ArrowRightIcon size={18} strokeWidth={1.5} />
                    )}
                    <span>
                      {busy
                        ? 'Đang gửi báo giá'
                        : booking.status === 'CONFIRMED'
                        ? 'Gửi báo giá điều chỉnh cho khách'
                        : 'Gửi báo giá lại cho khách'}
                    </span>
                  </button>

                  {!confirmCancelOpen ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmCancelOpen(true)}
                      className="btn btn-danger w-full py-2.5 text-sm font-medium"
                    >
                      <XIcon size={16} strokeWidth={1.5} />
                      <span>Hủy đơn này</span>
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-crimson bg-crimson-soft space-y-2.5 text-sm">
                      <div className="font-medium text-crimson">
                        Xác nhận hủy đơn {booking.code}? Thao tác này không thể hoàn tác.
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={handleCancel}
                          className="btn flex-1 py-2 text-sm font-medium bg-crimson text-white border-crimson hover:brightness-110"
                        >
                          {busy ? 'Đang hủy' : 'Xác nhận hủy đơn'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmCancelOpen(false)}
                          className="btn btn-ghost flex-1 py-2 text-sm font-medium"
                        >
                          Quay lại
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {booking.revisions?.length > 0 && (
            <div className="flagship-card">
              <div className="bg-surface-2 px-5 py-3 border-b border-rule flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-2">Lịch sử đàm phán</span>
                <span className="num text-[13px] font-medium text-ink-3">
                  {booking.revisions.length} lượt
                </span>
              </div>
              <div className="p-3.5 space-y-2.5 max-h-80 overflow-y-auto">
                {booking.revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 rounded-xl border border-rule bg-surface-2 text-sm space-y-1"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-ink">
                        <span className="num text-coral mr-1">V{rev.roundNo}</span>·{' '}
                        {rev.actionLabel}
                      </span>
                      <span className="num font-semibold text-coral shrink-0">
                        {formatVnd(rev.totalPrice)}
                      </span>
                    </div>
                    <div className="text-[13px] font-medium text-ink-3">{rev.actorName}</div>
                    {rev.note && (
                      <div className="text-[13px] font-normal text-ink-2">“{rev.note}”</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

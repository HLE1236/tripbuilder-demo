import { Avatar } from '@astryxdesign/core/Avatar';
import { formatVnd, noteTypeMeta, type Booking } from '../../api';
import {
  AlertIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircleIcon,
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  CompassIcon,
  EditIcon,
  MapPinIcon,
  PhoneIcon,
  RefreshIcon,
  StarIcon,
  UsersIcon,
  XIcon,
} from '../../components/icon';
import { SafeImage } from '../../components/ui/SafeImage';
import { TravelPhotoLightbox } from '../../components/ui/TravelPhotoLightbox';
import { useBookingWorkspace } from '../../hooks/useBookingWorkspace';
import { categoryDotClass } from '../../utils/tour';
import { CustomerCustomizeModal } from './CustomerCustomizeModal';

interface BookingWorkspaceProps {
  booking: Booking;
  onBack: () => void;
  onUpdated: (booking: Booking) => void;
}

const STEPPER_LEGS = [
  { idx: 0, label: 'Gửi yêu cầu' },
  { idx: 1, label: 'Chờ kiểm tra' },
  { idx: 2, label: 'Báo giá mới' },
  { idx: 3, label: 'Chốt chuyến' },
];

export function BookingWorkspace({ booking, onBack, onUpdated }: BookingWorkspaceProps) {
  const {
    busy,
    refreshing,
    error,
    editOpen,
    setEditOpen,
    confirmCancel,
    setConfirmCancel,
    rating,
    setRating,
    reviewText,
    setReviewText,
    reviewSaved,
    lightboxOpen,
    setLightboxOpen,
    lightboxIdx,
    setLightboxIdx,
    st,
    mode,
    isCancelled,
    photos,
    activeStepZeroBased,
    canCustomerEdit,
    canConfirm,
    groupedDays,
    serviceDiffPerPerson,
    serviceDiffTotal,
    diffFromConfirmed,
    nextActionGuidance,
    handleRefresh,
    handleConfirm,
    handleCancel,
    acceptAlternative,
    handleReview,
  } = useBookingWorkspace(booking, onUpdated);

  return (
    <div className="space-y-6 pb-12">
      {/* Thanh điều hướng trên cùng */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="btn btn-ghost !py-2 !px-4 text-sm font-medium">
          <ArrowLeftIcon size={16} />
          <span>Quay lại chuyến của tôi</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={refreshing || busy}
            onClick={handleRefresh}
            className="btn btn-ghost !py-2 !px-3.5 text-sm font-medium"
          >
            <RefreshIcon size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}</span>
          </button>

          <span className="num text-sm font-semibold px-3 py-1.5 rounded-lg border border-rule bg-surface text-ink">
            {booking.code}
          </span>
          <span className={`tag ${st.tagClass} !normal-case !tracking-normal !font-medium`}>
            {st.short}
          </span>
          <span className="num text-sm font-medium px-3 py-1.5 rounded-lg border border-rule bg-surface-2 text-ink-2">
            Mẫu v{booking.tourVersionSnapshot}
          </span>
          {booking.latestTourVersion > booking.tourVersionSnapshot && (
            <span className="text-sm font-medium px-3 py-1.5 rounded-lg bg-amber-soft text-amber">
              Tour gốc đã lên v{booking.latestTourVersion} · Đơn giữ giá cũ
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-crimson/40 bg-crimson-soft px-5 py-4 text-sm font-medium text-crimson flex items-start gap-3">
          <AlertIcon size={18} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Thao tác chưa hoàn tất</div>
            <div className="mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Bảng trạng thái "Việc tiếp theo cần làm" */}
      <div
        className={`rounded-xl border px-5 py-4 flex items-start gap-3.5 ${
          nextActionGuidance.tone === 'emerald'
            ? 'border-emerald/35 bg-emerald-soft text-emerald'
            : nextActionGuidance.tone === 'amber'
            ? 'border-amber/35 bg-amber-soft text-amber'
            : nextActionGuidance.tone === 'crimson'
            ? 'border-crimson/35 bg-crimson-soft text-crimson'
            : nextActionGuidance.tone === 'coral'
            ? 'border-coral/35 bg-coral-soft text-coral'
            : 'border-indigo/35 bg-indigo-soft text-indigo'
        }`}
      >
        {nextActionGuidance.tone === 'emerald' ? (
          <CheckCircleIcon size={20} className="mt-0.5 shrink-0" />
        ) : nextActionGuidance.tone === 'crimson' || nextActionGuidance.tone === 'amber' ? (
          <AlertIcon size={20} className="mt-0.5 shrink-0" />
        ) : (
          <CompassIcon size={20} className="mt-0.5 shrink-0" />
        )}
        <div className="space-y-1">
          <div className="text-base font-semibold">{nextActionGuidance.title}</div>
          <p className="text-sm font-medium opacity-95 leading-relaxed">
            {nextActionGuidance.body}
          </p>
        </div>
      </div>

      {/* Hồ sơ chính */}
      <section className="flagship-card">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-4 relative border-b lg:border-b-0 lg:border-r border-rule bg-surface-2">
            <button
              type="button"
              onClick={() => {
                setLightboxIdx(0);
                setLightboxOpen(true);
              }}
              className="relative w-full h-full min-h-[250px] overflow-hidden cursor-pointer group block"
            >
              <SafeImage
                src={booking.tour.imageUrl}
                alt={booking.tourTitleSnapshot}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-2 rounded-lg bg-flagship-dark/85 backdrop-blur-md border border-white/20 px-3 py-1.5 text-sm font-medium text-white num">
                <CameraIcon size={15} />
                <span>{photos.length} ảnh thực tế</span>
              </span>
            </button>
          </div>

          <div className="lg:col-span-8 p-6 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-medium text-ink-2">
                <span className="inline-flex items-center gap-1.5 text-ink">
                  <MapPinIcon size={15} className="text-ink-3" />
                  {booking.tour.regionName}
                </span>
                <span className="inline-flex items-center gap-1.5 num">
                  <CalendarIcon size={15} className="text-ink-3" />
                  {booking.startDate}
                </span>
                <span className="inline-flex items-center gap-1.5 num">
                  <ClockIcon size={15} className="text-ink-3" />
                  {booking.days} ngày
                </span>
                <span className="inline-flex items-center gap-1.5 num">
                  <UsersIcon size={15} className="text-ink-3" />
                  {booking.guests} khách
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CompassIcon size={15} className="text-ink-3" />
                  {mode.label}
                </span>
              </div>

              <h1 className="text-2xl sm:text-[30px] font-semibold tracking-[-0.02em] text-ink leading-tight">
                {booking.tourTitleSnapshot}
              </h1>
            </div>

            {/* Stepper 4 chặng */}
            {!isCancelled && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {STEPPER_LEGS.map((leg) => {
                  const isCompleted =
                    booking.status === 'CONFIRMED' ? leg.idx <= 3 : leg.idx < activeStepZeroBased;
                  const isActive =
                    booking.status !== 'CONFIRMED' && leg.idx === activeStepZeroBased;
                  return (
                    <div
                      key={leg.idx}
                      className={`rounded-lg border px-3.5 py-2.5 flex items-center gap-2 ${
                        isCompleted
                          ? 'border-emerald/40 bg-emerald-soft text-emerald'
                          : isActive
                          ? 'border-coral/50 bg-coral-soft text-coral'
                          : 'border-rule bg-surface-2 text-ink-3'
                      }`}
                    >
                      <span className="num text-sm font-semibold shrink-0">
                        {isCompleted ? <CheckIcon size={16} /> : `0${leg.idx + 1}`}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {leg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Local Host Card + Cụm nút hành động */}
            <div className="rounded-xl bg-surface-2 border border-rule p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="rounded-full border border-rule shrink-0">
                  <Avatar
                    src={booking.guide.avatarUrl || undefined}
                    name={booking.guide.fullName}
                    size="lg"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-base font-semibold text-ink">
                    Guide {booking.guide.fullName}
                  </div>
                  <div className="text-sm text-ink-2">
                    Thổ địa · {booking.guide.yearsExperience || 5} năm kinh nghiệm
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneIcon size={15} className="text-ink-3" />
                    {booking.guide.phone ? (
                      <a
                        href={`tel:${booking.guide.phone}`}
                        className="num text-base font-semibold text-ink hover:text-coral transition-colors duration-150"
                      >
                        {booking.guide.phone}
                      </a>
                    ) : (
                      <span className="text-sm text-ink-3">
                        Liên hệ qua ghi chú đơn
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {canCustomerEdit && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setEditOpen(true)}
                    className="btn btn-ghost text-sm font-medium"
                  >
                    <EditIcon size={15} />
                    <span>
                      {booking.status === 'CONFIRMED' ? 'Xin điều chỉnh sau chốt' : 'Chỉnh sửa lịch'}
                    </span>
                  </button>
                )}

                {canConfirm && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleConfirm}
                    className="btn btn-confirm text-sm font-semibold"
                  >
                    <CheckIcon size={16} />
                    <span>{busy ? 'Đang xử lý...' : 'Chốt chuyến'}</span>
                  </button>
                )}

                {!isCancelled && booking.status !== 'CONFIRMED' && (
                  !confirmCancel ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmCancel(true)}
                      className="btn btn-danger text-sm font-medium"
                    >
                      <XIcon size={15} />
                      <span>Huỷ đơn</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-crimson/40 bg-crimson-soft px-3 py-1.5">
                      <span className="text-sm font-medium text-crimson">Xác nhận huỷ?</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleCancel}
                        className="btn btn-danger !py-1.5 !px-3 text-sm !bg-crimson !text-white !border-crimson"
                      >
                        Đúng, huỷ đơn
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmCancel(false)}
                        className="btn btn-ghost !py-1.5 !px-3 text-sm"
                      >
                        Giữ lại
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <hr className="editorial-divider" />

        {/* 4-Column Financial Ledger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-rule bg-surface-2">
          <div className="p-5 space-y-1.5">
            <div className="text-sm font-medium text-ink-3">1. Giá lịch trình chuẩn</div>
            <div className="num text-[22px] sm:text-[26px] font-semibold text-ink">
              {formatVnd(booking.originalTotalPrice)}
            </div>
            <div className="num text-sm text-ink-2">
              {formatVnd(booking.originalPricePerPerson)}/khách × {booking.guests} khách
            </div>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="text-sm font-medium text-ink-3">2. Thay đổi dịch vụ</div>
            <div
              className={`num text-[22px] sm:text-[26px] font-semibold ${
                serviceDiffTotal > 0
                  ? 'text-amber'
                  : serviceDiffTotal < 0
                  ? 'text-emerald'
                  : 'text-ink-2'
              }`}
            >
              {serviceDiffTotal > 0 ? `+${formatVnd(serviceDiffTotal)}` : formatVnd(serviceDiffTotal)}
            </div>
            <div className="num text-sm text-ink-2">
              {serviceDiffPerPerson === 0
                ? 'Không thay đổi so với gốc'
                : `${serviceDiffPerPerson > 0 ? '+' : ''}${formatVnd(
                    serviceDiffPerPerson
                  )}/khách × ${booking.guests} khách`}
            </div>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="text-sm font-medium text-ink-3">3. Ưu đãi / Phụ thu đoàn</div>
            <div
              className={`num text-[22px] sm:text-[26px] font-semibold ${
                booking.groupAdjustment < 0
                  ? 'text-emerald'
                  : booking.groupAdjustment > 0
                  ? 'text-amber'
                  : 'text-ink-2'
              }`}
            >
              {booking.groupAdjustment > 0
                ? `+${formatVnd(booking.groupAdjustment)}`
                : formatVnd(booking.groupAdjustment)}
            </div>
            <div className="text-sm text-ink-2">
              {booking.groupAdjustment < 0
                ? 'Ưu đãi giảm giá đoàn'
                : booking.groupAdjustment > 0
                ? 'Phụ thu thêm cho đoàn'
                : 'Không có điều chỉnh đoàn'}
            </div>
          </div>

          {/* Cột 4: Điểm nhấn thanh toán */}
          <div className="p-5 space-y-1.5 bg-surface border-t-2 lg:border-t-0 lg:border-l-2 border-coral">
            <div className="text-sm font-semibold text-coral">4. Tổng thanh toán cuối</div>
            <div className="num text-[26px] sm:text-[30px] font-semibold text-ink leading-tight">
              {formatVnd(booking.totalPrice)}
            </div>
            <div className="num text-sm text-ink-2">
              {diffFromConfirmed != null
                ? `Đã chốt trước: ${formatVnd(booking.confirmedTotalPrice)} (${
                    diffFromConfirmed >= 0 ? '+' : ''
                  }${formatVnd(diffFromConfirmed)})`
                : `Tổng cho ${booking.guests} khách · ${booking.days} ngày`}
            </div>
          </div>
        </div>
      </section>

      {/* Nội dung 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl sm:text-3xl font-semibold text-ink">
              Chi tiết lịch trình ({booking.steps.filter((s) => s.noteType !== 'REMOVED').length}{' '}
              dịch vụ)
            </h2>
            <span className="num text-sm font-medium text-ink-2">
              Vòng thương lượng #{booking.revisionCount}
            </span>
          </div>

          {groupedDays.map((dayGroup) => (
            <section key={dayGroup.dayNumber} className="flagship-card">
              <div className="bg-surface-2 border-b border-rule px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-ink">
                    Ngày {String(dayGroup.dayNumber).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-ink-3">
                    {dayGroup.items.filter(({ step }) => step.noteType !== 'REMOVED').length} mục
                    hoạt động
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-ink-3 mr-2">Đơn giá ngày:</span>
                  <span className="num text-lg font-semibold text-ink">
                    {formatVnd(dayGroup.daySubtotal)}
                  </span>
                  <span className="text-sm text-ink-3"> /khách</span>
                </div>
              </div>

              {dayGroup.items.length === 0 ? (
                <div className="px-5 py-6 text-sm text-ink-3 text-center">
                  Ngày {dayGroup.dayNumber} hiện chưa có dịch vụ nào.
                </div>
              ) : (
                <div className="divide-y divide-rule">
                  {dayGroup.items.map(({ step: s, origIdx }) => {
                    const badge = noteTypeMeta(s.noteType);
                    const removed = s.noteType === 'REMOVED';
                    const priceDiff =
                      s.originalPricePerPerson != null
                        ? s.pricePerPerson - s.originalPricePerPerson
                        : 0;

                    return (
                      <div
                        key={`${s.dayNumber}-${origIdx}-${s.title}`}
                        className={`p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                          removed ? 'bg-surface-2/80' : 'bg-surface'
                        }`}
                      >
                        <SafeImage
                          src={s.imageUrl || booking.tour.imageUrl}
                          alt={s.title}
                          className={`w-full sm:w-28 h-32 sm:h-20 rounded-lg object-cover shrink-0 border border-rule ${
                            removed ? 'opacity-50 grayscale' : ''
                          }`}
                        />

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-md border border-rule bg-surface-2 px-2.5 py-0.5 text-sm font-medium text-ink-2">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${categoryDotClass(
                                  s.category
                                )}`}
                              />
                              <span>{s.category}</span>
                            </span>
                            <span className={`tag ${badge.tagClass} !normal-case !tracking-normal !font-medium`}>
                              {badge.label === 'ĐÃ BỎ' ? 'Đã bỏ' : badge.label}
                            </span>
                          </div>

                          <div
                            className={`text-[17px] font-semibold leading-snug ${
                              removed ? 'line-through text-ink-3' : 'text-ink'
                            }`}
                          >
                            {s.title}
                          </div>

                          {s.originalTitle && s.originalTitle !== s.title && (
                            <div className="text-sm text-ink-2">
                              Thay cho: <span className="line-through">{s.originalTitle}</span> (
                              <span className="num font-medium">
                                {formatVnd(s.originalPricePerPerson)}
                              </span>
                              )
                            </div>
                          )}

                          {s.noteType === 'ALTERNATIVE' && booking.status === 'REQUOTED' && (
                            <div className="pt-1">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => acceptAlternative(origIdx)}
                                className="btn btn-confirm !py-2 !px-3.5 text-sm font-medium"
                              >
                                <CheckIcon size={15} />
                                <span>Đồng ý phương án này</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="sm:text-right shrink-0 space-y-1">
                          <div
                            className={`num text-lg font-semibold ${
                              removed
                                ? 'text-crimson'
                                : s.pricePerPerson > 0
                                ? 'text-ink'
                                : 'text-amber'
                            }`}
                          >
                            {removed ? (
                              '0đ'
                            ) : s.pricePerPerson > 0 ? (
                              formatVnd(s.pricePerPerson)
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-amber-soft text-amber px-2.5 py-0.5 text-sm font-medium">
                                Chờ giá
                              </span>
                            )}
                          </div>
                          {!removed && (
                            <div className="text-sm text-ink-3">/ khách</div>
                          )}
                          {priceDiff !== 0 && !removed && (
                            <div>
                              <span
                                className={`num inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium ${
                                  priceDiff > 0
                                    ? 'bg-amber-soft text-amber'
                                    : 'bg-emerald-soft text-emerald'
                                }`}
                              >
                                {priceDiff > 0 ? `+${formatVnd(priceDiff)}` : formatVnd(priceDiff)}
                                /khách
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Cột phải: Trao đổi, Nhật ký & Đánh giá */}
        <div className="lg:col-span-4 space-y-5">
          {(booking.customerNote || booking.guideNote) && (
            <section className="flagship-card">
              <div className="bg-surface-2 px-5 py-3 border-b border-rule flex items-center gap-2">
                <ClipboardIcon size={16} className="text-ink-3" />
                <span className="text-sm font-semibold text-ink">Trao đổi mới nhất</span>
              </div>
              <div className="divide-y divide-rule">
                {booking.customerNote && (
                  <div className="p-4 space-y-1">
                    <div className="text-sm font-medium text-ink-3">Bạn nhắn Guide</div>
                    <p className="text-[15px] text-ink leading-relaxed">
                      {booking.customerNote}
                    </p>
                  </div>
                )}
                {booking.guideNote && (
                  <div className="p-4 space-y-1 bg-surface-2/60">
                    <div className="text-sm font-medium text-coral">Guide phản hồi</div>
                    <p className="text-[15px] text-ink leading-relaxed">
                      {booking.guideNote}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {booking.revisions?.length > 0 && (
            <section className="flagship-card">
              <div className="bg-surface-2 px-5 py-3 border-b border-rule flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ClockIcon size={16} className="text-ink-3" />
                  <span className="text-sm font-semibold text-ink">Nhật ký thương lượng</span>
                </div>
                <span className="num text-sm font-medium text-ink-2">
                  {booking.revisions.length} vòng
                </span>
              </div>

              <div className="divide-y divide-rule max-h-96 overflow-y-auto">
                {booking.revisions.map((rev) => (
                  <div key={rev.id} className="p-4 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink">
                        V{rev.roundNo} · {rev.actionLabel}
                      </span>
                      <span className="num font-semibold text-ink">
                        {formatVnd(rev.totalPrice)}
                      </span>
                    </div>
                    <div className="text-ink-3">
                      {rev.actorRole === 'GUIDE' ? 'Guide' : 'Khách'}: {rev.actorName}
                    </div>
                    {rev.note && (
                      <div className="text-ink-2 leading-relaxed">“{rev.note}”</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Đánh giá sau chốt (nút 44x44px h-11 w-11 có aria-label) */}
          {booking.status === 'CONFIRMED' && (
            <section className="flagship-card">
              <div className="bg-surface-2 px-5 py-3 border-b border-rule flex items-center gap-2">
                <StarIcon size={16} className="text-amber" />
                <span className="text-sm font-semibold text-ink">Đánh giá Tour Guide</span>
              </div>
              <div className="p-5 space-y-3.5">
                <div className="flex items-center gap-2" role="group" aria-label="Chọn số sao">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        aria-label={`Đánh giá ${star} sao`}
                        aria-pressed={active}
                        className={`h-11 w-11 inline-flex items-center justify-center rounded-lg border transition-colors duration-150 cursor-pointer ${
                          active
                            ? 'border-amber/60 bg-amber-soft text-amber'
                            : 'border-rule bg-surface-2 text-ink-3 hover:text-ink'
                        }`}
                      >
                        <StarIcon size={22} filled={active} />
                      </button>
                    );
                  })}
                </div>

                <textarea
                  rows={2}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm thực tế cùng Guide..."
                  aria-label="Nhận xét về Tour Guide"
                  className="field text-base"
                />

                {reviewSaved && (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-emerald">
                    <CheckCircleIcon size={16} />
                    <span>Đã lưu đánh giá của bạn</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={handleReview}
                  className="btn btn-primary w-full justify-center font-semibold"
                >
                  <span>{busy ? 'Đang gửi...' : 'Gửi đánh giá'}</span>
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {editOpen && (
        <CustomerCustomizeModal
          isOpen={editOpen}
          tour={booking.tour}
          customerId={booking.customer.id}
          existingBooking={booking}
          onClose={() => setEditOpen(false)}
          onSuccess={(updated) => {
            setEditOpen(false);
            onUpdated(updated);
          }}
        />
      )}

      <TravelPhotoLightbox
        photos={photos}
        initialIndex={lightboxIdx}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        regionTitle={`${booking.tour.regionName} · ${booking.tourTitleSnapshot}`}
      />
    </div>
  );
}

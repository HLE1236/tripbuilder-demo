import { useEffect, useState } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { formatVnd, noteTypeMeta, type Booking, type PresetOption, type Tour } from '../../api';
import type { CreateBookingPayload } from '../../api/booking';
import { getOptionsByRegionApi } from '../../api/option/getOptionsByRegion.api';
import {
  AlertIcon,
  CalendarIcon,
  CheckIcon,
  CustomIcon,
  MinusIcon,
  PlusIcon,
  RestoreIcon,
  SearchIcon,
  SwapIcon,
  UsersIcon,
  VoidIcon,
  XIcon,
} from '../../components/icon';
import { SafeImage } from '../../components/ui/SafeImage';
import { useCustomerCustomize } from '../../hooks/useCustomerCustomize';
import { matchesVietnameseQuery } from '../../utils/search';
import { categoryDotClass } from '../../utils/tour';

export interface CustomerCustomizeModalProps {
  isOpen: boolean;
  tour: Tour;
  customerId: number;
  isAuthenticated?: boolean;
  existingBooking?: Booking | null;
  externalError?: string;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
  onRequireAuth?: (draft: Omit<CreateBookingPayload, 'customerId'>) => void;
}

type SwapPriceFilter = 'ALL' | 'CHEAPER' | 'EQUAL' | 'HIGHER';
type SwapSort = 'default' | 'price_asc' | 'price_desc' | 'diff_asc';
type PresetSort = 'default' | 'price_asc' | 'price_desc';
type OptionItem = PresetOption & { description?: string | null };

const CATEGORIES = ['Di chuyển', 'Khách sạn', 'Ăn uống', 'Trải nghiệm', 'Yêu cầu thêm'];

export function CustomerCustomizeModal({
  isOpen,
  tour,
  customerId,
  isAuthenticated = true,
  existingBooking,
  externalError,
  onClose,
  onSuccess,
  onRequireAuth,
}: CustomerCustomizeModalProps) {
  const {
    tomorrowStr,
    isPostConfirm,
    startDate,
    setStartDate,
    days,
    guests,
    adults,
    setAdults,
    children,
    setChildren,
    serviceMode,
    setServiceMode,
    customerNote,
    setCustomerNote,
    steps,
    options,
    expandedSwapUid,
    setExpandedSwapUid,
    openPresetDay,
    setOpenPresetDay,
    presetCatFilter,
    setPresetCatFilter,
    openCustomDay,
    setOpenCustomDay,
    customCat,
    setCustomCat,
    customTitle,
    setCustomTitle,
    pendingReduceDays,
    submitting,
    error,
    activeSteps,
    unpricedCustomCount,
    estPerPerson,
    groupAdjustment,
    estTotal,
    hasChanges,
    itineraryWarnings,
    dayList,
    affectedCount,
    swapStepWithOption,
    restoreOriginalStep,
    toggleRemove,
    addPresetOptionToDay,
    addCustomStepToDay,
    handleDecreaseDays,
    handleIncreaseDays,
    resolveDayReduction,
    handleSubmit,
  } = useCustomerCustomize({
    tour,
    customerId,
    isAuthenticated,
    existingBooking,
    onSuccess,
    onRequireAuth,
  });

  const [swapQuery, setSwapQuery] = useState('');
  const [swapPriceFilter, setSwapPriceFilter] = useState<SwapPriceFilter>('ALL');
  const [swapSort, setSwapSort] = useState<SwapSort>('default');
  const [remoteSwapResult, setRemoteSwapResult] = useState<{
    uid: string;
    query: string;
    items: OptionItem[];
  } | null>(null);

  const [presetQuery, setPresetQuery] = useState('');
  const [presetSort, setPresetSort] = useState<PresetSort>('default');

  const handleToggleSwap = (uid: string) => {
    setSwapQuery('');
    setSwapPriceFilter('ALL');
    setSwapSort('default');
    setRemoteSwapResult(null);
    setExpandedSwapUid(expandedSwapUid === uid ? null : uid);
  };

  const handleTogglePresetDay = (dayNum: number, isCurrentlyOpen: boolean) => {
    setOpenCustomDay(null);
    setPresetCatFilter('ALL');
    setPresetQuery('');
    setPresetSort('default');
    setOpenPresetDay(isCurrentlyOpen ? null : dayNum);
  };

  const expandedCategory = steps.find((st) => st._uid === expandedSwapUid)?.category ?? null;

  useEffect(() => {
    if (!expandedSwapUid || !expandedCategory) return;
    const trimmed = swapQuery.trim();
    if (!trimmed) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      getOptionsByRegionApi({
        regionId: tour.regionId,
        category: expandedCategory,
        q: trimmed,
        sort: swapSort === 'price_asc' || swapSort === 'price_desc' ? swapSort : 'default',
      })
        .then((fetched) => {
          if (!cancelled && Array.isArray(fetched)) {
            setRemoteSwapResult({
              uid: expandedSwapUid,
              query: trimmed,
              items: fetched as OptionItem[],
            });
          }
        })
        .catch(() => {
          // Giữ kết quả lọc phía client khi tìm kiếm nền lỗi
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [expandedCategory, expandedSwapUid, swapQuery, swapSort, tour.regionId]);

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      width={980}
      maxHeight="92dvh"
      purpose="form"
    >
      <div className="flex flex-col max-h-[86dvh] min-h-0 overflow-hidden bg-surface">
        <div className="shrink-0 border-b border-rule">
          <DialogHeader
            title={
              isPostConfirm
                ? `Xin điều chỉnh sau khi chốt · ${existingBooking?.code}`
                : existingBooking
                ? `Tuỳ chỉnh lịch trình · ${existingBooking.code}`
                : `Tuỳ chỉnh & Đặt chuyến · ${tour.title}`
            }
            subtitle={`${tour.regionName} · Guide ${tour.guide.fullName}`}
            onOpenChange={(open) => !open && onClose()}
          />
        </div>

        <div className="flex-1 min-h-0 p-5 space-y-5 overflow-y-auto bg-canvas">
          {isPostConfirm && (
            <div className="rounded-xl border border-amber/40 bg-amber-soft px-4 py-3.5 text-sm font-medium text-amber flex items-start gap-3">
              <AlertIcon size={18} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Đơn này đã chốt lịch trước đó</div>
                <div className="mt-0.5">
                  Giá đã chốt:{' '}
                  <span className="num font-semibold">
                    {formatVnd(
                      existingBooking?.confirmedTotalPrice ?? existingBooking?.totalPrice
                    )}
                  </span>
                  . Thay đổi sẽ được gửi sang Guide để báo giá phần chênh lệch.
                </div>
              </div>
            </div>
          )}

          {(error || externalError) && (
            <div className="rounded-xl border border-crimson/40 bg-crimson-soft px-4 py-3.5 text-sm font-medium text-crimson flex items-start gap-3">
              <AlertIcon size={18} className="mt-0.5 shrink-0" />
              <span>{error || externalError}</span>
            </div>
          )}

          {/* Thông số hành trình */}
          <section className="flagship-card">
            <div className="bg-surface-2 px-5 py-3 border-b border-rule flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink">Thông tin hành trình & Đoàn khách</span>
              <span className="num text-sm font-medium text-ink-2">
                Mẫu chuẩn: {tour.days} ngày · {formatVnd(tour.basePricePerPerson)}/khách
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-rule">
              <div className="p-4 space-y-2">
                <label htmlFor="cust-start-date" className="text-sm font-medium text-ink-3 block">
                  Ngày khởi hành
                </label>
                <div className="relative flex items-center">
                  <CalendarIcon
                    size={16}
                    className="text-ink-3 absolute left-3 pointer-events-none"
                  />
                  <input
                    id="cust-start-date"
                    type="date"
                    min={tomorrowStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="field num !pl-9 !py-2 text-base"
                  />
                </div>
                <p className="text-xs text-ink-3">Đặt trước tối thiểu 24 giờ</p>
              </div>

              <div className="p-4 space-y-2">
                <span className="text-sm font-medium text-ink-3 block">Số ngày</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDecreaseDays}
                    disabled={days <= 1}
                    aria-label="Giảm số ngày"
                    className="btn btn-ghost !p-2 h-10 w-10"
                  >
                    <MinusIcon size={16} />
                  </button>
                  <span className="num text-base font-semibold text-ink flex-1 text-center">
                    {days} ngày
                  </span>
                  <button
                    type="button"
                    onClick={handleIncreaseDays}
                    disabled={days >= 10}
                    aria-label="Tăng số ngày"
                    className="btn btn-ghost !p-2 h-10 w-10"
                  >
                    <PlusIcon size={16} />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink-3">Số khách</span>
                  <span className="num text-xs font-medium text-ink-2 inline-flex items-center gap-1">
                    <UsersIcon size={13} className="text-ink-3" />
                    Tổng {guests} khách
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-ink-2">Người lớn</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAdults((a) => Math.max(1, a - 1))}
                        disabled={adults <= 1}
                        aria-label="Giảm số người lớn"
                        className="btn btn-ghost !p-1.5 h-8 w-8"
                      >
                        <MinusIcon size={14} />
                      </button>
                      <span className="num text-sm font-semibold text-ink w-6 text-center">
                        {adults}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAdults((a) => (guests < 30 ? a + 1 : a))}
                        disabled={guests >= 30}
                        aria-label="Tăng số người lớn"
                        className="btn btn-ghost !p-1.5 h-8 w-8"
                      >
                        <PlusIcon size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-ink-2">Trẻ em</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setChildren((c) => Math.max(0, c - 1))}
                        disabled={children <= 0}
                        aria-label="Giảm số trẻ em"
                        className="btn btn-ghost !p-1.5 h-8 w-8"
                      >
                        <MinusIcon size={14} />
                      </button>
                      <span className="num text-sm font-semibold text-ink w-6 text-center">
                        {children}
                      </span>
                      <button
                        type="button"
                        onClick={() => setChildren((c) => (guests < 30 ? c + 1 : c))}
                        disabled={guests >= 30}
                        aria-label="Tăng số trẻ em"
                        className="btn btn-ghost !p-1.5 h-8 w-8"
                      >
                        <PlusIcon size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <span className="text-sm font-medium text-ink-3 block">Hình thức Guide</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-pressed={serviceMode === 'COMPANION'}
                    onClick={() => setServiceMode('COMPANION')}
                    className="chip !rounded-lg justify-center !py-2 text-sm font-medium"
                  >
                    Đi cùng
                  </button>
                  <button
                    type="button"
                    aria-pressed={serviceMode === 'REMOTE'}
                    onClick={() => setServiceMode('REMOTE')}
                    className="chip !rounded-lg justify-center !py-2 text-sm font-medium"
                  >
                    Đặt hộ
                  </button>
                </div>
                <p className="text-xs text-ink-3 leading-relaxed">
                  {serviceMode === 'COMPANION'
                    ? 'Guide đồng hành trực tiếp suốt hành trình.'
                    : 'Guide đặt dịch vụ từ xa, không đi cùng đoàn.'}
                </p>
              </div>
            </div>
          </section>

          {itineraryWarnings.length > 0 && (
            <div className="rounded-xl border border-amber/40 bg-amber-soft px-4 py-3 text-sm text-amber space-y-1">
              <div className="font-semibold flex items-center gap-2">
                <AlertIcon size={16} className="shrink-0" />
                <span>Lưu ý nhỏ về lịch trình (không bắt buộc sửa)</span>
              </div>
              <ul className="list-disc pl-6 space-y-0.5 text-xs sm:text-sm">
                {itineraryWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Cảnh báo khi giảm số ngày mà ngày bị cắt có hoạt động */}
          {pendingReduceDays !== null && (
            <div className="flagship-card border border-amber bg-amber-soft p-5 space-y-3">
              <div className="flex items-start gap-3 text-amber">
                <AlertIcon size={20} className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <div className="text-base font-semibold">
                    Ngày {pendingReduceDays + 1} đang có {affectedCount} hoạt động
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    Khi rút ngắn hành trình xuống còn {pendingReduceDays} ngày, bạn muốn xử lý các
                    dịch vụ ở ngày bị cắt như thế nào?
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 pl-8">
                <button
                  type="button"
                  onClick={() => resolveDayReduction('move')}
                  className="btn btn-primary !py-2 !px-3.5 text-sm font-medium"
                >
                  Chuyển sang Ngày {pendingReduceDays}
                </button>
                <button
                  type="button"
                  onClick={() => resolveDayReduction('void')}
                  className="btn btn-danger !py-2 !px-3.5 text-sm font-medium"
                >
                  Đánh dấu bỏ
                </button>
                <button
                  type="button"
                  onClick={() => resolveDayReduction('cancel')}
                  className="btn btn-ghost !py-2 !px-3.5 text-sm font-medium"
                >
                  Giữ nguyên {days} ngày
                </button>
              </div>
            </div>
          )}

          {/* Danh sách Ngày 1..days */}
          <div className="space-y-5">
            {dayList.map((dayNum) => {
              const dayItems = steps.filter((s) => s.dayNumber === dayNum);
              const dayActiveSubtotal = dayItems
                .filter((s) => s.noteType !== 'REMOVED')
                .reduce((acc, s) => acc + (s.pricePerPerson || 0), 0);
              const isPresetOpen = openPresetDay === dayNum;
              const isCustomOpen = openCustomDay === dayNum;
              const filteredRegionOptions = (options as OptionItem[])
                .filter((o) => presetCatFilter === 'ALL' || o.category === presetCatFilter)
                .filter(
                  (o) =>
                    !presetQuery.trim() ||
                    matchesVietnameseQuery(o.title, presetQuery) ||
                    matchesVietnameseQuery(o.description, presetQuery)
                )
                .sort((a, b) => {
                  if (presetSort === 'price_asc') return a.pricePerPerson - b.pricePerPerson;
                  if (presetSort === 'price_desc') return b.pricePerPerson - a.pricePerPerson;
                  return 0;
                });

              return (
                <section key={dayNum} className="flagship-card">
                  <div className="bg-surface-2 border-b border-rule px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-ink">
                        Ngày {String(dayNum).padStart(2, '0')}
                      </span>
                      <span className="text-sm text-ink-3">
                        {dayItems.filter((s) => s.noteType !== 'REMOVED').length} mục hoạt động
                        {dayNum > tour.days && ' · Ngày thêm mới'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm text-ink-3 mr-2">Đơn giá ngày:</span>
                      <span className="num text-lg font-semibold text-ink">
                        {formatVnd(dayActiveSubtotal)}
                      </span>
                      <span className="text-sm text-ink-3"> /khách</span>
                    </div>
                  </div>

                  {dayItems.length === 0 ? (
                    <div className="px-5 py-7 text-center text-[15px] text-ink-2 bg-surface">
                      Ngày {dayNum} chưa có dịch vụ nào. Chọn dịch vụ có sẵn tại {tour.regionName}{' '}
                      hoặc tự nhập yêu cầu riêng bên dưới.
                    </div>
                  ) : (
                    <div className="divide-y divide-rule">
                      {dayItems.map((s) => {
                        const isRemoved = s.noteType === 'REMOVED';
                        const meta = noteTypeMeta(s.noteType);
                        const sameCatOptions = options.filter((o) => o.category === s.category);
                        const canSwap = !isRemoved && sameCatOptions.length > 0 && s.noteType !== 'CUSTOM';
                        const isSwapExpanded = expandedSwapUid === s._uid;
                        const origPrice = s.originalPricePerPerson ?? 0;
                        const diffFromOrig =
                          s.originalTitle != null && !isRemoved ? s.pricePerPerson - origPrice : 0;

                        return (
                          <div key={s._uid} className={isRemoved ? 'bg-surface-2/80' : 'bg-surface'}>
                            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                              <SafeImage
                                src={s.imageUrl || tour.imageUrl}
                                alt={s.title}
                                className={`w-full sm:w-24 h-28 sm:h-[72px] rounded-lg object-cover shrink-0 border border-rule ${
                                  isRemoved ? 'opacity-50 grayscale' : ''
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
                                  <span className={`tag ${meta.tagClass} !normal-case !tracking-normal !font-medium`}>
                                    {meta.label === 'ĐÃ BỎ' ? 'Đã bỏ' : meta.label}
                                  </span>
                                </div>

                                <div
                                  className={`text-[17px] font-semibold leading-snug ${
                                    isRemoved ? 'line-through text-ink-3' : 'text-ink'
                                  }`}
                                >
                                  {s.title}
                                </div>

                                {s.originalTitle && s.originalTitle !== s.title && !isRemoved && (
                                  <div className="text-sm text-ink-2">
                                    Thay cho: <span className="line-through">{s.originalTitle}</span>{' '}
                                    (<span className="num font-medium">{formatVnd(origPrice)}</span>)
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 shrink-0">
                                <div className="text-left sm:text-right mr-1 space-y-1">
                                  <div
                                    className={`num text-lg font-semibold ${
                                      isRemoved
                                        ? 'text-crimson'
                                        : s.pricePerPerson > 0
                                        ? 'text-ink'
                                        : 'text-amber'
                                    }`}
                                  >
                                    {isRemoved ? (
                                      '0đ'
                                    ) : s.pricePerPerson > 0 ? (
                                      formatVnd(s.pricePerPerson)
                                    ) : (
                                      <span className="inline-flex items-center rounded-md bg-amber-soft text-amber px-2.5 py-0.5 text-sm font-medium">
                                        Chờ báo giá
                                      </span>
                                    )}
                                  </div>
                                  {diffFromOrig !== 0 && (
                                    <div>
                                      <span
                                        className={`num inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium ${
                                          diffFromOrig > 0
                                            ? 'bg-amber-soft text-amber'
                                            : 'bg-emerald-soft text-emerald'
                                        }`}
                                      >
                                        {diffFromOrig > 0
                                          ? `+${formatVnd(diffFromOrig)}`
                                          : formatVnd(diffFromOrig)}
                                        /khách
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {canSwap && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSwap(s._uid)}
                                    aria-expanded={isSwapExpanded}
                                    className={`btn !py-2 !px-3 text-sm font-medium ${
                                      isSwapExpanded ? 'btn-primary' : 'btn-ghost'
                                    }`}
                                  >
                                    <SwapIcon size={14} />
                                    <span>{isSwapExpanded ? 'Đóng lựa chọn' : 'Đổi lựa chọn'}</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => toggleRemove(s._uid)}
                                  className={
                                    isRemoved
                                      ? 'btn btn-confirm !py-2 !px-3 text-sm font-medium'
                                      : 'btn btn-danger !py-2 !px-3 text-sm font-medium'
                                  }
                                >
                                  {isRemoved ? <RestoreIcon size={14} /> : <VoidIcon size={14} />}
                                  <span>{isRemoved ? 'Khôi phục' : 'Bỏ mục này'}</span>
                                </button>
                              </div>
                            </div>

                            {isSwapExpanded && (() => {
                              const trimmedSwapQuery = swapQuery.trim();
                              const activeRemoteOptions =
                                remoteSwapResult &&
                                remoteSwapResult.uid === s._uid &&
                                remoteSwapResult.query === trimmedSwapQuery
                                  ? remoteSwapResult.items
                                  : [];

                              const mergedSameCatOptions: OptionItem[] = [
                                ...(sameCatOptions as OptionItem[]),
                                ...activeRemoteOptions.filter(
                                  (r) =>
                                    r.category === s.category &&
                                    !sameCatOptions.some((o) => o.id === r.id)
                                ),
                              ];

                              const filteredSwapOptions = mergedSameCatOptions
                                .filter((opt) => {
                                  if (
                                    swapQuery.trim() &&
                                    !matchesVietnameseQuery(opt.title, swapQuery) &&
                                    !matchesVietnameseQuery(opt.description, swapQuery)
                                  ) {
                                    return false;
                                  }
                                  if (swapPriceFilter === 'CHEAPER') {
                                    return opt.pricePerPerson < s.pricePerPerson;
                                  }
                                  if (swapPriceFilter === 'EQUAL') {
                                    return opt.pricePerPerson === s.pricePerPerson;
                                  }
                                  if (swapPriceFilter === 'HIGHER') {
                                    return opt.pricePerPerson > s.pricePerPerson;
                                  }
                                  return true;
                                })
                                .sort((a, b) => {
                                  if (swapSort === 'price_asc') {
                                    return a.pricePerPerson - b.pricePerPerson;
                                  }
                                  if (swapSort === 'price_desc') {
                                    return b.pricePerPerson - a.pricePerPerson;
                                  }
                                  if (swapSort === 'diff_asc') {
                                    return (
                                      Math.abs(a.pricePerPerson - s.pricePerPerson) -
                                      Math.abs(b.pricePerPerson - s.pricePerPerson)
                                    );
                                  }
                                  return 0;
                                });

                              return (
                                <div className="bg-surface-2 border-t border-rule px-5 py-4 space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-ink">
                                      Chọn phương án {s.category} thay thế tại {tour.regionName}
                                    </span>
                                    <span className="text-sm text-ink-3">
                                      Chênh lệch tính so với lựa chọn đang hiển thị
                                    </span>
                                  </div>

                                  {/* Thanh tìm kiếm, lọc giá & sắp xếp */}
                                  <div className="space-y-2.5">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <div className="relative flex-1 flex items-center">
                                        <SearchIcon
                                          size={15}
                                          className="text-ink-3 absolute left-3 pointer-events-none"
                                        />
                                        <input
                                          type="text"
                                          value={swapQuery}
                                          onChange={(e) => setSwapQuery(e.target.value)}
                                          placeholder="Tìm tên hoặc mô tả (hỗ trợ không dấu)..."
                                          aria-label="Tìm phương án thay thế"
                                          className="field !pl-9 !pr-8 !py-2 text-sm w-full"
                                        />
                                        {swapQuery && (
                                          <button
                                            type="button"
                                            onClick={() => setSwapQuery('')}
                                            aria-label="Xoá tìm kiếm"
                                            className="absolute right-2.5 p-0.5 text-ink-3 hover:text-ink cursor-pointer"
                                          >
                                            <XIcon size={14} />
                                          </button>
                                        )}
                                      </div>

                                      <select
                                        value={swapSort}
                                        onChange={(e) => setSwapSort(e.target.value as SwapSort)}
                                        aria-label="Sắp xếp phương án thay thế"
                                        className="field !py-2 text-sm sm:w-48"
                                      >
                                        <option value="default">Mặc định</option>
                                        <option value="price_asc">Giá thấp → cao</option>
                                        <option value="price_desc">Giá cao → thấp</option>
                                        <option value="diff_asc">Chênh lệch ít nhất</option>
                                      </select>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {(
                                        [
                                          { id: 'ALL', label: 'Tất cả' },
                                          { id: 'CHEAPER', label: 'Rẻ hơn' },
                                          { id: 'EQUAL', label: 'Tương đương' },
                                          { id: 'HIGHER', label: 'Cao cấp hơn' },
                                        ] as const
                                      ).map((chipItem) => (
                                        <button
                                          key={chipItem.id}
                                          type="button"
                                          aria-pressed={swapPriceFilter === chipItem.id}
                                          onClick={() => setSwapPriceFilter(chipItem.id)}
                                          className="chip !py-1 !px-3 text-sm font-medium"
                                        >
                                          {chipItem.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="divide-y divide-rule rounded-lg border border-rule bg-surface overflow-hidden">
                                    {s.originalTitle &&
                                      s.originalTitle !== s.title &&
                                      !sameCatOptions.some((o) => o.title === s.originalTitle) && (
                                        <button
                                          type="button"
                                          onClick={() => restoreOriginalStep(s._uid)}
                                          className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface-2 text-left cursor-pointer transition-colors duration-150"
                                        >
                                          <div className="min-w-0">
                                            <div className="text-[15px] font-semibold text-ink truncate">
                                              {s.originalTitle}{' '}
                                              <span className="text-ink-2">(Mục gốc của tour)</span>
                                            </div>
                                          </div>
                                          <div className="text-right shrink-0 space-y-0.5">
                                            <div className="num text-[15px] font-semibold text-ink">
                                              {formatVnd(origPrice)}
                                            </div>
                                            <div>
                                              <span
                                                className={`num inline-flex items-center rounded-md px-2 py-0.5 text-sm font-medium ${
                                                  origPrice - s.pricePerPerson > 0
                                                    ? 'bg-amber-soft text-amber'
                                                    : origPrice - s.pricePerPerson < 0
                                                    ? 'bg-emerald-soft text-emerald'
                                                    : 'bg-surface-2 text-ink-3'
                                                }`}
                                              >
                                                {origPrice - s.pricePerPerson === 0
                                                  ? 'Không đổi giá'
                                                  : `${origPrice - s.pricePerPerson > 0 ? '+' : ''}${formatVnd(
                                                      origPrice - s.pricePerPerson
                                                    )}/khách`}
                                              </span>
                                            </div>
                                          </div>
                                        </button>
                                      )}

                                    {filteredSwapOptions.length === 0 ? (
                                      <div className="px-4 py-6 text-center space-y-3">
                                        <p className="text-sm text-ink-2">
                                          Không tìm thấy phương án {s.category} phù hợp với bộ lọc hiện tại.
                                        </p>
                                        {trimmedSwapQuery && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              swapStepWithOption(s._uid, {
                                                id: -Date.now(),
                                                regionId: tour.regionId,
                                                category: s.category,
                                                title: trimmedSwapQuery,
                                                imageUrl: s.imageUrl,
                                                pricePerPerson: 0,
                                              })
                                            }
                                            className="btn btn-primary !py-2 !px-4 text-sm font-medium inline-flex items-center gap-2"
                                          >
                                            <CustomIcon size={15} />
                                            <span>
                                              Đề xuất &ldquo;{trimmedSwapQuery}&rdquo; như yêu cầu riêng để Guide báo giá
                                            </span>
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      filteredSwapOptions.map((opt) => {
                                        const isSelected =
                                          opt.title === s.title &&
                                          opt.pricePerPerson === s.pricePerPerson;
                                        const isOriginal =
                                          Boolean(s.originalTitle) && opt.title === s.originalTitle;
                                        const delta = opt.pricePerPerson - s.pricePerPerson;

                                        return (
                                          <button
                                            key={opt.id}
                                            type="button"
                                            disabled={isSelected}
                                            onClick={() => swapStepWithOption(s._uid, opt)}
                                            className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors duration-150 ${
                                              isSelected
                                                ? 'bg-surface-2 cursor-default'
                                                : 'hover:bg-surface-2 cursor-pointer'
                                            }`}
                                          >
                                            <div className="flex items-center gap-3 min-w-0">
                                              <SafeImage
                                                src={opt.imageUrl || tour.imageUrl}
                                                alt={opt.title}
                                                className="w-14 h-11 rounded-lg object-cover border border-rule shrink-0"
                                              />
                                              <div className="min-w-0">
                                                <div className="text-[15px] font-semibold text-ink truncate">
                                                  {opt.title}
                                                </div>
                                                {opt.description && (
                                                  <div className="text-sm text-ink-3 line-clamp-2 mt-0.5">
                                                    {opt.description}
                                                  </div>
                                                )}
                                                <div className="flex items-center gap-2 text-sm">
                                                  {isOriginal && (
                                                    <span className="text-ink-2 font-medium">
                                                      Mục gốc của tour
                                                    </span>
                                                  )}
                                                  {isSelected && (
                                                    <span className="text-coral font-medium">
                                                      Đang chọn
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="text-right shrink-0 space-y-0.5">
                                              <div className="num text-[15px] font-semibold text-ink">
                                                {formatVnd(opt.pricePerPerson)}
                                              </div>
                                              <div>
                                                <span
                                                  className={`num inline-flex items-center rounded-md px-2 py-0.5 text-sm font-medium ${
                                                    isSelected
                                                      ? 'bg-surface-2 text-ink-3'
                                                      : delta > 0
                                                      ? 'bg-amber-soft text-amber'
                                                      : delta < 0
                                                      ? 'bg-emerald-soft text-emerald'
                                                      : 'bg-surface-2 text-ink-3'
                                                  }`}
                                                >
                                                  {isSelected
                                                    ? 'Đang chọn'
                                                    : delta === 0
                                                    ? 'Không đổi giá'
                                                    : `${delta > 0 ? '+' : ''}${formatVnd(
                                                        delta
                                                      )}/khách`}
                                                </span>
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Thêm từ gợi ý có sẵn hoặc Tự nhập yêu cầu riêng */}
                  <div className="bg-surface-2 border-t border-rule px-5 py-3.5 space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleTogglePresetDay(dayNum, isPresetOpen)}
                        className={`btn !py-2 !px-3.5 text-sm font-medium ${
                          isPresetOpen ? 'btn-primary' : 'btn-ghost'
                        }`}
                      >
                        <PlusIcon size={15} />
                        <span>Chọn dịch vụ gợi ý có sẵn</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenPresetDay(null);
                          setCustomTitle('');
                          setOpenCustomDay(isCustomOpen ? null : dayNum);
                        }}
                        className={`btn !py-2 !px-3.5 text-sm font-medium ${
                          isCustomOpen ? 'btn-primary' : 'btn-ghost'
                        }`}
                      >
                        <CustomIcon size={15} />
                        <span>Tự nhập yêu cầu riêng</span>
                      </button>
                    </div>

                    {isPresetOpen && (
                      <div className="rounded-lg border border-rule bg-surface p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-ink">
                            Kho dịch vụ niêm yết tại {tour.regionName} → Thêm vào Ngày {dayNum}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {['ALL', 'Di chuyển', 'Khách sạn', 'Ăn uống', 'Trải nghiệm'].map(
                              (cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  aria-pressed={presetCatFilter === cat}
                                  onClick={() => setPresetCatFilter(cat)}
                                  className="chip !py-1.5 !px-3 text-sm font-medium"
                                >
                                  {cat === 'ALL' ? 'Tất cả' : cat}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1 flex items-center">
                            <SearchIcon
                              size={15}
                              className="text-ink-3 absolute left-3 pointer-events-none"
                            />
                            <input
                              type="text"
                              value={presetQuery}
                              onChange={(e) => setPresetQuery(e.target.value)}
                              placeholder="Tìm dịch vụ theo tên hoặc mô tả (hỗ trợ không dấu)..."
                              aria-label="Tìm dịch vụ gợi ý có sẵn"
                              className="field !pl-9 !pr-8 !py-2 text-sm w-full"
                            />
                            {presetQuery && (
                              <button
                                type="button"
                                onClick={() => setPresetQuery('')}
                                aria-label="Xoá tìm kiếm dịch vụ"
                                className="absolute right-2.5 p-0.5 text-ink-3 hover:text-ink cursor-pointer"
                              >
                                <XIcon size={14} />
                              </button>
                            )}
                          </div>

                          <select
                            value={presetSort}
                            onChange={(e) => setPresetSort(e.target.value as PresetSort)}
                            aria-label="Sắp xếp dịch vụ theo giá"
                            className="field !py-2 text-sm sm:w-44"
                          >
                            <option value="default">Mặc định</option>
                            <option value="price_asc">Giá thấp → cao</option>
                            <option value="price_desc">Giá cao → thấp</option>
                          </select>
                        </div>

                        {filteredRegionOptions.length === 0 ? (
                          <div className="py-4 text-center space-y-2.5">
                            <div className="text-sm text-ink-3">
                              {presetQuery.trim()
                                ? `Không tìm thấy dịch vụ phù hợp với "${presetQuery.trim()}".`
                                : `Chưa có dịch vụ mẫu thuộc nhóm này tại ${tour.regionName}.`}
                            </div>
                            {presetQuery.trim() && (
                              <button
                                type="button"
                                onClick={() => {
                                  const q = presetQuery.trim();
                                  setOpenPresetDay(null);
                                  setCustomCat(
                                    presetCatFilter !== 'ALL' ? presetCatFilter : 'Trải nghiệm'
                                  );
                                  setCustomTitle(q);
                                  setOpenCustomDay(dayNum);
                                }}
                                className="btn btn-primary !py-2 !px-3.5 text-sm font-medium inline-flex items-center gap-2"
                              >
                                <CustomIcon size={15} />
                                <span>Đề xuất &ldquo;{presetQuery.trim()}&rdquo; như yêu cầu riêng</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                            {filteredRegionOptions.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => addPresetOptionToDay(dayNum, opt)}
                                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-rule bg-surface-2 hover:border-rule-strong text-left cursor-pointer transition-colors duration-150"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <SafeImage
                                    src={opt.imageUrl || tour.imageUrl}
                                    alt={opt.title}
                                    className="w-14 h-11 rounded-md object-cover border border-rule shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-ink truncate">
                                      {opt.title}
                                    </div>
                                    {opt.description && (
                                      <div className="text-xs text-ink-3 line-clamp-2 mt-0.5">
                                        {opt.description}
                                      </div>
                                    )}
                                    <div className="text-sm text-ink-3">{opt.category}</div>
                                  </div>
                                </div>
                                <span className="num text-sm font-semibold text-ink shrink-0">
                                  +{formatVnd(opt.pricePerPerson)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {isCustomOpen && (
                      <div className="rounded-lg border border-rule bg-surface p-4 space-y-3">
                        <div className="text-sm font-semibold text-ink">
                          Yêu cầu riêng cho Ngày {dayNum} (Guide sẽ báo giá sau khi nhận)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                          <div className="sm:col-span-3">
                            <select
                              value={customCat}
                              onChange={(e) => setCustomCat(e.target.value)}
                              aria-label="Nhóm dịch vụ yêu cầu thêm"
                              className="field text-sm"
                            >
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-6">
                            <input
                              type="text"
                              value={customTitle}
                              onChange={(e) => setCustomTitle(e.target.value)}
                              placeholder="Thuê xe riêng 7 chỗ, tiệc BBQ tối..."
                              className="field text-base"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <button
                              type="button"
                              disabled={!customTitle.trim()}
                              onClick={() => addCustomStepToDay(dayNum)}
                              className="btn btn-primary !py-2.5 !px-3.5 text-sm font-medium w-full"
                            >
                              <PlusIcon size={15} />
                              <span>Thêm vào Ngày {dayNum}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Ghi chú cho Tour Guide */}
          <section className="flagship-card p-5 space-y-2.5">
            <label htmlFor="customer-note" className="text-sm font-semibold text-ink block">
              Ghi chú gửi Tour Guide
            </label>
            <textarea
              id="customer-note"
              rows={2}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Giờ bay dự kiến, yêu cầu ăn chay/ăn kiêng, trẻ nhỏ hoặc ưu tiên phòng yên tĩnh..."
              className="field text-base"
            />
          </section>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-rule bg-surface-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm text-ink-2 flex flex-wrap items-center gap-x-2">
              <span>
                Tạm tính (<span className="num font-semibold text-ink">{guests}</span> khách ×{' '}
                <span className="num font-semibold text-ink">{formatVnd(estPerPerson)}</span>/khách)
              </span>
              {groupAdjustment !== 0 && (
                <span
                  className={`num inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium ${
                    groupAdjustment < 0
                      ? 'bg-emerald-soft text-emerald'
                      : 'bg-amber-soft text-amber'
                  }`}
                >
                  Điều chỉnh đoàn {groupAdjustment > 0 ? '+' : ''}
                  {formatVnd(groupAdjustment)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {unpricedCustomCount > 0 ? (
                <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-medium text-ink">
                  <span>
                    Tạm tính phần có sẵn:{' '}
                    <span className="num text-xl sm:text-2xl font-semibold text-ink">
                      {formatVnd(estTotal)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-soft text-amber px-3 py-1 text-sm font-medium">
                    <AlertIcon size={15} />
                    <span>+ {unpricedCustomCount} mục chờ Guide báo giá</span>
                  </span>
                </div>
              ) : (
                <span className="num text-2xl font-semibold text-ink">{formatVnd(estTotal)}</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <button type="button" onClick={onClose} className="btn btn-ghost font-medium">
              Đóng
            </button>
            <button
              type="button"
              disabled={submitting || activeSteps.length === 0}
              onClick={handleSubmit}
              className="btn btn-primary font-semibold"
            >
              <CheckIcon size={16} />
              <span>
                {submitting
                  ? 'Đang gửi...'
                  : isPostConfirm
                  ? 'Gửi yêu cầu điều chỉnh'
                  : hasChanges
                  ? 'Gửi tuỳ chỉnh cho Guide'
                  : 'Đặt theo lịch chuẩn'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

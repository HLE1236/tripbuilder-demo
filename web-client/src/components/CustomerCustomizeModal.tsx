import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import {
  createBooking,
  customizeBooking,
  formatVnd,
  getOptionsByRegion,
  noteTypeMeta,
  type Booking,
  type BookingStep,
  type PresetOption,
  type ServiceMode,
  type Tour,
} from '../api';
import { Icon } from './Icon';
import { SafeImage } from './SafeImage';

export interface CustomerCustomizeModalProps {
  isOpen: boolean;
  tour: Tour;
  customerId: number;
  existingBooking?: Booking | null;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
}

interface LocalStep extends BookingStep {
  _uid: string;
  _restoreSnapshot?: {
    title: string;
    pricePerPerson: number;
    noteType: string;
  };
}

const CATEGORIES = ['Di chuyển', 'Khách sạn', 'Ăn uống', 'Trải nghiệm', 'Yêu cầu thêm'];

function categoryDotClass(category: string): string {
  switch (category) {
    case 'Khách sạn':
      return 'bg-indigo';
    case 'Ăn uống':
      return 'bg-orange';
    case 'Di chuyển':
      return 'bg-sky';
    case 'Trải nghiệm':
      return 'bg-emerald';
    default:
      return 'bg-coral';
  }
}

function getLocalTodayIso(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function getDefaultStartDate(): string {
  const future = new Date(Date.now() + 14 * 86400_000);
  const offsetMs = future.getTimezoneOffset() * 60_000;
  return new Date(future.getTime() - offsetMs).toISOString().slice(0, 10);
}

let uidSeq = 1;
function nextUid(): string {
  uidSeq += 1;
  return `step-${Date.now()}-${uidSeq}`;
}

export function CustomerCustomizeModal({
  isOpen,
  tour,
  customerId,
  existingBooking,
  onClose,
  onSuccess,
}: CustomerCustomizeModalProps) {
  const todayStr = useMemo(() => getLocalTodayIso(), []);
  const isPostConfirm =
    existingBooking?.status === 'CONFIRMED' || existingBooking?.status === 'CHANGE_REQUESTED';

  const [startDate, setStartDate] = useState(
    existingBooking?.startDate || getDefaultStartDate()
  );
  const [days, setDays] = useState(existingBooking?.days || tour.days);
  const [guests, setGuests] = useState(existingBooking?.guests || 2);
  const [serviceMode, setServiceMode] = useState<ServiceMode>(
    existingBooking?.serviceMode === 'REMOTE' ? 'REMOTE' : 'COMPANION'
  );
  const [customerNote, setCustomerNote] = useState(existingBooking?.customerNote || '');

  const [steps, setSteps] = useState<LocalStep[]>(() =>
    existingBooking
      ? existingBooking.steps.map((s) => ({ ...s, _uid: nextUid() }))
      : tour.steps.map((s) => ({
          _uid: nextUid(),
          dayNumber: s.dayNumber,
          category: s.category,
          title: s.title,
          imageUrl: s.imageUrl,
          pricePerPerson: s.pricePerPerson,
          originalTitle: s.title,
          originalPricePerPerson: s.pricePerPerson,
          noteType: 'PRESET',
        }))
  );

  const [options, setOptions] = useState<PresetOption[]>([]);
  const [expandedSwapUid, setExpandedSwapUid] = useState<string | null>(null);
  const [openPresetDay, setOpenPresetDay] = useState<number | null>(null);
  const [presetCatFilter, setPresetCatFilter] = useState<string>('ALL');
  const [openCustomDay, setOpenCustomDay] = useState<number | null>(null);
  const [customCat, setCustomCat] = useState('Yêu cầu thêm');
  const [customTitle, setCustomTitle] = useState('');
  const [pendingReduceDays, setPendingReduceDays] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getOptionsByRegion(tour.regionId)
      .then(setOptions)
      .catch(() => setOptions([]));
  }, [tour.regionId]);

  const activeSteps = steps.filter((s) => s.noteType !== 'REMOVED');
  const unpricedCustomCount = activeSteps.filter(
    (s) => s.noteType === 'CUSTOM' || s.pricePerPerson === 0
  ).length;
  const estPerPerson = activeSteps.reduce((acc, s) => acc + (s.pricePerPerson || 0), 0);
  const groupAdjustment = existingBooking?.groupAdjustment ?? 0;
  const estTotal = Math.max(0, estPerPerson * guests + groupAdjustment);

  const hasChanges =
    days !== tour.days ||
    steps.some((s) => s.noteType !== 'PRESET') ||
    existingBooking?.status === 'REQUOTED' ||
    isPostConfirm;

  const swapStepWithOption = (uid: string, opt: PresetOption) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s._uid !== uid) return s;
        const isBackToOriginal =
          Boolean(s.originalTitle) &&
          opt.title === s.originalTitle &&
          opt.pricePerPerson === (s.originalPricePerPerson ?? 0);
        return {
          ...s,
          title: opt.title,
          imageUrl: opt.imageUrl || s.imageUrl,
          pricePerPerson: opt.pricePerPerson,
          noteType: s.originalTitle ? (isBackToOriginal ? 'PRESET' : 'MODIFIED') : 'MODIFIED',
        };
      })
    );
    setExpandedSwapUid(null);
  };

  const restoreOriginalStep = (uid: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s._uid !== uid) return s;
        if (s.originalTitle) {
          const origStep = tour.steps.find((ts) => ts.title === s.originalTitle);
          const origPrice = s.originalPricePerPerson ?? origStep?.pricePerPerson ?? 0;
          return {
            ...s,
            title: s.originalTitle,
            imageUrl: origStep?.imageUrl || s.imageUrl,
            pricePerPerson: origPrice,
            noteType: 'PRESET',
            _restoreSnapshot: undefined,
          };
        }
        if (s._restoreSnapshot) {
          return {
            ...s,
            title: s._restoreSnapshot.title,
            pricePerPerson: s._restoreSnapshot.pricePerPerson,
            noteType: s._restoreSnapshot.noteType,
            _restoreSnapshot: undefined,
          };
        }
        return s;
      })
    );
    setExpandedSwapUid(null);
  };

  const toggleRemove = (uid: string) => {
    if (expandedSwapUid === uid) setExpandedSwapUid(null);
    setSteps((prev) =>
      prev
        .map((s): LocalStep | null => {
          if (s._uid !== uid) return s;

          if (s.noteType === 'REMOVED') {
            if (s.originalTitle) {
              const origStep = tour.steps.find((ts) => ts.title === s.originalTitle);
              const origPrice = s.originalPricePerPerson ?? origStep?.pricePerPerson ?? 0;
              return {
                ...s,
                title: s.originalTitle,
                pricePerPerson: origPrice,
                noteType: 'PRESET',
                _restoreSnapshot: undefined,
              };
            }
            if (s._restoreSnapshot) {
              return {
                ...s,
                title: s._restoreSnapshot.title,
                pricePerPerson: s._restoreSnapshot.pricePerPerson,
                noteType: s._restoreSnapshot.noteType,
                _restoreSnapshot: undefined,
              };
            }
            return { ...s, noteType: 'PRESET' };
          }

          if (s.originalTitle || s.noteType === 'GUIDE' || s.noteType === 'ALTERNATIVE') {
            return {
              ...s,
              _restoreSnapshot: {
                title: s.title,
                pricePerPerson: s.pricePerPerson,
                noteType: s.noteType,
              },
              noteType: 'REMOVED',
              pricePerPerson: 0,
            };
          }

          return null;
        })
        .filter((x): x is LocalStep => x !== null)
    );
  };

  const addPresetOptionToDay = (dayNum: number, opt: PresetOption) => {
    setSteps((prev) => [
      ...prev,
      {
        _uid: nextUid(),
        dayNumber: dayNum,
        category: opt.category,
        title: opt.title,
        imageUrl: opt.imageUrl || tour.imageUrl,
        pricePerPerson: opt.pricePerPerson,
        originalTitle: null,
        originalPricePerPerson: 0,
        noteType: 'MODIFIED',
      },
    ]);
    setOpenPresetDay(null);
  };

  const addCustomStepToDay = (dayNum: number) => {
    if (!customTitle.trim()) return;
    setSteps((prev) => [
      ...prev,
      {
        _uid: nextUid(),
        dayNumber: dayNum,
        category: customCat,
        title: customTitle.trim(),
        imageUrl: tour.imageUrl,
        pricePerPerson: 0,
        originalTitle: null,
        originalPricePerPerson: 0,
        noteType: 'CUSTOM',
      },
    ]);
    setCustomTitle('');
    setOpenCustomDay(null);
  };

  const handleDecreaseDays = () => {
    if (days <= 1) return;
    const nextDays = days - 1;
    const activeAffected = steps.filter((s) => s.dayNumber > nextDays && s.noteType !== 'REMOVED');
    if (activeAffected.length > 0) {
      setPendingReduceDays(nextDays);
      return;
    }
    setSteps((prev) =>
      prev.map((s) => (s.dayNumber > nextDays ? { ...s, dayNumber: nextDays } : s))
    );
    setDays(nextDays);
    if (openPresetDay && openPresetDay > nextDays) setOpenPresetDay(null);
    if (openCustomDay && openCustomDay > nextDays) setOpenCustomDay(null);
  };

  const resolveDayReduction = (action: 'move' | 'void' | 'cancel') => {
    if (pendingReduceDays == null) return;
    const targetDays = pendingReduceDays;
    setPendingReduceDays(null);
    if (action === 'cancel') return;

    if (action === 'move') {
      setSteps((prev) =>
        prev.map((s) => (s.dayNumber > targetDays ? { ...s, dayNumber: targetDays } : s))
      );
    } else {
      setSteps((prev) =>
        prev
          .map((s): LocalStep | null => {
            if (s.dayNumber <= targetDays) return s;
            if (s.originalTitle || s.noteType === 'GUIDE' || s.noteType === 'ALTERNATIVE') {
              return {
                ...s,
                dayNumber: targetDays,
                _restoreSnapshot:
                  s.noteType !== 'REMOVED'
                    ? {
                        title: s.title,
                        pricePerPerson: s.pricePerPerson,
                        noteType: s.noteType,
                      }
                    : s._restoreSnapshot,
                noteType: 'REMOVED',
                pricePerPerson: 0,
              };
            }
            return null;
          })
          .filter((x): x is LocalStep => x !== null)
      );
    }
    setDays(targetDays);
    if (openPresetDay && openPresetDay > targetDays) setOpenPresetDay(null);
    if (openCustomDay && openCustomDay > targetDays) setOpenCustomDay(null);
  };

  const handleSubmit = async () => {
    setError('');
    if (activeSteps.length === 0) {
      setError('Lịch trình phải có ít nhất 1 hoạt động chưa bị bỏ.');
      return;
    }
    if (pendingReduceDays !== null) {
      setError('Vui lòng chọn cách xử lý các hoạt động ở ngày bị cắt trước khi gửi.');
      return;
    }

    setSubmitting(true);
    try {
      const payloadSteps: BookingStep[] = steps.map((s) => ({
        id: s.id,
        dayNumber: Math.min(Math.max(1, s.dayNumber), days),
        category: s.category,
        title: s.title,
        imageUrl: s.imageUrl,
        pricePerPerson: s.pricePerPerson,
        originalTitle: s.originalTitle,
        originalPricePerPerson: s.originalPricePerPerson,
        noteType: s.noteType,
      }));

      const saved = existingBooking
        ? await customizeBooking(existingBooking.id, {
            startDate,
            days,
            guests,
            serviceMode,
            customerNote,
            steps: payloadSteps,
          })
        : await createBooking({
            tourId: tour.id,
            customerId,
            startDate,
            days,
            guests,
            serviceMode,
            customerNote,
            customized: hasChanges,
            steps: payloadSteps,
          });
      onSuccess(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể lưu yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const dayList = Array.from({ length: days }, (_, i) => i + 1);
  const affectedCount =
    pendingReduceDays != null
      ? steps.filter((s) => s.dayNumber > pendingReduceDays && s.noteType !== 'REMOVED').length
      : 0;

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
              <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
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

          {error && (
            <div className="rounded-xl border border-crimson/40 bg-crimson-soft px-4 py-3.5 text-sm font-medium text-crimson flex items-start gap-3">
              <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
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
                  <Icon
                    name="calendar"
                    size={16}
                    className="text-ink-3 absolute left-3 pointer-events-none"
                  />
                  <input
                    id="cust-start-date"
                    type="date"
                    min={todayStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="field num !pl-9 !py-2 text-base"
                  />
                </div>
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
                    <Icon name="minus" size={16} />
                  </button>
                  <span className="num text-base font-semibold text-ink flex-1 text-center">
                    {days} ngày
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingReduceDays(null);
                      setDays((d) => Math.min(10, d + 1));
                    }}
                    disabled={days >= 10}
                    aria-label="Tăng số ngày"
                    className="btn btn-ghost !p-2 h-10 w-10"
                  >
                    <Icon name="plus" size={16} />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <span className="text-sm font-medium text-ink-3 block">Số khách</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    disabled={guests <= 1}
                    aria-label="Giảm số khách"
                    className="btn btn-ghost !p-2 h-10 w-10"
                  >
                    <Icon name="minus" size={16} />
                  </button>
                  <span className="num text-base font-semibold text-ink flex-1 text-center inline-flex items-center justify-center gap-1.5">
                    <Icon name="users" size={16} className="text-ink-3" />
                    {guests}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuests((g) => Math.min(30, g + 1))}
                    disabled={guests >= 30}
                    aria-label="Tăng số khách"
                    className="btn btn-ghost !p-2 h-10 w-10"
                  >
                    <Icon name="plus" size={16} />
                  </button>
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
              </div>
            </div>
          </section>

          {/* Cảnh báo khi giảm số ngày mà ngày bị cắt có hoạt động */}
          {pendingReduceDays !== null && (
            <div className="flagship-card border border-amber bg-amber-soft p-5 space-y-3">
              <div className="flex items-start gap-3 text-amber">
                <Icon name="alert" size={20} className="mt-0.5 shrink-0" />
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
              const filteredRegionOptions = options.filter(
                (o) => presetCatFilter === 'ALL' || o.category === presetCatFilter
              );

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
                                    onClick={() =>
                                      setExpandedSwapUid(isSwapExpanded ? null : s._uid)
                                    }
                                    aria-expanded={isSwapExpanded}
                                    className={`btn !py-2 !px-3 text-sm font-medium ${
                                      isSwapExpanded ? 'btn-primary' : 'btn-ghost'
                                    }`}
                                  >
                                    <Icon name="swap" size={14} />
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
                                  <Icon name={isRemoved ? 'restore' : 'void'} size={14} />
                                  <span>{isRemoved ? 'Khôi phục' : 'Bỏ mục này'}</span>
                                </button>
                              </div>
                            </div>

                            {isSwapExpanded && (
                              <div className="bg-surface-2 border-t border-rule px-5 py-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-sm font-semibold text-ink">
                                    Chọn phương án {s.category} thay thế tại {tour.regionName}
                                  </span>
                                  <span className="text-sm text-ink-3">
                                    Chênh lệch tính so với lựa chọn đang hiển thị
                                  </span>
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

                                  {sameCatOptions.map((opt) => {
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
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Thêm từ kho vùng hoặc Tự nhập yêu cầu riêng */}
                  <div className="bg-surface-2 border-t border-rule px-5 py-3.5 space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenCustomDay(null);
                          setPresetCatFilter('ALL');
                          setOpenPresetDay(isPresetOpen ? null : dayNum);
                        }}
                        className={`btn !py-2 !px-3.5 text-sm font-medium ${
                          isPresetOpen ? 'btn-primary' : 'btn-ghost'
                        }`}
                      >
                        <Icon name="plus" size={15} />
                        <span>Chọn dịch vụ có sẵn từ kho vùng</span>
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
                        <Icon name="custom" size={15} />
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

                        {filteredRegionOptions.length === 0 ? (
                          <div className="text-sm text-ink-3 py-2">
                            Chưa có dịch vụ mẫu thuộc nhóm này tại {tour.regionName}.
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
                              <Icon name="plus" size={15} />
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
              <span className="num text-2xl font-semibold text-ink">{formatVnd(estTotal)}</span>
              {unpricedCustomCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-soft text-amber px-3 py-1 text-sm font-medium">
                  <Icon name="alert" size={15} />
                  <span>
                    Có {unpricedCustomCount} yêu cầu riêng đang chờ Guide báo giá
                  </span>
                </span>
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
              <Icon name="check" size={16} />
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

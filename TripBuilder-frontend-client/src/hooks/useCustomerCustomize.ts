import { useMemo, useState } from 'react';
import type { CreateBookingPayload } from '../api/booking';
import type {
  Booking,
  BookingStep,
  PresetOption,
  ServiceMode,
  Tour,
} from '../api/types';
import {
  useCreateBookingMutation,
  useCustomizeBookingMutation,
  useOptionsByRegionQuery,
} from './api';

export interface LocalStep extends BookingStep {
  _uid: string;
  _restoreSnapshot?: {
    title: string;
    pricePerPerson: number;
    noteType: string;
  };
}

function getLocalTomorrowIso(): string {
  const tomorrow = new Date(Date.now() + 86400_000);
  const offsetMs = tomorrow.getTimezoneOffset() * 60_000;
  return new Date(tomorrow.getTime() - offsetMs).toISOString().slice(0, 10);
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

export interface UseCustomerCustomizeParams {
  tour: Tour;
  customerId: number;
  isAuthenticated?: boolean;
  existingBooking?: Booking | null;
  onSuccess: (booking: Booking) => void;
  onRequireAuth?: (draft: Omit<CreateBookingPayload, 'customerId'>) => void;
}

export function useCustomerCustomize({
  tour,
  customerId,
  isAuthenticated = true,
  existingBooking,
  onSuccess,
  onRequireAuth,
}: UseCustomerCustomizeParams) {
  const tomorrowStr = useMemo(() => getLocalTomorrowIso(), []);
  const isPostConfirm =
    existingBooking?.status === 'CONFIRMED' || existingBooking?.status === 'CHANGE_REQUESTED';

  const [startDate, setStartDate] = useState(
    existingBooking?.startDate || getDefaultStartDate()
  );
  const [days, setDays] = useState(existingBooking?.days || tour.days);
  const [adults, setAdults] = useState(
    existingBooking?.adults ?? existingBooking?.guests ?? 2
  );
  const [children, setChildren] = useState(existingBooking?.children ?? 0);
  const guests = adults + children;
  const initialMode: ServiceMode = existingBooking?.serviceMode === 'REMOTE' ? 'REMOTE' : 'COMPANION';
  const initialNote = (existingBooking?.customerNote || '').trim();
  const [serviceMode, setServiceMode] = useState<ServiceMode>(initialMode);
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

  const [expandedSwapUid, setExpandedSwapUid] = useState<string | null>(null);
  const [openPresetDay, setOpenPresetDay] = useState<number | null>(null);
  const [presetCatFilter, setPresetCatFilter] = useState<string>('ALL');
  const [openCustomDay, setOpenCustomDay] = useState<number | null>(null);
  const [customCat, setCustomCat] = useState('Yêu cầu thêm');
  const [customTitle, setCustomTitle] = useState('');
  const [pendingReduceDays, setPendingReduceDays] = useState<number | null>(null);
  const [error, setError] = useState('');

  const { data: options = [] } = useOptionsByRegionQuery(tour.regionId);
  const createBookingMutation = useCreateBookingMutation();
  const customizeBookingMutation = useCustomizeBookingMutation();

  const submitting = createBookingMutation.isPending || customizeBookingMutation.isPending;

  const activeSteps = steps.filter((s) => s.noteType !== 'REMOVED');
  const unpricedCustomCount = activeSteps.filter(
    (s) => s.noteType === 'CUSTOM' || s.pricePerPerson === 0
  ).length;
  const estPerPerson = activeSteps.reduce((acc, s) => acc + (s.pricePerPerson || 0), 0);
  const groupAdjustment = existingBooking?.groupAdjustment ?? 0;
  const estTotal = Math.max(0, estPerPerson * guests + groupAdjustment);

  const hasChanges =
    days !== (existingBooking?.days ?? tour.days) ||
    steps.some((s) => s.noteType !== 'PRESET') ||
    serviceMode !== initialMode ||
    customerNote.trim() !== initialNote ||
    existingBooking?.status === 'REQUOTED' ||
    isPostConfirm;

  const itineraryWarnings = useMemo(() => {
    const warnings: string[] = [];
    for (let d = 1; d <= days; d += 1) {
      const dayActive = activeSteps.filter((s) => s.dayNumber === d);
      if (days > 1 && dayActive.length === 0) {
        warnings.push(`Ngày ${d} hiện đang trống, chưa có hoạt động nào.`);
      }
      if (dayActive.length > 4) {
        warnings.push(`Ngày ${d} đang có ${dayActive.length} hoạt động, lịch trình có thể hơi dày.`);
      }
      const hotelCount = dayActive.filter((s) => s.category === 'Khách sạn').length;
      if (hotelCount > 1) {
        warnings.push(`Ngày ${d} đang có ${hotelCount} mục khách sạn/lưu trú.`);
      }
    }
    return warnings;
  }, [activeSteps, days]);

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

  const handleIncreaseDays = () => {
    setPendingReduceDays(null);
    setDays((d) => Math.min(10, d + 1));
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
    if (startDate < tomorrowStr) {
      setError('Ngày khởi hành phải cách hiện tại ít nhất 24 giờ (từ ngày mai trở đi).');
      return;
    }
    if (activeSteps.length === 0) {
      setError('Lịch trình phải có ít nhất 1 hoạt động chưa bị bỏ.');
      return;
    }
    if (pendingReduceDays !== null) {
      setError('Vui lòng chọn cách xử lý các hoạt động ở ngày bị cắt trước khi gửi.');
      return;
    }

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

    if (!existingBooking && !isAuthenticated && onRequireAuth) {
      onRequireAuth({
        tourId: tour.id,
        startDate,
        days,
        guests,
        adults,
        children,
        serviceMode,
        customerNote,
        customized: hasChanges,
        steps: payloadSteps,
      });
      return;
    }

    try {
      const saved = existingBooking
        ? await customizeBookingMutation.mutateAsync({
            bookingId: existingBooking.id,
            payload: {
              startDate,
              days,
              guests,
              adults,
              children,
              serviceMode,
              customerNote,
              steps: payloadSteps,
            },
          })
        : await createBookingMutation.mutateAsync({
            tourId: tour.id,
            customerId,
            startDate,
            days,
            guests,
            adults,
            children,
            serviceMode,
            customerNote,
            customized: hasChanges,
            steps: payloadSteps,
          });
      onSuccess(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể lưu yêu cầu');
    }
  };

  const dayList = Array.from({ length: days }, (_, i) => i + 1);
  const affectedCount =
    pendingReduceDays != null
      ? steps.filter((s) => s.dayNumber > pendingReduceDays && s.noteType !== 'REMOVED').length
      : 0;

  return {
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
  };
}

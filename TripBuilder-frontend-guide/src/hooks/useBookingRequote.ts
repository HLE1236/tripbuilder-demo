import { useMemo, useState } from 'react';
import type { Booking, BookingStep } from '@/api/types';
import {
  useCancelBookingMutation,
  useOptionsByRegionQuery,
  useRequoteBookingMutation,
} from '@/hooks/api';
import { serviceModeMeta, statusMeta } from '@/config/constants/meta';

export interface DraftStep extends BookingStep {
  _key: string;
  _isNewDraft?: boolean;
  _wasCustom?: boolean;
  _prevBeforeRemove?: {
    title: string;
    pricePerPerson: number;
    noteType: string;
    dayNumber: number;
    category: string;
  };
}

export type AdjMode = 'none' | 'discount' | 'surcharge';

export const REQUOTE_CATEGORIES = [
  'Di chuyển',
  'Khách sạn',
  'Ăn uống',
  'Trải nghiệm',
  'Yêu cầu thêm',
] as const;

export const QUICK_CUSTOM_PRICES = [150_000, 250_000, 350_000, 500_000, 800_000] as const;
export const QUICK_GROUP_ADJ = [100_000, 200_000, 300_000, 500_000, 1_000_000] as const;

function toDraftSteps(booking: Booking): DraftStep[] {
  return booking.steps.map((s, idx) => ({
    ...s,
    _key: `srv-${s.id ?? idx}-${idx}`,
    _wasCustom: s.noteType === 'CUSTOM',
  }));
}

function initialAdjMode(groupAdjustment: number | null | undefined): AdjMode {
  if (!groupAdjustment || groupAdjustment === 0) return 'none';
  return groupAdjustment < 0 ? 'discount' : 'surcharge';
}

interface UseBookingRequoteOptions {
  booking: Booking;
  onUpdated: (booking: Booking) => void;
}

export function useBookingRequote({ booking, onUpdated }: UseBookingRequoteOptions) {
  const [days, setDays] = useState(booking.days);
  const [guests, setGuests] = useState(booking.guests);
  const [adjMode, setAdjMode] = useState<AdjMode>(() =>
    initialAdjMode(booking.groupAdjustment)
  );
  const [adjAmount, setAdjAmount] = useState(Math.abs(booking.groupAdjustment || 0));
  const [guideNote, setGuideNote] = useState(booking.guideNote || '');
  const [steps, setSteps] = useState<DraftStep[]>(() => toDraftSteps(booking));
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [pendingDayShrink, setPendingDayShrink] = useState<number | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [error, setError] = useState('');

  const bookingSig = `${booking.id}-${booking.updatedAt}-${booking.revisionCount}-${booking.status}`;
  const [prevSig, setPrevSig] = useState(bookingSig);
  if (bookingSig !== prevSig) {
    setPrevSig(bookingSig);
    setDays(booking.days);
    setGuests(booking.guests);
    setAdjMode(initialAdjMode(booking.groupAdjustment));
    setAdjAmount(Math.abs(booking.groupAdjustment || 0));
    setGuideNote(booking.guideNote || '');
    setSteps(toDraftSteps(booking));
    setExpandedKeys({});
    setPendingDayShrink(null);
    setConfirmCancelOpen(false);
    setError('');
  }

  const { data: options = [] } = useOptionsByRegionQuery(booking.tour.regionId);
  const requoteMutation = useRequoteBookingMutation();
  const cancelMutation = useCancelBookingMutation();

  const busy = requoteMutation.isPending || cancelMutation.isPending;
  const st = statusMeta(booking.status);
  const mode = serviceModeMeta(booking.serviceMode);
  const isCancelled = booking.status === 'CANCELLED';

  const groupAdjustmentSigned =
    adjMode === 'none'
      ? 0
      : adjMode === 'discount'
      ? -Math.abs(adjAmount)
      : Math.abs(adjAmount);

  const perPerson = useMemo(
    () =>
      steps
        .filter((s) => s.noteType !== 'REMOVED')
        .reduce((acc, s) => acc + (Number(s.pricePerPerson) || 0), 0),
    [steps]
  );

  const rawTotalPreview = perPerson * guests + groupAdjustmentSigned;
  const totalPreview = Math.max(0, rawTotalPreview);
  const diffOrig = totalPreview - booking.originalTotalPrice;

  const unpricedCustomSteps = useMemo(
    () =>
      steps.filter(
        (s) => s.noteType === 'CUSTOM' && (Number(s.pricePerPerson) || 0) <= 0
      ),
    [steps]
  );

  const activeStepsCount = useMemo(
    () => steps.filter((s) => s.noteType !== 'REMOVED').length,
    [steps]
  );

  const activeLeg = isCancelled
    ? 0
    : booking.status === 'CONFIRMED'
    ? 3
    : booking.status === 'REQUOTED' || booking.status === 'CHANGE_REQUESTED'
    ? 2
    : booking.status === 'WAITING_REQUOTE'
    ? 1
    : 0;

  const updateStepByKey = (key: string, patch: Partial<DraftStep>) => {
    setSteps((prev) => prev.map((s) => (s._key === key ? { ...s, ...patch } : s)));
  };

  const expandStep = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: true }));
  };

  const collapseStep = (key: string) => {
    setExpandedKeys((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handlePriceChange = (step: DraftStep, rawPrice: number) => {
    const cleanPrice = Math.max(0, Number(rawPrice) || 0);
    let nextNoteType = step.noteType;
    if (step.noteType === 'CUSTOM' && cleanPrice > 0) {
      nextNoteType = 'GUIDE';
    } else if (
      step.noteType === 'PRESET' &&
      cleanPrice !== (step.originalPricePerPerson ?? step.pricePerPerson)
    ) {
      nextNoteType = 'ALTERNATIVE';
    }
    updateStepByKey(step._key, {
      pricePerPerson: cleanPrice,
      noteType: nextNoteType,
    });
  };

  const replaceWithAlternative = (step: DraftStep, optIdStr: string) => {
    const opt = options.find((o) => String(o.id) === optIdStr);
    if (!opt) return;
    updateStepByKey(step._key, {
      title: opt.title,
      category: opt.category,
      imageUrl: opt.imageUrl || step.imageUrl,
      pricePerPerson: opt.pricePerPerson,
      noteType: 'ALTERNATIVE',
    });
  };

  const addGuideStepForDay = (dayNum: number) => {
    const newKey = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setSteps((prev) => [
      ...prev,
      {
        _key: newKey,
        _isNewDraft: true,
        dayNumber: dayNum,
        category: 'Trải nghiệm',
        title: `Dịch vụ bổ sung Ngày ${dayNum}`,
        imageUrl: booking.tour.imageUrl,
        pricePerPerson: 250_000,
        originalTitle: null,
        originalPricePerPerson: 0,
        noteType: 'GUIDE',
      },
    ]);
    setExpandedKeys((prev) => ({ ...prev, [newKey]: true }));
  };

  const handleVoidOrDeleteStep = (step: DraftStep) => {
    if (step._isNewDraft) {
      setSteps((prev) => prev.filter((s) => s._key !== step._key));
      return;
    }
    updateStepByKey(step._key, {
      _prevBeforeRemove: {
        title: step.title,
        pricePerPerson: step.pricePerPerson,
        noteType: step.noteType,
        dayNumber: step.dayNumber,
        category: step.category,
      },
      originalTitle: step.originalTitle || step.title,
      originalPricePerPerson: step.originalPricePerPerson ?? step.pricePerPerson,
      noteType: 'REMOVED',
      pricePerPerson: 0,
    });
  };

  const handleRestoreStep = (step: DraftStep) => {
    if (step._prevBeforeRemove) {
      const snap = step._prevBeforeRemove;
      updateStepByKey(step._key, {
        title: snap.title,
        pricePerPerson: snap.pricePerPerson,
        noteType: snap.noteType,
        dayNumber: snap.dayNumber,
        category: snap.category,
        _prevBeforeRemove: undefined,
      });
      return;
    }
    const restoredTitle = step.originalTitle || step.title;
    const restoredPrice = step.originalPricePerPerson ?? 0;
    updateStepByKey(step._key, {
      title: restoredTitle,
      pricePerPerson: restoredPrice,
      noteType: restoredPrice > 0 && step.originalTitle ? 'PRESET' : 'GUIDE',
    });
  };

  const handleRequestDaysChange = (targetDays: number) => {
    const clamped = Math.min(10, Math.max(1, targetDays));
    if (clamped < days && steps.some((s) => s.dayNumber > clamped)) {
      setPendingDayShrink(clamped);
      return;
    }
    setPendingDayShrink(null);
    setDays(clamped);
  };

  const applyDayShrink = (strategy: 'move' | 'void') => {
    if (pendingDayShrink == null) return;
    const nextDays = pendingDayShrink;
    setSteps((prev) =>
      prev
        .filter((s) => !(s._isNewDraft && s.dayNumber > nextDays && strategy === 'void'))
        .map((s) => {
          if (s.dayNumber <= nextDays) return s;
          if (strategy === 'move') {
            return { ...s, dayNumber: nextDays };
          }
          if (s.noteType === 'REMOVED') {
            return { ...s, dayNumber: nextDays };
          }
          return {
            ...s,
            dayNumber: nextDays,
            _prevBeforeRemove: {
              title: s.title,
              pricePerPerson: s.pricePerPerson,
              noteType: s.noteType,
              dayNumber: s.dayNumber,
              category: s.category,
            },
            originalTitle: s.originalTitle || s.title,
            originalPricePerPerson: s.originalPricePerPerson ?? s.pricePerPerson,
            noteType: 'REMOVED',
            pricePerPerson: 0,
          };
        })
    );
    setDays(nextDays);
    setPendingDayShrink(null);
  };

  const handleSendRequote = async () => {
    setError('');
    if (unpricedCustomSteps.length > 0) {
      setError(
        `Còn ${unpricedCustomSteps.length} yêu cầu tự thêm chưa có giá (> 0đ): ${unpricedCustomSteps
          .map((s) => s.title)
          .join(', ')}. Vui lòng nhập giá trước khi gửi báo giá`
      );
      return;
    }
    if (activeStepsCount === 0) {
      setError('Lịch trình phải giữ lại ít nhất 1 hoạt động chưa bị bỏ');
      return;
    }
    if (rawTotalPreview < 0) {
      setError('Tổng tiền sau ưu đãi / phụ thu không được nhỏ hơn 0đ');
      return;
    }

    try {
      const cleanSteps: BookingStep[] = steps.map((s) => ({
        id: s.id,
        dayNumber: Math.min(Math.max(1, Number(s.dayNumber) || 1), days),
        category: s.category,
        title: s.title.trim() || 'Hoạt động bổ sung',
        imageUrl: s.imageUrl,
        pricePerPerson:
          s.noteType === 'REMOVED' ? 0 : Math.max(0, Number(s.pricePerPerson) || 0),
        originalTitle: s.originalTitle ?? null,
        originalPricePerPerson: s.originalPricePerPerson ?? null,
        noteType: s.noteType,
      }));

      const updated = await requoteMutation.mutateAsync({
        bookingId: booking.id,
        payload: {
          days,
          guests,
          groupAdjustment: groupAdjustmentSigned,
          guideNote,
          steps: cleanSteps,
        },
      });
      onUpdated(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể gửi báo giá');
    }
  };

  const handleCancel = async () => {
    setError('');
    try {
      const updated = await cancelMutation.mutateAsync(booking.id);
      setConfirmCancelOpen(false);
      onUpdated(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể hủy đơn');
    }
  };

  const canSubmitRequote =
    !busy &&
    !isCancelled &&
    unpricedCustomSteps.length === 0 &&
    activeStepsCount > 0 &&
    rawTotalPreview >= 0;

  return {
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
  };
}

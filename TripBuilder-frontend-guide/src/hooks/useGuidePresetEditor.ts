import { useMemo, useState } from 'react';
import type { Region, Tour, TourStep } from '@/api/types';
import {
  useCreateTourMutation,
  useOptionsByRegionQuery,
  useUpdateTourMutation,
} from '@/hooks/api';
import { useAuthStore } from '@/stores';
import { DEFAULT_TRAVEL_IMAGE } from '@/utils/format';

export interface DraftTourStep extends TourStep {
  _key: string;
}

export const EDITOR_CATEGORIES = [
  'Di chuyển',
  'Khách sạn',
  'Ăn uống',
  'Trải nghiệm',
  'Yêu cầu thêm',
] as const;

function makeDraftKey(prefix = 'ts'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface UseGuidePresetEditorOptions {
  guideId: number;
  regions: Region[];
  editingTour?: Tour | null;
  onSaved: (tour: Tour, isNew: boolean) => void;
}

export function useGuidePresetEditor({
  guideId,
  regions,
  editingTour,
  onSaved,
}: UseGuidePresetEditorOptions) {
  const user = useAuthStore((s) => s.user);
  const isEdit = Boolean(editingTour);
  const matchedGuideRegion =
    regions.find((r) => user?.regionId != null && r.id === user.regionId) ??
    regions.find((r) => user?.regionName && r.name === user.regionName);
  const hasGuideRegion = Boolean(user?.regionId && matchedGuideRegion);
  const isRegionLocked = true;
  const lockedRegionName =
    matchedGuideRegion?.name || user?.regionName || editingTour?.regionName || '';
  const defaultRegion = matchedGuideRegion ?? regions[0];
  const defaultRegionCover = defaultRegion?.imageUrl || DEFAULT_TRAVEL_IMAGE;

  const [regionId, setRegionId] = useState(
    user?.regionId
      ? String(user.regionId)
      : String(matchedGuideRegion?.id || editingTour?.regionId || defaultRegion?.id || '')
  );
  const [title, setTitle] = useState(editingTour?.title || '');
  const [description, setDescription] = useState(editingTour?.description || '');
  const [days, setDays] = useState(editingTour?.days || 3);

  const [imageUrl, setImageUrl] = useState(
    editingTour?.imageUrl || defaultRegionCover
  );

  const [galleryUrls, setGalleryUrls] = useState<string[]>(() => {
    if (editingTour?.galleryUrls?.length) {
      return Array.from(new Set(editingTour.galleryUrls.filter(Boolean)));
    }
    const seed = editingTour?.imageUrl || defaultRegionCover;
    return seed ? [seed] : [];
  });

  const [showExternalUrlInput, setShowExternalUrlInput] = useState(false);
  const [externalUrlDraft, setExternalUrlDraft] = useState('');
  const [pickingStepKey, setPickingStepKey] = useState<string | null>(null);

  const [steps, setSteps] = useState<DraftTourStep[]>(() =>
    editingTour
      ? editingTour.steps.map((s, idx) => ({ ...s, _key: `srv-${s.id ?? idx}-${idx}` }))
      : [
          {
            _key: makeDraftKey('init1'),
            dayNumber: 1,
            category: 'Di chuyển',
            title: 'Xe đón đoàn tại điểm hẹn',
            imageUrl: '/images/activities/01-limousine-van.jpg',
            pricePerPerson: 350_000,
          },
          {
            _key: makeDraftKey('init2'),
            dayNumber: 1,
            category: 'Khách sạn',
            title: 'Khách sạn trung tâm 4★ (2 đêm)',
            imageUrl: '/images/activities/05-resort-spa.jpg',
            pricePerPerson: 900_000,
          },
        ]
  );

  const [pendingDayShrink, setPendingDayShrink] = useState<number | null>(null);
  const [error, setError] = useState('');

  const { data: options = [] } = useOptionsByRegionQuery(Number(regionId));
  const createTourMutation = useCreateTourMutation(guideId);
  const updateTourMutation = useUpdateTourMutation(guideId);
  const saving = createTourMutation.isPending || updateTourMutation.isPending;

  const basePrice = useMemo(
    () => steps.reduce((acc, s) => acc + (Number(s.pricePerPerson) || 0), 0),
    [steps]
  );

  const handleRegionChange = (val: string) => {
    if (isRegionLocked) return;
    setRegionId(val);
    const reg = regions.find((r) => String(r.id) === val);
    if (reg && !isEdit) {
      setImageUrl(reg.imageUrl);
      setGalleryUrls((prev) =>
        prev.includes(reg.imageUrl) ? prev : [reg.imageUrl, ...prev]
      );
    }
  };

  const handleToggleGalleryUrl = (url: string) => {
    setGalleryUrls((prev) => {
      if (prev.includes(url)) {
        const next = prev.filter((item) => item !== url);
        if (imageUrl === url) {
          setImageUrl(next[0] || DEFAULT_TRAVEL_IMAGE);
        }
        return next;
      }
      const next = [...prev, url];
      if (!imageUrl || imageUrl === DEFAULT_TRAVEL_IMAGE) {
        setImageUrl(url);
      }
      return next;
    });
  };

  const handleBatchAddGalleryUrls = (urls: string[]) => {
    setGalleryUrls((prev) => {
      const merged = Array.from(new Set([...prev, ...urls.filter(Boolean)]));
      if ((!imageUrl || imageUrl === DEFAULT_TRAVEL_IMAGE) && merged[0]) {
        setImageUrl(merged[0]);
      }
      return merged;
    });
  };

  const handleMoveGalleryUrl = (index: number, direction: -1 | 1) => {
    setGalleryUrls((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const handleRemoveGalleryUrl = (url: string) => {
    setGalleryUrls((prev) => {
      const next = prev.filter((item) => item !== url);
      if (imageUrl === url) {
        setImageUrl(next[0] || DEFAULT_TRAVEL_IMAGE);
      }
      return next;
    });
  };

  const handleAddExternalUrl = () => {
    const clean = externalUrlDraft.trim();
    if (!clean) return;
    setGalleryUrls((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    if (!imageUrl) {
      setImageUrl(clean);
    }
    setExternalUrlDraft('');
    setShowExternalUrlInput(false);
  };

  const updateStepByKey = (key: string, patch: Partial<DraftTourStep>) => {
    setSteps((prev) => prev.map((s) => (s._key === key ? { ...s, ...patch } : s)));
  };

  const removeStepByKey = (key: string) => {
    setSteps((prev) => prev.filter((s) => s._key !== key));
    if (pickingStepKey === key) setPickingStepKey(null);
  };

  const addBlankStepForDay = (dayNumber: number) => {
    setSteps((prev) => [
      ...prev,
      {
        _key: makeDraftKey('blank'),
        dayNumber,
        category: 'Trải nghiệm',
        title: `Hoạt động Ngày ${dayNumber}`,
        imageUrl,
        pricePerPerson: 300_000,
      },
    ]);
  };

  const addOptionStepForDay = (dayNumber: number, optIdStr: string) => {
    const opt = options.find((o) => String(o.id) === optIdStr);
    if (!opt) return;
    setSteps((prev) => [
      ...prev,
      {
        _key: makeDraftKey('opt'),
        dayNumber,
        category: opt.category,
        title: opt.title,
        imageUrl: opt.imageUrl || imageUrl,
        pricePerPerson: opt.pricePerPerson,
      },
    ]);
  };

  const handleRequestDaysChange = (nextDays: number) => {
    const clamped = Math.min(10, Math.max(1, nextDays));
    if (clamped < days && steps.some((s) => s.dayNumber > clamped)) {
      setPendingDayShrink(clamped);
      return;
    }
    setPendingDayShrink(null);
    setDays(clamped);
  };

  const applyDayShrink = (strategy: 'merge' | 'drop') => {
    if (pendingDayShrink == null) return;
    const nextDays = pendingDayShrink;
    setSteps((prev) => {
      if (strategy === 'drop') {
        return prev.filter((s) => s.dayNumber <= nextDays);
      }
      return prev.map((s) =>
        s.dayNumber > nextDays ? { ...s, dayNumber: nextDays } : s
      );
    });
    setDays(nextDays);
    setPendingDayShrink(null);
  };

  const handleSave = async () => {
    if (!hasGuideRegion || !user?.regionId) {
      setError('Tài khoản Guide chưa được gán vùng phụ trách. Vui lòng liên hệ Admin.');
      return;
    }
    if (!title.trim()) {
      setError('Vui lòng nhập tên tour mẫu');
      return;
    }
    if (steps.length === 0) {
      setError('Tour cần có ít nhất 1 hạng mục');
      return;
    }

    setError('');
    try {
      const normalizedCover =
        imageUrl.trim() || galleryUrls[0] || regions[0]?.imageUrl || DEFAULT_TRAVEL_IMAGE;
      const normalizedGallery = galleryUrls.length > 0 ? galleryUrls : [normalizedCover];

      const cleanSteps: TourStep[] = steps.map((s) => ({
        id: s.id,
        dayNumber: Math.min(Math.max(1, Number(s.dayNumber) || 1), days),
        category: s.category,
        title: s.title.trim() || 'Hoạt động tour',
        imageUrl: s.imageUrl || normalizedCover,
        pricePerPerson: Math.max(0, Number(s.pricePerPerson) || 0),
      }));

      const payload = {
        guideId,
        regionId: Number(regionId),
        title: title.trim(),
        description:
          description.trim() || 'Lịch trình bản địa do Tour Guide trực tiếp thiết kế.',
        imageUrl: normalizedCover,
        galleryUrls: normalizedGallery,
        days,
        steps: cleanSteps,
      };

      const saved =
        isEdit && editingTour
          ? await updateTourMutation.mutateAsync({ tourId: editingTour.id, payload })
          : await createTourMutation.mutateAsync(payload);
      onSaved(saved, !isEdit);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể lưu tour');
    }
  };

  const affectedLastDayStepsCount =
    pendingDayShrink != null
      ? steps.filter((s) => s.dayNumber > pendingDayShrink).length
      : 0;

  return {
    isEdit,
    hasGuideRegion,
    isRegionLocked,
    lockedRegionName,
    regionId,
    handleRegionChange,
    title,
    setTitle,
    description,
    setDescription,
    days,
    imageUrl,
    setImageUrl,
    galleryUrls,
    showExternalUrlInput,
    setShowExternalUrlInput,
    externalUrlDraft,
    setExternalUrlDraft,
    pickingStepKey,
    setPickingStepKey,
    steps,
    pendingDayShrink,
    setPendingDayShrink,
    options,
    saving,
    error,
    basePrice,
    affectedLastDayStepsCount,
    handleToggleGalleryUrl,
    handleBatchAddGalleryUrls,
    handleMoveGalleryUrl,
    handleRemoveGalleryUrl,
    handleAddExternalUrl,
    updateStepByKey,
    removeStepByKey,
    addBlankStepForDay,
    addOptionStepForDay,
    handleRequestDaysChange,
    applyDayShrink,
    handleSave,
  };
}

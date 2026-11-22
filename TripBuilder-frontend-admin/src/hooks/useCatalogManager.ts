import { useMemo, useState, type FormEvent } from 'react';
import type { PresetCategory, PresetOption, Region } from '../api';
import { useAdminUiStore } from '../stores';
import {
  useAdminPresetOptionsQuery,
  useAdminRegionsQuery,
  useCreateAdminPresetOptionMutation,
  useDeleteAdminPresetOptionMutation,
  useUpdateAdminPresetOptionMutation,
} from './api/useAdminQueries';

const EMPTY_REGIONS: Region[] = [];
const EMPTY_OPTIONS: PresetOption[] = [];

function normalizeCategoryValue(raw: string): PresetCategory {
  const upper = raw.trim().toUpperCase();
  if (upper === 'HOTEL' || raw === 'Khách sạn') return 'Khách sạn';
  if (upper === 'FOOD' || raw === 'Ăn uống') return 'Ăn uống';
  if (upper === 'TRANSPORT' || raw === 'Di chuyển') return 'Di chuyển';
  return 'Trải nghiệm';
}

export function useCatalogManager() {
  const selectedRegionId = useAdminUiStore((s) => s.selectedRegionId);
  const setSelectedRegionId = useAdminUiStore((s) => s.setSelectedRegionId);

  // Add/Edit service modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<PresetOption | null>(null);
  const [formRegionId, setFormRegionId] = useState<string>('');
  const [formCategory, setFormCategory] = useState<PresetCategory>('Khách sạn');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('500000');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const regionsQuery = useAdminRegionsQuery();
  const optionsQuery = useAdminPresetOptionsQuery();
  const createOptionMutation = useCreateAdminPresetOptionMutation();
  const updateOptionMutation = useUpdateAdminPresetOptionMutation();
  const deleteOptionMutation = useDeleteAdminPresetOptionMutation();

  const regions = regionsQuery.data ?? EMPTY_REGIONS;
  const options = optionsQuery.data ?? EMPTY_OPTIONS;

  const regionMap = useMemo(() => {
    const map = new Map<number, Region>();
    for (const r of regions) map.set(r.id, r);
    return map;
  }, [regions]);

  const filteredOptions = useMemo(() => {
    if (selectedRegionId === 'ALL') return options;
    return options.filter((o) => o.regionId === selectedRegionId);
  }, [options, selectedRegionId]);

  const effectiveFormRegionId =
    formRegionId || (regions.length > 0 ? String(regions[0].id) : '');

  function openAddModal() {
    setEditingOption(null);
    setFormError(null);
    setFormTitle('');
    setFormDescription('');
    setFormPrice('500000');
    setFormCategory('Khách sạn');
    if (selectedRegionId !== 'ALL') {
      setFormRegionId(String(selectedRegionId));
    } else if (regions.length > 0) {
      setFormRegionId(String(regions[0].id));
    }
    setModalOpen(true);
  }

  function openEditModal(opt: PresetOption) {
    setEditingOption(opt);
    setFormError(null);
    setFormRegionId(String(opt.regionId));
    setFormCategory(normalizeCategoryValue(opt.category));
    setFormTitle(opt.title);
    setFormDescription(opt.description || '');
    setFormPrice(String(opt.pricePerPerson));
    setModalOpen(true);
  }

  function closeAddModal() {
    setModalOpen(false);
    setEditingOption(null);
  }

  async function handleSaveOption(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const price = Number(formPrice);
    if (!effectiveFormRegionId || !formTitle.trim() || Number.isNaN(price) || price < 0) {
      setFormError('Vui lòng nhập đầy đủ vùng, tên dịch vụ và đơn giá hợp lệ.');
      return;
    }

    const payload = {
      regionId: Number(effectiveFormRegionId),
      category: formCategory,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      pricePerPerson: price,
    };

    try {
      if (editingOption) {
        await updateOptionMutation.mutateAsync({ id: editingOption.id, payload });
      } else {
        await createOptionMutation.mutateAsync(payload);
      }
      setModalOpen(false);
      setEditingOption(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể lưu dịch vụ');
    }
  }

  async function handleDelete(opt: PresetOption) {
    setDeletingId(opt.id);
    setActionError(null);
    try {
      await deleteOptionMutation.mutateAsync(opt.id);
      setConfirmDeleteId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể xoá dịch vụ');
    } finally {
      setDeletingId(null);
    }
  }

  const queryError = regionsQuery.error ?? optionsQuery.error;
  const error = actionError ?? (queryError instanceof Error ? queryError.message : null);

  return {
    regions,
    options,
    regionMap,
    selectedRegionId,
    setSelectedRegionId,
    filteredOptions,
    loading: regionsQuery.isLoading || optionsQuery.isLoading,
    error,
    modalOpen,
    editingOption,
    openAddModal,
    openEditModal,
    closeAddModal,
    formRegionId: effectiveFormRegionId,
    setFormRegionId,
    formCategory,
    setFormCategory,
    formTitle,
    setFormTitle,
    formDescription,
    setFormDescription,
    formPrice,
    setFormPrice,
    submitting: createOptionMutation.isPending || updateOptionMutation.isPending,
    formError,
    confirmDeleteId,
    setConfirmDeleteId,
    deletingId,
    handleAddOption: handleSaveOption,
    handleDelete,
  };
}

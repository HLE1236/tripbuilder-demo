import { useMemo, useState, type FormEvent } from 'react';
import type { PresetCategory, PresetOption, Region } from '../api';
import { useAdminUiStore } from '../stores';
import {
  useAdminPresetOptionsQuery,
  useAdminRegionsQuery,
  useCreateAdminPresetOptionMutation,
  useDeleteAdminPresetOptionMutation,
} from './api/useAdminQueries';

const EMPTY_REGIONS: Region[] = [];
const EMPTY_OPTIONS: PresetOption[] = [];

export function useCatalogManager() {
  const selectedRegionId = useAdminUiStore((s) => s.selectedRegionId);
  const setSelectedRegionId = useAdminUiStore((s) => s.setSelectedRegionId);

  // Add service modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formRegionId, setFormRegionId] = useState<string>('');
  const [formCategory, setFormCategory] = useState<PresetCategory>('HOTEL');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('500000');
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const regionsQuery = useAdminRegionsQuery();
  const optionsQuery = useAdminPresetOptionsQuery();
  const createOptionMutation = useCreateAdminPresetOptionMutation();
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
    setFormError(null);
    setFormTitle('');
    setFormDescription('');
    setFormPrice('500000');
    setFormCategory('HOTEL');
    if (selectedRegionId !== 'ALL') {
      setFormRegionId(String(selectedRegionId));
    } else if (regions.length > 0) {
      setFormRegionId(String(regions[0].id));
    }
    setModalOpen(true);
  }

  function closeAddModal() {
    setModalOpen(false);
  }

  async function handleAddOption(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const price = Number(formPrice);
    if (!effectiveFormRegionId || !formTitle.trim() || Number.isNaN(price) || price < 0) {
      setFormError('Vui lòng nhập đầy đủ vùng, tên dịch vụ và đơn giá hợp lệ.');
      return;
    }

    try {
      await createOptionMutation.mutateAsync({
        regionId: Number(effectiveFormRegionId),
        category: formCategory,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        pricePerPerson: price,
      });
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể thêm dịch vụ mới');
    }
  }

  async function handleDelete(opt: PresetOption) {
    setDeletingId(opt.id);
    setActionError(null);
    try {
      await deleteOptionMutation.mutateAsync(opt.id);
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
    openAddModal,
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
    submitting: createOptionMutation.isPending,
    formError,
    deletingId,
    handleAddOption,
    handleDelete,
  };
}

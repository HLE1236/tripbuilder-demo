import { useMemo, useState, type FormEvent } from 'react';
import type { Region, User } from '../api';
import { useAdminUiStore } from '../stores';
import {
  useAdminRegionsQuery,
  useAdminUsersQuery,
  useCreateAdminUserMutation,
} from './api/useAdminQueries';

const EMPTY_USERS: User[] = [];
const EMPTY_REGIONS: Region[] = [];

export function useUsersManager() {
  const roleFilter = useAdminUiStore((s) => s.roleFilter);
  const setRoleFilter = useAdminUiStore((s) => s.setRoleFilter);

  const [search, setSearch] = useState('');

  // Modal tạo Tour Guide mới
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [phone, setPhone] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const usersQuery = useAdminUsersQuery(roleFilter);
  const regionsQuery = useAdminRegionsQuery();
  const createUserMutation = useCreateAdminUserMutation();

  const users = usersQuery.data ?? EMPTY_USERS;
  const regions = regionsQuery.data ?? EMPTY_REGIONS;

  const effectiveRegionId =
    selectedRegionId || (regions.length > 0 ? String(regions[0].id) : '');

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.regionName && u.regionName.toLowerCase().includes(q))
    );
  }, [users, search]);

  function openCreateModal() {
    setFormError(null);
    setFullName('');
    setEmail('');
    setPassword('123456');
    setPhone('');
    if (regions.length > 0 && !selectedRegionId) {
      setSelectedRegionId(String(regions[0].id));
    }
    setModalOpen(true);
  }

  function closeCreateModal() {
    setModalOpen(false);
  }

  async function handleCreateGuide(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setFormError('Vui lòng nhập đầy đủ họ tên, email và mật khẩu.');
      return;
    }

    const region = regions.find((r) => String(r.id) === effectiveRegionId);

    try {
      await createUserMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role: 'GUIDE',
        regionId: region?.id,
        regionName: region?.name,
      });
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Tạo tài khoản thất bại');
    }
  }

  const queryError = usersQuery.error ?? regionsQuery.error;

  return {
    regions,
    roleFilter,
    setRoleFilter,
    search,
    setSearch,
    filteredUsers,
    loading: usersQuery.isLoading,
    error: queryError instanceof Error ? queryError.message : null,
    modalOpen,
    openCreateModal,
    closeCreateModal,
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    phone,
    setPhone,
    selectedRegionId: effectiveRegionId,
    setSelectedRegionId,
    submitting: createUserMutation.isPending,
    formError,
    handleCreateGuide,
  };
}

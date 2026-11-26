import { useMemo, useState, type FormEvent } from 'react';
import type { Region, User } from '../api';
import { useAdminUiStore } from '../stores';
import {
  useAdminRegionsQuery,
  useAdminUsersQuery,
  useCreateAdminUserMutation,
  useDeleteAdminUserMutation,
  useUpdateAdminUserMutation,
} from './api/useAdminQueries';

const EMPTY_USERS: User[] = [];
const EMPTY_REGIONS: Region[] = [];

export function useUsersManager() {
  const roleFilter = useAdminUiStore((s) => s.roleFilter);
  const setRoleFilter = useAdminUiStore((s) => s.setRoleFilter);

  const [search, setSearch] = useState('');

  // Modal tạo / sửa người dùng
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [yearsExperience, setYearsExperience] = useState('5');
  const [bio, setBio] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const usersQuery = useAdminUsersQuery(roleFilter);
  const regionsQuery = useAdminRegionsQuery();
  const createUserMutation = useCreateAdminUserMutation();
  const updateUserMutation = useUpdateAdminUserMutation();
  const deleteUserMutation = useDeleteAdminUserMutation();

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
    setEditingUser(null);
    setFormError(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setYearsExperience('5');
    setBio('');
    if (regions.length > 0 && !selectedRegionId) {
      setSelectedRegionId(String(regions[0].id));
    }
    setModalOpen(true);
  }

  function openEditModal(u: User) {
    setEditingUser(u);
    setFormError(null);
    setFullName(u.fullName);
    setEmail(u.email);
    setPassword('');
    setPhone(u.phone || '');
    const matchedReg = regions.find(
      (r) => (u.regionId != null && r.id === u.regionId) || r.name === u.regionName
    );
    setSelectedRegionId(matchedReg ? String(matchedReg.id) : regions[0] ? String(regions[0].id) : '');
    setYearsExperience(u.yearsExperience != null ? String(u.yearsExperience) : '5');
    setBio(u.bio || '');
    setModalOpen(true);
  }

  function closeCreateModal() {
    setModalOpen(false);
    setEditingUser(null);
  }

  async function handleSaveUser(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!fullName.trim()) {
      setFormError('Vui lòng nhập họ tên.');
      return;
    }

    const region = regions.find((r) => String(r.id) === effectiveRegionId);
    if ((!editingUser || editingUser.role === 'GUIDE') && !region) {
      setFormError('Vui lòng chọn vùng phụ trách cho Tour Guide.');
      return;
    }
    const parsedYears = Number(yearsExperience);
    const cleanYears = Number.isFinite(parsedYears) && parsedYears >= 0 ? parsedYears : undefined;

    if (editingUser) {
      try {
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          payload: {
            fullName: fullName.trim(),
            phone: phone.trim() || undefined,
            regionId: editingUser.role === 'GUIDE' ? region?.id : undefined,
            bio: editingUser.role === 'GUIDE' ? bio.trim() : undefined,
            yearsExperience: editingUser.role === 'GUIDE' ? cleanYears : undefined,
          },
        });
        setModalOpen(false);
        setEditingUser(null);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Cập nhật tài khoản thất bại');
      }
      return;
    }

    if (!email.trim() || password.length < 6) {
      setFormError('Vui lòng nhập email hợp lệ và mật khẩu tối thiểu 6 ký tự.');
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role: 'GUIDE',
        regionId: region?.id,
        regionName: region?.name,
        bio: bio.trim() || undefined,
        yearsExperience: cleanYears,
      });
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Tạo tài khoản thất bại');
    }
  }

  async function handleDeleteUser(id: number) {
    setDeletingId(id);
    setActionError(null);
    try {
      await deleteUserMutation.mutateAsync(id);
      setConfirmDeleteId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể xoá tài khoản');
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  const queryError = usersQuery.error ?? regionsQuery.error;
  const error = actionError ?? (queryError instanceof Error ? queryError.message : null);

  return {
    regions,
    roleFilter,
    setRoleFilter,
    search,
    setSearch,
    filteredUsers,
    loading: usersQuery.isLoading,
    error,
    modalOpen,
    editingUser,
    openCreateModal,
    openEditModal,
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
    yearsExperience,
    setYearsExperience,
    bio,
    setBio,
    submitting: createUserMutation.isPending || updateUserMutation.isPending,
    formError,
    confirmDeleteId,
    setConfirmDeleteId,
    deletingId,
    handleCreateGuide: handleSaveUser,
    handleDeleteUser,
  };
}

import { AlertIcon, EditIcon, PlusIcon, SearchIcon, TrashIcon, XIcon } from '../../components/icon';
import { ROLE_META } from '../../config/constants/meta';
import { useUsersManager } from '../../hooks';
import type { RoleFilter } from '../../stores';

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'CUSTOMER', label: 'Khách hàng' },
  { value: 'GUIDE', label: 'Tour Guide' },
  { value: 'ADMIN', label: 'Quản trị viên' },
];

export function UsersView() {
  const {
    regions,
    roleFilter,
    setRoleFilter,
    search,
    setSearch,
    filteredUsers,
    loading,
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
    selectedRegionId,
    setSelectedRegionId,
    yearsExperience,
    setYearsExperience,
    bio,
    setBio,
    submitting,
    formError,
    confirmDeleteId,
    setConfirmDeleteId,
    deletingId,
    handleCreateGuide,
    handleDeleteUser,
  } = useUsersManager();

  const isGuideForm = !editingUser || editingUser.role === 'GUIDE';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">
            Quản lý Người dùng
          </h2>
          <p className="text-sm text-ink-2 mt-0.5">
            Tra cứu, chỉnh sửa tài khoản Khách hàng, Tour Guide và cấp tài khoản Guide mới theo vùng.
          </p>
        </div>

        <button type="button" onClick={openCreateModal} className="btn btn-primary">
          <PlusIcon size={16} />
          <span>Thêm Tour Guide mới</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flagship-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={roleFilter === f.value}
              onClick={() => setRoleFilter(f.value)}
              className="chip"
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <SearchIcon
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email"
            className="field pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-crimson/30 bg-crimson-soft px-4 py-2.5 text-sm text-crimson flex items-center gap-2">
          <AlertIcon size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="flagship-card overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-ink-2">Đang tải danh sách người dùng...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-2">
            Không tìm thấy tài khoản nào phù hợp.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-rule bg-surface-2 text-xs text-ink-2">
                <th className="py-3 px-4 font-medium">ID</th>
                <th className="py-3 px-4 font-medium">Họ tên</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Vai trò</th>
                <th className="py-3 px-4 font-medium">Số điện thoại</th>
                <th className="py-3 px-4 font-medium">Vùng phụ trách</th>
                <th className="py-3 px-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule text-sm">
              {filteredUsers.map((u) => {
                const roleInfo = ROLE_META[u.role] || { label: u.role, tagClass: 'tag-neutral' };
                const isConfirming = confirmDeleteId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-surface-2/60 transition">
                    <td className="py-3 px-4 num text-xs text-ink-3">#{u.id}</td>
                    <td className="py-3 px-4 font-medium text-ink">{u.fullName}</td>
                    <td className="py-3 px-4 num text-xs text-ink-2">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`tag ${roleInfo.tagClass}`}>{roleInfo.label}</span>
                    </td>
                    <td className="py-3 px-4 num text-xs text-ink-2">{u.phone || '—'}</td>
                    <td className="py-3 px-4 text-xs text-ink-2">{u.regionName || '—'}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isConfirming ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={deletingId === u.id}
                            onClick={() => void handleDeleteUser(u.id)}
                            className="btn btn-danger py-1 px-2.5 text-xs !bg-crimson !text-white !border-crimson"
                          >
                            {deletingId === u.id ? 'Đang xoá...' : 'Xác nhận xoá'}
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === u.id}
                            onClick={() => setConfirmDeleteId(null)}
                            className="btn btn-ghost py-1 px-2.5 text-xs"
                          >
                            Huỷ
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="btn btn-ghost py-1.5 px-2.5 text-xs"
                          >
                            <EditIcon size={14} />
                            <span>Sửa</span>
                          </button>
                          {u.role !== 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(u.id)}
                              className="btn btn-danger py-1.5 px-2.5 text-xs"
                              title="Xoá tài khoản"
                            >
                              <TrashIcon size={14} />
                              <span>Xoá</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal thêm / sửa người dùng */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản Tour Guide mới'}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="flagship-card w-full max-w-md p-6 space-y-5 bg-surface max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {editingUser ? `Chỉnh sửa tài khoản #${editingUser.id}` : 'Thêm tài khoản Tour Guide mới'}
                </h3>
                <p className="text-xs text-ink-2 mt-0.5">
                  {editingUser
                    ? editingUser.email
                    : 'Tài khoản được cấp quyền đăng nhập Cổng Tour Guide (:5174).'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 cursor-pointer"
                aria-label="Đóng"
              >
                <XIcon size={18} />
              </button>
            </div>

            {formError && (
              <div className="rounded-lg border border-crimson/30 bg-crimson-soft px-3 py-2 text-xs text-crimson">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateGuide} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-ink-2">Họ tên *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn Minh"
                  className="field"
                  required
                />
              </div>

              {!editingUser && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-ink-2">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="guide.moi@tripbuilder.vn"
                      className="field"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-ink-2">Mật khẩu *</label>
                      <input
                        type="password"
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="field"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-ink-2">Số điện thoại</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="field"
                      />
                    </div>
                  </div>
                </>
              )}

              {editingUser && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-ink-2">Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    className="field"
                  />
                </div>
              )}

              {isGuideForm && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-ink-2">Vùng phụ trách</label>
                      <select
                        value={selectedRegionId}
                        onChange={(e) => setSelectedRegionId(e.target.value)}
                        className="field"
                      >
                        {regions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.province})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-ink-2">Số năm kinh nghiệm</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                        className="field num"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-ink-2">Giới thiệu ngắn</label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Thổ địa am hiểu văn hoá, ẩm thực và lịch trình bản địa..."
                      className="field"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="btn btn-ghost"
                >
                  Huỷ
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting
                    ? 'Đang lưu...'
                    : editingUser
                    ? 'Lưu thay đổi'
                    : 'Tạo tài khoản Guide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

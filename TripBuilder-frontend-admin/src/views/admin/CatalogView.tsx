import { useEffect } from 'react';
import type { PresetCategory } from '../../api';
import {
  AlertIcon,
  EditIcon,
  MapPinIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from '../../components/icon';
import { PRESET_CATEGORIES, presetCategoryMeta } from '../../config/constants/meta';
import { useCatalogManager } from '../../hooks';
import { formatVnd } from '../../utils/format';

export function CatalogView() {
  const {
    regions,
    options,
    regionMap,
    selectedRegionId,
    setSelectedRegionId,
    filteredOptions,
    loading,
    error,
    modalOpen,
    editingOption,
    openAddModal,
    openEditModal,
    closeAddModal,
    formRegionId,
    setFormRegionId,
    formCategory,
    setFormCategory,
    formTitle,
    setFormTitle,
    formDescription,
    setFormDescription,
    formPrice,
    setFormPrice,
    submitting,
    formError,
    confirmDeleteId,
    setConfirmDeleteId,
    deletingId,
    handleAddOption,
    handleDelete,
  } = useCatalogManager();

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAddModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, closeAddModal]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">
            Quản lý Vùng &amp; Kho dịch vụ chuẩn
          </h2>
          <p className="text-sm text-ink-2 mt-0.5">
            Chuẩn hoá danh mục dịch vụ theo 6 vùng để Tour Guide và Khách hàng lựa chọn khi thiết kế lịch trình.
          </p>
        </div>

        <button type="button" onClick={openAddModal} className="btn btn-primary">
          <PlusIcon size={16} />
          <span>Thêm dịch vụ vào kho</span>
        </button>
      </div>

      {/* 6 Regions Filter */}
      <div className="flagship-card p-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={selectedRegionId === 'ALL'}
          onClick={() => setSelectedRegionId('ALL')}
          className="chip"
        >
          Tất cả vùng ({options.length})
        </button>
        {regions.map((r) => {
          const count = options.filter((o) => o.regionId === r.id).length;
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={selectedRegionId === r.id}
              onClick={() => setSelectedRegionId(r.id)}
              className="chip"
            >
              <MapPinIcon size={13} />
              <span>{r.name}</span>
              <span className="num opacity-70">({count})</span>
            </button>
          );
        })}
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
          <div className="p-8 text-center text-sm text-ink-2">Đang tải kho dịch vụ...</div>
        ) : filteredOptions.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-2">
            Chưa có dịch vụ nào trong vùng đã chọn.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-rule bg-surface-2 text-xs text-ink-2">
                <th className="py-3 px-4 font-medium">ID</th>
                <th className="py-3 px-4 font-medium">Vùng</th>
                <th className="py-3 px-4 font-medium">Nhóm dịch vụ</th>
                <th className="py-3 px-4 font-medium">Tên dịch vụ &amp; Mô tả</th>
                <th className="py-3 px-4 font-medium text-right">Đơn giá / người</th>
                <th className="py-3 px-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule text-sm">
              {filteredOptions.map((opt) => {
                const region = regionMap.get(opt.regionId);
                const cat = presetCategoryMeta(opt.category);
                const isConfirming = confirmDeleteId === opt.id;
                return (
                  <tr key={opt.id} className="hover:bg-surface-2/60 transition">
                    <td className="py-3 px-4 num text-xs text-ink-3">#{opt.id}</td>
                    <td className="py-3 px-4 text-ink font-medium whitespace-nowrap">
                      {opt.regionName || region?.name || `Vùng #${opt.regionId}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cat.badgeClass}>{cat.label}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-ink">{opt.title}</div>
                      {opt.description && (
                        <div className="text-xs text-ink-3 mt-0.5 max-w-md truncate">
                          {opt.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 num font-medium text-ink text-right whitespace-nowrap">
                      {formatVnd(opt.pricePerPerson)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isConfirming ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={deletingId === opt.id}
                            onClick={() => void handleDelete(opt)}
                            className="btn btn-danger py-1 px-2.5 text-xs !bg-crimson !text-white !border-crimson"
                          >
                            {deletingId === opt.id ? 'Đang xoá...' : 'Xác nhận xoá'}
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === opt.id}
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
                            onClick={() => openEditModal(opt)}
                            className="btn btn-ghost py-1.5 px-2.5 text-xs"
                            title="Sửa dịch vụ"
                          >
                            <EditIcon size={14} />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(opt.id)}
                            className="btn btn-danger py-1.5 px-2.5 text-xs"
                            title="Xoá dịch vụ"
                          >
                            <TrashIcon size={14} />
                            <span>Xoá</span>
                          </button>
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

      {/* Modal thêm / sửa dịch vụ */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingOption ? 'Chỉnh sửa dịch vụ trong kho' : 'Thêm dịch vụ vào kho chuẩn'}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddModal();
          }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="flagship-card w-full max-w-md p-6 space-y-5 bg-surface">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {editingOption ? 'Chỉnh sửa dịch vụ kho vùng' : 'Thêm dịch vụ vào kho chuẩn'}
                </h3>
                <p className="text-xs text-ink-2 mt-0.5">
                  {editingOption
                    ? `Cập nhật mục #${editingOption.id} cho vùng du lịch đã chọn.`
                    : 'Tạo dịch vụ mới để Khách hàng và Guide sử dụng.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
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

            <form onSubmit={handleAddOption} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-ink-2">Vùng du lịch *</label>
                  <select
                    value={formRegionId}
                    onChange={(e) => setFormRegionId(e.target.value)}
                    className="field"
                  >
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-ink-2">Loại dịch vụ *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as PresetCategory)}
                    className="field"
                  >
                    {PRESET_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-ink-2">Tên dịch vụ *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Khách sạn 4 sao trung tâm vịnh"
                  className="field"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-ink-2">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Gồm ăn sáng buffet, nhận phòng 14:00..."
                  className="field"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-ink-2">Đơn giá / người (VNĐ) *</label>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="field num"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="btn btn-ghost"
                >
                  Huỷ
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Đang lưu...' : editingOption ? 'Cập nhật dịch vụ' : 'Lưu dịch vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

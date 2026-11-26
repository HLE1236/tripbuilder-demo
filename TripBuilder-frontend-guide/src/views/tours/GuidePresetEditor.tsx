import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import type { Region, Tour } from '@/api/types';
import {
  AlertIcon,
  CameraIcon,
  CategoryIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from '@/components/icon';
import { RegionPhotoPicker } from '@/components/ui/RegionPhotoPicker';
import { SafeImage } from '@/components/ui/SafeImage';
import { EDITOR_CATEGORIES, useGuidePresetEditor } from '@/hooks';
import { formatVnd } from '@/utils/format';

interface GuidePresetEditorProps {
  isOpen: boolean;
  guideId: number;
  regions: Region[];
  editingTour?: Tour | null;
  onClose: () => void;
  onSaved: (tour: Tour, isNew: boolean) => void;
}

function categoryBadgeClass(category: string): string {
  switch (category) {
    case 'Khách sạn':
      return 'category-badge-hotel';
    case 'Ăn uống':
      return 'category-badge-food';
    case 'Di chuyển':
      return 'category-badge-transport';
    case 'Trải nghiệm':
      return 'category-badge-activity';
    default:
      return 'category-badge-custom';
  }
}

export function GuidePresetEditor({
  isOpen,
  guideId,
  regions,
  editingTour,
  onClose,
  onSaved,
}: GuidePresetEditorProps) {
  const {
    isEdit,
    hasGuideRegion,
    isRegionLocked,
    lockedRegionName,
    regionId,
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
  } = useGuidePresetEditor({
    guideId,
    regions,
    editingTour,
    onSaved,
  });

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      width={1060}
      maxHeight="90dvh"
      purpose="form"
    >
      <div className="flex flex-col max-h-[86dvh] min-h-0 overflow-hidden bg-surface">
        <div className="shrink-0">
          <DialogHeader
            title={isEdit ? `Chỉnh sửa tour mẫu · v${editingTour?.version}` : 'Tạo tour mẫu mới'}
            subtitle={
              isEdit
                ? 'Lưu sẽ nâng phiên bản tour, các đơn khách đã đặt vẫn giữ nguyên bản chụp cũ'
                : 'Thiết kế lịch trình chuẩn theo từng ngày để khách đặt ngay hoặc tùy chỉnh'
            }
            onOpenChange={(open) => !open && onClose()}
          />
        </div>

        <div className="flex-1 min-h-0 p-5 space-y-5 overflow-y-auto bg-canvas">
          {!hasGuideRegion && (
            <div
              role="alert"
              className="rounded-xl border border-amber bg-amber-soft px-4 py-3 flex items-start gap-3 text-base text-amber"
            >
              <AlertIcon size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Tài khoản chưa được gán vùng phụ trách</div>
                <div className="text-sm font-normal">
                  Mỗi Tour Guide chỉ được phép tạo tour tại đúng 1 vùng bản địa. Vui lòng liên hệ Admin để gán vùng trước khi lưu tour.
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-crimson bg-crimson-soft px-4 py-3 flex items-start gap-3 text-base text-crimson"
            >
              <AlertIcon size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Không thể lưu tour</div>
                <div className="text-sm font-normal">{error}</div>
              </div>
            </div>
          )}

          {/* Thông tin cơ bản tour mẫu */}
          <section className="flagship-card p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6 space-y-1.5">
                <label htmlFor="tour-title" className="block text-sm font-medium text-ink-2">
                  Tên tour mẫu <span className="text-crimson">*</span>
                </label>
                <input
                  id="tour-title"
                  type="text"
                  placeholder="Ví dụ: Đà Lạt săn mây 3N2Đ"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="field text-base font-medium"
                />
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <label htmlFor="tour-region" className="block text-sm font-medium text-ink-2">
                  Điểm đến (Khoá theo vùng Guide)
                </label>
                <div
                  id="tour-region"
                  className="field bg-surface-2 text-[14px] font-medium text-ink-2 flex items-center"
                  title="Tài khoản Guide được khóa theo vùng phụ trách"
                >
                  {isRegionLocked && lockedRegionName
                    ? `Vùng: ${lockedRegionName}`
                    : 'Chưa gán vùng phụ trách'}
                </div>
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <span className="block text-sm font-medium text-ink-2">Số ngày</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={days <= 1}
                    onClick={() => handleRequestDaysChange(days - 1)}
                    aria-label="Giảm số ngày"
                    className="btn btn-ghost px-3 py-2 text-sm font-medium"
                  >
                    <MinusIcon size={16} strokeWidth={1.5} />
                  </button>
                  <span className="num flex-1 text-center text-lg font-semibold text-ink">
                    {days}N
                  </span>
                  <button
                    type="button"
                    disabled={days >= 10}
                    onClick={() => handleRequestDaysChange(days + 1)}
                    aria-label="Tăng số ngày"
                    className="btn btn-ghost px-3 py-2 text-sm font-medium"
                  >
                    <PlusIcon size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>

            {pendingDayShrink != null && (
              <div className="p-3.5 rounded-xl border border-amber bg-amber-soft text-sm flex flex-wrap items-center justify-between gap-2.5">
                <div className="font-medium text-amber">
                  Ngày cuối đang có {affectedLastDayStepsCount} hoạt động. Giảm xuống{' '}
                  {pendingDayShrink} ngày sẽ gộp hoặc xóa các hoạt động đó
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyDayShrink('merge')}
                    className="btn btn-primary text-sm font-medium py-1.5 px-3"
                  >
                    Gộp về Ngày {pendingDayShrink}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDayShrink('drop')}
                    className="btn btn-danger text-sm font-medium py-1.5 px-3"
                  >
                    Xóa các chặng dư
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDayShrink(null)}
                    className="btn btn-ghost text-sm font-medium py-1.5 px-3"
                  >
                    Giữ nguyên
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="tour-desc" className="block text-sm font-medium text-ink-2">
                Mô tả ngắn gọn
              </label>
              <textarea
                id="tour-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tóm tắt điểm nhấn của hành trình"
                className="field text-[15px]"
              />
            </div>
          </section>

          {/* Visual Multi-Photo Gallery Manager */}
          <section className="flagship-card overflow-hidden">
            <div className="bg-surface-2 px-5 py-3.5 border-b border-rule flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <div className="text-sm font-semibold text-ink">
                  Bộ ảnh trưng bày &amp; Ảnh bìa tour
                </div>
                <p className="text-sm font-normal text-ink-3 mt-0.5">
                  Chọn nhiều ảnh thực tế từ kho vùng, bấm Đặt bìa hoặc sắp xếp thứ tự hiển thị
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="num text-sm font-medium text-ink-2">
                  {galleryUrls.length} ảnh đã chọn
                </span>
                <button
                  type="button"
                  onClick={() => setShowExternalUrlInput((v) => !v)}
                  className="btn btn-ghost text-[13px] font-medium py-1.5 px-3"
                >
                  <PlusIcon size={16} strokeWidth={1.5} />
                  <span>Dán URL ảnh ngoài</span>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {showExternalUrlInput && (
                <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl border border-rule bg-surface-2">
                  <input
                    type="text"
                    value={externalUrlDraft}
                    onChange={(e) => setExternalUrlDraft(e.target.value)}
                    placeholder="Dán đường dẫn ảnh (https://... hoặc /images/...)"
                    className="field flex-1 min-w-[240px] py-2 text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddExternalUrl}
                    className="btn btn-primary text-sm font-medium py-2 px-4"
                  >
                    Thêm vào thư viện
                  </button>
                </div>
              )}

              {galleryUrls.length === 0 ? (
                <div className="p-5 rounded-xl border border-dashed border-rule-strong bg-surface-2 text-center text-sm font-normal text-ink-3">
                  Chưa có ảnh trong bộ sưu tập, chọn ảnh từ kho vùng bên dưới để thêm
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {galleryUrls.map((url, idx) => {
                    const isCover = url === imageUrl;
                    return (
                      <div
                        key={`${url}-${idx}`}
                        className={`rounded-xl border overflow-hidden bg-surface flex flex-col ${
                          isCover ? 'border-coral ring-2 ring-coral/30' : 'border-rule'
                        }`}
                      >
                        <div className="relative aspect-[4/3] bg-surface-2 overflow-hidden">
                          <SafeImage
                            src={url}
                            alt={`Ảnh gallery ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="num absolute top-2 left-2 rounded-md bg-black/75 text-white px-2 py-0.5 text-[13px] font-semibold">
                            #{idx + 1}
                          </span>
                          {isCover && (
                            <span className="rounded-md bg-coral text-white absolute top-2 right-2 text-[13px] font-medium py-0.5 px-2">
                              Ảnh bìa
                            </span>
                          )}
                        </div>

                        <div className="p-2 border-t border-rule bg-surface-2 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveGalleryUrl(idx, -1)}
                              title="Di chuyển sang trái"
                              aria-label="Di chuyển ảnh sang trái"
                              className="h-7 w-7 rounded-lg border border-rule bg-surface text-ink-2 hover:text-ink disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors duration-150"
                            >
                              <ChevronLeftIcon size={16} strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === galleryUrls.length - 1}
                              onClick={() => handleMoveGalleryUrl(idx, 1)}
                              title="Di chuyển sang phải"
                              aria-label="Di chuyển ảnh sang phải"
                              className="h-7 w-7 rounded-lg border border-rule bg-surface text-ink-2 hover:text-ink disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors duration-150"
                            >
                              <ChevronRightIcon size={16} strokeWidth={1.5} />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => setImageUrl(url)}
                                className="text-[13px] font-medium text-coral hover:underline px-1 cursor-pointer"
                              >
                                Đặt bìa
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryUrl(url)}
                              title="Xóa ảnh"
                              aria-label="Xóa ảnh khỏi gallery"
                              className="h-7 w-7 rounded-lg text-crimson hover:bg-crimson-soft flex items-center justify-center cursor-pointer transition-colors duration-150"
                            >
                              <XIcon size={16} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="editorial-divider pt-4">
                <div className="text-sm font-medium text-ink-2 mb-2.5">
                  Kho ảnh thực tế theo điểm đến
                </div>
                <RegionPhotoPicker
                  regionId={Number(regionId)}
                  selectedUrls={galleryUrls}
                  onToggleUrl={handleToggleGalleryUrl}
                  onBatchAddUrls={handleBatchAddGalleryUrls}
                />
              </div>
            </div>
          </section>

          {/* Gom các chặng theo từng Ngày 01..0N */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <h3 className="font-display text-xl font-semibold text-ink">
                  Lịch trình theo ngày ({steps.length} chặng)
                </h3>
                <p className="text-sm font-normal text-ink-2 mt-0.5">
                  Chèn dịch vụ từ kho vùng hoặc thêm hoạt động mới, bấm vào ảnh thu nhỏ để chọn ảnh riêng
                </p>
              </div>
              <span className="num text-base font-semibold text-coral px-3.5 py-1.5 rounded-xl border border-rule bg-surface">
                {formatVnd(basePrice)} / khách
              </span>
            </div>

            <div className="space-y-4">
              {Array.from({ length: days }, (_, i) => i + 1).map((dayNum) => {
                const daySteps = steps.filter((s) => s.dayNumber === dayNum);
                const dayTotal = daySteps.reduce(
                  (acc, s) => acc + (Number(s.pricePerPerson) || 0),
                  0
                );

                return (
                  <section key={dayNum} className="flagship-card">
                    <div className="bg-flagship-dark text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-display text-lg sm:text-xl font-semibold rounded-lg bg-coral text-white px-3 py-1 leading-none">
                          Ngày {String(dayNum).padStart(2, '0')}
                        </span>
                        <span className="num text-sm font-medium text-slate-300">
                          {daySteps.length} hạng mục
                        </span>
                        <span className="num text-base font-semibold text-rose-300">
                          {formatVnd(dayTotal)}/khách
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {options.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                addOptionStepForDay(dayNum, e.target.value);
                              }
                            }}
                            aria-label={`Chọn từ kho vùng vào Ngày ${dayNum}`}
                            className="field py-1.5 px-3 text-sm font-medium w-64 bg-white text-[#0F172A]"
                          >
                            <option value="">
                              + Chọn từ kho vùng vào Ngày {dayNum}
                            </option>
                            {options.map((o) => (
                              <option key={o.id} value={String(o.id)}>
                                [{o.category}] {o.title} ({formatVnd(o.pricePerPerson)})
                              </option>
                            ))}
                          </select>
                        )}

                        <button
                          type="button"
                          onClick={() => addBlankStepForDay(dayNum)}
                          className="btn bg-white/15 hover:bg-white/25 text-white border border-white/25 text-sm font-medium py-1.5 px-3"
                        >
                          <PlusIcon size={16} strokeWidth={1.5} />
                          <span>Thêm hoạt động Ngày {dayNum}</span>
                        </button>
                      </div>
                    </div>

                    {daySteps.length === 0 ? (
                      <div className="p-5 text-center text-sm font-normal text-ink-3">
                        Ngày {dayNum} chưa có chặng nào
                      </div>
                    ) : (
                      <div className="divide-y divide-rule">
                        {daySteps.map((s) => {
                          const isPickingPhoto = pickingStepKey === s._key;
                          return (
                            <div key={s._key} className="p-3.5 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                {/* Thumbnail + Category Dot */}
                                <div className="sm:col-span-2 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPickingStepKey((cur) => (cur === s._key ? null : s._key))
                                    }
                                    title="Đổi ảnh cho chặng này"
                                    className={`relative w-14 h-10 rounded-lg overflow-hidden border shrink-0 cursor-pointer group transition-colors duration-150 ${
                                      isPickingPhoto
                                        ? 'border-coral ring-2 ring-coral/30'
                                        : 'border-rule hover:border-coral'
                                    }`}
                                  >
                                    <SafeImage
                                      src={s.imageUrl || imageUrl}
                                      alt={s.title}
                                      className="w-full h-full object-cover"
                                    />
                                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center text-white">
                                      <CameraIcon size={16} strokeWidth={1.5} />
                                    </span>
                                  </button>
                                  <span
                                    title={s.category}
                                    className={`h-9 px-2.5 rounded-lg inline-flex items-center shrink-0 ${categoryBadgeClass(
                                      s.category
                                    )}`}
                                  >
                                    <CategoryIcon
                                      category={s.category}
                                      size={16}
                                      strokeWidth={1.5}
                                    />
                                  </span>
                                </div>

                                <div className="sm:col-span-2">
                                  <select
                                    aria-label="Ngày"
                                    value={s.dayNumber}
                                    onChange={(e) =>
                                      updateStepByKey(s._key, {
                                        dayNumber: Number(e.target.value) || 1,
                                      })
                                    }
                                    className="field py-2 text-sm font-medium"
                                  >
                                    {Array.from({ length: days }, (_, idx) => (
                                      <option key={idx + 1} value={idx + 1}>
                                        Ngày {idx + 1}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="sm:col-span-2">
                                  <select
                                    aria-label="Nhóm dịch vụ"
                                    value={s.category}
                                    onChange={(e) =>
                                      updateStepByKey(s._key, { category: e.target.value })
                                    }
                                    className="field py-2 text-sm font-medium"
                                  >
                                    {EDITOR_CATEGORIES.map((c) => (
                                      <option key={c} value={c}>
                                        {c}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="sm:col-span-3">
                                  <input
                                    type="text"
                                    aria-label="Tên dịch vụ"
                                    value={s.title}
                                    onChange={(e) =>
                                      updateStepByKey(s._key, { title: e.target.value })
                                    }
                                    className="field py-2 text-[15px] font-medium"
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <input
                                    type="number"
                                    step={50_000}
                                    min={0}
                                    aria-label="Đơn giá / khách"
                                    value={s.pricePerPerson}
                                    onChange={(e) =>
                                      updateStepByKey(s._key, {
                                        pricePerPerson: Math.max(0, Number(e.target.value) || 0),
                                      })
                                    }
                                    className="field py-2 text-right num text-[15px] font-semibold text-coral"
                                  />
                                </div>

                                <div className="sm:col-span-1 flex justify-end">
                                  <button
                                    type="button"
                                    aria-label="Xóa hoạt động"
                                    title="Xóa hoạt động"
                                    onClick={() => removeStepByKey(s._key)}
                                    className="btn btn-danger px-2.5 py-2 text-sm"
                                  >
                                    <XIcon size={16} strokeWidth={1.5} />
                                  </button>
                                </div>
                              </div>

                              {/* Popover chọn 1-chạm ảnh thật cho riêng chặng này */}
                              {isPickingPhoto && (
                                <div className="p-3.5 rounded-xl border border-coral/40 bg-surface-2 space-y-2.5">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-coral">
                                      Chọn ảnh cho chặng: {s.title}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setPickingStepKey(null)}
                                      className="btn btn-ghost text-[13px] font-medium py-1 px-2.5"
                                    >
                                      Đóng
                                    </button>
                                  </div>
                                  <RegionPhotoPicker
                                    regionId={Number(regionId)}
                                    selectedUrls={s.imageUrl ? [s.imageUrl] : []}
                                    selectionMode="single"
                                    compact
                                    onToggleUrl={(pickedUrl) => {
                                      updateStepByKey(s._key, { imageUrl: pickedUrl });
                                      setPickingStepKey(null);
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-rule bg-surface flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-ink-3">Giá cơ sở mới / khách</div>
            <div className="num text-2xl font-semibold text-coral mt-0.5">
              {formatVnd(basePrice)}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-ghost text-[15px] font-medium py-2.5 px-5"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasGuideRegion}
              className="btn btn-primary text-[15px] font-medium py-2.5 px-5"
            >
              <CheckIcon size={16} strokeWidth={1.5} />
              <span>
                {saving
                  ? 'Đang lưu'
                  : isEdit
                  ? `Lưu thành v${(editingTour?.version || 1) + 1}`
                  : 'Xuất bản tour mẫu'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

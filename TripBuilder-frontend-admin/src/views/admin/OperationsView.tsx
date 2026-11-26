import { useEffect } from 'react';
import {
  AlertIcon,
  ClipboardIcon,
  CompassIcon,
  RefreshIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from '../../components/icon';
import { SafeImage } from '../../components/ui/SafeImage';
import { bookingStatusMeta } from '../../config/constants/meta';
import { useOperationsManager } from '../../hooks';
import type { BookingStatusFilter } from '../../stores';
import { formatDate, formatVnd } from '../../utils/format';

const BOOKING_STATUS_FILTERS: { value: BookingStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'BOOKED_ORIGINAL', label: 'Lịch chuẩn' },
  { value: 'WAITING_REQUOTE', label: 'Chờ báo giá' },
  { value: 'CHANGE_REQUESTED', label: 'Xin đổi sau chốt' },
  { value: 'REQUOTED', label: 'Đã gửi giá' },
  { value: 'CONFIRMED', label: 'Đã chốt' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
];

export function OperationsView() {
  const {
    subTab,
    setSubTab,
    bookingStatusFilter,
    setBookingStatusFilter,
    search,
    setSearch,
    bookings,
    tours,
    filteredBookings,
    filteredTours,
    selectedBooking,
    guideOptionsForSelectedBooking,
    reassignGuideId,
    setReassignGuideId,
    reassigningGuide,
    handleReassignGuide,
    completingBooking,
    handleCompleteSelectedBooking,
    openBookingDetail,
    closeBookingDetail,
    confirmCancelBooking,
    setConfirmCancelBooking,
    cancelReason,
    setCancelReason,
    cancellingBooking,
    handleCancelSelectedBooking,
    togglingTourId,
    handleToggleTourStatus,
    confirmDeleteTourId,
    setConfirmDeleteTourId,
    deletingTourId,
    handleDeleteTour,
    loading,
    refreshing,
    error,
    refreshAll,
  } = useOperationsManager();

  useEffect(() => {
    if (!selectedBooking) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeBookingDetail();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedBooking, closeBookingDetail]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">
            Giám sát toàn bộ Tour &amp; Đơn đặt
          </h2>
          <p className="text-sm text-ink-2 mt-0.5">
            Theo dõi luồng báo giá, xem chi tiết từng đơn đặt và quản lý toàn bộ Tour mẫu trên sàn.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refreshAll()}
          disabled={refreshing}
          className="btn btn-ghost"
        >
          <RefreshIcon size={15} className={refreshing ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Sub-tabs & Search */}
      <div className="flagship-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={subTab === 'BOOKINGS'}
              onClick={() => setSubTab('BOOKINGS')}
              className="chip"
            >
              <ClipboardIcon size={14} />
              <span>Tất cả Đơn đặt ({bookings.length})</span>
            </button>
            <button
              type="button"
              aria-pressed={subTab === 'TOURS'}
              onClick={() => setSubTab('TOURS')}
              className="chip"
            >
              <CompassIcon size={14} />
              <span>Tất cả Tour mẫu ({tours.length})</span>
            </button>
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
              placeholder={
                subTab === 'BOOKINGS'
                  ? 'Tìm mã đơn, khách, guide, tour'
                  : 'Tìm tên tour, vùng, guide'
              }
              className="field pl-9"
            />
          </div>
        </div>

        {subTab === 'BOOKINGS' && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-rule">
            {BOOKING_STATUS_FILTERS.map((f) => {
              const count =
                f.value === 'ALL'
                  ? bookings.length
                  : bookings.filter((b) => b.status === f.value).length;
              return (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={bookingStatusFilter === f.value}
                  onClick={() => setBookingStatusFilter(f.value)}
                  className="chip text-xs py-1 px-2.5"
                >
                  <span>{f.label}</span>
                  <span className="num opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-crimson/30 bg-crimson-soft px-4 py-2.5 text-sm text-crimson flex items-center gap-2">
          <AlertIcon size={15} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flagship-card p-8 text-center text-sm text-ink-2">
          Đang tải dữ liệu vận hành...
        </div>
      ) : subTab === 'BOOKINGS' ? (
        <div className="flagship-card overflow-x-auto">
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-2">Không có đơn đặt nào.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rule bg-surface-2 text-xs text-ink-2">
                  <th className="py-3 px-3.5 font-medium">Mã đơn</th>
                  <th className="py-3 px-3.5 font-medium">Khách hàng</th>
                  <th className="py-3 px-3.5 font-medium">Tour Guide</th>
                  <th className="py-3 px-3.5 font-medium">Tour</th>
                  <th className="py-3 px-3.5 font-medium">Khởi hành</th>
                  <th className="py-3 px-3.5 font-medium">Trạng thái</th>
                  <th className="py-3 px-3.5 font-medium text-right">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule text-sm">
                {filteredBookings.map((b) => {
                  const st = bookingStatusMeta(b.status);
                  return (
                    <tr
                      key={b.id}
                      onClick={() => openBookingDetail(b.id)}
                      className="hover:bg-surface-2/60 transition cursor-pointer"
                    >
                      <td className="py-3 px-3.5 num font-medium text-coral whitespace-nowrap">{b.code}</td>
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-ink">{b.customer?.fullName || '—'}</div>
                        <div className="num text-xs text-ink-3">{b.customer?.email || ''}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="text-ink">{b.guide?.fullName || '—'}</div>
                        <div className="text-xs text-ink-3">{b.guide?.regionName || ''}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="text-ink max-w-[200px] truncate" title={b.tourTitleSnapshot}>
                          {b.tourTitleSnapshot}
                        </div>
                        <div className="num text-xs text-ink-3">
                          {b.days} ngày · {b.guests} khách · v{b.tourVersionSnapshot}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 num text-xs text-ink-2 whitespace-nowrap">
                        {formatDate(b.startDate)}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`tag ${st.tagClass}`}>{b.statusLabel || st.label}</span>
                      </td>
                      <td className="py-3 px-3.5 num font-medium text-ink text-right whitespace-nowrap">
                        {formatVnd(b.confirmedTotalPrice ?? b.totalPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="flagship-card overflow-x-auto">
          {filteredTours.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-2">Không có tour mẫu nào.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rule bg-surface-2 text-xs text-ink-2">
                  <th className="py-3 px-3.5 font-medium">Tour mẫu</th>
                  <th className="py-3 px-3.5 font-medium">Vùng / Tỉnh</th>
                  <th className="py-3 px-3.5 font-medium">Guide</th>
                  <th className="py-3 px-3.5 font-medium">Thời lượng</th>
                  <th className="py-3 px-3.5 font-medium">Trạng thái</th>
                  <th className="py-3 px-3.5 font-medium text-right">Giá gốc</th>
                  <th className="py-3 px-3.5 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule text-sm">
                {filteredTours.map((t) => {
                  const isConfirming = confirmDeleteTourId === t.id;
                  const isActive = t.active !== false;
                  const isToggling = togglingTourId === t.id;
                  return (
                    <tr key={t.id} className="hover:bg-surface-2/60 transition">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <SafeImage
                            src={t.imageUrl}
                            alt={t.title}
                            className="w-11 h-8 rounded-md object-cover shrink-0 border border-rule"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-ink truncate max-w-[210px]" title={t.title}>
                              {t.title}
                            </div>
                            <div className="num text-xs text-ink-3">
                              #{t.id} · v{t.version}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="text-ink whitespace-nowrap">{t.regionName}</div>
                        <div className="text-xs text-ink-3 whitespace-nowrap">{t.province}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="text-ink whitespace-nowrap">{t.guide?.fullName || '—'}</div>
                      </td>
                      <td className="py-3 px-3.5 num text-ink-2 whitespace-nowrap">{t.days} ngày</td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`tag ${isActive ? 'tag-forest' : 'tag-ochre'}`}>
                          {isActive ? 'Đang mở' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 num font-medium text-ink text-right whitespace-nowrap">
                        {formatVnd(t.basePricePerPerson)}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={deletingTourId === t.id}
                              onClick={() => void handleDeleteTour(t.id)}
                              className="btn btn-danger py-1 px-2.5 text-xs !bg-crimson !text-white !border-crimson"
                            >
                              {deletingTourId === t.id ? 'Đang xoá...' : 'Xác nhận'}
                            </button>
                            <button
                              type="button"
                              disabled={deletingTourId === t.id}
                              onClick={() => setConfirmDeleteTourId(null)}
                              className="btn btn-ghost py-1 px-2 text-xs"
                            >
                              Huỷ
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => void handleToggleTourStatus(t.id, !isActive)}
                              className="btn btn-ghost py-1.5 px-2.5 text-xs"
                            >
                              {isToggling ? 'Đang lưu...' : isActive ? 'Tạm ẩn' : 'Mở bán'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTourId(t.id)}
                              className="btn btn-danger py-1.5 px-2.5 text-xs"
                              title="Xoá tour mẫu chưa có đơn"
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
      )}

      {/* Modal chi tiết đơn đặt cho Admin */}
      {selectedBooking && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Chi tiết đơn ${selectedBooking.code}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeBookingDetail();
          }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="flagship-card w-full max-w-2xl bg-surface max-h-[88vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-rule bg-surface-2 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="num text-base font-semibold text-coral">{selectedBooking.code}</span>
                  <span className={`tag ${bookingStatusMeta(selectedBooking.status).tagClass}`}>
                    {selectedBooking.statusLabel || bookingStatusMeta(selectedBooking.status).label}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-ink mt-1">
                  {selectedBooking.tourTitleSnapshot}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeBookingDetail}
                className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface cursor-pointer"
                aria-label="Đóng"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded-lg border border-rule bg-surface-2">
                  <div className="text-xs text-ink-3">Khách hàng</div>
                  <div className="font-medium text-ink mt-0.5 truncate">{selectedBooking.customer?.fullName}</div>
                </div>
                <div className="p-3 rounded-lg border border-rule bg-surface-2">
                  <div className="text-xs text-ink-3">Tour Guide</div>
                  <div className="font-medium text-ink mt-0.5 truncate">{selectedBooking.guide?.fullName}</div>
                </div>
                <div className="p-3 rounded-lg border border-rule bg-surface-2">
                  <div className="text-xs text-ink-3">Khởi hành</div>
                  <div className="num font-medium text-ink mt-0.5">
                    {formatDate(selectedBooking.startDate)}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-rule bg-surface-2">
                  <div className="text-xs text-ink-3">Tổng tiền</div>
                  <div className="num font-semibold text-coral mt-0.5">
                    {formatVnd(selectedBooking.confirmedTotalPrice ?? selectedBooking.totalPrice)}
                  </div>
                </div>
              </div>

              {(selectedBooking.customerNote ||
                selectedBooking.guideNote ||
                selectedBooking.cancelReason) && (
                <div className="space-y-2 text-sm">
                  {selectedBooking.customerNote && (
                    <div className="p-3 rounded-lg border border-rule bg-surface-2">
                      <span className="font-medium text-ink">Ghi chú khách: </span>
                      <span className="text-ink-2">{selectedBooking.customerNote}</span>
                    </div>
                  )}
                  {selectedBooking.guideNote && (
                    <div className="p-3 rounded-lg border border-rule bg-surface-2">
                      <span className="font-medium text-ink">Ghi chú Guide: </span>
                      <span className="text-ink-2">{selectedBooking.guideNote}</span>
                    </div>
                  )}
                  {selectedBooking.cancelReason && (
                    <div className="p-3 rounded-lg border border-crimson/25 bg-crimson-soft">
                      <span className="font-medium text-crimson">Lý do huỷ: </span>
                      <span className="text-ink">{selectedBooking.cancelReason}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedBooking.status !== 'CANCELLED' &&
                selectedBooking.status !== 'COMPLETED' && (
                  <div className="p-3.5 rounded-lg border border-rule bg-surface-2 space-y-2">
                    <div className="text-xs font-medium text-ink-2">Điều chuyển Guide (chỉ cùng vùng)</div>
                    {guideOptionsForSelectedBooking.length === 0 ? (
                      <p className="text-xs text-ink-3">
                        Chưa có Tour Guide khác cùng vùng để điều chuyển đơn này.
                      </p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={reassignGuideId}
                          onChange={(e) => setReassignGuideId(e.target.value)}
                          className="field flex-1 min-w-[200px] text-sm"
                          aria-label="Chọn Tour Guide mới"
                        >
                          <option value="">
                            -- Chọn Guide thay thế ({selectedBooking.guide?.fullName || 'Chưa có'}) --
                          </option>
                          {guideOptionsForSelectedBooking.map(({ guide }) => (
                            <option key={guide.id} value={guide.id}>
                              {guide.fullName}
                              {guide.regionName ? ` · ${guide.regionName}` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!reassignGuideId || reassigningGuide}
                          onClick={() => void handleReassignGuide()}
                          className="btn btn-primary text-xs py-2 px-3"
                        >
                          {reassigningGuide ? 'Đang chuyển...' : 'Điều chuyển'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

              {selectedBooking.steps && selectedBooking.steps.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-ink-2">
                    Lịch trình chi tiết ({selectedBooking.steps.length} chặng)
                  </div>
                  <div className="rounded-lg border border-rule divide-y divide-rule">
                    {selectedBooking.steps.map((s, idx) => (
                      <div key={idx} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <span className="num text-xs text-ink-3 mr-2">N{s.dayNumber}</span>
                          <span className={s.noteType === 'REMOVED' ? 'line-through text-ink-3' : 'text-ink font-medium'}>
                            {s.title}
                          </span>
                        </div>
                        <span className="num text-xs font-medium text-ink shrink-0">
                          {formatVnd(s.pricePerPerson)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-rule bg-surface-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {selectedBooking.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    disabled={completingBooking}
                    onClick={() => void handleCompleteSelectedBooking()}
                    className="btn btn-primary text-xs"
                  >
                    {completingBooking ? 'Đang cập nhật...' : 'Đánh dấu hoàn thành'}
                  </button>
                )}

                {selectedBooking.status !== 'CANCELLED' &&
                selectedBooking.status !== 'COMPLETED' ? (
                  confirmCancelBooking ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Lý do huỷ (tuỳ chọn)"
                        className="field py-1.5 px-2.5 text-xs w-48"
                      />
                      <button
                        type="button"
                        disabled={cancellingBooking}
                        onClick={() => void handleCancelSelectedBooking()}
                        className="btn btn-danger py-1.5 px-3 text-xs !bg-crimson !text-white !border-crimson"
                      >
                        {cancellingBooking ? 'Đang huỷ...' : 'Đúng, huỷ đơn'}
                      </button>
                      <button
                        type="button"
                        disabled={cancellingBooking}
                        onClick={() => {
                          setConfirmCancelBooking(false);
                          setCancelReason('');
                        }}
                        className="btn btn-ghost py-1.5 px-3 text-xs"
                      >
                        Giữ lại
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmCancelBooking(true)}
                      className="btn btn-danger text-xs"
                    >
                      Huỷ đơn đặt tour
                    </button>
                  )
                ) : (
                  <span className="text-xs text-ink-3">
                    {selectedBooking.status === 'COMPLETED'
                      ? 'Đơn này đã hoàn thành.'
                      : 'Đơn này đã ở trạng thái huỷ.'}
                  </span>
                )}
              </div>

              <button type="button" onClick={closeBookingDetail} className="btn btn-ghost text-sm">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

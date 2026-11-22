import {
  AlertIcon,
  ClipboardIcon,
  CompassIcon,
  RefreshIcon,
  SearchIcon,
} from '../../components/icon';
import { SafeImage } from '../../components/ui/SafeImage';
import { bookingStatusMeta } from '../../config/constants/meta';
import { useOperationsManager } from '../../hooks';
import { formatDateTime, formatVnd } from '../../utils/format';

export function OperationsView() {
  const {
    subTab,
    setSubTab,
    search,
    setSearch,
    bookings,
    tours,
    filteredBookings,
    filteredTours,
    loading,
    refreshing,
    error,
    refreshAll,
  } = useOperationsManager();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">
            Giám sát toàn bộ Tour &amp; Đơn đặt
          </h2>
          <p className="text-sm text-ink-2 mt-0.5">
            Theo dõi luồng báo giá, đơn đã chốt và toàn bộ lịch trình Tour mẫu của các Tour Guide.
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
      <div className="flagship-card p-4 flex flex-wrap items-center justify-between gap-3">
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
                ? 'Tìm mã đơn, khách, guide, tour...'
                : 'Tìm tên tour, vùng, guide...'
            }
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
                  <th className="py-3 px-4 font-medium">Mã đơn</th>
                  <th className="py-3 px-4 font-medium">Khách hàng</th>
                  <th className="py-3 px-4 font-medium">Tour Guide</th>
                  <th className="py-3 px-4 font-medium">Tour</th>
                  <th className="py-3 px-4 font-medium">Khởi hành</th>
                  <th className="py-3 px-4 font-medium">Trạng thái</th>
                  <th className="py-3 px-4 font-medium text-right">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule text-sm">
                {filteredBookings.map((b) => {
                  const st = bookingStatusMeta(b.status);
                  return (
                    <tr key={b.id} className="hover:bg-surface-2/60 transition">
                      <td className="py-3 px-4 num font-medium text-ink">{b.code}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-ink">{b.customer?.fullName || '—'}</div>
                        <div className="num text-xs text-ink-3">{b.customer?.email || ''}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-ink">{b.guide?.fullName || '—'}</div>
                        <div className="text-xs text-ink-3">{b.guide?.regionName || ''}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-ink max-w-xs truncate" title={b.tourTitleSnapshot}>
                          {b.tourTitleSnapshot}
                        </div>
                        <div className="num text-xs text-ink-3">
                          {b.days} ngày · {b.guests} khách · v{b.tourVersionSnapshot}
                        </div>
                      </td>
                      <td className="py-3 px-4 num text-xs text-ink-2">
                        {formatDateTime(b.startDate)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`tag ${st.tagClass}`}>{b.statusLabel || st.label}</span>
                      </td>
                      <td className="py-3 px-4 num font-medium text-ink text-right">
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
                  <th className="py-3 px-4 font-medium">Tour mẫu</th>
                  <th className="py-3 px-4 font-medium">Vùng / Tỉnh</th>
                  <th className="py-3 px-4 font-medium">Guide phụ trách</th>
                  <th className="py-3 px-4 font-medium">Số ngày</th>
                  <th className="py-3 px-4 font-medium">Phiên bản</th>
                  <th className="py-3 px-4 font-medium text-right">Giá gốc / người</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule text-sm">
                {filteredTours.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-2/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <SafeImage
                          src={t.imageUrl}
                          alt={t.title}
                          className="w-12 h-9 rounded-md object-cover shrink-0 border border-rule"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-ink truncate max-w-xs" title={t.title}>
                            {t.title}
                          </div>
                          <div className="num text-xs text-ink-3">ID #{t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-ink">{t.regionName}</div>
                      <div className="text-xs text-ink-3">{t.province}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-ink">{t.guide?.fullName || '—'}</div>
                      <div className="num text-xs text-ink-3">{t.guide?.email || ''}</div>
                    </td>
                    <td className="py-3 px-4 num text-ink-2">{t.days} ngày</td>
                    <td className="py-3 px-4">
                      <span className="tag tag-neutral num">v{t.version}</span>
                    </td>
                    <td className="py-3 px-4 num font-medium text-ink text-right">
                      {formatVnd(t.basePricePerPerson)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

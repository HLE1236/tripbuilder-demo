import { AlertIcon, ArrowRightIcon, RefreshIcon } from '../../components/icon';
import { bookingStatusMeta } from '../../config/constants/meta';
import { useAdminBookingsQuery, useAdminOverviewQuery } from '../../hooks';
import { useAdminUiStore } from '../../stores';
import { formatVnd } from '../../utils/format';

export function OverviewView() {
  const { data: overview, isLoading, isFetching, error, refetch } = useAdminOverviewQuery();
  const { data: bookings = [] } = useAdminBookingsQuery();
  const setActiveTab = useAdminUiStore((s) => s.setActiveTab);
  const setOperationsSubTab = useAdminUiStore((s) => s.setOperationsSubTab);
  const setRoleFilter = useAdminUiStore((s) => s.setRoleFilter);

  const errorMessage = error instanceof Error ? error.message : null;

  if (isLoading && !overview) {
    return (
      <div className="flagship-card p-8 text-center text-sm text-ink-2">
        Đang tổng hợp số liệu toàn sàn...
      </div>
    );
  }

  if (errorMessage && !overview) {
    return (
      <div className="flagship-card p-6 space-y-3">
        <div className="flex items-center gap-2 text-crimson text-sm font-medium">
          <AlertIcon size={16} />
          <span>{errorMessage}</span>
        </div>
        <button type="button" onClick={() => void refetch()} className="btn btn-ghost">
          <RefreshIcon size={15} />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  const goToBookings = () => {
    setOperationsSubTab('BOOKINGS');
    setActiveTab('operations');
  };

  const goToTours = () => {
    setOperationsSubTab('TOURS');
    setActiveTab('operations');
  };

  const goToUsers = (role: 'CUSTOMER' | 'GUIDE') => {
    setRoleFilter(role);
    setActiveTab('users');
  };

  const recentBookings = bookings.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">
            Tổng quan KPI toàn sàn
          </h2>
          <p className="text-sm text-ink-2 mt-0.5">
            Theo dõi doanh thu chốt đơn, trạng thái xử lý báo giá và quy mô vận hành hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="btn btn-ghost"
        >
          <RefreshIcon size={15} className={isFetching ? 'animate-spin' : ''} />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-crimson/30 bg-crimson-soft px-4 py-2.5 text-sm text-crimson flex items-center gap-2">
          <AlertIcon size={15} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Asymmetric Executive Strip (5 + 7) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <button
          type="button"
          onClick={goToBookings}
          className="lg:col-span-5 flagship-card flagship-card-interactive p-5 text-left flex flex-col justify-between gap-4 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-2">Doanh thu đã chốt</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-coral">
              <span>Xem đơn</span>
              <ArrowRightIcon size={13} />
            </span>
          </div>
          <div>
            <div className="num text-3xl font-semibold text-emerald tracking-tight">
              {formatVnd(overview.totalRevenue)}
            </div>
            <div className="text-xs text-ink-3 mt-1.5">
              Từ {overview.confirmedBookings} đơn đã xác nhận trên tổng {overview.totalBookings} đơn đặt
            </div>
          </div>
        </button>

        <div className="lg:col-span-7 flagship-card grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-rule">
          <button
            type="button"
            onClick={goToBookings}
            className="p-4 text-left hover:bg-surface-2 transition-colors cursor-pointer flex flex-col justify-between gap-2"
          >
            <span className="text-xs font-medium text-ink-2">Tổng đơn đặt</span>
            <div>
              <div className="num text-2xl font-semibold text-ink">{overview.totalBookings}</div>
              <div className="text-xs text-ink-3 mt-0.5">Toàn sàn</div>
            </div>
          </button>

          <button
            type="button"
            onClick={goToBookings}
            className="p-4 text-left hover:bg-surface-2 transition-colors cursor-pointer flex flex-col justify-between gap-2"
          >
            <span className="text-xs font-medium text-ink-2">Chờ báo giá</span>
            <div>
              <div className="num text-2xl font-semibold text-amber">{overview.waitingRequoteBookings}</div>
              <div className="text-xs text-ink-3 mt-0.5">Cần Guide xử lý</div>
            </div>
          </button>

          <button
            type="button"
            onClick={goToBookings}
            className="p-4 text-left hover:bg-surface-2 transition-colors cursor-pointer flex flex-col justify-between gap-2"
          >
            <span className="text-xs font-medium text-ink-2">Đã gửi giá</span>
            <div>
              <div className="num text-2xl font-semibold text-coral">{overview.requotedBookings}</div>
              <div className="text-xs text-ink-3 mt-0.5">Chờ khách chốt</div>
            </div>
          </button>

          <button
            type="button"
            onClick={goToBookings}
            className="p-4 text-left hover:bg-surface-2 transition-colors cursor-pointer flex flex-col justify-between gap-2"
          >
            <span className="text-xs font-medium text-ink-2">Đã chốt</span>
            <div>
              <div className="num text-2xl font-semibold text-emerald">{overview.confirmedBookings}</div>
              <div className="text-xs text-ink-3 mt-0.5">Sẵn sàng khởi hành</div>
            </div>
          </button>
        </div>
      </section>

      {/* Resource Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={goToTours}
          className="flagship-card flagship-card-interactive p-4 text-left flex items-center justify-between gap-3 cursor-pointer"
        >
          <div>
            <div className="text-xs font-medium text-ink-2">Tour mẫu</div>
            <div className="num text-xl font-semibold text-ink mt-1">{overview.totalTours}</div>
          </div>
          <ArrowRightIcon size={15} className="text-ink-3" />
        </button>

        <button
          type="button"
          onClick={() => goToUsers('CUSTOMER')}
          className="flagship-card flagship-card-interactive p-4 text-left flex items-center justify-between gap-3 cursor-pointer"
        >
          <div>
            <div className="text-xs font-medium text-ink-2">Khách hàng</div>
            <div className="num text-xl font-semibold text-ink mt-1">{overview.totalCustomers}</div>
          </div>
          <ArrowRightIcon size={15} className="text-ink-3" />
        </button>

        <button
          type="button"
          onClick={() => goToUsers('GUIDE')}
          className="flagship-card flagship-card-interactive p-4 text-left flex items-center justify-between gap-3 cursor-pointer"
        >
          <div>
            <div className="text-xs font-medium text-ink-2">Tour Guide</div>
            <div className="num text-xl font-semibold text-ink mt-1">{overview.totalGuides}</div>
          </div>
          <ArrowRightIcon size={15} className="text-ink-3" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className="flagship-card flagship-card-interactive p-4 text-left flex items-center justify-between gap-3 cursor-pointer"
        >
          <div>
            <div className="text-xs font-medium text-ink-2">Vùng &amp; Kho dịch vụ</div>
            <div className="num text-xl font-semibold text-ink mt-1">
              {overview.totalRegions} vùng · {overview.totalPresetOptions} mục
            </div>
          </div>
          <ArrowRightIcon size={15} className="text-ink-3" />
        </button>
      </section>

      {/* Recent Bookings Ledger */}
      <section className="flagship-card overflow-x-auto">
        <div className="px-5 py-3.5 border-b border-rule flex items-center justify-between gap-3 bg-surface-2">
          <h3 className="text-sm font-semibold text-ink">Đơn đặt tour mới cập nhật</h3>
          <button
            type="button"
            onClick={goToBookings}
            className="text-xs font-medium text-coral hover:underline cursor-pointer"
          >
            Xem tất cả ({overview.totalBookings})
          </button>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-6 text-center text-sm text-ink-2">Chưa có đơn đặt tour nào.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-rule text-xs text-ink-3">
                <th className="py-2.5 px-4 font-medium">Mã đơn</th>
                <th className="py-2.5 px-4 font-medium">Khách hàng</th>
                <th className="py-2.5 px-4 font-medium">Hành trình</th>
                <th className="py-2.5 px-4 font-medium">Trạng thái</th>
                <th className="py-2.5 px-4 font-medium text-right">Tổng tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule text-sm">
              {recentBookings.map((b) => {
                const st = bookingStatusMeta(b.status);
                return (
                  <tr
                    key={b.id}
                    onClick={goToBookings}
                    className="hover:bg-surface-2/60 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-4 num font-medium text-ink">{b.code}</td>
                    <td className="py-2.5 px-4 text-ink">{b.customer?.fullName || '—'}</td>
                    <td className="py-2.5 px-4 text-ink-2 max-w-xs truncate">{b.tourTitleSnapshot}</td>
                    <td className="py-2.5 px-4">
                      <span className={`tag ${st.tagClass}`}>{b.statusLabel || st.label}</span>
                    </td>
                    <td className="py-2.5 px-4 num font-medium text-ink text-right">
                      {formatVnd(b.confirmedTotalPrice ?? b.totalPrice)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

import { AlertIcon, Icon, RefreshIcon, type IconName } from '../../components/icon';
import { useAdminOverviewQuery } from '../../hooks';
import { formatVnd } from '../../utils/format';

interface KpiCard {
  label: string;
  value: string | number;
  sub: string;
  icon: IconName;
  accent?: boolean;
  tone?: 'default' | 'emerald' | 'amber' | 'terracotta';
}

export function OverviewView() {
  const { data: overview, isLoading, isFetching, error, refetch } = useAdminOverviewQuery();
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

  const data = overview!;

  const primaryCards: KpiCard[] = [
    {
      label: 'Doanh thu đã chốt',
      value: formatVnd(data.totalRevenue),
      sub: `${data.confirmedBookings} đơn đã xác nhận`,
      icon: 'ticket',
      accent: true,
      tone: 'emerald',
    },
    {
      label: 'Tổng đơn đặt',
      value: data.totalBookings,
      sub: 'Toàn bộ yêu cầu trên sàn',
      icon: 'clipboard',
    },
    {
      label: 'Đơn chờ báo giá',
      value: data.waitingRequoteBookings,
      sub: 'Đang chờ Tour Guide xử lý',
      icon: 'clock',
      tone: 'amber',
    },
    {
      label: 'Đơn đã báo giá',
      value: data.requotedBookings,
      sub: 'Chờ khách hàng xác nhận',
      icon: 'edit',
      tone: 'terracotta',
    },
    {
      label: 'Đơn đã chốt',
      value: data.confirmedBookings,
      sub: 'Sẵn sàng khởi hành',
      icon: 'check-circle',
      tone: 'emerald',
    },
  ];

  const systemCards: KpiCard[] = [
    {
      label: 'Tổng Tour mẫu',
      value: data.totalTours,
      sub: 'Lịch trình chuẩn của Guide',
      icon: 'compass',
    },
    {
      label: 'Tổng Khách hàng',
      value: data.totalCustomers,
      sub: 'Tài khoản CUSTOMER',
      icon: 'user',
    },
    {
      label: 'Tổng Tour Guide',
      value: data.totalGuides,
      sub: 'Tài khoản GUIDE phụ trách vùng',
      icon: 'users',
    },
    {
      label: 'Vùng & Kho dịch vụ',
      value: `${data.totalRegions} vùng · ${data.totalPresetOptions} mục`,
      sub: 'Danh mục PresetOption chuẩn hoá',
      icon: 'layers',
    },
  ];

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

      {/* Doanh thu & Trạng thái đơn đặt */}
      <section className="space-y-3">
        <div className="text-xs font-medium text-ink-3">Doanh thu &amp; Luồng đơn đặt</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {primaryCards.map((card) => (
            <div key={card.label} className="flagship-card p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink-2">{card.label}</span>
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    card.tone === 'emerald'
                      ? 'bg-emerald-soft text-emerald'
                      : card.tone === 'amber'
                        ? 'bg-amber-soft text-amber'
                        : card.tone === 'terracotta'
                          ? 'bg-coral-soft text-coral'
                          : 'bg-surface-2 text-ink-2'
                  }`}
                >
                  <Icon name={card.icon} size={16} />
                </span>
              </div>

              <div>
                <div
                  className={`num font-semibold tracking-tight ${
                    card.accent ? 'text-2xl text-emerald' : 'text-2xl text-ink'
                  }`}
                >
                  {card.value}
                </div>
                <div className="text-xs text-ink-3 mt-1">{card.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quy mô tài nguyên hệ thống */}
      <section className="space-y-3">
        <div className="text-xs font-medium text-ink-3">Quy mô tài nguyên &amp; Nhân sự</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {systemCards.map((card) => (
            <div key={card.label} className="flagship-card p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink-2">{card.label}</span>
                <span className="w-8 h-8 rounded-lg bg-surface-2 text-ink-2 flex items-center justify-center">
                  <Icon name={card.icon} size={16} />
                </span>
              </div>
              <div>
                <div className="num text-xl font-semibold text-ink">{card.value}</div>
                <div className="text-xs text-ink-3 mt-1">{card.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

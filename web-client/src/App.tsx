import { useEffect, useState } from 'react';
import {
  formatVnd,
  getBooking,
  getBookings,
  getHello,
  getRegions,
  getTours,
  getUsers,
  statusBadge,
  type Booking,
  type Region,
  type Tour,
  type User,
} from './api';
import CustomerCustomizeModal from './components/CustomerCustomizeModal';
import GuidePresetEditor from './components/GuidePresetEditor';
import BookingWorkspace from './components/BookingWorkspace';
import Icon, { type IconName } from './components/Icon';

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getServices(tour: Tour): { icon: IconName; label: string }[] {
  const cats = tour.steps.map((s) => s.category.toLowerCase());
  const list: { icon: IconName; label: string }[] = [];
  if (cats.some((c) => c.includes('di chuyển') || c.includes('xe'))) list.push({ icon: 'bus', label: 'Xe đưa đón' });
  if (cats.some((c) => c.includes('khách sạn') || c.includes('lưu trú'))) list.push({ icon: 'bed', label: 'Khách sạn' });
  if (cats.some((c) => c.includes('trải nghiệm') || c.includes('tham quan'))) list.push({ icon: 'ticket', label: 'Trải nghiệm' });
  if (cats.some((c) => c.includes('ăn') || c.includes('ẩm thực'))) list.push({ icon: 'utensils', label: 'Ẩm thực' });
  return list;
}

function durationLabel(days: number): string {
  return days > 1 ? `${days}N${days - 1}Đ` : '1 ngày';
}

export default function App() {
  const [roleMode, setRoleMode] = useState<'CUSTOMER' | 'GUIDE'>('CUSTOMER');
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [dark, setDark] = useState<boolean>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  const [customers, setCustomers] = useState<User[]>([]);
  const [guides, setGuides] = useState<User[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<User | null>(null);
  const [currentGuide, setCurrentGuide] = useState<User | null>(null);

  const [tab, setTab] = useState<'tours' | 'bookings'>('tours');
  const [selectedRegionId, setSelectedRegionId] = useState<number | 'ALL'>('ALL');

  const [tours, setTours] = useState<Tour[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [bookingTour, setBookingTour] = useState<Tour | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [activeWorkspaceBooking, setActiveWorkspaceBooking] = useState<Booking | null>(null);
  const [editingPreset, setEditingPreset] = useState<Tour | null>(null);
  const [creatingPreset, setCreatingPreset] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('tb-theme', dark ? 'dark' : 'light');
    } catch {
      /* bỏ qua khi trình duyệt chặn localStorage */
    }
  }, [dark]);

  useEffect(() => {
    getHello()
      .then(() => setServerOnline(true))
      .catch(() => setServerOnline(false));
    getRegions().then(setRegions).catch(() => setRegions([]));
    getUsers('CUSTOMER').then((list) => {
      setCustomers(list);
      if (list.length > 0) setCurrentCustomer(list[0]);
    });
    getUsers('GUIDE').then((list) => {
      setGuides(list);
      if (list.length > 0) setCurrentGuide(list[0]);
    });
  }, []);

  const refreshData = () => {
    setLoadingList(true);
    const jobs: Promise<unknown>[] = [];
    if (roleMode === 'CUSTOMER') {
      jobs.push(getTours().then(setTours));
      if (currentCustomer) jobs.push(getBookings({ customerId: currentCustomer.id }).then(setBookings));
    } else if (currentGuide) {
      jobs.push(getTours(currentGuide.id).then(setTours));
      jobs.push(getBookings({ guideId: currentGuide.id }).then(setBookings));
    }
    Promise.allSettled(jobs).finally(() => setLoadingList(false));
  };

  useEffect(() => {
    refreshData();
  }, [roleMode, currentCustomer, currentGuide]);

  useEffect(() => {
    if (selectedBookingId) {
      getBooking(selectedBookingId)
        .then(setActiveWorkspaceBooking)
        .catch(() => setActiveWorkspaceBooking(null));
    } else {
      setActiveWorkspaceBooking(null);
    }
  }, [selectedBookingId]);

  // Đổi vai thông minh: đang mở 1 đơn → tự chọn đúng Khách / Guide của đơn đó
  const handleSmartRoleSwitch = (targetRole: 'CUSTOMER' | 'GUIDE', explicitBooking?: Booking | null) => {
    const b = explicitBooking || activeWorkspaceBooking;
    setCreatingPreset(false);
    setEditingPreset(null);
    if (targetRole === 'GUIDE') {
      if (b?.guide) setCurrentGuide(guides.find((g) => g.id === b.guide.id) || b.guide);
      setRoleMode('GUIDE');
    } else {
      if (b?.customer) setCurrentCustomer(customers.find((c) => c.id === b.customer.id) || b.customer);
      setRoleMode('CUSTOMER');
    }
  };

  const goTab = (t: 'tours' | 'bookings') => {
    setTab(t);
    setSelectedBookingId(null);
    setCreatingPreset(false);
    setEditingPreset(null);
    refreshData();
  };

  const waitingRequoteCount = bookings.filter((b) => b.status === 'WAITING_REQUOTE').length;
  const requotedCount = bookings.filter((b) => b.status === 'REQUOTED').length;
  const filteredTours = selectedRegionId === 'ALL' ? tours : tours.filter((t) => t.regionId === selectedRegionId);
  const activeUser = roleMode === 'CUSTOMER' ? currentCustomer : currentGuide;
  const isGuide = roleMode === 'GUIDE';
  const badgeCount = isGuide ? waitingRequoteCount : requotedCount;

  return (
    <div className="min-h-screen flex flex-col bg-ground text-ink">
      {/* ============ Thanh trình diễn (chỉ dùng khi demo) ============ */}
      <div className="bg-[#081a30] text-navy-ink-2 text-xs">
        <div className="mx-auto max-w-6xl px-4 py-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <p className="flex items-center gap-2 min-w-0">
            <span className="coupon-head text-[0.72rem] text-[#f2c14e]">Chế độ trình diễn</span>
            <span className="hidden md:inline truncate">
              {selectedBookingId && activeWorkspaceBooking
                ? `Đang mở đơn ${activeWorkspaceBooking.code}. Đổi vai sẽ tự chọn đúng Khách / Guide của đơn này.`
                : 'Chuyển góc nhìn Khách hàng ↔ Tour Guide ngay trên một màn hình.'}
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Chọn góc nhìn" className="inline-flex rounded-md border border-white/15 p-0.5">
              {(['CUSTOMER', 'GUIDE'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={roleMode === r}
                  onClick={() => handleSmartRoleSwitch(r)}
                  className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-semibold cursor-pointer transition-colors ${
                    roleMode === r ? 'bg-navy-ink text-[#081a30]' : 'text-navy-ink-2 hover:text-white'
                  }`}
                >
                  <Icon name={r === 'CUSTOMER' ? 'user' : 'compass'} size={14} />
                  {r === 'CUSTOMER' ? 'Khách hàng' : 'Tour Guide'}
                </button>
              ))}
            </div>

            <label className="sr-only" htmlFor="demo-account">Tài khoản mẫu</label>
            {roleMode === 'CUSTOMER' ? (
              <select
                id="demo-account"
                value={currentCustomer?.id || ''}
                onChange={(e) => {
                  setCurrentCustomer(customers.find((x) => x.id === Number(e.target.value)) || null);
                  setSelectedBookingId(null);
                }}
                className="rounded-md border border-white/15 bg-[#0c2340] px-2 py-1 text-navy-ink font-medium"
              >
                {customers.map((u) => (
                  <option key={u.id} value={u.id}>Khách: {u.fullName}</option>
                ))}
              </select>
            ) : (
              <select
                id="demo-account"
                value={currentGuide?.id || ''}
                onChange={(e) => {
                  setCurrentGuide(guides.find((x) => x.id === Number(e.target.value)) || null);
                  setSelectedBookingId(null);
                  setSelectedRegionId('ALL');
                }}
                className="rounded-md border border-white/15 bg-[#0c2340] px-2 py-1 text-navy-ink font-medium"
              >
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>Guide: {g.fullName} ({g.regionName})</option>
                ))}
              </select>
            )}

            <span className="inline-flex items-center gap-1.5 border-l border-white/15 pl-2.5" title="Kết nối tới máy chủ">
              <span className={`h-2 w-2 rounded-full ${serverOnline ? 'bg-[#5fd39a]' : 'bg-[#ff5c72]'}`} />
              {serverOnline ? 'Máy chủ online' : 'Mất kết nối máy chủ'}
            </span>
          </div>
        </div>
      </div>

      {/* ============ Header ============ */}
      <header className="sticky top-0 z-30 bg-navy text-navy-ink border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <button type="button" onClick={() => goTab('tours')} className="flex items-center gap-2.5 cursor-pointer">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-red text-white dark:text-[#2a0710]">
              <Icon name="ticket" size={20} />
            </span>
            <span className="text-left leading-none">
              <span className="block font-head text-2xl font-bold tracking-wide uppercase">TripBuilder</span>
              <span className="hidden sm:block text-[0.7rem] text-navy-ink-2 mt-0.5">Lịch trình riêng cùng Guide bản địa</span>
            </span>
          </button>

          <nav aria-label="Điều hướng chính" className="flex items-stretch h-full">
            {([
              { id: 'tours' as const, label: isGuide ? 'Tour của tôi' : 'Khám phá tour', count: tours.length },
              { id: 'bookings' as const, label: isGuide ? 'Đơn & báo giá' : 'Chuyến đi của tôi', count: bookings.length },
            ]).map((t) => {
              const active = t.id === 'bookings' ? tab === 'bookings' || !!selectedBookingId : tab === 'tours' && !selectedBookingId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => goTab(t.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-2 px-3 sm:px-4 text-sm font-semibold cursor-pointer transition-colors ${
                    active ? 'text-white' : 'text-navy-ink-2 hover:text-white'
                  }`}
                >
                  {t.label}
                  <span className="num text-xs text-navy-ink-2">{t.count}</span>
                  {t.id === 'bookings' && badgeCount > 0 && (
                    <span className="num rounded-full bg-red px-1.5 py-0.5 text-[0.68rem] font-bold text-white dark:text-[#2a0710]">
                      {badgeCount}
                    </span>
                  )}
                  {active && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-red" />}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {activeUser && (
              <div className="hidden md:flex items-center gap-2.5 rounded-md border border-white/15 px-2.5 py-1.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-navy-ink text-navy text-[0.7rem] font-bold">
                  {getInitials(activeUser.fullName)}
                </span>
                <span className="text-xs leading-tight">
                  <span className="block font-semibold text-white">{activeUser.fullName}</span>
                  <span className="block text-navy-ink-2">
                    {isGuide ? `Guide · ${activeUser.regionName || 'Việt Nam'}` : 'Khách hàng'}
                  </span>
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              className="grid h-9 w-9 place-items-center rounded-md border border-white/15 text-navy-ink-2 hover:text-white hover:border-white/40 cursor-pointer transition-colors"
            >
              <Icon name={dark ? 'sun' : 'moon'} size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ============ Nội dung ============ */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {!serverOnline && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-red/40 bg-red-soft px-4 py-3 text-sm text-ink">
            <Icon name="alert" size={18} className="mt-0.5 text-red" />
            <p>
              Không kết nối được máy chủ ở <span className="num">localhost:8080</span>. Hãy chạy backend
              (file <span className="num">run-demo.bat</span>) rồi tải lại trang.
            </p>
          </div>
        )}

        {selectedBookingId ? (
          <BookingWorkspace
            bookingId={selectedBookingId}
            roleMode={roleMode}
            onBack={() => {
              setSelectedBookingId(null);
              refreshData();
            }}
            onChanged={(updated) => {
              if (updated) setActiveWorkspaceBooking(updated);
              refreshData();
            }}
            onSwitchRoleWithSync={(targetRole, booking) => handleSmartRoleSwitch(targetRole, booking)}
          />
        ) : tab === 'tours' ? (
          isGuide && (creatingPreset || editingPreset) && currentGuide ? (
            <GuidePresetEditor
              guideId={currentGuide.id}
              guideName={currentGuide.fullName}
              initialTour={editingPreset}
              onCancel={() => {
                setCreatingPreset(false);
                setEditingPreset(null);
              }}
              onSaved={() => {
                setCreatingPreset(false);
                setEditingPreset(null);
                refreshData();
              }}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-2xl">
                  <h1 className="font-head text-4xl font-bold uppercase tracking-wide leading-none text-ink">
                    {isGuide ? `Tour của ${currentGuide?.fullName ?? 'Guide'}` : 'Chọn chuyến đi của bạn'}
                  </h1>
                  <p className="mt-2 text-[0.95rem] text-ink-2">
                    {isGuide
                      ? 'Đăng tour mới hoặc sửa lịch trình và đơn giá từng mục của tour hiện có.'
                      : 'Mỗi tour là một lịch trình chuẩn do Guide địa phương soạn. Giữ nguyên để đặt ngay, hoặc đổi khách sạn, bỏ, thêm hoạt động rồi nhờ Guide báo giá.'}
                  </p>
                </div>
                {isGuide && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPreset(null);
                      setCreatingPreset(true);
                    }}
                    className="btn btn-primary btn-lg"
                  >
                    <Icon name="plus" size={18} />
                    Đăng tour mới
                  </button>
                )}
              </div>

              {!isGuide && regions.length > 0 && (
                <div role="group" aria-label="Lọc theo điểm đến" className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button type="button" aria-pressed={selectedRegionId === 'ALL'} onClick={() => setSelectedRegionId('ALL')} className="chip">
                    <Icon name="globe" size={14} />
                    Tất cả điểm đến <span className="num text-xs opacity-70">{tours.length}</span>
                  </button>
                  {regions.map((r) => {
                    const count = tours.filter((t) => t.regionId === r.id).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        aria-pressed={selectedRegionId === r.id}
                        onClick={() => setSelectedRegionId(r.id)}
                        className="chip"
                      >
                        <Icon name="pin" size={14} />
                        {r.name} <span className="num text-xs opacity-70">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {loadingList && tours.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[26rem] rounded-lg border border-hairline bg-stock animate-pulse" />
                  ))}
                </div>
              ) : filteredTours.length === 0 ? (
                <div className="rounded-lg border border-dashed border-hairline-strong bg-stock px-6 py-12 text-center">
                  <p className="font-semibold text-ink">
                    {isGuide ? 'Bạn chưa đăng tour nào.' : 'Chưa có tour ở điểm đến này.'}
                  </p>
                  <p className="mt-1 text-sm text-ink-2">
                    {isGuide
                      ? 'Bấm “Đăng tour mới” để soạn lịch trình theo ngày và đơn giá từng mục.'
                      : 'Chọn “Tất cả điểm đến” để xem các tour khác.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTours.map((t) => (
                    <article
                      key={t.id}
                      className="group flex flex-col overflow-hidden rounded-lg border border-hairline bg-stock shadow-coupon transition-shadow duration-200 hover:shadow-lift"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-stock-2">
                        <img
                          src={t.imageUrl}
                          alt={`Cảnh ${t.regionName}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <span className="coupon-head absolute left-3 top-3 rounded bg-navy/90 px-2 py-1 text-[0.72rem] text-navy-ink">
                          {t.regionName} · {durationLabel(t.days)}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <h3 className="text-[1.05rem] font-semibold leading-snug text-ink">{t.title}</h3>
                        <p className="text-sm text-ink-2 line-clamp-2">{t.description}</p>

                        <ul className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-xs text-ink-2">
                          {getServices(t).map((s) => (
                            <li key={s.label} className="inline-flex items-center gap-1.5">
                              <Icon name={s.icon} size={14} className="text-ink-3" />
                              {s.label}
                            </li>
                          ))}
                          <li className="inline-flex items-center gap-1.5">
                            <span className="num">{t.steps.length}</span> hoạt động
                          </li>
                        </ul>

                        <div className="mt-auto flex items-center gap-2.5 pt-1">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-stock-2 border border-hairline text-[0.7rem] font-bold text-ink-2">
                            {getInitials(t.guide.fullName)}
                          </span>
                          <p className="text-xs leading-tight text-ink-2">
                            <span className="block font-semibold text-ink">Guide {t.guide.fullName}</span>
                            <span className="num">{t.guide.yearsExperience ?? 5}</span> năm kinh nghiệm · {t.guide.regionName || t.regionName}
                          </p>
                        </div>
                      </div>

                      <div className="perf-x flex items-center justify-between gap-3 px-4 py-3.5 bg-stock-2">
                        <div>
                          <span className="block text-[0.7rem] text-ink-3">Giá lịch trình chuẩn</span>
                          <span className="num text-lg font-bold text-carbon">
                            {formatVnd(t.basePricePerPerson)}
                          </span>
                          <span className="text-xs text-ink-3">/khách</span>
                        </div>
                        {isGuide ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCreatingPreset(false);
                              setEditingPreset(t);
                            }}
                            className="btn btn-ghost btn-sm"
                          >
                            <Icon name="pencil" size={14} />
                            Sửa tour
                          </button>
                        ) : (
                          <button type="button" onClick={() => setBookingTour(t)} className="btn btn-primary btn-sm">
                            Xem lịch trình & đặt
                            <Icon name="arrow-right" size={14} />
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          /* ============ Danh sách đơn ============ */
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="font-head text-4xl font-bold uppercase tracking-wide leading-none">
                  {isGuide ? 'Đơn đặt & báo giá' : 'Chuyến đi của tôi'}
                </h1>
                <p className="mt-2 text-[0.95rem] text-ink-2">
                  {isGuide
                    ? `Yêu cầu gửi tới Guide ${currentGuide?.fullName ?? ''}. Mở đơn đang chờ báo giá để điền giá và gửi báo giá chốt.`
                    : `Các tấm vé của ${currentCustomer?.fullName ?? 'bạn'}. Mở vé để xem tiến trình 4 chặng và so sánh giá trước/sau.`}
                </p>
              </div>
              <button type="button" onClick={refreshData} className="btn btn-ghost btn-sm">
                <Icon name="refresh" size={14} />
                Làm mới
              </button>
            </div>

            {loadingList && bookings.length === 0 ? (
              <div className="space-y-4" aria-busy="true">
                {[0, 1].map((i) => (
                  <div key={i} className="h-32 rounded-lg border border-hairline bg-stock animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-hairline-strong bg-stock px-6 py-12 text-center">
                <Icon name="wallet" size={28} className="mx-auto text-ink-3" />
                <p className="mt-3 font-semibold text-ink">Ví vé đang trống</p>
                <p className="mt-1 text-sm text-ink-2">
                  {isGuide
                    ? 'Khi khách đặt tour của bạn, đơn sẽ xuất hiện ở đây.'
                    : 'Chọn một tour, giữ nguyên hoặc tuỳ chỉnh lịch trình rồi gửi yêu cầu đặt.'}
                </p>
                {!isGuide && (
                  <button type="button" onClick={() => goTab('tours')} className="btn btn-primary mt-4">
                    Khám phá tour
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-4">
                {bookings.map((b) => {
                  const badge = statusBadge(b.status);
                  const priceChanged = b.totalPrice !== b.originalTotalPrice;
                  const needsMe =
                    (isGuide && b.status === 'WAITING_REQUOTE') || (!isGuide && b.status === 'REQUOTED');
                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedBookingId(b.id)}
                        className={`w-full text-left grid grid-cols-1 sm:grid-cols-[9.5rem_1fr_auto] overflow-hidden rounded-lg border bg-stock shadow-coupon transition-shadow duration-200 hover:shadow-lift cursor-pointer ${
                          needsMe ? 'border-carbon' : 'border-hairline'
                        }`}
                      >
                        <div className="flex sm:flex-col items-center sm:items-start justify-between gap-3 bg-stock-2 px-4 py-4">
                          <span className="num text-sm font-bold text-ink">{b.code}</span>
                          <span className={`stamp ${badge.bg}`}>{badge.stamp}</span>
                        </div>

                        <div className="perf-y min-w-0 px-4 py-4 flex gap-4">
                          <img
                            src={b.tour.imageUrl}
                            alt=""
                            className="hidden md:block h-20 w-24 shrink-0 rounded object-cover bg-stock-2"
                          />
                          <div className="min-w-0 space-y-1">
                            <p className="font-semibold text-ink leading-snug">{b.tour.title}</p>
                            <p className="text-xs text-ink-2 flex flex-wrap gap-x-3 gap-y-1">
                              <span className="inline-flex items-center gap-1"><Icon name="user" size={13} />{b.customer.fullName}</span>
                              <span className="inline-flex items-center gap-1"><Icon name="compass" size={13} />{b.guide.fullName}</span>
                              <span className="inline-flex items-center gap-1"><Icon name="calendar" size={13} /><span className="num">{b.startDate}</span></span>
                              <span className="inline-flex items-center gap-1"><Icon name="users" size={13} /><span className="num">{b.days}</span> ngày · <span className="num">{b.guests}</span> khách</span>
                            </p>
                            <p className="text-xs text-ink-3">{badge.text}</p>
                            {b.customerNote && (
                              <p className="text-xs text-ink-2 truncate max-w-xl">
                                <Icon name="message" size={12} className="inline -mt-0.5 mr-1 text-ink-3" />
                                “{b.customerNote}”
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="perf-x sm:border-t-0 sm:perf-y flex sm:flex-col items-center sm:items-end justify-between gap-2 px-4 py-4 sm:min-w-[12rem]">
                          <div className="sm:text-right">
                            {priceChanged && (
                              <span className="num block text-xs text-ink-3 line-through">{formatVnd(b.originalTotalPrice)}</span>
                            )}
                            <span className="num block text-lg font-bold text-carbon">{formatVnd(b.totalPrice)}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${needsMe ? 'text-carbon' : 'text-ink-2'}`}>
                            {needsMe ? (isGuide ? 'Báo giá ngay' : 'Xem báo giá mới') : 'Xem chi tiết'}
                            <Icon name="arrow-right" size={13} />
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-ink-3">
          TripBuilder · Bản demo đồ án. Dữ liệu tour, Guide và khách hàng là dữ liệu mẫu.
        </div>
      </footer>

      {bookingTour && currentCustomer && (
        <CustomerCustomizeModal
          tour={bookingTour}
          customer={currentCustomer}
          onClose={() => setBookingTour(null)}
          onSubmitted={(createdBooking) => {
            setBookingTour(null);
            refreshData();
            setTab('bookings');
            setSelectedBookingId(createdBooking.id);
          }}
        />
      )}
    </div>
  );
}

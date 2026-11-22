import { Avatar } from '@astryxdesign/core/Avatar';
import { Drawer, DrawerHeader } from '@astryxdesign/core/Drawer';
import { LayerProvider } from '@astryxdesign/core/Layer';
import { Layout } from '@astryxdesign/core/Layout';
import { Theme } from '@astryxdesign/core/theme';
import type { Booking } from '@/api/types';
import {
  AlertIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClipboardIcon,
  ClockIcon,
  CompassIcon,
  DashboardIcon,
  EditIcon,
  ImageIcon,
  LogoutIcon,
  MapIcon,
  MapPinIcon,
  MoonIcon,
  PlusIcon,
  RestoreIcon,
  SearchIcon,
  SunIcon,
  TagIcon,
  UsersIcon,
  XIcon,
} from '@/components/icon';
import { SafeImage } from '@/components/ui/SafeImage';
import { noteTypeMeta, serviceModeMeta, statusMeta } from '@/config/constants/meta';
import { tripBuilderAdminTheme } from '@/config/theme';
import { useGuidePortal } from '@/hooks';
import type { BookingFilter } from '@/stores';
import { formatVnd } from '@/utils/format';
import { LoginPage } from '@/views/auth/LoginPage';
import { BookingRequoteWorkspace } from '@/views/bookings/BookingRequoteWorkspace';
import { GuidePresetEditor } from '@/views/tours/GuidePresetEditor';

export default function App() {
  const {
    mode,
    toggleMode,
    user,
    authChecking,
    setSession,
    handleLogout,
    section,
    setSection,
    ledgerFilter,
    setLedgerFilter,
    bookingFilter,
    setBookingFilter,
    searchQuery,
    setSearchQuery,
    regions,
    tours,
    bookings,
    selectedBooking,
    drawerBooking,
    openBookingWorkspace,
    closeBookingWorkspace,
    openBookingDrawer,
    closeBookingDrawer,
    editorOpen,
    editingTour,
    openTourEditor,
    closeTourEditor,
    handleTourSaved,
    loading,
    error,
    loadData,
    actionQueue,
    requotedList,
    confirmedList,
    cancelledList,
    confirmedRevenue,
    ledgerFilteredBookings,
    filteredBookings,
    ledgerTitle,
    updateBookingInList,
  } = useGuidePortal();

  const renderBookingDossierList = (list: Booking[], emptyText: string) => {
    if (list.length === 0) {
      return (
        <div className="flagship-card p-10 text-center space-y-2.5">
          <ClipboardIcon size={24} strokeWidth={1.5} className="text-ink-3 mx-auto" />
          <div className="text-base font-medium text-ink-2">{emptyText}</div>
        </div>
      );
    }

    return (
      <div className="space-y-3.5">
        {list.map((b) => {
          const st = statusMeta(b.status);
          const modeInfo = serviceModeMeta(b.serviceMode);
          const unpricedCount = b.steps.filter(
            (s) => s.noteType === 'CUSTOM' && (s.pricePerPerson || 0) <= 0
          ).length;
          const needsUrgentAttention = st.actionNeeded || unpricedCount > 0;

          return (
            <div
              key={b.id}
              className={`flagship-card transition-colors duration-150 hover:border-rule-strong grid grid-cols-1 sm:grid-cols-[13.5rem_1fr_auto] ${
                needsUrgentAttention ? 'border-l-4 border-l-coral' : ''
              }`}
            >
              {/* Cột trái: Mã hồ sơ & Trạng thái */}
              <div className="bg-surface-2 p-4 sm:p-5 flex sm:flex-col justify-between sm:justify-center gap-2 border-b sm:border-b-0 sm:border-r border-rule">
                <div>
                  <div className="text-[13px] font-medium text-ink-3">Mã hồ sơ</div>
                  <div className="num text-lg font-semibold text-coral mt-0.5">{b.code}</div>
                  <div className="num text-[13px] font-normal text-ink-3 mt-0.5">
                    v{b.tourVersionSnapshot} · Vòng {b.revisionCount}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`tag normal-case tracking-normal font-medium ${st.tagClass}`}>
                    {st.short}
                  </span>
                </div>
              </div>

              {/* Cột giữa: Khách hàng, Hành trình & Ghi chú */}
              <div className="p-4 sm:p-5 min-w-0 flex flex-col justify-center gap-2.5">
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <h3 className="font-display !font-semibold text-lg text-ink truncate">
                    {b.tourTitleSnapshot}
                  </h3>
                  {b.postConfirmAdjustment && (
                    <span className="tag tag-ochre normal-case tracking-normal font-medium">
                      Đổi sau chốt
                    </span>
                  )}
                  {unpricedCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-coral-soft border border-coral/30 text-coral px-2.5 py-0.5 text-[13px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-coral" />
                      {unpricedCount} mục chờ giá
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[14px] font-medium text-ink-2">
                  <span className="inline-flex items-center gap-2 font-semibold text-ink text-[15px]">
                    <Avatar
                      src={b.customer.avatarUrl || undefined}
                      name={b.customer.fullName}
                      size="xsm"
                    />
                    <span>{b.customer.fullName}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 num">
                    <CalendarIcon size={16} strokeWidth={1.5} className="text-ink-3" />
                    {b.startDate}
                  </span>
                  <span className="inline-flex items-center gap-1.5 num">
                    <ClockIcon size={16} strokeWidth={1.5} className="text-ink-3" />
                    {b.days}N
                  </span>
                  <span className="inline-flex items-center gap-1.5 num">
                    <UsersIcon size={16} strokeWidth={1.5} className="text-ink-3" />
                    {b.guests} khách
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <TagIcon size={16} strokeWidth={1.5} className="text-ink-3" />
                    {modeInfo.label}
                  </span>
                </div>

                {b.customerNote && (
                  <p className="text-sm leading-snug font-normal text-ink-2 bg-surface-2 border border-rule rounded-xl px-3.5 py-2 truncate">
                    <span className="font-medium text-ink">Khách nhắn:</span> {b.customerNote}
                  </p>
                )}
              </div>

              {/* Cột phải: Tổng báo giá & Thao tác */}
              <div className="bg-surface-2/60 p-4 sm:p-5 flex sm:flex-col items-center sm:items-end justify-between gap-3 border-t sm:border-t-0 sm:border-l border-rule">
                <div className="sm:text-right">
                  <div className="text-[13px] font-medium text-ink-3">Tổng báo giá</div>
                  <div className="num text-[22px] font-semibold text-coral mt-0.5 leading-tight">
                    {formatVnd(b.totalPrice)}
                  </div>
                  {b.totalPrice !== b.originalTotalPrice && (
                    <div className="num text-[13px] font-normal text-ink-3 line-through">
                      {formatVnd(b.originalTotalPrice)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className="btn btn-ghost text-sm font-medium py-2 px-3.5"
                    onClick={() => openBookingDrawer(b.id)}
                  >
                    Xem nhanh
                  </button>
                  <button
                    type="button"
                    className={`btn text-sm font-medium py-2 px-4 ${
                      st.actionNeeded ? 'btn-primary' : 'btn-ghost'
                    }`}
                    onClick={() => openBookingWorkspace(b.id)}
                  >
                    <span>{st.actionNeeded ? 'Báo giá ngay' : 'Mở chi tiết'}</span>
                    <ArrowRightIcon size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Theme theme={tripBuilderAdminTheme} mode={mode}>
      <LayerProvider>
        <div className="min-h-screen bg-canvas text-ink flex flex-col">
          {authChecking ? (
            <div className="flex-1 flex items-center justify-center p-8 text-base font-medium text-ink-2">
              Đang kiểm tra phiên Tour Guide
            </div>
          ) : !user ? (
            <LoginPage onSuccess={(token, loggedInUser) => setSession(token, loggedInUser)} />
          ) : (
            <>
              {/* Studio Header nền Đen Than #0F172A, cao 68px */}
              <header className="sticky top-0 z-30 h-[68px] bg-flagship-dark text-white border-b border-white/15">
                <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-3 px-5">
                  <div className="flex items-center gap-5 lg:gap-8 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSection('overview')}
                      className="flex items-center gap-3 text-left cursor-pointer shrink-0"
                    >
                      <span className="h-10 w-10 rounded-xl bg-coral text-white flex items-center justify-center shrink-0">
                        <CompassIcon size={18} strokeWidth={1.5} />
                      </span>
                      <div className="leading-tight">
                        <div className="font-display !font-semibold text-lg text-white whitespace-nowrap">
                          TripBuilder Studio
                        </div>
                        <div className="text-[13px] font-normal text-slate-300 truncate max-w-[170px]">
                          {user.regionName || 'Điều phối Tour Guide'}
                        </div>
                      </div>
                    </button>

                    <nav
                      className="flex items-center h-[68px] gap-1 lg:gap-2 overflow-x-auto no-scrollbar"
                      aria-label="Điều hướng chính"
                    >
                      <button
                        type="button"
                        onClick={() => setSection('overview')}
                        className={`h-full px-3 inline-flex items-center gap-2 text-[15px] font-medium border-b-[3px] transition-colors duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
                          section === 'overview' && !selectedBooking
                            ? 'border-coral text-white font-semibold'
                            : 'border-transparent text-slate-300 hover:text-white'
                        }`}
                      >
                        <DashboardIcon size={16} strokeWidth={1.5} />
                        <span>Tổng quan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSection('bookings')}
                        className={`h-full px-3 inline-flex items-center gap-2 text-[15px] font-medium border-b-[3px] transition-colors duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
                          section === 'bookings' || Boolean(selectedBooking)
                            ? 'border-coral text-white font-semibold'
                            : 'border-transparent text-slate-300 hover:text-white'
                        }`}
                      >
                        <ClipboardIcon size={16} strokeWidth={1.5} />
                        <span>Đơn đặt &amp; Báo giá</span>
                        {actionQueue.length > 0 && (
                          <span className="num text-sm font-normal text-slate-400">
                            {actionQueue.length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSection('tours')}
                        className={`h-full px-3 inline-flex items-center gap-2 text-[15px] font-medium border-b-[3px] transition-colors duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
                          section === 'tours' && !selectedBooking
                            ? 'border-coral text-white font-semibold'
                            : 'border-transparent text-slate-300 hover:text-white'
                        }`}
                      >
                        <MapIcon size={16} strokeWidth={1.5} />
                        <span>Tour mẫu</span>
                        <span className="num text-sm font-normal text-slate-400">
                          {tours.length}
                        </span>
                      </button>
                    </nav>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openTourEditor(null)}
                      className="btn btn-primary hidden sm:inline-flex text-sm font-medium py-2 px-3.5 whitespace-nowrap"
                    >
                      <PlusIcon size={16} strokeWidth={1.5} />
                      <span>Tạo tour mẫu</span>
                    </button>

                    <div className="hidden 2xl:flex items-center gap-2 pl-2.5 pr-1 border-l border-white/15">
                      <Avatar
                        src={user.avatarUrl || undefined}
                        name={user.fullName}
                        size="xsm"
                      />
                      <span className="text-sm font-medium text-white max-w-[130px] truncate">
                        {user.fullName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={toggleMode}
                      aria-label={mode === 'light' ? 'Bật nền tối' : 'Bật nền sáng'}
                      title={mode === 'light' ? 'Bật nền tối' : 'Bật nền sáng'}
                      className="h-9 w-9 rounded-xl border border-white/20 bg-white/10 inline-flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/20 cursor-pointer transition-colors duration-150"
                    >
                      {mode === 'light' ? (
                        <MoonIcon size={16} strokeWidth={1.5} />
                      ) : (
                        <SunIcon size={16} strokeWidth={1.5} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      aria-label="Đăng xuất"
                      title="Đăng xuất"
                      className="h-9 w-9 rounded-xl border border-white/20 bg-white/10 inline-flex items-center justify-center text-slate-200 hover:text-rose-300 hover:bg-rose-500/20 cursor-pointer transition-colors duration-150"
                    >
                      <LogoutIcon size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </header>

              {/* Main Content Container max-w-[1440px] */}
              <main className="flex-1 mx-auto w-full max-w-[1440px] px-5 py-7 space-y-7">
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-crimson bg-crimson-soft px-5 py-3.5 flex items-start gap-3 text-base text-crimson"
                  >
                    <AlertIcon size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold">Lỗi tải dữ liệu</div>
                      <div className="text-sm font-normal">{error}</div>
                    </div>
                  </div>
                )}

                {selectedBooking ? (
                  <BookingRequoteWorkspace
                    booking={selectedBooking}
                    onBack={closeBookingWorkspace}
                    onUpdated={updateBookingInList}
                  />
                ) : section === 'overview' ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h1 className="font-display !font-semibold text-3xl sm:text-4xl text-ink">
                          Điều phối báo giá &amp; lịch trình
                        </h1>
                        <p className="text-[15px] font-normal text-ink-2 mt-1">
                          Điều phối viên phụ trách: {user.fullName} · {bookings.length} hồ sơ đang theo dõi
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={loadData}
                          disabled={loading}
                          className="btn btn-ghost text-sm font-medium py-2 px-4"
                        >
                          <RestoreIcon size={16} strokeWidth={1.5} />
                          <span>{loading ? 'Đang tải' : 'Làm mới dữ liệu'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Asymmetric Summary Strip — 12 cột bất đối xứng (5 + 7) */}
                    <section
                      aria-label="Tóm tắt vận hành điều phối"
                      className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch"
                    >
                      {/* Khối tiêu điểm bên trái (5 cột) */}
                      <div
                        className={`lg:col-span-5 bg-surface border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-colors duration-150 ${
                          ledgerFilter === 'ACTION'
                            ? 'border-coral/50 ring-1 ring-coral/25'
                            : 'border-rule'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-ink-2">
                              <span className="w-2 h-2 rounded-full bg-coral shrink-0" />
                              <span>Cần xử lý báo giá ngay</span>
                            </div>
                            <div className="num text-3xl font-semibold text-ink tabular-nums pt-1">
                              {actionQueue.length}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setLedgerFilter('ACTION')}
                            aria-pressed={ledgerFilter === 'ACTION'}
                            className={`btn text-sm font-medium py-2 px-3.5 shrink-0 ${
                              ledgerFilter === 'ACTION' ? 'btn-primary' : 'btn-ghost'
                            }`}
                          >
                            Lọc hồ sơ cần xử lý
                          </button>
                        </div>

                        <div className="text-sm font-normal text-ink-3">
                          Bao gồm đơn lịch chuẩn mới, đơn chờ báo giá lại và yêu cầu đổi sau chốt
                        </div>
                      </div>

                      {/* Dải 3 chỉ số vận hành bên phải (7 cột) */}
                      <div className="lg:col-span-7 bg-surface border border-rule rounded-2xl grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-rule overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setLedgerFilter('ALL')}
                          aria-pressed={ledgerFilter === 'ALL'}
                          className={`p-5 text-left transition-colors duration-150 cursor-pointer flex flex-col justify-between gap-2 ${
                            ledgerFilter === 'ALL' ? 'bg-surface-2' : 'hover:bg-surface-2/60'
                          }`}
                        >
                          <span className="text-sm font-medium text-ink-2">
                            Tổng hồ sơ đặt tour
                          </span>
                          <div>
                            <div className="num tabular-nums text-2xl font-semibold text-ink">
                              {bookings.length}
                            </div>
                            <div className="num text-[13px] font-normal text-ink-3 mt-1">
                              {tours.length} tour mẫu đang mở
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setLedgerFilter('REQUOTED')}
                          aria-pressed={ledgerFilter === 'REQUOTED'}
                          className={`p-5 text-left transition-colors duration-150 cursor-pointer flex flex-col justify-between gap-2 ${
                            ledgerFilter === 'REQUOTED' ? 'bg-surface-2' : 'hover:bg-surface-2/60'
                          }`}
                        >
                          <span className="text-sm font-medium text-ink-2">
                            Đang chờ khách phản hồi
                          </span>
                          <div>
                            <div className="num tabular-nums text-2xl font-semibold text-ink">
                              {requotedList.length}
                            </div>
                            <div className="text-[13px] font-normal text-ink-3 mt-1">
                              Đã gửi bảng báo giá
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setLedgerFilter('CONFIRMED')}
                          aria-pressed={ledgerFilter === 'CONFIRMED'}
                          className={`p-5 text-left transition-colors duration-150 cursor-pointer flex flex-col justify-between gap-2 ${
                            ledgerFilter === 'CONFIRMED' ? 'bg-surface-2' : 'hover:bg-surface-2/60'
                          }`}
                        >
                          <span className="text-sm font-medium text-ink-2">
                            Đã chốt &amp; xác nhận
                          </span>
                          <div>
                            <div className="num tabular-nums text-2xl font-semibold text-ink">
                              {confirmedList.length}
                            </div>
                            <div className="num text-[13px] font-normal text-ink-3 mt-1">
                              {formatVnd(confirmedRevenue)}
                            </div>
                          </div>
                        </button>
                      </div>
                    </section>

                    {/* Hàng đợi được lọc trực tiếp bởi Summary Strip */}
                    <section className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="font-display !font-semibold text-2xl text-ink">
                          {ledgerTitle}
                        </h2>
                        <button
                          type="button"
                          onClick={() => {
                            setBookingFilter('ALL');
                            setSection('bookings');
                          }}
                          className="btn btn-ghost text-sm font-medium py-2 px-4"
                        >
                          <span>Xem tất cả đơn ({bookings.length})</span>
                          <ArrowRightIcon size={16} strokeWidth={1.5} />
                        </button>
                      </div>

                      {renderBookingDossierList(
                        ledgerFilteredBookings,
                        ledgerFilter === 'ACTION'
                          ? 'Hiện không có đơn nào đang chờ xử lý'
                          : ledgerFilter === 'REQUOTED'
                          ? 'Chưa có đơn nào đang chờ khách duyệt báo giá'
                          : ledgerFilter === 'ALL'
                          ? 'Chưa có hồ sơ đặt tour nào'
                          : 'Chưa có chuyến nào được khách chốt'
                      )}
                    </section>
                  </div>
                ) : section === 'bookings' ? (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h1 className="font-display !font-semibold text-3xl text-ink">
                          Điều phối báo giá &amp; lịch trình
                        </h1>
                        <p className="text-[15px] font-normal text-ink-2 mt-1">
                          Điều phối viên phụ trách: {user.fullName} · {filteredBookings.length} hồ sơ đang theo dõi
                        </p>
                      </div>

                      <div className="relative w-full sm:w-96">
                        <SearchIcon
                          size={16}
                          strokeWidth={1.5}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
                        />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Tìm mã đơn, tên khách hoặc tour"
                          aria-label="Tìm mã đơn hoặc tên khách"
                          className="field pl-10 pr-9 py-2.5 text-[15px]"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            aria-label="Xóa từ khóa tìm kiếm"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink cursor-pointer"
                          >
                            <XIcon size={16} strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          { key: 'ALL', label: `Tất cả (${bookings.length})` },
                          { key: 'ACTION', label: `Cần xử lý (${actionQueue.length})` },
                          { key: 'REQUOTED', label: `Đã gửi giá (${requotedList.length})` },
                          { key: 'CONFIRMED', label: `Đã chốt (${confirmedList.length})` },
                          { key: 'CANCELLED', label: `Đã hủy (${cancelledList.length})` },
                        ] as { key: BookingFilter; label: string }[]
                      ).map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          aria-pressed={bookingFilter === item.key}
                          onClick={() => setBookingFilter(item.key)}
                          className="chip font-medium"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {renderBookingDossierList(
                      filteredBookings,
                      'Không tìm thấy đơn đặt tour khớp bộ lọc hiện tại'
                    )}
                  </div>
                ) : (
                  /* Quản lý Tour mẫu */
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h1 className="font-display !font-semibold text-3xl text-ink">
                          Thư viện lộ trình mẫu &amp; kho ảnh vùng miền
                        </h1>
                        <p className="text-[15px] font-normal text-ink-2 mt-1">
                          Mỗi lần chỉnh sửa sẽ nâng phiên bản (v1 → v2) mà không làm sai lệch đơn khách đã đặt.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openTourEditor(null)}
                        className="btn btn-primary text-sm font-medium py-2.5 px-5"
                      >
                        <PlusIcon size={16} strokeWidth={1.5} />
                        <span>Tạo tour mẫu mới</span>
                      </button>
                    </div>

                    {tours.length === 0 ? (
                      <div className="flagship-card p-10 text-center space-y-3">
                        <MapIcon size={24} strokeWidth={1.5} className="text-ink-3 mx-auto" />
                        <div className="text-base font-medium text-ink-2">
                          Bạn chưa có tour mẫu nào
                        </div>
                        <button
                          type="button"
                          onClick={() => openTourEditor(null)}
                          className="btn btn-primary text-sm font-medium"
                        >
                          <PlusIcon size={16} strokeWidth={1.5} />
                          <span>Tạo tour mẫu đầu tiên</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tours.map((tour) => {
                          const photoCount = tour.galleryUrls?.length || (tour.imageUrl ? 1 : 0);
                          return (
                            <article
                              key={tour.id}
                              className="flagship-card transition-colors duration-150 hover:border-rule-strong flex flex-col"
                            >
                              <div className="relative aspect-[16/10] overflow-hidden border-b border-rule bg-surface-2">
                                <SafeImage
                                  src={tour.imageUrl}
                                  alt={tour.title}
                                  className="w-full h-full object-cover"
                                />
                                <span className="num absolute top-3 left-3 rounded-lg bg-[#0F172A]/90 text-white px-3 py-1 text-[13px] font-medium">
                                  v{tour.version} · {tour.days}N
                                </span>
                                <span className="num absolute top-3 right-3 rounded-lg bg-black/75 text-white px-2.5 py-1 text-[13px] font-medium inline-flex items-center gap-1.5">
                                  <ImageIcon size={14} strokeWidth={1.5} />
                                  {photoCount} ảnh
                                </span>
                              </div>

                              <div className="p-5 flex-1 flex flex-col justify-between gap-2.5">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink-3">
                                    <span className="inline-flex items-center gap-1.5 text-indigo">
                                      <MapPinIcon size={16} strokeWidth={1.5} />
                                      {tour.regionName}
                                    </span>
                                    <span className="num">{tour.steps.length} chặng</span>
                                  </div>
                                  <h3 className="font-display !font-semibold text-lg text-ink leading-snug">
                                    {tour.title}
                                  </h3>
                                  <p className="text-sm font-normal text-ink-2 line-clamp-2">
                                    {tour.description}
                                  </p>
                                </div>
                              </div>

                              <div className="editorial-divider" />

                              <div className="bg-surface-2 px-5 py-3.5 flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-[13px] font-medium text-ink-3">
                                    Giá chuẩn / khách
                                  </div>
                                  <div className="num text-xl font-semibold text-coral mt-0.5">
                                    {formatVnd(tour.basePricePerPerson)}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openTourEditor(tour)}
                                  className="btn btn-ghost text-sm font-medium py-2 px-3.5"
                                >
                                  <EditIcon size={16} strokeWidth={1.5} />
                                  <span>Sửa tour</span>
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </main>
            </>
          )}

          {/* Drawer xem nhanh đơn */}
          <Drawer
            isOpen={Boolean(drawerBooking)}
            onOpenChange={(open) => !open && closeBookingDrawer()}
            side="end"
            width={480}
            label="Chi tiết nhanh đơn đặt tour"
          >
            {drawerBooking && (
              <Layout
                height="fill"
                header={
                  <DrawerHeader
                    title={`${drawerBooking.code} · ${drawerBooking.customer.fullName}`}
                    subtitle={`${drawerBooking.tourTitleSnapshot} (v${drawerBooking.tourVersionSnapshot})`}
                    onOpenChange={(open) => !open && closeBookingDrawer()}
                  />
                }
                content={
                  <div className="p-5 space-y-4 overflow-y-auto bg-canvas">
                    <div className="bg-surface-2 p-4 rounded-xl border border-rule flex items-center justify-between gap-2">
                      <span
                        className={`tag normal-case tracking-normal font-medium ${
                          statusMeta(drawerBooking.status).tagClass
                        }`}
                      >
                        {statusMeta(drawerBooking.status).short}
                      </span>
                      <div className="text-right">
                        <div className="text-[13px] font-medium text-ink-3">Tổng báo giá</div>
                        <div className="num text-xl font-semibold text-coral">
                          {formatVnd(drawerBooking.totalPrice)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 text-sm">
                      <div className="p-3 rounded-xl border border-rule bg-surface">
                        <div className="text-[13px] font-medium text-ink-3">Khởi hành</div>
                        <div className="num font-semibold text-ink mt-1">
                          {drawerBooking.startDate}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl border border-rule bg-surface">
                        <div className="text-[13px] font-medium text-ink-3">Thời lượng</div>
                        <div className="num font-semibold text-ink mt-1">
                          {drawerBooking.days} ngày
                        </div>
                      </div>
                      <div className="p-3 rounded-xl border border-rule bg-surface">
                        <div className="text-[13px] font-medium text-ink-3">Số khách</div>
                        <div className="num font-semibold text-ink mt-1">
                          {drawerBooking.guests} khách
                        </div>
                      </div>
                    </div>

                    {drawerBooking.customerNote && (
                      <div className="p-3.5 rounded-xl border border-rule bg-surface text-sm">
                        <div className="text-[13px] font-medium text-ink-3 mb-1">
                          Lời nhắn từ khách
                        </div>
                        <div className="text-ink font-normal">{drawerBooking.customerNote}</div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-[13px] font-medium text-ink-3">
                        Danh sách chặng ({drawerBooking.steps.length})
                      </div>
                      <div className="rounded-xl border border-rule divide-y divide-rule bg-surface overflow-hidden">
                        {drawerBooking.steps.map((s, idx) => {
                          const nt = noteTypeMeta(s.noteType);
                          const isVoid = s.noteType === 'REMOVED';
                          return (
                            <div
                              key={idx}
                              className={`p-3 flex items-center justify-between gap-2.5 text-sm ${
                                isVoid ? 'opacity-65 bg-surface-2' : ''
                              }`}
                            >
                              <div className="min-w-0 space-y-1">
                                <div
                                  className={`font-medium text-ink truncate ${
                                    isVoid ? 'line-through' : ''
                                  }`}
                                >
                                  <span className="num text-ink-3 mr-1.5">N{s.dayNumber}</span>
                                  {s.title}
                                </div>
                                <span
                                  className={`tag normal-case tracking-normal font-medium ${nt.tagClass}`}
                                >
                                  {nt.label}
                                </span>
                              </div>
                              <span className="num font-semibold text-coral shrink-0">
                                {formatVnd(s.pricePerPerson)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                }
                footer={
                  <div className="p-4 border-t border-rule bg-surface-2 flex justify-end gap-2.5">
                    <button
                      type="button"
                      className="btn btn-ghost text-sm font-medium"
                      onClick={closeBookingDrawer}
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary text-sm font-medium"
                      onClick={() => openBookingWorkspace(drawerBooking.id)}
                    >
                      <span>Mở màn hình báo giá</span>
                      <ArrowRightIcon size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                }
              />
            )}
          </Drawer>

          {user && editorOpen && (
            <GuidePresetEditor
              key={editingTour ? editingTour.id : 'new'}
              isOpen={editorOpen}
              guideId={user.id}
              regions={regions}
              editingTour={editingTour}
              onClose={closeTourEditor}
              onSaved={handleTourSaved}
            />
          )}
        </div>
      </LayerProvider>
    </Theme>
  );
}

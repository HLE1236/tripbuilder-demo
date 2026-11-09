import { useEffect, useState } from 'react';
import {
  formatVnd,
  getBookings,
  getTours,
  getUsers,
  statusBadge,
  type Booking,
  type Tour,
  type User,
} from './api';
import StatusBar from './components/StatusBar';
import CustomerCustomizeModal from './components/CustomerCustomizeModal';
import GuidePresetEditor from './components/GuidePresetEditor';
import BookingWorkspace from './components/BookingWorkspace';

export default function App() {
  // Chế độ vai trò ngay trên 1 trang web: CUSTOMER hoặc GUIDE
  const [roleMode, setRoleMode] = useState<'CUSTOMER' | 'GUIDE'>('CUSTOMER');

  const [customers, setCustomers] = useState<User[]>([]);
  const [guides, setGuides] = useState<User[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<User | null>(null);
  const [currentGuide, setCurrentGuide] = useState<User | null>(null);

  // Tab điều hướng
  const [tab, setTab] = useState<'tours' | 'bookings'>('tours');

  // Dữ liệu
  const [tours, setTours] = useState<Tour[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Trạng thái mở Modal / Workspace
  const [bookingTour, setBookingTour] = useState<Tour | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [editingPreset, setEditingPreset] = useState<Tour | null>(null);
  const [creatingPreset, setCreatingPreset] = useState(false);

  // Tải danh sách tài khoản mẫu khi mở trang
  useEffect(() => {
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
    if (roleMode === 'CUSTOMER') {
      getTours().then(setTours);
      if (currentCustomer) {
        getBookings({ customerId: currentCustomer.id }).then(setBookings);
      }
    } else {
      if (currentGuide) {
        getTours(currentGuide.id).then(setTours);
        getBookings({ guideId: currentGuide.id }).then(setBookings);
      }
    }
  };

  useEffect(() => {
    refreshData();
  }, [roleMode, currentCustomer, currentGuide]);

  const waitingRequoteCount = bookings.filter(
    (b) => b.status === 'WAITING_REQUOTE'
  ).length;
  const requotedCount = bookings.filter((b) => b.status === 'REQUOTED').length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* HEADER CHÍNH: Có nút gạt chuyển đổi tức thì giữa [Khách hàng] và [Tour Guide] */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Menu Tab */}
          <div className="flex flex-wrap items-center gap-5">
            <div>
              <span className="text-xl font-extrabold text-blue-700 tracking-tight">
                TripBuilder
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-gray-500">
                Đặt & Tuỳ chỉnh Tour cùng Guide bản địa
              </span>
            </div>

            <nav className="flex gap-1.5">
              <button
                onClick={() => {
                  setTab('tours');
                  setSelectedBookingId(null);
                  setCreatingPreset(false);
                  setEditingPreset(null);
                  refreshData();
                }}
                className={`px-3.5 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors ${
                  tab === 'tours'
                    ? roleMode === 'GUIDE'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {roleMode === 'CUSTOMER'
                  ? `1. Khám phá & Đặt Tour (${tours.length})`
                  : `Quản lý Tour Preset (${tours.length})`}
              </button>

              <button
                onClick={() => {
                  setTab('bookings');
                  setSelectedBookingId(null);
                  setCreatingPreset(false);
                  setEditingPreset(null);
                  refreshData();
                }}
                className={`px-3.5 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                  tab === 'bookings'
                    ? roleMode === 'GUIDE'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>
                  {roleMode === 'CUSTOMER'
                    ? `2. Đơn đặt tour của tôi (${bookings.length})`
                    : `Yêu cầu Đặt tour & Báo giá lại (${bookings.length})`}
                </span>
                {roleMode === 'GUIDE' && waitingRequoteCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-400 text-gray-900">
                    {waitingRequoteCount} cần báo giá
                  </span>
                )}
                {roleMode === 'CUSTOMER' && requotedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-purple-600 text-white">
                    {requotedCount} có giá mới
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* BỘ CHUYỂN VAI TRÒ TỨC THÌ (KHÁCH HÀNG <-> TOUR GUIDE) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl p-1 bg-gray-100 border border-gray-300">
              <button
                onClick={() => {
                  setRoleMode('CUSTOMER');
                  setCreatingPreset(false);
                  setEditingPreset(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                  roleMode === 'CUSTOMER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👤 Vai: Khách hàng
              </button>
              <button
                onClick={() => {
                  setRoleMode('GUIDE');
                  setCreatingPreset(false);
                  setEditingPreset(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                  roleMode === 'GUIDE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🧭 Vai: Tour Guide
              </button>
            </div>

            {/* Dropdown chọn người dùng trong vai hiện tại */}
            {roleMode === 'CUSTOMER' ? (
              <select
                value={currentCustomer?.id || ''}
                onChange={(e) => {
                  const u = customers.find((x) => x.id === Number(e.target.value)) || null;
                  setCurrentCustomer(u);
                  setSelectedBookingId(null);
                }}
                className="border border-blue-300 bg-blue-50/50 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-900"
              >
                {customers.map((u) => (
                  <option key={u.id} value={u.id}>
                    Khách: {u.fullName}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={currentGuide?.id || ''}
                onChange={(e) => {
                  const g = guides.find((x) => x.id === Number(e.target.value)) || null;
                  setCurrentGuide(g);
                  setSelectedBookingId(null);
                }}
                className="border border-emerald-300 bg-emerald-50/50 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-900"
              >
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    Guide: {g.fullName} ({g.regionName})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <StatusBar />

        {/* ===================================================================== */}
        {/* TRƯỜNG HỢP 1: ĐANG MỞ CHI TIẾT 1 ĐƠN ĐẶT TOUR (BOOKING WORKSPACE)      */}
        {/* ===================================================================== */}
        {selectedBookingId ? (
          <BookingWorkspace
            bookingId={selectedBookingId}
            roleMode={roleMode}
            onBack={() => {
              setSelectedBookingId(null);
              refreshData();
            }}
            onChanged={refreshData}
          />
        ) : (
          <>
            {/* ================================================================= */}
            {/* TAB "TOURS"                                                       */}
            {/* ================================================================= */}
            {tab === 'tours' && (
              <div className="space-y-5">
                {/* Nếu Guide đang bật form Tạo mới hoặc Chỉnh sửa Tour Preset */}
                {roleMode === 'GUIDE' && (creatingPreset || editingPreset) && currentGuide ? (
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
                  <>
                    {/* Tiêu đề khu vực Tour */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {roleMode === 'CUSTOMER'
                            ? 'Danh sách Tour Preset của Hướng dẫn viên bản địa'
                            : `Các Tour Preset của Guide ${currentGuide?.fullName}`}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {roleMode === 'CUSTOMER'
                            ? 'Mỗi tour đều có sẵn lịch trình chuẩn & giá gốc. Bạn có thể bấm vào để Tự chỉnh sửa theo ý muốn trước khi Book!'
                            : 'Bạn có thể Đăng Tour Preset mới hoặc bấm "Chỉnh sửa Tour Preset" để cập nhật lịch trình & giá gốc.'}
                        </p>
                      </div>

                      {roleMode === 'GUIDE' && (
                        <button
                          onClick={() => {
                            setEditingPreset(null);
                            setCreatingPreset(true);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs cursor-pointer"
                        >
                          + Đăng Tour Preset mới
                        </button>
                      )}
                    </div>

                    {/* Lưới thẻ Tour Preset */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {tours.map((t) => (
                        <div
                          key={t.id}
                          className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-blue-400 transition-colors"
                        >
                          <div>
                            <div className="relative h-44 bg-gray-200">
                              <img
                                src={t.imageUrl}
                                alt={t.title}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-3 left-3 bg-gray-900/85 text-white text-xs font-bold px-2.5 py-1 rounded">
                                {t.regionName} · {t.days}N{t.days - 1}Đ
                              </span>
                            </div>

                            <div className="p-4 space-y-2.5">
                              <h3 className="font-bold text-gray-900 text-base leading-snug">
                                {t.title}
                              </h3>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {t.description}
                              </p>

                              {/* Tóm tắt nhanh các dòng lịch trình chuẩn ngay trên thẻ */}
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-1">
                                <span className="text-[11px] font-bold text-gray-500 uppercase block">
                                  Lịch trình chuẩn ({t.steps.length} hoạt động):
                                </span>
                                {t.steps.slice(0, 3).map((s, i) => (
                                  <p key={i} className="text-xs text-gray-700 truncate">
                                    • <strong>N{s.dayNumber}:</strong> {s.title}
                                  </p>
                                ))}
                                {t.steps.length > 3 && (
                                  <p className="text-[11px] text-blue-600 font-medium">
                                    + {t.steps.length - 3} hoạt động khác...
                                  </p>
                                )}
                              </div>

                              <p className="text-xs text-gray-500">
                                Guide phụ trách:{' '}
                                <strong className="text-gray-800">{t.guide.fullName}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[11px] text-gray-500 block">
                                Giá gốc trọn gói
                              </span>
                              <span className="text-base font-extrabold text-blue-700">
                                {formatVnd(t.basePricePerPerson)}
                                <span className="text-xs font-normal text-gray-500">/khách</span>
                              </span>
                            </div>

                            {roleMode === 'CUSTOMER' ? (
                              <button
                                onClick={() => setBookingTour(t)}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                              >
                                Tuỳ chỉnh & Book Tour
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setCreatingPreset(false);
                                  setEditingPreset(t);
                                }}
                                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                              >
                                ✎ Chỉnh sửa Tour Preset
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB "BOOKINGS" (ĐƠN ĐẶT TOUR & BÁO GIÁ LẠI)                       */}
            {/* ================================================================= */}
            {tab === 'bookings' && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {roleMode === 'CUSTOMER'
                        ? `Đơn đặt tour của khách hàng ${currentCustomer?.fullName}`
                        : `Đơn đặt tour gửi tới Tour Guide ${currentGuide?.fullName}`}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {roleMode === 'CUSTOMER'
                        ? 'Nhấn vào đơn để xem tiến trình 4 bước, chỉnh sửa thêm theo ý muốn hoặc bấm Đồng ý chốt giá.'
                        : 'Nhấn vào các đơn đang ở Bước 2 (Khách đã sửa · Chờ báo giá lại) để sửa giá từng dòng và gửi Báo giá lại cho khách.'}
                    </p>
                  </div>
                  <button
                    onClick={refreshData}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    ↻ Làm mới
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 text-sm">
                    Chưa có đơn đặt tour nào.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b) => {
                      const badge = statusBadge(b.status);
                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBookingId(b.id)}
                          className="bg-white border border-gray-200 hover:border-blue-500 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer transition-all shadow-2xs"
                        >
                          <div className="flex items-start gap-3.5 max-w-2xl">
                            <img
                              src={b.tour.imageUrl}
                              alt={b.tour.title}
                              className="w-20 h-20 rounded-lg object-cover bg-gray-100 shrink-0"
                            />
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-gray-500">
                                  {b.code}
                                </span>
                                <span
                                  className={`text-xs font-bold px-2.5 py-0.5 rounded border ${badge.bg}`}
                                >
                                  {badge.text}
                                </span>
                              </div>
                              <h3 className="font-bold text-gray-900 text-base">
                                {b.tour.title}
                              </h3>
                              <p className="text-xs text-gray-600">
                                Khách: <strong>{b.customer.fullName}</strong> · Guide:{' '}
                                <strong>{b.guide.fullName}</strong> · Khởi hành:{' '}
                                <strong>{b.startDate}</strong> ({b.days} ngày · {b.guests} khách)
                              </p>
                              {b.customerNote && (
                                <p className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded truncate max-w-xl">
                                  Yêu cầu khách: "{b.customerNote}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] text-gray-400 line-through block">
                              Giá gốc: {formatVnd(b.originalTotalPrice)}
                            </span>
                            <span className="text-lg font-extrabold text-blue-700 block">
                              {formatVnd(b.totalPrice)}
                            </span>
                            <span
                              className={`inline-block mt-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                                roleMode === 'GUIDE' && b.status === 'WAITING_REQUOTE'
                                  ? 'bg-emerald-600 text-white'
                                  : roleMode === 'CUSTOMER' && b.status === 'REQUOTED'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {roleMode === 'GUIDE' && b.status === 'WAITING_REQUOTE'
                                ? '→ Vào Báo giá lại ngay'
                                : roleMode === 'CUSTOMER' && b.status === 'REQUOTED'
                                ? '→ Xem giá mới & Chốt'
                                : 'Mở chi tiết đơn →'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal Khách hàng Tuỳ chỉnh & Book Tour */}
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

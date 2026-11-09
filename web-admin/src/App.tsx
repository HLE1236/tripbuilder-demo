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

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getServiceBadges(tour: Tour): string[] {
  const badges: string[] = [];
  const cats = tour.steps.map((s) => s.category.toLowerCase());
  if (cats.some((c) => c.includes('di chuyển') || c.includes('xe'))) {
    badges.push('🚌 Xe đưa đón');
  }
  if (cats.some((c) => c.includes('khách sạn') || c.includes('lưu trú'))) {
    badges.push('🏨 Khách sạn');
  }
  if (cats.some((c) => c.includes('trải nghiệm') || c.includes('tham quan'))) {
    badges.push('🎟️ Trải nghiệm');
  }
  if (cats.some((c) => c.includes('ăn') || c.includes('ẩm thực'))) {
    badges.push('🍲 Ẩm thực');
  }
  return badges.length > 0
    ? badges
    : ['🚌 Xe đưa đón', '🏨 Khách sạn', '🎟️ Trải nghiệm'];
}

export default function App() {
  // Chế độ vai trò: CUSTOMER hoặc GUIDE
  const [roleMode, setRoleMode] = useState<'CUSTOMER' | 'GUIDE'>('CUSTOMER');
  const [serverOnline, setServerOnline] = useState<boolean>(true);

  const [customers, setCustomers] = useState<User[]>([]);
  const [guides, setGuides] = useState<User[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<User | null>(null);
  const [currentGuide, setCurrentGuide] = useState<User | null>(null);

  // Tab điều hướng chính của trang web
  const [tab, setTab] = useState<'tours' | 'bookings'>('tours');
  // Bộ lọc Điểm đến 1 chạm trên trang Khám phá Tour
  const [selectedRegionId, setSelectedRegionId] = useState<number | 'ALL'>('ALL');

  // Dữ liệu
  const [tours, setTours] = useState<Tour[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Trạng thái mở Modal / Workspace
  const [bookingTour, setBookingTour] = useState<Tour | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [activeWorkspaceBooking, setActiveWorkspaceBooking] = useState<Booking | null>(null);
  const [editingPreset, setEditingPreset] = useState<Tour | null>(null);
  const [creatingPreset, setCreatingPreset] = useState(false);

  // Tải danh sách tài khoản mẫu, vùng miền & kiểm tra kết nối khi mở trang
  useEffect(() => {
    getHello()
      .then(() => setServerOnline(true))
      .catch(() => setServerOnline(false));
    getRegions().then(setRegions);
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

  // Khi mở chi tiết 1 đơn, lưu thông tin đơn đó để hỗ trợ Tự động đồng bộ tài khoản khi đổi vai
  useEffect(() => {
    if (selectedBookingId) {
      getBooking(selectedBookingId)
        .then(setActiveWorkspaceBooking)
        .catch(() => setActiveWorkspaceBooking(null));
    } else {
      setActiveWorkspaceBooking(null);
    }
  }, [selectedBookingId]);

  // Hàm chuyển vai thông minh: Nếu đang mở 1 đơn cụ thể -> tự động đồng bộ đúng Guide / Khách của đơn đó!
  const handleSmartRoleSwitch = (
    targetRole: 'CUSTOMER' | 'GUIDE',
    explicitBooking?: Booking | null
  ) => {
    const b = explicitBooking || activeWorkspaceBooking;
    setCreatingPreset(false);
    setEditingPreset(null);

    if (targetRole === 'GUIDE') {
      if (b && b.guide) {
        const matchedGuide = guides.find((g) => g.id === b.guide.id) || b.guide;
        setCurrentGuide(matchedGuide);
      }
      setRoleMode('GUIDE');
    } else {
      if (b && b.customer) {
        const matchedCustomer =
          customers.find((c) => c.id === b.customer.id) || b.customer;
        setCurrentCustomer(matchedCustomer);
      }
      setRoleMode('CUSTOMER');
    }
  };

  const waitingRequoteCount = bookings.filter(
    (b) => b.status === 'WAITING_REQUOTE'
  ).length;
  const requotedCount = bookings.filter((b) => b.status === 'REQUOTED').length;

  const filteredTours =
    selectedRegionId === 'ALL'
      ? tours
      : tours.filter((t) => t.regionId === selectedRegionId);

  const activeUser = roleMode === 'CUSTOMER' ? currentCustomer : currentGuide;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      {/* ===================================================================== */}
      {/* 1. THANH CÔNG CỤ DEMO TÁCH BIỆT Ở MÉP TRÊN CÙNG (DEMO SWITCHER BAR)     */}
      {/* ===================================================================== */}
      <div className="bg-slate-900 text-slate-200 text-xs border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-bold text-amber-400 uppercase tracking-wider text-[11px]">
              🎬 Thanh điều khiển Kịch bản Demo
            </span>
            <span className="hidden md:inline text-slate-400">
              {selectedBookingId && activeWorkspaceBooking
                ? `Đang mở đơn ${activeWorkspaceBooking.code} — Bấm đổi vai sẽ tự động chọn đúng Khách / Guide của đơn này`
                : 'Chuyển nhanh góc nhìn giữa Khách hàng và Tour Guide ngay trên 1 màn hình'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Nút gạt chuyển vai 1 chạm */}
            <div className="inline-flex rounded-lg p-0.5 bg-slate-800 border border-slate-700">
              <button
                onClick={() => handleSmartRoleSwitch('CUSTOMER')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                  roleMode === 'CUSTOMER'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                👤 Góc nhìn: Khách hàng
              </button>
              <button
                onClick={() => handleSmartRoleSwitch('GUIDE')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                  roleMode === 'GUIDE'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🧭 Góc nhìn: Tour Guide
              </button>
            </div>

            {/* Đổi nhanh tài khoản mẫu */}
            {roleMode === 'CUSTOMER' ? (
              <select
                value={currentCustomer?.id || ''}
                onChange={(e) => {
                  const u =
                    customers.find((x) => x.id === Number(e.target.value)) || null;
                  setCurrentCustomer(u);
                  setSelectedBookingId(null);
                }}
                className="bg-slate-800 border border-slate-700 text-slate-100 rounded-md px-2 py-1 text-xs font-semibold"
              >
                {customers.map((u) => (
                  <option key={u.id} value={u.id}>
                    Tài khoản Khách: {u.fullName}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={currentGuide?.id || ''}
                onChange={(e) => {
                  const g =
                    guides.find((x) => x.id === Number(e.target.value)) || null;
                  setCurrentGuide(g);
                  setSelectedBookingId(null);
                  setSelectedRegionId('ALL');
                }}
                className="bg-slate-800 border border-slate-700 text-slate-100 rounded-md px-2 py-1 text-xs font-semibold"
              >
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    Tài khoản Guide: {g.fullName} ({g.regionName})
                  </option>
                ))}
              </select>
            )}

            {/* Chấm trạng thái kết nối máy chủ nhỏ gọn */}
            <span
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 pl-1 border-l border-slate-700"
              title="Trạng thái kết nối Backend API"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  serverOnline ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
              />
              {serverOnline ? 'Hệ thống Online' : 'Mất kết nối'}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. HEADER WEBSITE DU LỊCH CHÍNH THỨC                                   */}
      {/* ===================================================================== */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo thương hiệu */}
          <div
            onClick={() => {
              setTab('tours');
              setSelectedBookingId(null);
              setCreatingPreset(false);
              setEditingPreset(null);
            }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-xs ${
                roleMode === 'GUIDE' ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
            >
              ✈
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight block leading-none">
                Trip<span className="text-blue-600">Builder</span>
              </span>
              <span className="text-[11px] text-gray-500">
                Thiết kế chuyến đi riêng cùng Guide bản địa
              </span>
            </div>
          </div>

          {/* 2 Tab điều hướng chính */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => {
                setTab('tours');
                setSelectedBookingId(null);
                setCreatingPreset(false);
                setEditingPreset(null);
                refreshData();
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all ${
                tab === 'tours' && !selectedBookingId
                  ? roleMode === 'GUIDE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {roleMode === 'CUSTOMER'
                ? `🧭 Khám phá Tour (${tours.length})`
                : `📋 Tour của tôi (${tours.length})`}
            </button>

            <button
              onClick={() => {
                setTab('bookings');
                setSelectedBookingId(null);
                setCreatingPreset(false);
                setEditingPreset(null);
                refreshData();
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all flex items-center gap-2 ${
                tab === 'bookings' || selectedBookingId
                  ? roleMode === 'GUIDE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>
                {roleMode === 'CUSTOMER'
                  ? `🎒 Chuyến đi của tôi (${bookings.length})`
                  : `📨 Đơn đặt & Báo giá (${bookings.length})`}
              </span>

              {roleMode === 'GUIDE' && waitingRequoteCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-400 text-gray-900">
                  {waitingRequoteCount} chờ báo giá
                </span>
              )}
              {roleMode === 'CUSTOMER' && requotedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-purple-600 text-white">
                  {requotedCount} có báo giá mới
                </span>
              )}
            </button>
          </nav>

          {/* Thông tin người dùng đang đăng nhập */}
          {activeUser && (
            <div className="hidden sm:flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white ${
                  roleMode === 'GUIDE' ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
              >
                {getInitials(activeUser.fullName)}
              </div>
              <div className="text-xs leading-tight">
                <p className="font-bold text-gray-900">{activeUser.fullName}</p>
                <p className="text-[11px] text-gray-500">
                  {roleMode === 'GUIDE'
                    ? `Guide bản địa · ${activeUser.regionName || 'Việt Nam'}`
                    : 'Khách hàng thành viên'}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 3. NỘI DUNG CHÍNH                                                      */}
      {/* ===================================================================== */}
      <main className="max-w-6xl mx-auto w-full px-4 py-6 space-y-6 flex-1">
        {/* TRƯỜNG HỢP 1: ĐANG MỞ CHI TIẾT 1 ĐƠN ĐẶT TOUR (BOOKING WORKSPACE) */}
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
            onSwitchRoleWithSync={(targetRole, booking) =>
              handleSmartRoleSwitch(targetRole, booking)
            }
          />
        ) : (
          <>
            {/* ================================================================= */}
            {/* TAB 1: KHÁM PHÁ TOUR (KHÁCH) HOẶC QUẢN LÝ TOUR (GUIDE)            */}
            {/* ================================================================= */}
            {tab === 'tours' && (
              <div className="space-y-5">
                {/* Nếu Guide đang mở trình Tạo mới hoặc Chỉnh sửa Tour Preset */}
                {roleMode === 'GUIDE' &&
                (creatingPreset || editingPreset) &&
                currentGuide ? (
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
                    {/* Banner giới thiệu ngắn gọn & Nút đăng tour cho Guide */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span
                          className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-md ${
                            roleMode === 'CUSTOMER'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {roleMode === 'CUSTOMER'
                            ? '✨ Đặt tour linh hoạt theo ý muốn'
                            : '🧭 Quản lý các gói Tour bản địa'}
                        </span>
                        <h1 className="text-xl font-extrabold text-gray-900">
                          {roleMode === 'CUSTOMER'
                            ? 'Chọn lịch trình chuẩn từ Guide bản địa — Tự do đổi khách sạn, thêm bớt hoạt động'
                            : `Danh sách Tour do Guide ${currentGuide?.fullName} thiết kế & dẫn đoàn`}
                        </h1>
                        <p className="text-xs text-gray-500">
                          {roleMode === 'CUSTOMER'
                            ? 'Ưng ý lịch trình chuẩn? Đặt ngay trong 1 chạm. Muốn nâng cấp khách sạn hay thêm tiệc riêng? Guide sẽ kiểm tra và gửi báo giá chốt cho bạn.'
                            : 'Bạn có thể đăng gói Tour mới hoặc chỉnh sửa lịch trình, đơn giá các Tour hiện có.'}
                        </p>
                      </div>

                      {roleMode === 'GUIDE' && (
                        <button
                          onClick={() => {
                            setEditingPreset(null);
                            setCreatingPreset(true);
                          }}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-xs cursor-pointer"
                        >
                          + Đăng Tour mới
                        </button>
                      )}
                    </div>

                    {/* THANH LỌC ĐIỂM ĐẾN 1 CHẠM (DESTINATION PILLS - ĐỀ XUẤT 2) */}
                    {roleMode === 'CUSTOMER' && regions.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <button
                          onClick={() => setSelectedRegionId('ALL')}
                          className={`px-4 py-2 rounded-full text-xs font-extrabold shrink-0 border transition-all cursor-pointer ${
                            selectedRegionId === 'ALL'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          🌍 Tất cả điểm đến ({tours.length})
                        </button>

                        {regions.map((r) => {
                          const count = tours.filter((t) => t.regionId === r.id).length;
                          if (count === 0) return null;
                          const active = selectedRegionId === r.id;
                          return (
                            <button
                              key={r.id}
                              onClick={() => setSelectedRegionId(r.id)}
                              className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 border transition-all cursor-pointer ${
                                active
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-white hover:bg-blue-50 text-gray-700 border-gray-200'
                              }`}
                            >
                              📍 {r.name} ({count})
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* LƯỚI THẺ TOUR GIÀU CẢM XÚC & SẠCH SẼ (ĐỀ XUẤT 2) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredTours.map((t) => {
                        const serviceBadges = getServiceBadges(t);
                        return (
                          <div
                            key={t.id}
                            className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all"
                          >
                            <div>
                              {/* 1. Ảnh địa danh + Nhãn thời lượng rõ ràng */}
                              <div className="relative h-48 bg-gray-200">
                                <img
                                  src={t.imageUrl}
                                  alt={t.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                  <span className="bg-gray-900/85 backdrop-blur-xs text-white text-xs font-extrabold px-2.5 py-1 rounded-lg">
                                    📍 {t.regionName}
                                  </span>
                                  <span className="bg-blue-600/95 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg">
                                    ⏱ {t.days} Ngày {t.days > 1 ? `${t.days - 1} Đêm` : ''}
                                  </span>
                                </div>
                              </div>

                              <div className="p-4 space-y-3.5">
                                <div>
                                  <h3 className="font-extrabold text-gray-900 text-base leading-snug">
                                    {t.title}
                                  </h3>
                                  <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                    {t.description}
                                  </p>
                                </div>

                                {/* 2. Huy hiệu dịch vụ đã bao gồm trong lịch trình chuẩn */}
                                <div className="flex flex-wrap gap-1.5">
                                  {serviceBadges.map((b) => (
                                    <span
                                      key={b}
                                      className="text-[11px] font-semibold bg-blue-50/80 text-blue-800 border border-blue-100 px-2.5 py-0.5 rounded-md"
                                    >
                                      {b}
                                    </span>
                                  ))}
                                  <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                    {t.steps.length} hoạt động chuẩn
                                  </span>
                                </div>

                                {/* 3. Khung thông tin Hướng dẫn viên bản địa nổi bật */}
                                <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-2.5 flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                                    {getInitials(t.guide.fullName)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <p className="text-xs font-extrabold text-gray-900 truncate">
                                        🧭 Guide {t.guide.fullName}
                                      </p>
                                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                                        {t.guide.yearsExperience || 5} năm KN
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 truncate">
                                      Thổ địa {t.guide.regionName || t.regionName} · Hỗ trợ tuỳ chỉnh 1-1
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 4. Giá trọn gói & Nút "Xem lịch trình & Đặt tour" */}
                            <div className="px-4 py-3.5 bg-gray-50/70 border-t border-gray-200 flex items-center justify-between gap-2">
                              <div>
                                <span className="text-[11px] text-gray-500 block">
                                  Giá lịch trình chuẩn
                                </span>
                                <span className="text-lg font-extrabold text-blue-700">
                                  {formatVnd(t.basePricePerPerson)}
                                  <span className="text-xs font-normal text-gray-500">
                                    /khách
                                  </span>
                                </span>
                              </div>

                              {roleMode === 'CUSTOMER' ? (
                                <button
                                  onClick={() => setBookingTour(t)}
                                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-xs cursor-pointer transition-colors"
                                >
                                  Xem lịch trình & Đặt tour →
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCreatingPreset(false);
                                    setEditingPreset(t);
                                  }}
                                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
                                >
                                  ✎ Chỉnh sửa Tour
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 2: CHUYẾN ĐI CỦA TÔI (KHÁCH) HOẶC ĐƠN ĐẶT & BÁO GIÁ (GUIDE)   */}
            {/* ================================================================= */}
            {tab === 'bookings' && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900">
                      {roleMode === 'CUSTOMER'
                        ? `🎒 Chuyến đi của ${currentCustomer?.fullName}`
                        : `📨 Danh sách yêu cầu Đặt tour gửi tới Guide ${currentGuide?.fullName}`}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {roleMode === 'CUSTOMER'
                        ? 'Bấm vào chuyến đi để xem tiến trình 4 bước, so sánh báo giá Trước / Sau hoặc bấm Đồng ý & Hoàn tất.'
                        : 'Bấm vào đơn đang chờ báo giá để điền giá mục khách yêu cầu thêm và gửi Báo giá chốt.'}
                    </p>
                  </div>
                  <button
                    onClick={refreshData}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    ↻ Làm mới danh sách
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center space-y-3">
                    <p className="text-gray-500 text-sm">
                      Hiện chưa có đơn đặt tour nào cho tài khoản này.
                    </p>
                    {roleMode === 'CUSTOMER' && (
                      <button
                        onClick={() => setTab('tours')}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                      >
                        🧭 Khám phá & Đặt Tour ngay
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b) => {
                      const badge = statusBadge(b.status);
                      const isPriceChanged = b.totalPrice !== b.originalTotalPrice;
                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBookingId(b.id)}
                          className="bg-white border border-gray-200 hover:border-blue-500 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer transition-all shadow-2xs"
                        >
                          <div className="flex items-start gap-3.5 max-w-2xl">
                            <img
                              src={b.tour.imageUrl}
                              alt={b.tour.title}
                              className="w-20 h-20 rounded-xl object-cover bg-gray-100 shrink-0"
                            />
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-extrabold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  {b.code}
                                </span>
                                <span
                                  className={`text-xs font-bold px-2.5 py-0.5 rounded border ${badge.bg}`}
                                >
                                  {badge.text}
                                </span>
                              </div>
                              <h3 className="font-extrabold text-gray-900 text-base">
                                {b.tour.title}
                              </h3>
                              <p className="text-xs text-gray-600">
                                👤 Khách: <strong>{b.customer.fullName}</strong> · 🧭 Guide:{' '}
                                <strong>{b.guide.fullName}</strong> · 📅 Khởi hành:{' '}
                                <strong>{b.startDate}</strong> ({b.days} ngày · {b.guests}{' '}
                                khách)
                              </p>
                              {b.customerNote && (
                                <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-md truncate max-w-xl">
                                  💬 Lời nhắn khách: "{b.customerNote}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            {isPriceChanged && (
                              <span className="text-[11px] text-gray-400 line-through block">
                                Giá chuẩn: {formatVnd(b.originalTotalPrice)}
                              </span>
                            )}
                            <span className="text-lg font-extrabold text-blue-700 block">
                              {formatVnd(b.totalPrice)}
                            </span>
                            <span
                              className={`inline-block mt-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold ${
                                roleMode === 'GUIDE' && b.status === 'WAITING_REQUOTE'
                                  ? 'bg-emerald-600 text-white'
                                  : roleMode === 'CUSTOMER' && b.status === 'REQUOTED'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {roleMode === 'GUIDE' && b.status === 'WAITING_REQUOTE'
                                ? '→ Kiểm tra & Báo giá chốt ngay'
                                : roleMode === 'CUSTOMER' && b.status === 'REQUOTED'
                                ? '→ Xem báo giá mới & Đồng ý chốt'
                                : 'Xem chi tiết chuyến đi →'}
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

      {/* Modal Khách hàng Xem lịch trình, Tuỳ chỉnh & Đặt Tour */}
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

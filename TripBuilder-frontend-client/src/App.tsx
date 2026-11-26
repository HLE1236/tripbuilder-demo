import { useEffect, type ReactNode } from 'react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { LayerProvider } from '@astryxdesign/core/Layer';
import { Theme } from '@astryxdesign/core/theme';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  DEFAULT_TRAVEL_IMAGE,
  formatVnd,
  resolveMediaUrl,
  serviceModeMeta,
  statusMeta,
  type Tour,
} from './api';
import { AuthModal } from './components/auth';
import {
  AlertIcon,
  ArrowRightIcon,
  ArrowUpDownIcon,
  CalendarIcon,
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CompassIcon,
  ExternalIcon,
  HeartIcon,
  LogoutIcon,
  MapPinIcon,
  MoonIcon,
  PlusIcon,
  RefreshIcon,
  RestoreIcon,
  SearchIcon,
  StarIcon,
  SunIcon,
  UsersIcon,
  XIcon,
} from './components/icon';
import { NotificationBell } from './components/ui/NotificationBell';
import { SafeImage } from './components/ui/SafeImage';
import { TravelPhotoLightbox } from './components/ui/TravelPhotoLightbox';
import { tripBuilderClientTheme } from './config/theme';
import { useClientPortal } from './hooks/useClientPortal';
import type { DurationFilter, PriceSort } from './stores/useClientUiStore';
import { categoryDotClass, tourToPhotoItems } from './utils/tour';
import { LoginPage } from './views/auth/LoginPage';
import { BookingWorkspace } from './views/bookings/BookingWorkspace';
import { CustomerCustomizeModal } from './views/bookings/CustomerCustomizeModal';
import { ProfileView } from './views/profile/ProfileView';
import { TourDetailView } from './views/tours/TourDetailView';

function getSafeRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/';
  }
  return raw;
}

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  authLoading: boolean;
  children: ReactNode;
}

function ProtectedRoute({ isAuthenticated, authLoading, children }: ProtectedRouteProps) {
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-16 text-center text-base font-medium text-ink-2">
        Đang khôi phục phiên đăng nhập của bạn...
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const {
    theme,
    toggleTheme,
    user,
    setUser,
    authLoading,
    handleAuthSuccess,
    handleLogout,
    openAuthModal,

    regionFilter,
    setRegionFilter,
    durationFilter,
    setDurationFilter,
    priceSort,
    setPriceSort,
    searchQuery,
    setSearchQuery,
    resetFilters,

    regions,
    tours,
    bookings,
    favoriteIds,
    filteredTours,
    savedTours,
    selectedRegion,
    selectedRegionPhotos,
    setSelectedTourId,
    customizeTour,
    setCustomizeTourId,
    requestCustomize,
    requireAuthForBookingSubmit,
    setSelectedBookingId,

    cardPhotoIdx,
    stepCardPhoto,
    lightbox,
    openLightbox,
    openTourLightbox,
    closeLightbox,

    loadingData,
    error,
    flashError,
    refreshingBookingId,
    pendingActionCount,
    hasActiveFilters,
    featuredHeroTour,
    heroPreviewPhotos,
    heroSteps,

    toggleFavorite,
    handleRefreshBooking,
    handleBookingUpdated,
    handleBookingCreated,
    scrollToCatalog,
  } = useClientPortal((created) => navigate(`/bookings/${created.id}`));

  const isAuthenticated = Boolean(user);
  const isAuthRoute =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password';

  const isExploreRoute =
    location.pathname === '/' || location.pathname.startsWith('/tours/');
  const isSavedRoute = location.pathname === '/saved';
  const isBookingsRoute = location.pathname.startsWith('/bookings');

  const renderTourCard = (tour: Tour) => {
    const isFav = favoriteIds.includes(tour.id);
    const photos = tourToPhotoItems(tour);
    const activeIdx = Math.min(cardPhotoIdx[tour.id] ?? 0, Math.max(photos.length - 1, 0));
    const currentPhotoUrl = photos[activeIdx]?.url || tour.imageUrl;

    return (
      <article key={tour.id} className="flagship-card flex flex-col h-full">
        {/* Khung ảnh 16:10 */}
        <div
          onClick={() => navigate(`/tours/${tour.id}`)}
          className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2 cursor-pointer group"
        >
          <SafeImage
            src={currentPhotoUrl}
            alt={tour.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15 pointer-events-none" />

          <span className="absolute top-3 left-3 rounded-lg bg-flagship-dark/85 backdrop-blur-sm px-3 py-1 text-sm font-medium text-white num">
            {tour.days} ngày
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void toggleFavorite(tour.id);
            }}
            aria-label={isFav ? `Bỏ lưu ${tour.title}` : `Lưu ${tour.title}`}
            aria-pressed={isFav}
            className={`absolute top-3 right-3 h-10 w-10 rounded-full flex items-center justify-center backdrop-blur-sm border transition-colors duration-150 cursor-pointer ${
              isFav
                ? 'bg-coral border-coral text-white'
                : 'bg-black/45 border-white/25 text-white hover:bg-black/65'
            }`}
          >
            <HeartIcon size={18} filled={isFav} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stepCardPhoto(tour.id, photos.length, -1);
                }}
                aria-label="Ảnh trước"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
              >
                <ChevronLeftIcon size={18} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stepCardPhoto(tour.id, photos.length, 1);
                }}
                aria-label="Ảnh tiếp theo"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
              >
                <ChevronRightIcon size={18} />
              </button>

              <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5">
                {photos.slice(0, 5).map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-opacity duration-150 ${
                      idx === activeIdx % 5 ? 'w-4 bg-white' : 'w-1.5 bg-white/55'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openTourLightbox(tour, activeIdx);
            }}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-black/65 backdrop-blur-sm px-3 py-1 text-sm font-medium text-white hover:bg-black/85 transition-colors duration-150 cursor-pointer num"
            title="Xem bộ ảnh hành trình"
          >
            <CameraIcon size={14} />
            <span>{photos.length} ảnh</span>
          </button>
        </div>

        {/* Nội dung thẻ */}
        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-ink-2">
              <div className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-coral" />
                <span>
                  {tour.regionName} · {tour.province}
                </span>
              </div>
              {(tour.reviewCount ?? 0) > 0 && tour.averageRating != null && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-soft text-amber px-2 py-0.5 text-xs font-semibold num">
                  <StarIcon size={12} filled />
                  <span>{tour.averageRating.toFixed(1)}</span>
                  <span className="opacity-80">({tour.reviewCount})</span>
                </span>
              )}
            </div>

            <h3
              onClick={() => navigate(`/tours/${tour.id}`)}
              className="text-[22px] font-semibold text-ink leading-snug cursor-pointer hover:text-coral transition-colors duration-150"
            >
              {tour.title}
            </h3>

            <p className="text-[15px] text-ink-2 line-clamp-2 leading-relaxed">
              {tour.description}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-surface-2 px-3.5 py-2.5 border border-rule">
              <div className="rounded-full border border-rule shrink-0">
                <Avatar
                  src={tour.guide.avatarUrl || undefined}
                  name={tour.guide.fullName}
                  size="md"
                />
              </div>
              <div className="min-w-0">
                <div className="text-base font-medium text-ink truncate">
                  {tour.guide.fullName}
                </div>
                <div className="text-sm text-ink-3">
                  {tour.guide.yearsExperience
                    ? `Thổ địa ${tour.guide.yearsExperience} năm kinh nghiệm`
                    : `Hướng dẫn viên bản địa · ${tour.regionName}`}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-rule flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-ink-3">Giá chuẩn / khách</div>
                <div className="num text-2xl font-semibold text-ink leading-tight">
                  {formatVnd(tour.basePricePerPerson)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => requestCustomize(tour.id)}
                className="btn btn-primary !py-2.5 !px-4 text-sm font-semibold shrink-0"
              >
                <span>Tuỳ chỉnh &amp; Đặt</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  function TourDetailRoute() {
    const { id } = useParams<{ id: string }>();
    const tourId = Number(id);
    const tour = Number.isFinite(tourId) ? tours.find((t) => t.id === tourId) ?? null : null;

    useEffect(() => {
      setSelectedTourId(Number.isFinite(tourId) && tourId > 0 ? tourId : null);
      return () => setSelectedTourId(null);
    }, [tourId]);

    if (loadingData && tours.length === 0) {
      return (
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-12 text-center text-base font-medium text-ink-2">
          Đang tải chi tiết hành trình...
        </div>
      );
    }

    if (!tour) {
      return (
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-12">
          <div className="flagship-card p-10 text-center space-y-4">
            <h2 className="text-xl font-semibold text-ink">Không tìm thấy hành trình</h2>
            <p className="text-base text-ink-2">
              Hành trình bạn tìm kiếm không tồn tại hoặc đã được cập nhật.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-primary font-semibold"
            >
              Quay lại khám phá
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6">
        <TourDetailView
          tour={tour}
          isFavorite={favoriteIds.includes(tour.id)}
          onToggleFavorite={(tId) => void toggleFavorite(tId)}
          onBack={() => navigate('/')}
          onCustomize={(target) => requestCustomize(target.id)}
        />
      </div>
    );
  }

  function BookingDetailRoute() {
    const { id } = useParams<{ id: string }>();
    const bookingId = Number(id);
    const booking = Number.isFinite(bookingId)
      ? bookings.find((b) => b.id === bookingId) ?? null
      : null;

    useEffect(() => {
      setSelectedBookingId(Number.isFinite(bookingId) && bookingId > 0 ? bookingId : null);
      return () => setSelectedBookingId(null);
    }, [bookingId]);

    if (loadingData && bookings.length === 0) {
      return (
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-12 text-center text-base font-medium text-ink-2">
          Đang tải chuyến đi của bạn...
        </div>
      );
    }

    if (!booking) {
      return (
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-12">
          <div className="flagship-card p-10 text-center space-y-4">
            <h2 className="text-xl font-semibold text-ink">Không tìm thấy chuyến đi của bạn</h2>
            <button
              type="button"
              onClick={() => navigate('/bookings')}
              className="btn btn-primary font-semibold"
            >
              Về danh sách chuyến đi
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6">
        <BookingWorkspace
          booking={booking}
          onBack={() => navigate('/bookings')}
          onUpdated={handleBookingUpdated}
        />
      </div>
    );
  }

  const exploreView = (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8 lg:py-10 space-y-12">
      {/* Asymmetric Split Scene Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            <p className="text-sm font-medium text-ink-2">
              Lữ hành bản địa Việt Nam · {regions.length || 6} vùng di sản &amp; lịch trình may đo
            </p>
            <h1 className="text-4xl lg:text-[44px] font-semibold tracking-[-0.025em] leading-[1.12] text-ink">
              Đi theo nhịp riêng, cùng người hiểu đất
            </h1>
            <p className="text-base sm:text-lg text-ink-2 max-w-[52ch] leading-relaxed">
              Chọn lịch trình chuẩn từ hướng dẫn viên địa phương, đổi nơi ở hoặc thêm trải nghiệm
              riêng và nhận báo giá minh bạch từng chặng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={scrollToCatalog}
              className="btn btn-primary font-semibold"
            >
              <span>Khám phá hành trình mẫu</span>
              <ArrowRightIcon size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/bookings');
                } else {
                  openAuthModal('login');
                }
              }}
              className="btn btn-ghost font-medium"
            >
              <span>
                {isAuthenticated
                  ? pendingActionCount > 0
                    ? `Xem báo giá mới (${pendingActionCount})`
                    : 'Xem chuyến của tôi'
                  : 'Đăng nhập xem chuyến đi'}
              </span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-rule bg-surface-2">
            <SafeImage
              src={featuredHeroTour?.imageUrl || DEFAULT_TRAVEL_IMAGE}
              alt={featuredHeroTour?.title || 'Hành trình bản địa Việt Nam'}
              className="w-full h-full object-cover"
            />
            {heroPreviewPhotos.length > 0 && featuredHeroTour && (
              <button
                type="button"
                onClick={() => openTourLightbox(featuredHeroTour, 0)}
                className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-2 rounded-lg bg-flagship-dark/85 backdrop-blur-md border border-white/20 px-3.5 py-2 text-sm font-medium text-white hover:bg-flagship-dark transition-colors duration-150 cursor-pointer"
              >
                <CameraIcon size={15} />
                <span className="num">Xem trọn bộ {heroPreviewPhotos.length} ảnh thực tế</span>
              </button>
            )}
          </div>

          {featuredHeroTour && (
            <div className="rounded-xl border border-rule bg-surface p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-3">
                <div>
                  <div className="text-sm text-ink-3">
                    Lộ trình mẫu · {featuredHeroTour.regionName}
                  </div>
                  <div
                    onClick={() => navigate(`/tours/${featuredHeroTour.id}`)}
                    className="text-base sm:text-lg font-semibold text-ink cursor-pointer hover:text-coral transition-colors duration-150"
                  >
                    {featuredHeroTour.title}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-ink-3">Giá cơ bản</div>
                  <div className="num text-lg font-semibold text-ink">
                    {formatVnd(featuredHeroTour.basePricePerPerson)}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-rule">
                {heroSteps.map((step, idx) => (
                  <div
                    key={`${step.dayNumber}-${idx}-${step.title}`}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${categoryDotClass(
                          step.category
                        )}`}
                      />
                      <span className="num text-sm text-ink-3 shrink-0">
                        Ngày {String(step.dayNumber).padStart(2, '0')}
                      </span>
                      <span className="text-[15px] font-medium text-ink truncate">
                        {step.title}
                      </span>
                    </div>
                    <span className="num text-sm font-semibold text-ink shrink-0">
                      {formatVnd(step.pricePerPerson)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Khu vực Danh sách hành trình + Quiet Toolbar */}
      <section id="catalog-section" className="space-y-6 pt-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink">Danh sách hành trình</h2>
          <span className="num text-sm text-ink-2">{filteredTours.length} hành trình</span>
        </div>

        <div className="rounded-xl bg-surface border border-rule p-4 space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={regionFilter === 'ALL'}
              onClick={() => setRegionFilter('ALL')}
              className="chip font-medium"
            >
              <span>Tất cả ({tours.length})</span>
            </button>
            {regions.map((r) => {
              const active = regionFilter === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRegionFilter(active ? 'ALL' : r.id)}
                  className="chip font-medium"
                >
                  <SafeImage
                    src={r.imageUrl}
                    alt={r.name}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                  <span>{r.name}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-rule flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1 flex items-center min-w-[240px]">
              <SearchIcon
                size={17}
                className="absolute left-3.5 text-ink-3 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm Hạ Long, Đà Lạt, Hội An, tên Guide"
                aria-label="Tìm điểm đến hoặc tên Guide"
                className="field !pl-10 !pr-9 text-base"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-3 text-ink-3 hover:text-ink cursor-pointer"
                >
                  <XIcon size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {(
                [
                  { id: 'ALL', label: 'Mọi thời lượng' },
                  { id: '2', label: '2 ngày' },
                  { id: '3+', label: '3+ ngày' },
                ] as Array<{ id: DurationFilter; label: string }>
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={durationFilter === opt.id}
                  onClick={() => setDurationFilter(opt.id)}
                  className="chip text-sm font-medium"
                >
                  {opt.label}
                </button>
              ))}

              <div className="flex items-center gap-2">
                <ArrowUpDownIcon size={16} className="text-ink-3 shrink-0" />
                <select
                  value={priceSort}
                  onChange={(e) => setPriceSort(e.target.value as PriceSort)}
                  aria-label="Sắp xếp theo giá"
                  className="field !w-auto !py-2 !px-3.5 text-sm font-medium"
                >
                  <option value="default">Sắp xếp: Mặc định</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn btn-ghost !py-2 !px-3.5 text-sm font-medium"
                >
                  <RestoreIcon size={15} />
                  <span>Xoá bộ lọc</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {selectedRegion && (
          <section className="flagship-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1 max-w-3xl">
                <div className="text-sm font-medium text-ink-3">
                  Thư viện ảnh vùng · {selectedRegion.province}
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-ink">
                  Khoảnh khắc thực tế tại {selectedRegion.name}
                </h3>
                <p className="text-[15px] text-ink-2 leading-relaxed">
                  {selectedRegion.description}
                </p>
              </div>

              {selectedRegionPhotos.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    openLightbox(
                      selectedRegionPhotos,
                      0,
                      `${selectedRegion.name} · ${selectedRegion.province}`
                    )
                  }
                  className="btn btn-ghost !py-2 !px-4 text-sm font-medium shrink-0"
                >
                  <CameraIcon size={16} />
                  <span>
                    Xem trọn bộ {selectedRegion.photoCount ?? selectedRegionPhotos.length} ảnh{' '}
                    {selectedRegion.name}
                  </span>
                </button>
              )}
            </div>

            {selectedRegionPhotos.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                {selectedRegionPhotos.map((photo, idx) => (
                  <button
                    key={`${photo.id}-${idx}`}
                    type="button"
                    onClick={() =>
                      openLightbox(
                        selectedRegionPhotos,
                        idx,
                        `${selectedRegion.name} · ${selectedRegion.province}`
                      )
                    }
                    className="relative w-52 sm:w-60 aspect-[4/3] shrink-0 overflow-hidden rounded-lg border border-rule group cursor-pointer bg-surface-2"
                  >
                    <SafeImage
                      src={photo.url}
                      alt={photo.landmarkName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-left">
                      <div className="text-sm font-medium text-white truncate">
                        {photo.landmarkName}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {loadingData && tours.length === 0 ? (
          <div className="flagship-card p-12 text-center text-base font-medium text-ink-2">
            Đang tải danh sách hành trình...
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="flagship-card p-12 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-surface-2 border border-rule flex items-center justify-center text-ink-3">
              <SearchIcon size={22} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-semibold text-ink">
                Không tìm thấy hành trình phù hợp
              </h3>
              <p className="text-base text-ink-2">
                Thử đổi vùng miền, thời lượng hoặc xóa từ khóa tìm kiếm.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="btn btn-ghost font-medium"
              >
                <RestoreIcon size={16} />
                <span>Xoá bộ lọc</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTours.map(renderTourCard)}
          </div>
        )}
      </section>
    </div>
  );

  const savedView = (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8 space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
        <div>
          <p className="text-sm font-medium text-ink-3">Bộ sưu tập cá nhân</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-ink mt-1">Hành trình đã lưu</h1>
          <p className="text-base text-ink-2 mt-1">
            Những tuyến đi bạn đã đánh dấu để cân nhắc hoặc gửi yêu cầu tuỳ chỉnh.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn btn-ghost font-medium"
        >
          <CompassIcon size={16} />
          <span>Khám phá thêm</span>
        </button>
      </div>

      {savedTours.length === 0 ? (
        <div className="flagship-card p-12 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-surface-2 border border-rule flex items-center justify-center text-ink-3">
            <HeartIcon size={24} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-ink">Chưa có hành trình nào được lưu</h2>
            <p className="text-base text-ink-2">
              Nhấn biểu tượng trái tim trên bất kỳ hành trình nào để lưu lại danh sách yêu thích
              của riêng bạn.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-primary font-semibold"
          >
            Khám phá hành trình ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedTours.map(renderTourCard)}
        </div>
      )}
    </div>
  );

  const bookingsView = (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8 space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
        <div>
          <p className="text-sm font-medium text-ink-3">Danh sách đặt chỗ</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-ink mt-1">Chuyến đi của bạn</h1>
          <p className="text-base text-ink-2 mt-1">
            Theo dõi trạng thái báo giá, đối chiếu chênh lệch từng lần trao đổi và chốt chuyến cùng Guide.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn btn-primary font-semibold"
        >
          <PlusIcon size={16} />
          <span>Đặt thêm chuyến</span>
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="flagship-card p-12 text-center space-y-4">
          <div className="text-base font-medium text-ink-2">
            Bạn chưa có chuyến đi nào.
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-primary font-semibold"
          >
            Khám phá hành trình ngay
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map((b) => {
            const st = statusMeta(b.status);
            const sm = serviceModeMeta(b.serviceMode);
            const priceChanged = b.totalPrice !== b.originalTotalPrice;
            const isRefreshing = refreshingBookingId === b.id;

            return (
              <article
                key={b.id}
                className="flagship-card grid grid-cols-1 md:grid-cols-[14rem_1fr_auto]"
              >
                <div className="relative h-48 md:h-auto bg-surface-2 border-b md:border-b-0 md:border-r border-rule overflow-hidden">
                  <SafeImage
                    src={b.tour.imageUrl}
                    alt={b.tourTitleSnapshot}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white">
                    <span className="num text-sm font-semibold tracking-wide">{b.code}</span>
                    <span className="num text-sm text-white/90">Vòng {b.revisionCount}</span>
                  </div>
                </div>

                <div className="p-5 sm:p-6 flex flex-col justify-between gap-3 min-w-0">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-ink-2">
                        <MapPinIcon size={14} className="text-ink-3" />
                        <span>{b.tour.regionName}</span>
                        <span>·</span>
                        <span>Guide {b.guide.fullName}</span>
                      </div>
                      <span
                        className={`tag ${st.tagClass} !normal-case !tracking-normal !font-medium`}
                      >
                        {st.short}
                      </span>
                    </div>

                    <h3
                      onClick={() => navigate(`/bookings/${b.id}`)}
                      className="text-[22px] font-semibold text-ink truncate cursor-pointer hover:text-coral transition-colors duration-150"
                    >
                      {b.tourTitleSnapshot}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm font-medium text-ink-2">
                    <span className="inline-flex items-center gap-1.5 num">
                      <CalendarIcon size={15} className="text-ink-3" />
                      {b.startDate}
                    </span>
                    <span className="inline-flex items-center gap-1.5 num">
                      <ClockIcon size={15} className="text-ink-3" />
                      {b.days} ngày
                    </span>
                    <span className="inline-flex items-center gap-1.5 num">
                      <UsersIcon size={15} className="text-ink-3" />
                      {b.guests} khách
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CompassIcon size={15} className="text-ink-3" />
                      {sm.short}
                    </span>
                  </div>

                  <div className="text-sm text-ink-2 truncate">
                    <span className="font-semibold text-ink">Bước tiếp theo:</span> {st.hint}
                  </div>
                </div>

                <div className="bg-surface-2 border-t md:border-t-0 md:border-l border-rule p-5 sm:p-6 md:min-w-[17rem] flex flex-col justify-between items-start md:items-end gap-4">
                  <div className="text-left md:text-right">
                    <div className="text-sm text-ink-3">Tổng thanh toán</div>
                    {priceChanged && (
                      <div className="num text-sm text-ink-3 line-through mt-0.5">
                        {formatVnd(b.originalTotalPrice)}
                      </div>
                    )}
                    <div className="num text-2xl font-semibold text-ink">
                      {formatVnd(b.totalPrice)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      disabled={isRefreshing}
                      onClick={() => void handleRefreshBooking(b.id)}
                      className="btn btn-ghost !py-2 !px-3 text-sm font-medium"
                      title="Cập nhật trạng thái mới nhất"
                    >
                      <RefreshIcon size={14} className={isRefreshing ? 'animate-spin' : ''} />
                      <span>Cập nhật trạng thái</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/bookings/${b.id}`)}
                      className={
                        b.status === 'REQUOTED'
                          ? 'btn btn-confirm !py-2.5 !px-4 text-sm font-semibold shrink-0'
                          : 'btn btn-primary !py-2.5 !px-4 text-sm font-semibold shrink-0'
                      }
                    >
                      <span>{b.status === 'REQUOTED' ? 'Xem & Chốt' : 'Mở hồ sơ'}</span>
                      <ArrowRightIcon size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );

  const redirectTarget = getSafeRedirect(searchParams.get('redirect'));

  return (
    <Theme theme={tripBuilderClientTheme} mode={theme}>
      <LayerProvider>
        {isAuthRoute ? (
          authLoading ? (
            <div className="min-h-screen bg-canvas flex items-center justify-center text-base font-medium text-ink-2">
              Đang kiểm tra phiên đăng nhập...
            </div>
          ) : isAuthenticated ? (
            <Navigate to={redirectTarget} replace />
          ) : (
            <Routes>
              <Route
                path="/login"
                element={
                  <LoginPage
                    initialMode="login"
                    onSuccess={(data, rememberMe) => {
                      handleAuthSuccess(data, rememberMe);
                      navigate(redirectTarget, { replace: true });
                    }}
                  />
                }
              />
              <Route
                path="/register"
                element={
                  <LoginPage
                    initialMode="register"
                    onSuccess={(data, rememberMe) => {
                      handleAuthSuccess(data, rememberMe);
                      navigate(redirectTarget, { replace: true });
                    }}
                  />
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <LoginPage
                    initialMode="forgot"
                    onSuccess={(data, rememberMe) => {
                      handleAuthSuccess(data, rememberMe);
                      navigate(redirectTarget, { replace: true });
                    }}
                  />
                }
              />
            </Routes>
          )
        ) : (
          <div className="min-h-screen bg-canvas text-ink flex flex-col">
            {/* Header Quiet Chrome */}
            <header className="sticky top-0 z-30 h-[72px] bg-surface/95 backdrop-blur-md border-b border-rule">
              <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
                <div className="flex items-center gap-4 lg:gap-9 min-w-0 flex-1 h-full">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="flex items-center gap-3 shrink-0 cursor-pointer text-left"
                  >
                    <span className="h-9 w-9 rounded-lg bg-coral text-white flex items-center justify-center">
                      <CompassIcon size={19} />
                    </span>
                    <div className="leading-none">
                      <span className="text-xl font-semibold text-ink block">TripBuilder</span>
                      <span className="text-sm text-ink-3 hidden md:block mt-0.5">
                        Hành trình bản địa
                      </span>
                    </div>
                  </button>

                  <nav
                    className="flex items-stretch h-full gap-1.5 sm:gap-4 overflow-x-auto no-scrollbar min-w-0"
                    aria-label="Điều hướng chính"
                  >
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className={`relative px-2 flex items-center gap-2 text-[15px] font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                        isExploreRoute ? 'text-ink font-semibold' : 'text-ink-2 hover:text-ink'
                      }`}
                    >
                      <span>Khám phá</span>
                      {isExploreRoute && (
                        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-coral" />
                      )}
                    </button>

                    {isAuthenticated && (
                      <>
                        <button
                          type="button"
                          onClick={() => navigate('/saved')}
                          className={`relative px-2 flex items-center gap-2 text-[15px] font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                            isSavedRoute ? 'text-ink font-semibold' : 'text-ink-2 hover:text-ink'
                          }`}
                        >
                          <span>Đã lưu</span>
                          <span className="num text-sm text-ink-3">{favoriteIds.length}</span>
                          {isSavedRoute && (
                            <span className="absolute inset-x-0 bottom-0 h-[2px] bg-coral" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate('/bookings')}
                          className={`relative px-2 flex items-center gap-2 text-[15px] font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                            isBookingsRoute ? 'text-ink font-semibold' : 'text-ink-2 hover:text-ink'
                          }`}
                        >
                          <span>Chuyến của tôi</span>
                          <span className="num text-sm text-ink-3">{bookings.length}</span>
                          {pendingActionCount > 0 && (
                            <span className="num inline-flex items-center gap-1.5 text-sm font-medium text-coral">
                              <span className="h-1.5 w-1.5 rounded-full bg-coral" />
                              <span>{pendingActionCount} mới</span>
                            </span>
                          )}
                          {isBookingsRoute && (
                            <span className="absolute inset-x-0 bottom-0 h-[2px] bg-coral" />
                          )}
                        </button>
                      </>
                    )}
                  </nav>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <a
                    href={`${import.meta.env.VITE_GUIDE_PORTAL_URL || 'http://localhost:5174'}/?mode=apply`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rule bg-surface hover:bg-surface-2 text-xs font-medium text-ink-2 hover:text-ink transition-colors whitespace-nowrap"
                  >
                    <span>Trở thành Hướng dẫn viên</span>
                    <ExternalIcon size={13} />
                  </a>

                  <NotificationBell
                    enabled={isAuthenticated}
                    onNavigateBooking={(bookingId) => navigate(`/bookings/${bookingId}`)}
                  />

                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={theme === 'light' ? 'Bật nền tối' : 'Bật nền sáng'}
                    title={theme === 'light' ? 'Bật nền tối' : 'Bật nền sáng'}
                    className="h-9 w-9 rounded-lg border border-rule bg-surface hover:bg-surface-2 text-ink-2 flex items-center justify-center transition-colors duration-150 cursor-pointer"
                  >
                    {theme === 'light' ? <MoonIcon size={17} /> : <SunIcon size={17} />}
                  </button>

                  {user ? (
                    <>
                      <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        title="Hồ sơ cá nhân"
                        className="flex items-center gap-2.5 pl-3 ml-1 border-l border-rule hover:opacity-85 transition-opacity cursor-pointer text-left"
                      >
                        <Avatar
                          src={user.avatarUrl ? resolveMediaUrl(user.avatarUrl) : undefined}
                          name={user.fullName}
                          size="sm"
                        />
                        <div className="hidden lg:block leading-tight max-w-[160px]">
                          <div className="text-sm font-medium text-ink truncate">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-ink-3">Hồ sơ</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleLogout();
                          if (isSavedRoute || isBookingsRoute || location.pathname === '/profile') {
                            navigate('/');
                          }
                        }}
                        aria-label="Đăng xuất"
                        title="Đăng xuất"
                        className="h-9 px-3 rounded-lg border border-rule bg-surface hover:bg-crimson-soft hover:text-crimson hover:border-crimson/40 text-ink-2 inline-flex items-center gap-2 text-sm font-medium transition-colors duration-150 cursor-pointer shrink-0"
                      >
                        <LogoutIcon size={16} />
                        <span className="hidden sm:inline">Đăng xuất</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 pl-2 border-l border-rule">
                      <button
                        type="button"
                        onClick={() => openAuthModal('login')}
                        className="btn btn-ghost !py-2 !px-3.5 text-sm font-medium"
                      >
                        Đăng nhập
                      </button>
                      <button
                        type="button"
                        onClick={() => openAuthModal('register')}
                        className="btn btn-primary !py-2 !px-3.5 text-sm font-semibold"
                      >
                        Đăng ký
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <main className="flex-1 w-full">
              {error && (
                <div className="mx-auto max-w-[1440px] px-4 sm:px-6 pt-5">
                  <div className="rounded-xl border border-crimson/40 bg-crimson-soft px-5 py-3.5 text-sm font-medium text-crimson flex items-center gap-2.5">
                    <AlertIcon size={18} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <Routes>
                <Route path="/" element={exploreView} />
                <Route path="/tours/:id" element={<TourDetailRoute />} />
                <Route
                  path="/saved"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated} authLoading={authLoading}>
                      {savedView}
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated} authLoading={authLoading}>
                      {bookingsView}
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings/:id"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated} authLoading={authLoading}>
                      <BookingDetailRoute />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated} authLoading={authLoading}>
                      {user ? (
                        <ProfileView
                          user={user}
                          onUserUpdated={(updated) => setUser(updated)}
                          onBack={() => navigate('/')}
                        />
                      ) : null}
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <footer className="border-t border-rule bg-surface/80 mt-10">
              <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-2">
                <div className="flex items-center gap-2">
                  <CompassIcon size={16} className="text-coral shrink-0" />
                  <span className="font-medium text-ink">TripBuilder</span>
                  <span className="text-ink-3">· Hành trình bản địa cùng thổ địa</span>
                </div>
                <a
                  href={`${import.meta.env.VITE_GUIDE_PORTAL_URL || 'http://localhost:5174'}/?mode=apply`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-coral hover:underline"
                >
                  <span>Trở thành Hướng dẫn viên bản địa</span>
                  <ExternalIcon size={14} />
                </a>
              </div>
            </footer>

            {customizeTour && (
              <CustomerCustomizeModal
                isOpen
                tour={customizeTour}
                customerId={user?.id ?? 0}
                isAuthenticated={isAuthenticated}
                externalError={flashError}
                onClose={() => setCustomizeTourId(null)}
                onRequireAuth={requireAuthForBookingSubmit}
                onSuccess={(created) => {
                  handleBookingCreated(created);
                  navigate(`/bookings/${created.id}`);
                }}
              />
            )}

            <AuthModal onAuthSuccess={handleAuthSuccess} />

            <TravelPhotoLightbox
              photos={lightbox.photos}
              initialIndex={lightbox.index}
              isOpen={lightbox.isOpen}
              onClose={closeLightbox}
              regionTitle={lightbox.title}
            />
          </div>
        )}
      </LayerProvider>
    </Theme>
  );
}

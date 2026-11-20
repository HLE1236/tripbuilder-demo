import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { LayerProvider } from '@astryxdesign/core/Layer';
import { Theme } from '@astryxdesign/core/theme';
import {
  authLogin,
  authMe,
  DEFAULT_TRAVEL_IMAGE,
  formatVnd,
  getAuthToken,
  getBooking,
  getBookings,
  getFavoriteTourIds,
  getRegionPhotos,
  getRegions,
  getTours,
  removeFavoriteTour,
  saveFavoriteTour,
  serviceModeMeta,
  setAuthToken,
  setUnauthorizedHandler,
  statusMeta,
  type Booking,
  type PhotoItem,
  type Region,
  type Tour,
  type User,
} from './api';
import { BookingWorkspace } from './components/BookingWorkspace';
import { CustomerCustomizeModal } from './components/CustomerCustomizeModal';
import { DemoSwitcherBar } from './components/DemoSwitcherBar';
import { Icon } from './components/Icon';
import { LoginPage } from './components/LoginPage';
import { SafeImage } from './components/SafeImage';
import { TourDetailView } from './components/TourDetailView';
import { TravelPhotoLightbox } from './components/TravelPhotoLightbox';
import { tripBuilderClientTheme } from './theme';

type PageTab = 'explore' | 'saved' | 'trips';
type DurationFilter = 'ALL' | '2' | '3+';
type PriceSort = 'default' | 'price_asc' | 'price_desc';

function categoryDotClass(category: string): string {
  switch (category) {
    case 'Khách sạn':
      return 'bg-indigo';
    case 'Ăn uống':
      return 'bg-orange';
    case 'Di chuyển':
      return 'bg-sky';
    case 'Trải nghiệm':
      return 'bg-emerald';
    default:
      return 'bg-coral';
  }
}

function tourToPhotoItems(tour: Tour): PhotoItem[] {
  if (tour.galleryItems && tour.galleryItems.length > 0) {
    return tour.galleryItems;
  }
  const urls = tour.galleryUrls?.length ? tour.galleryUrls : [tour.imageUrl];
  return urls.map((url, idx) => ({
    id: idx + 1,
    url,
    landmarkName: tour.title,
    caption: `${tour.regionName} · ${tour.province}`,
    category: 'Hành trình',
    credit: `Guide ${tour.guide.fullName}`,
  }));
}

export default function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('tb_client_theme') === 'dark' ? 'dark' : 'light'
  );
  const initialDemoEmailRef = useRef<string | null>(null);
  if (initialDemoEmailRef.current === null) {
    initialDemoEmailRef.current =
      new URLSearchParams(window.location.search).get('demoEmail')?.trim() || '';
  }

  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [pendingBookingCode, setPendingBookingCode] = useState<string | null>(() => {
    const code = new URLSearchParams(window.location.search).get('bookingCode')?.trim();
    return code || null;
  });

  const [tab, setTab] = useState<PageTab>(() => {
    const code = new URLSearchParams(window.location.search).get('bookingCode')?.trim();
    return code ? 'trips' : 'explore';
  });

  const [regions, setRegions] = useState<Region[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [regionPhotosMap, setRegionPhotosMap] = useState<Record<number, PhotoItem[]>>({});
  const [cardPhotoIdx, setCardPhotoIdx] = useState<Record<number, number>>({});

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [refreshingBookingId, setRefreshingBookingId] = useState<number | null>(null);

  const [regionFilter, setRegionFilter] = useState<number | 'ALL'>('ALL');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('ALL');
  const [priceSort, setPriceSort] = useState<PriceSort>('default');
  const [searchQuery, setSearchQuery] = useState('');

  const [detailTour, setDetailTour] = useState<Tour | null>(null);
  const [customizeTour, setCustomizeTour] = useState<Tour | null>(null);

  const [lightboxPhotos, setLightboxPhotos] = useState<PhotoItem[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [lightboxTitle, setLightboxTitle] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setBookings([]);
    setFavoriteIds([]);
    setSelectedBooking(null);
    setDetailTour(null);
    setPendingBookingCode(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(handleLogout);
    return () => setUnauthorizedHandler(null);
  }, [handleLogout]);

  useEffect(() => {
    localStorage.setItem('tb_client_theme', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  useEffect(() => {
    let active = true;
    const demoEmail = initialDemoEmailRef.current || '';

    const clearQueryParams = () => {
      if (window.location.search) {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
      }
    };

    const restoreSession = async () => {
      if (demoEmail) {
        try {
          const res = await authLogin(demoEmail, '123456');
          if (!active) return;
          setAuthToken(res.token);
          setUser(res.user);
          clearQueryParams();
          setAuthChecking(false);
          return;
        } catch {
          // Rơi về kiểm tra token hiện tại
        }
      }

      clearQueryParams();
      const token = getAuthToken();
      if (!token) {
        if (active) setAuthChecking(false);
        return;
      }

      try {
        const u = await authMe();
        if (!active) return;
        if (u.role !== 'CUSTOMER') {
          handleLogout();
        } else {
          setUser(u);
        }
      } catch {
        if (active) handleLogout();
      } finally {
        if (active) setAuthChecking(false);
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, [handleLogout]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      setLoadingData(true);
      setError('');
      try {
        const [regList, tourList, bookingList, favList] = await Promise.all([
          getRegions(),
          getTours(),
          getBookings(),
          getFavoriteTourIds().catch(() => [] as number[]),
        ]);
        if (!active) return;
        setRegions(regList);
        setTours(tourList);
        setBookings(bookingList);
        setFavoriteIds(favList);

        if (pendingBookingCode) {
          const matched = bookingList.find(
            (b) => b.code.toUpperCase() === pendingBookingCode.toUpperCase()
          );
          if (matched) {
            setSelectedBooking(matched);
            setTab('trips');
          }
          setPendingBookingCode(null);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Không tải được dữ liệu');
      } finally {
        if (active) setLoadingData(false);
      }
    });
    return () => {
      active = false;
    };
  }, [user, pendingBookingCode]);

  const selectedRegion = useMemo(
    () => (regionFilter === 'ALL' ? null : regions.find((r) => r.id === regionFilter) ?? null),
    [regions, regionFilter]
  );

  useEffect(() => {
    if (!selectedRegion) return;
    if (regionPhotosMap[selectedRegion.id]) return;
    let active = true;
    getRegionPhotos(selectedRegion.id)
      .then((list) => {
        if (active) {
          setRegionPhotosMap((prev) => ({ ...prev, [selectedRegion.id]: list }));
        }
      })
      .catch(() => {
        // Giữ previewPhotos fallback
      });
    return () => {
      active = false;
    };
  }, [selectedRegion, regionPhotosMap]);

  const selectedRegionPhotos = useMemo(() => {
    if (!selectedRegion) return [] as PhotoItem[];
    return regionPhotosMap[selectedRegion.id] || selectedRegion.previewPhotos || [];
  }, [selectedRegion, regionPhotosMap]);

  const filteredTours = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = tours.filter((t) => {
      if (regionFilter !== 'ALL' && t.regionId !== regionFilter) return false;
      if (durationFilter === '2' && t.days !== 2) return false;
      if (durationFilter === '3+' && t.days < 3) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.regionName.toLowerCase().includes(q) ||
        t.province.toLowerCase().includes(q) ||
        t.guide.fullName.toLowerCase().includes(q)
      );
    });

    if (priceSort === 'price_asc') {
      return [...list].sort((a, b) => a.basePricePerPerson - b.basePricePerPerson);
    }
    if (priceSort === 'price_desc') {
      return [...list].sort((a, b) => b.basePricePerPerson - a.basePricePerPerson);
    }
    return list;
  }, [tours, regionFilter, durationFilter, priceSort, searchQuery]);

  const savedTours = useMemo(
    () => tours.filter((t) => favoriteIds.includes(t.id)),
    [tours, favoriteIds]
  );

  const toggleFavorite = async (tourId: number) => {
    const isFav = favoriteIds.includes(tourId);
    try {
      const next = isFav
        ? await removeFavoriteTour(tourId)
        : await saveFavoriteTour(tourId);
      setFavoriteIds(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể cập nhật mục đã lưu');
    }
  };

  const openPhotosLightbox = (photos: PhotoItem[], index: number, title: string) => {
    if (photos.length === 0) return;
    setLightboxPhotos(photos);
    setLightboxIdx(index);
    setLightboxTitle(title);
    setLightboxOpen(true);
  };

  const openTourLightbox = (tour: Tour, index = 0) => {
    openPhotosLightbox(tourToPhotoItems(tour), index, `${tour.regionName} · ${tour.title}`);
  };

  const stepCardPhoto = (tourId: number, total: number, delta: number) => {
    if (total <= 1) return;
    setCardPhotoIdx((prev) => {
      const curr = prev[tourId] ?? 0;
      return { ...prev, [tourId]: (curr + delta + total) % total };
    });
  };

  const handleRefreshBooking = async (bookingId: number) => {
    setRefreshingBookingId(bookingId);
    try {
      const fresh = await getBooking(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === fresh.id ? fresh : b)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể làm mới trạng thái đơn');
    } finally {
      setRefreshingBookingId(null);
    }
  };

  const scrollToCatalog = () => {
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const pendingActionCount = bookings.filter((b) => b.status === 'REQUOTED').length;
  const hasActiveFilters =
    regionFilter !== 'ALL' ||
    durationFilter !== 'ALL' ||
    priceSort !== 'default' ||
    searchQuery.trim().length > 0;

  const featuredHeroTour = tours[0] ?? null;
  const heroPreviewPhotos = featuredHeroTour ? tourToPhotoItems(featuredHeroTour) : [];
  const heroSteps = featuredHeroTour ? featuredHeroTour.steps.slice(0, 3) : [];

  const renderTourCard = (tour: Tour) => {
    const isFav = favoriteIds.includes(tour.id);
    const photos = tourToPhotoItems(tour);
    const activeIdx = Math.min(cardPhotoIdx[tour.id] ?? 0, Math.max(photos.length - 1, 0));
    const currentPhotoUrl = photos[activeIdx]?.url || tour.imageUrl;

    return (
      <article key={tour.id} className="flagship-card flex flex-col h-full">
        {/* Khung ảnh 16:10 */}
        <div
          onClick={() => setDetailTour(tour)}
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
              toggleFavorite(tour.id);
            }}
            aria-label={isFav ? `Bỏ lưu ${tour.title}` : `Lưu ${tour.title}`}
            aria-pressed={isFav}
            className={`absolute top-3 right-3 h-10 w-10 rounded-full flex items-center justify-center backdrop-blur-sm border transition-colors duration-150 cursor-pointer ${
              isFav
                ? 'bg-coral border-coral text-white'
                : 'bg-black/45 border-white/25 text-white hover:bg-black/65'
            }`}
          >
            <Icon name="heart" size={18} filled={isFav} />
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
                <Icon name="chevron-left" size={18} />
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
                <Icon name="chevron-right" size={18} />
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
            <Icon name="camera" size={14} />
            <span>{photos.length} ảnh</span>
          </button>
        </div>

        {/* Nội dung thẻ */}
        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-coral" />
              <span>
                {tour.regionName} · {tour.province}
              </span>
            </div>

            <h3
              onClick={() => setDetailTour(tour)}
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
                  Thổ địa {tour.guide.yearsExperience || 5} năm kinh nghiệm
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
                onClick={() => setCustomizeTour(tour)}
                className="btn btn-primary !py-2.5 !px-4 text-sm font-semibold shrink-0"
              >
                <span>Tuỳ chỉnh & Đặt</span>
                <Icon name="arrow-right" size={16} />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <Theme theme={tripBuilderClientTheme} mode={mode}>
      <LayerProvider>
        {authChecking ? (
          <div className="min-h-screen bg-canvas flex items-center justify-center text-base font-medium text-ink-2">
            Đang khôi phục sổ hành trình của bạn...
          </div>
        ) : !user ? (
          <LoginPage
            onSuccess={(token, loggedInUser) => {
              setAuthToken(token);
              setUser(loggedInUser);
            }}
          />
        ) : (
          <div className="min-h-screen bg-canvas text-ink flex flex-col">
            {/* Tầng 1: Thanh Demo Switcher */}
            <DemoSwitcherBar
              currentUser={user}
              onSwitchUser={(nextUser) => {
                setSelectedBooking(null);
                setDetailTour(null);
                setPendingBookingCode(null);
                setUser(nextUser);
              }}
              activeBooking={selectedBooking}
            />

            {/* Tầng 2: Header Quiet Chrome */}
            <header className="sticky top-0 z-30 h-[72px] bg-surface/95 backdrop-blur-md border-b border-rule">
              <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
                <div className="flex items-center gap-4 lg:gap-9 min-w-0 flex-1 h-full">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBooking(null);
                      setDetailTour(null);
                      setTab('explore');
                    }}
                    className="flex items-center gap-3 shrink-0 cursor-pointer text-left"
                  >
                    <span className="h-9 w-9 rounded-lg bg-coral text-white flex items-center justify-center">
                      <Icon name="compass" size={19} />
                    </span>
                    <div className="leading-none">
                      <span className="text-xl font-semibold text-ink block">
                        TripBuilder
                      </span>
                      <span className="text-sm text-ink-3 hidden md:block mt-0.5">
                        Hành trình bản địa
                      </span>
                    </div>
                  </button>

                  <nav className="flex items-stretch h-full gap-1.5 sm:gap-4 overflow-x-auto no-scrollbar min-w-0" aria-label="Điều hướng chính">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBooking(null);
                        setDetailTour(null);
                        setTab('explore');
                      }}
                      className={`relative px-2 flex items-center gap-2 text-[15px] font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                        tab === 'explore' && !selectedBooking
                          ? 'text-ink font-semibold'
                          : 'text-ink-2 hover:text-ink'
                      }`}
                    >
                      <span>Khám phá</span>
                      {tab === 'explore' && !selectedBooking && (
                        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-coral" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBooking(null);
                        setDetailTour(null);
                        setTab('saved');
                      }}
                      className={`relative px-2 flex items-center gap-2 text-[15px] font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                        tab === 'saved' && !selectedBooking
                          ? 'text-ink font-semibold'
                          : 'text-ink-2 hover:text-ink'
                      }`}
                    >
                      <span>Đã lưu</span>
                      <span className="num text-sm text-ink-3">{favoriteIds.length}</span>
                      {tab === 'saved' && !selectedBooking && (
                        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-coral" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBooking(null);
                        setDetailTour(null);
                        setTab('trips');
                      }}
                      className={`relative px-2 flex items-center gap-2 text-[15px] font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                        tab === 'trips' || Boolean(selectedBooking)
                          ? 'text-ink font-semibold'
                          : 'text-ink-2 hover:text-ink'
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
                      {(tab === 'trips' || Boolean(selectedBooking)) && (
                        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-coral" />
                      )}
                    </button>
                  </nav>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}
                    aria-label={mode === 'light' ? 'Bật nền tối' : 'Bật nền sáng'}
                    title={mode === 'light' ? 'Bật nền tối' : 'Bật nền sáng'}
                    className="h-9 w-9 rounded-lg border border-rule bg-surface hover:bg-surface-2 text-ink-2 flex items-center justify-center transition-colors duration-150 cursor-pointer"
                  >
                    <Icon name={mode === 'light' ? 'moon' : 'sun'} size={17} />
                  </button>

                  <div className="hidden lg:flex items-center gap-2.5 pl-3 ml-1 border-l border-rule">
                    <Avatar src={user.avatarUrl || undefined} name={user.fullName} size="sm" />
                    <div className="leading-tight max-w-[160px]">
                      <div className="text-sm font-medium text-ink truncate">{user.fullName}</div>
                      <div className="text-sm text-ink-3">Hành khách</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    aria-label="Đăng xuất"
                    title="Đăng xuất"
                    className="h-9 w-9 rounded-lg border border-rule bg-surface hover:bg-crimson-soft hover:text-crimson hover:border-crimson/40 text-ink-2 flex items-center justify-center transition-colors duration-150 cursor-pointer"
                  >
                    <Icon name="logout" size={17} />
                  </button>
                </div>
              </div>
            </header>

            <main className="flex-1 w-full">
              {error && (
                <div className="mx-auto max-w-[1440px] px-4 sm:px-6 pt-5">
                  <div className="rounded-xl border border-crimson/40 bg-crimson-soft px-5 py-3.5 text-sm font-medium text-crimson flex items-center gap-2.5">
                    <Icon name="alert" size={18} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {selectedBooking ? (
                <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6">
                  <BookingWorkspace
                    booking={selectedBooking}
                    onBack={() => setSelectedBooking(null)}
                    onUpdated={(updated) => {
                      setSelectedBooking(updated);
                      setBookings((prev) =>
                        prev.map((b) => (b.id === updated.id ? updated : b))
                      );
                    }}
                  />
                </div>
              ) : detailTour ? (
                <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6">
                  <TourDetailView
                    tour={detailTour}
                    isFavorite={favoriteIds.includes(detailTour.id)}
                    onToggleFavorite={toggleFavorite}
                    onBack={() => setDetailTour(null)}
                    onCustomize={(target) => setCustomizeTour(target)}
                  />
                </div>
              ) : tab === 'explore' ? (
                <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8 lg:py-10 space-y-12">
                  {/* Asymmetric Split Scene Hero */}
                  <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                    {/* Cột trái (5 cột): Ngữ cảnh, H1, Mô tả, 1 CTA chính + 1 CTA phụ */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="space-y-4">
                        <p className="text-sm font-medium text-ink-2">
                          Lữ hành bản địa Việt Nam · 78 tư liệu ảnh thực tế
                        </p>
                        <h1 className="text-4xl lg:text-[44px] font-semibold tracking-[-0.025em] leading-[1.12] text-ink">
                          Đi theo nhịp riêng, cùng người hiểu đất
                        </h1>
                        <p className="text-base sm:text-lg text-ink-2 max-w-[52ch] leading-relaxed">
                          Chọn lịch trình chuẩn từ hướng dẫn viên địa phương, đổi nơi ở hoặc thêm
                          trải nghiệm riêng và nhận báo giá minh bạch từng chặng.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={scrollToCatalog}
                          className="btn btn-primary font-semibold"
                        >
                          <span>Khám phá hành trình mẫu</span>
                          <Icon name="arrow-right" size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setTab('trips')}
                          className="btn btn-ghost font-medium"
                        >
                          <span>
                            {pendingActionCount > 0
                              ? `Xem báo giá mới (${pendingActionCount})`
                              : 'Xem chuyến của tôi'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Cột phải (7 cột) — The Moment: Ảnh thực tế + Thẻ tóm tắt lộ trình mẫu */}
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
                            <Icon name="camera" size={15} />
                            <span className="num">
                              Xem trọn bộ {heroPreviewPhotos.length} ảnh thực tế
                            </span>
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
                                onClick={() => setDetailTour(featuredHeroTour)}
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
                      <h2 className="text-2xl sm:text-3xl font-semibold text-ink">
                        Danh sách hành trình
                      </h2>
                      <span className="num text-sm text-ink-2">
                        {filteredTours.length} hành trình
                      </span>
                    </div>

                    {/* Quiet Toolbar: 6 vùng miền + Tìm kiếm + Thời lượng + Sắp xếp */}
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
                          <Icon
                            name="search"
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
                              <Icon name="x" size={16} />
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
                            <Icon name="arrow-up-down" size={16} className="text-ink-3 shrink-0" />
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
                              onClick={() => {
                                setRegionFilter('ALL');
                                setDurationFilter('ALL');
                                setPriceSort('default');
                                setSearchQuery('');
                              }}
                              className="btn btn-ghost !py-2 !px-3.5 text-sm font-medium"
                            >
                              <Icon name="restore" size={15} />
                              <span>Xoá bộ lọc</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Region Lookbook Strip khi chọn 1 vùng */}
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
                                openPhotosLightbox(
                                  selectedRegionPhotos,
                                  0,
                                  `${selectedRegion.name} · ${selectedRegion.province}`
                                )
                              }
                              className="btn btn-ghost !py-2 !px-4 text-sm font-medium shrink-0"
                            >
                              <Icon name="camera" size={16} />
                              <span>
                                Xem trọn bộ {selectedRegion.photoCount ?? selectedRegionPhotos.length}{' '}
                                ảnh {selectedRegion.name}
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
                                  openPhotosLightbox(
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

                    {/* Lưới Tour Cards */}
                    {loadingData && tours.length === 0 ? (
                      <div className="flagship-card p-12 text-center text-base font-medium text-ink-2">
                        Đang tải danh sách hành trình...
                      </div>
                    ) : filteredTours.length === 0 ? (
                      <div className="flagship-card p-12 text-center space-y-4">
                        <div className="mx-auto h-12 w-12 rounded-full bg-surface-2 border border-rule flex items-center justify-center text-ink-3">
                          <Icon name="search" size={22} />
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
                            onClick={() => {
                              setRegionFilter('ALL');
                              setDurationFilter('ALL');
                              setPriceSort('default');
                              setSearchQuery('');
                            }}
                            className="btn btn-ghost font-medium"
                          >
                            <Icon name="restore" size={16} />
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
              ) : tab === 'saved' ? (
                /* Tab Đã lưu */
                <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8 space-y-7">
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
                    <div>
                      <p className="text-sm font-medium text-ink-3">Bộ sưu tập cá nhân</p>
                      <h1 className="text-3xl sm:text-4xl font-semibold text-ink mt-1">
                        Hành trình đã lưu
                      </h1>
                      <p className="text-base text-ink-2 mt-1">
                        Những tuyến đi bạn đã đánh dấu để cân nhắc hoặc gửi yêu cầu tuỳ chỉnh.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab('explore')}
                      className="btn btn-ghost font-medium"
                    >
                      <Icon name="compass" size={16} />
                      <span>Khám phá thêm</span>
                    </button>
                  </div>

                  {savedTours.length === 0 ? (
                    <div className="flagship-card p-12 text-center space-y-4">
                      <div className="mx-auto h-12 w-12 rounded-full bg-surface-2 border border-rule flex items-center justify-center text-ink-3">
                        <Icon name="heart" size={24} />
                      </div>
                      <div className="space-y-1.5 max-w-md mx-auto">
                        <h2 className="text-xl font-semibold text-ink">
                          Chưa có hành trình nào được lưu
                        </h2>
                        <p className="text-base text-ink-2">
                          Nhấn biểu tượng trái tim trên bất kỳ hành trình nào để lưu lại danh sách
                          yêu thích của riêng bạn.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTab('explore')}
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
              ) : (
                /* Tab Chuyến của tôi */
                <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8 space-y-7">
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
                    <div>
                      <p className="text-sm font-medium text-ink-3">Hồ sơ đặt chuyến</p>
                      <h1 className="text-3xl sm:text-4xl font-semibold text-ink mt-1">
                        Chuyến đi của bạn
                      </h1>
                      <p className="text-base text-ink-2 mt-1">
                        Theo dõi trạng thái báo giá, đối chiếu chênh lệch từng vòng và chốt chuyến
                        cùng Guide.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab('explore')}
                      className="btn btn-primary font-semibold"
                    >
                      <Icon name="plus" size={16} />
                      <span>Đặt thêm chuyến</span>
                    </button>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="flagship-card p-12 text-center space-y-4">
                      <div className="text-base font-medium text-ink-2">
                        Bạn chưa có hồ sơ đặt chuyến nào.
                      </div>
                      <button
                        type="button"
                        onClick={() => setTab('explore')}
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
                            {/* Ảnh thumbnail & Mã đơn */}
                            <div className="relative h-48 md:h-auto bg-surface-2 border-b md:border-b-0 md:border-r border-rule overflow-hidden">
                              <SafeImage
                                src={b.tour.imageUrl}
                                alt={b.tourTitleSnapshot}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white">
                                <span className="num text-sm font-semibold tracking-wide">
                                  {b.code}
                                </span>
                                <span className="num text-sm text-white/90">
                                  Vòng {b.revisionCount}
                                </span>
                              </div>
                            </div>

                            {/* Thân hồ sơ */}
                            <div className="p-5 sm:p-6 flex flex-col justify-between gap-3 min-w-0">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-ink-2">
                                    <Icon name="map-pin" size={14} className="text-ink-3" />
                                    <span>{b.tour.regionName}</span>
                                    <span>·</span>
                                    <span>Guide {b.guide.fullName}</span>
                                  </div>
                                  <span className={`tag ${st.tagClass} !normal-case !tracking-normal !font-medium`}>
                                    {st.short}
                                  </span>
                                </div>

                                <h3
                                  onClick={() => setSelectedBooking(b)}
                                  className="text-[22px] font-semibold text-ink truncate cursor-pointer hover:text-coral transition-colors duration-150"
                                >
                                  {b.tourTitleSnapshot}
                                </h3>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm font-medium text-ink-2">
                                <span className="inline-flex items-center gap-1.5 num">
                                  <Icon name="calendar" size={15} className="text-ink-3" />
                                  {b.startDate}
                                </span>
                                <span className="inline-flex items-center gap-1.5 num">
                                  <Icon name="clock" size={15} className="text-ink-3" />
                                  {b.days} ngày
                                </span>
                                <span className="inline-flex items-center gap-1.5 num">
                                  <Icon name="users" size={15} className="text-ink-3" />
                                  {b.guests} khách
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <Icon name="compass" size={15} className="text-ink-3" />
                                  {sm.short}
                                </span>
                              </div>

                              <div className="text-sm text-ink-2 truncate">
                                <span className="font-semibold text-ink">Bước tiếp theo:</span>{' '}
                                {st.hint}
                              </div>
                            </div>

                            {/* Giá & Hành động */}
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
                                  onClick={() => handleRefreshBooking(b.id)}
                                  className="btn btn-ghost !py-2 !px-3 text-sm font-medium"
                                  title="Cập nhật trạng thái mới nhất"
                                >
                                  <Icon
                                    name="refresh"
                                    size={14}
                                    className={isRefreshing ? 'animate-spin' : ''}
                                  />
                                  <span>Cập nhật trạng thái</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedBooking(b)}
                                  className={
                                    b.status === 'REQUOTED'
                                      ? 'btn btn-confirm !py-2.5 !px-4 text-sm font-semibold shrink-0'
                                      : 'btn btn-primary !py-2.5 !px-4 text-sm font-semibold shrink-0'
                                  }
                                >
                                  <span>{b.status === 'REQUOTED' ? 'Xem & Chốt' : 'Mở hồ sơ'}</span>
                                  <Icon name="arrow-right" size={15} />
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </main>

            {customizeTour && (
              <CustomerCustomizeModal
                isOpen
                tour={customizeTour}
                customerId={user.id}
                onClose={() => setCustomizeTour(null)}
                onSuccess={(created) => {
                  setCustomizeTour(null);
                  setDetailTour(null);
                  setBookings((prev) => [created, ...prev]);
                  setSelectedBooking(created);
                  setTab('trips');
                }}
              />
            )}

            <TravelPhotoLightbox
              photos={lightboxPhotos}
              initialIndex={lightboxIdx}
              isOpen={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
              regionTitle={lightboxTitle}
            />
          </div>
        )}
      </LayerProvider>
    </Theme>
  );
}

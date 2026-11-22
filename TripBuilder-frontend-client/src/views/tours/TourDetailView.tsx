import { Avatar } from '@astryxdesign/core/Avatar';
import { formatVnd, type Tour } from '../../api';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CameraIcon,
  HeartIcon,
  MapPinIcon,
  ZoomInIcon,
} from '../../components/icon';
import { SafeImage } from '../../components/ui/SafeImage';
import { TravelPhotoLightbox } from '../../components/ui/TravelPhotoLightbox';
import { useTourDetail } from '../../hooks/useTourDetail';
import { categoryDotClass } from '../../utils/tour';

export interface TourDetailViewProps {
  tour: Tour;
  isFavorite: boolean;
  onToggleFavorite: (tourId: number) => void;
  onBack: () => void;
  onCustomize: (tour: Tour) => void;
}

export function TourDetailView({
  tour,
  isFavorite,
  onToggleFavorite,
  onBack,
  onCustomize,
}: TourDetailViewProps) {
  const {
    photos,
    bentoPhotos,
    dayGroups,
    lightboxOpen,
    setLightboxOpen,
    lightboxIndex,
    customLightboxPhotos,
    openGalleryAt,
    openStepPhoto,
  } = useTourDetail(tour);

  return (
    <div className="space-y-8 pb-12">
      {/* Thanh điều hướng trên cùng */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-ghost !py-2 !px-4 text-sm font-medium"
        >
          <ArrowLeftIcon size={16} />
          <span>Quay lại khám phá</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleFavorite(tour.id)}
          aria-pressed={isFavorite}
          className="btn btn-ghost !py-2 !px-4 text-sm font-medium"
        >
          <HeartIcon
            size={16}
            filled={isFavorite}
            className={isFavorite ? 'text-coral' : 'text-ink-2'}
          />
          <span>{isFavorite ? 'Đã lưu yêu thích' : 'Lưu yêu thích'}</span>
        </button>
      </div>

      {/* Tiêu đề */}
      <header className="space-y-2.5 max-w-5xl">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-2">
          <MapPinIcon size={16} className="text-ink-3" />
          <span>
            {tour.regionName} · {tour.province}
          </span>
          <span className="text-ink-3">·</span>
          <span className="num text-ink">{tour.days} ngày</span>
        </div>
        <h1 className="text-3xl sm:text-[42px] font-semibold tracking-[-0.025em] text-ink leading-[1.12]">
          {tour.title}
        </h1>
      </header>

      {/* 5-Photo Bento Photo Wall */}
      <section aria-label="Bộ ảnh hành trình">
        <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-3 md:h-[460px] rounded-2xl overflow-hidden">
          {bentoPhotos.map((photo, idx) => {
            const isHero = idx === 0;
            const isLastTile = idx === bentoPhotos.length - 1;
            return (
              <button
                key={`${photo.id}-${idx}`}
                type="button"
                onClick={() => openGalleryAt(idx)}
                className={`relative overflow-hidden bg-surface-2 group cursor-pointer text-left ${
                  isHero
                    ? 'col-span-2 row-span-2 aspect-[4/3] md:aspect-auto'
                    : 'col-span-1 row-span-1 aspect-[4/3] md:aspect-auto'
                }`}
                aria-label={`Xem ảnh ${idx + 1}: ${photo.landmarkName}`}
              >
                <SafeImage
                  src={photo.url}
                  alt={photo.landmarkName || tour.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-75 group-hover:opacity-100 transition-opacity duration-150" />

                {isHero && photo.landmarkName && (
                  <span className="absolute bottom-4 left-4 rounded-lg bg-black/65 backdrop-blur-md px-3.5 py-1.5 text-sm font-medium text-white">
                    {photo.landmarkName}
                  </span>
                )}

                {isLastTile && (
                  <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg bg-flagship-dark/90 backdrop-blur-md border border-white/20 px-3.5 py-2 text-sm font-medium text-white">
                    <CameraIcon size={16} />
                    <span className="num">Xem trọn bộ {photos.length} ảnh thực tế</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Bố cục 2 cột (8:4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột trái (8) */}
        <div className="lg:col-span-8 space-y-8">
          <section className="space-y-2.5">
            <h2 className="text-sm font-medium text-ink-3">Tổng quan hành trình</h2>
            <p className="text-base sm:text-lg text-ink-2 leading-relaxed">
              {tour.description}
            </p>
          </section>

          {/* Local Host Card (Quiet surface) */}
          <section className="rounded-2xl bg-surface border border-rule p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full border border-rule shrink-0">
                  <Avatar
                    src={tour.guide.avatarUrl || undefined}
                    name={tour.guide.fullName}
                    size="lg"
                  />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-ink-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
                    <span>
                      {tour.guide.yearsExperience
                        ? `Thổ địa bản địa · ${tour.guide.yearsExperience} năm kinh nghiệm`
                        : `Hướng dẫn viên bản địa · ${tour.guide.regionName || tour.province}`}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-ink">
                    Guide {tour.guide.fullName}
                  </h3>
                  <div className="text-sm text-ink-3">
                    Chuyên tuyến {tour.guide.regionName || tour.province}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-lg bg-surface-2 border border-rule px-3 py-1.5 text-sm font-medium text-ink-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
                <span>Đồng hành trực tiếp</span>
              </span>
            </div>

            {tour.guide.bio && (
              <p className="text-base text-ink-2 leading-relaxed border-t border-rule pt-4">
                “{tour.guide.bio}”
              </p>
            )}
          </section>

          {/* Lịch trình theo ngày */}
          <section className="space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
              <div>
                <p className="text-sm font-medium text-ink-3">Chi tiết theo ngày</p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-ink mt-1">
                  Lịch trình chuẩn {tour.days} ngày
                </h2>
              </div>
              <span className="text-sm text-ink-2">
                Mọi chặng đều có thể thay đổi hoặc bỏ bớt khi đặt
              </span>
            </div>

            <div className="space-y-5">
              {dayGroups.map((dayGroup) => (
                <article key={dayGroup.dayNumber} className="flagship-card">
                  <div className="bg-surface-2 border-b border-rule px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-ink">
                        Ngày {String(dayGroup.dayNumber).padStart(2, '0')}
                      </span>
                      <span className="text-sm text-ink-3">
                        {dayGroup.items.length} dịch vụ chuẩn
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-ink-3 mr-2">Tạm tính ngày:</span>
                      <span className="num text-lg font-semibold text-ink">
                        {formatVnd(dayGroup.subtotal)}
                      </span>
                      <span className="text-sm text-ink-3"> /khách</span>
                    </div>
                  </div>

                  <div className="divide-y divide-rule">
                    {dayGroup.items.map((s, idx) => (
                      <div
                        key={`${dayGroup.dayNumber}-${idx}-${s.title}`}
                        className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 bg-surface"
                      >
                        <button
                          type="button"
                          onClick={() => openStepPhoto(s)}
                          className="relative w-full sm:w-32 h-36 sm:h-[88px] rounded-lg overflow-hidden border border-rule shrink-0 group cursor-pointer bg-surface-2"
                          title={`Phóng to ảnh: ${s.title}`}
                        >
                          <SafeImage
                            src={s.imageUrl || tour.imageUrl}
                            alt={s.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center text-white">
                            <ZoomInIcon size={20} />
                          </span>
                        </button>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <span className="inline-flex items-center gap-2 rounded-md border border-rule bg-surface-2 px-2.5 py-0.5 text-sm font-medium text-ink-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${categoryDotClass(s.category)}`} />
                            <span>{s.category}</span>
                          </span>
                          <div className="text-[17px] sm:text-lg font-semibold text-ink leading-snug">
                            {s.title}
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <div className="num text-lg font-semibold text-ink">
                            {formatVnd(s.pricePerPerson)}
                          </div>
                          <div className="text-sm text-ink-3">/ khách</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* Cột phải (4): Sticky Concierge Box */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24">
          <div className="flagship-card p-6 space-y-5">
            <div className="space-y-1 border-b border-rule pb-4">
              <span className="text-sm font-medium text-ink-3">Đơn giá chuẩn tham khảo</span>
              <div className="flex items-baseline gap-2">
                <span className="num text-[28px] font-semibold text-ink">
                  {formatVnd(tour.basePricePerPerson)}
                </span>
                <span className="text-base text-ink-2">/ khách</span>
              </div>
            </div>

            <dl className="divide-y divide-rule text-[15px]">
              <div className="py-3 flex items-center justify-between gap-2">
                <dt className="text-ink-2">Thời lượng</dt>
                <dd className="num font-medium text-ink">{tour.days} ngày</dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-2">
                <dt className="text-ink-2">Vùng hành trình</dt>
                <dd className="font-medium text-ink">{tour.regionName}</dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-2">
                <dt className="text-ink-2">Hướng dẫn viên</dt>
                <dd className="font-medium text-ink">{tour.guide.fullName}</dd>
              </div>
            </dl>

            <p className="text-sm text-ink-2 leading-relaxed bg-surface-2 rounded-lg p-4 border border-rule">
              Bạn có thể giữ nguyên lịch chuẩn để chốt ngay, hoặc tuỳ chỉnh từng dịch vụ và nhận
              báo giá chi tiết từ Guide {tour.guide.fullName}.
            </p>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => onCustomize(tour)}
                className="btn btn-primary w-full justify-center !py-3.5 text-base font-semibold"
              >
                <span>Tuỳ chỉnh & Đặt chuyến này</span>
                <ArrowRightIcon size={18} />
              </button>

              <button
                type="button"
                onClick={() => openGalleryAt(0)}
                className="btn btn-ghost w-full justify-center text-[15px] font-medium"
              >
                <CameraIcon size={16} />
                <span>Xem trọn bộ {photos.length} ảnh thực tế</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      <TravelPhotoLightbox
        photos={customLightboxPhotos ?? photos}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        regionTitle={`${tour.regionName} · ${tour.title}`}
      />
    </div>
  );
}

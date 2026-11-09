import { useEffect, useState } from 'react';
import {
  createBooking,
  customizeBooking,
  formatVnd,
  getOptionsByRegion,
  type Booking,
  type BookingStep,
  type PresetOption,
  type Tour,
  type User,
} from '../api';

interface Props {
  tour: Tour;
  customer: User;
  /** Nếu truyền existingBooking vào -> Khách đang sửa lại một đơn đã đặt trước đó. */
  existingBooking?: Booking | null;
  onClose: () => void;
  onSubmitted: (booking: Booking) => void;
}

const QUICK_CUSTOM_CHIPS = [
  '🎂 Tổ chức sinh nhật / kỷ niệm tại phòng',
  '🔥 Thêm tiệc nướng BBQ tối riêng cho đoàn',
  '📸 Thuê thợ chụp ảnh đi cùng đoàn',
  '🥗 Thực đơn ăn chay / kiêng hải sản',
];

function categoryIcon(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('di chuyển') || c.includes('xe')) return '🚌';
  if (c.includes('khách sạn') || c.includes('lưu trú') || c.includes('resort')) return '🏨';
  if (c.includes('ăn') || c.includes('ẩm thực')) return '🍲';
  if (c.includes('yêu cầu')) return '✨';
  return '🎟️';
}

export default function CustomerCustomizeModal({
  tour,
  customer,
  existingBooking,
  onClose,
  onSubmitted,
}: Props) {
  const defaultDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const [options, setOptions] = useState<PresetOption[]>([]);
  const [startDate, setStartDate] = useState(existingBooking?.startDate || defaultDate);
  const [days, setDays] = useState(existingBooking?.days || tour.days);
  const [guests, setGuests] = useState(existingBooking?.guests || 2);
  const [customerNote, setCustomerNote] = useState(existingBooking?.customerNote || '');

  // Danh sách các dòng hoạt động trong lịch trình
  const [steps, setSteps] = useState<BookingStep[]>(() => {
    if (existingBooking) {
      return existingBooking.steps.map((s) => ({
        ...s,
        originalTitle: s.originalTitle ?? s.title,
        originalPricePerPerson: s.originalPricePerPerson ?? s.pricePerPerson,
      }));
    }
    return tour.steps.map((s) => ({
      dayNumber: s.dayNumber,
      category: s.category,
      title: s.title,
      pricePerPerson: s.pricePerPerson,
      originalTitle: s.title,
      originalPricePerPerson: s.pricePerPerson,
      noteType: 'PRESET',
    }));
  });

  // Trạng thái đang mở bảng "Đổi lựa chọn khác" cho dòng thứ idx
  const [swappingIdx, setSwappingIdx] = useState<number | null>(null);
  // Trạng thái đang mở bảng "+ Thêm hoạt động có sẵn" cho Ngày thứ d
  const [addingPresetDay, setAddingPresetDay] = useState<number | null>(null);

  // Ô nhập nhanh yêu cầu mới của khách cho từng ngày
  const [customDraft, setCustomDraft] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getOptionsByRegion(tour.regionId).then(setOptions);
  }, [tour.regionId]);

  // Chỉ tính các hoạt động nằm trong số ngày đi đã chọn
  const activeSteps = steps.filter((s) => s.dayNumber <= days);

  // Kiểm tra xem có ô nháp nào khách đang gõ dở không
  const hasPendingDraft = Object.entries(customDraft).some(
    ([d, text]) => Number(d) <= days && text.trim().length > 0
  );

  // Khách chỉ thực sự thay đổi lịch trình khi đổi số ngày, đổi/bỏ/thêm hoạt động (ghi lời nhắn dặn dò vẫn giữ giá gốc!)
  const isModifiedFromOriginal =
    days !== tour.days ||
    activeSteps.length !== tour.steps.length ||
    activeSteps.some((s) => s.noteType !== 'PRESET') ||
    hasPendingDraft;

  const estimatedPerPerson = activeSteps
    .filter((s) => s.noteType !== 'REMOVED')
    .reduce((sum, s) => sum + (Number(s.pricePerPerson) || 0), 0);
  const estimatedTotal = estimatedPerPerson * guests;
  const priceDiffPerPerson = estimatedPerPerson - tour.basePricePerPerson;

  const hasCustomUnpriced =
    activeSteps.some((s) => s.noteType === 'CUSTOM' && s.pricePerPerson === 0) ||
    hasPendingDraft;

  const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

  // 1. Đổi sang lựa chọn khác (Thay thế trực tiếp vào mục đang chọn, KHÔNG cộng dồn 2 khách sạn)
  const handleSwapStepWithOption = (idx: number, opt: PresetOption) => {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const origTitle = s.originalTitle ?? s.title;
        const origPrice = s.originalPricePerPerson ?? s.pricePerPerson;
        const isSameAsOriginal = opt.title === origTitle && opt.pricePerPerson === origPrice;
        return {
          ...s,
          category: opt.category,
          title: opt.title,
          pricePerPerson: opt.pricePerPerson,
          originalTitle: origTitle,
          originalPricePerPerson: origPrice,
          noteType: isSameAsOriginal ? 'PRESET' : 'MODIFIED',
        };
      })
    );
    setSwappingIdx(null);
  };

  // Khôi phục 1 mục đã đổi hoặc đã bỏ về mặc định ban đầu
  const handleRestoreStepToOriginal = (idx: number) => {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        return {
          ...s,
          title: s.originalTitle || s.title,
          pricePerPerson: s.originalPricePerPerson ?? s.pricePerPerson,
          noteType: 'PRESET',
        };
      })
    );
    if (swappingIdx === idx) setSwappingIdx(null);
  };

  // 2. Bấm [✕ Bỏ mục này] -> Gạch ngang (REMOVED, giá 0đ) và hiện nút [↺ Giữ lại]
  const handleSoftRemoveOrDeleteStep = (idx: number) => {
    setSteps((prev) => {
      const target = prev[idx];
      if (!target) return prev;
      // Nếu là mục khách mới tự thêm ngoài lịch trình chuẩn -> Xoá hẳn khỏi danh sách
      if (target.noteType === 'CUSTOM' || !target.originalTitle) {
        return prev.filter((_, i) => i !== idx);
      }
      // Nếu là mục có trong lịch trình gốc -> Đánh dấu REMOVED (0đ) để có thể bấm [↺ Giữ lại]
      return prev.map((s, i) =>
        i === idx
          ? {
              ...s,
              originalTitle: s.originalTitle ?? s.title,
              originalPricePerPerson: s.originalPricePerPerson ?? s.pricePerPerson,
              pricePerPerson: 0,
              noteType: 'REMOVED',
            }
          : s
      );
    });
    if (swappingIdx === idx) setSwappingIdx(null);
  };

  // 3. Thêm 1 hoạt động có sẵn vào ngày (dành cho trường hợp muốn đi thêm điểm mới)
  const handleAddExtraPresetOption = (dayNumber: number, opt: PresetOption) => {
    setSteps((prev) => [
      ...prev,
      {
        dayNumber,
        category: opt.category,
        title: opt.title,
        pricePerPerson: opt.pricePerPerson,
        originalTitle: null,
        originalPricePerPerson: null,
        noteType: 'MODIFIED',
      },
    ]);
    setAddingPresetDay(null);
  };

  // 4. Thêm yêu cầu riêng từ thẻ 1 chạm hoặc ô nhập
  const handleAddCustomRequestText = (dayNumber: number, rawText: string) => {
    const text = rawText.trim();
    if (!text) return;
    setSteps((prev) => [
      ...prev,
      {
        dayNumber,
        category: 'Yêu cầu thêm',
        title: text,
        pricePerPerson: 0,
        originalTitle: null,
        originalPricePerPerson: null,
        noteType: 'CUSTOM',
      },
    ]);
    setCustomDraft((prev) => ({ ...prev, [dayNumber]: '' }));
  };

  const handleResetToPreset = () => {
    setDays(tour.days);
    setSwappingIdx(null);
    setAddingPresetDay(null);
    setCustomDraft({});
    setSteps(
      tour.steps.map((s) => ({
        dayNumber: s.dayNumber,
        category: s.category,
        title: s.title,
        pricePerPerson: s.pricePerPerson,
        originalTitle: s.title,
        originalPricePerPerson: s.pricePerPerson,
        noteType: 'PRESET',
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // Tự động thu thập mọi nội dung khách đã gõ trong ô nháp nhưng quên bấm "+ Thêm"
      const autoSavedDraftSteps: BookingStep[] = [];
      for (let d = 1; d <= days; d++) {
        const draftText = (customDraft[d] || '').trim();
        if (draftText.length > 0) {
          autoSavedDraftSteps.push({
            dayNumber: d,
            category: 'Yêu cầu thêm',
            title: draftText,
            pricePerPerson: 0,
            originalTitle: null,
            originalPricePerPerson: null,
            noteType: 'CUSTOM',
          });
        }
      }

      const finalSteps = [
        ...steps.filter((s) => s.dayNumber <= days && s.title.trim().length > 0),
        ...autoSavedDraftSteps,
      ];

      const nonRemovedCount = finalSteps.filter((s) => s.noteType !== 'REMOVED').length;
      if (nonRemovedCount === 0) {
        throw new Error('Lịch trình cần giữ lại ít nhất 1 hoạt động.');
      }

      const finalCustomized =
        days !== tour.days ||
        finalSteps.length !== tour.steps.length ||
        finalSteps.some((s) => s.noteType !== 'PRESET');

      if (existingBooking) {
        const updated = await customizeBooking(existingBooking.id, {
          startDate,
          days,
          guests,
          customerNote,
          steps: finalSteps,
        });
        onSubmitted(updated);
      } else {
        const created = await createBooking({
          tourId: tour.id,
          customerId: customer.id,
          startDate,
          days,
          guests,
          customerNote,
          customized: finalCustomized,
          steps: finalSteps,
        });
        onSubmitted(created);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-2 sm:p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner đầu trang */}
        <div className="relative h-44 bg-gray-900 shrink-0">
          <img
            src={tour.imageUrl}
            alt={tour.title}
            className="w-full h-full object-cover opacity-80"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/95 hover:bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow cursor-pointer"
          >
            ✕ Đóng
          </button>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider bg-blue-600 px-2.5 py-0.5 rounded">
                  {tour.regionName} ({tour.province}) · Chuẩn {tour.days}N{tour.days - 1}Đ
                </span>
                <h2 className="text-xl font-bold mt-1">{tour.title}</h2>
                <p className="text-xs text-gray-200">
                  🧭 Tour Guide bản địa phụ trách: <strong>{tour.guide.fullName}</strong> (
                  {tour.guide.yearsExperience || 5} năm kinh nghiệm · ĐT: {tour.guide.phone})
                </p>
              </div>
              <div className="text-right bg-black/45 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/20">
                <span className="text-[11px] text-gray-300 block">Giá lịch trình chuẩn</span>
                <span className="text-lg font-extrabold text-amber-300">
                  {formatVnd(tour.basePricePerPerson)} / khách
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form đặt & tuỳ chỉnh */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Bước 1: Thông tin khởi hành */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Khách hàng đặt
              </label>
              <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg font-semibold text-gray-800 truncate">
                👤 {customer.fullName}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Ngày khởi hành *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Số khách tham gia *
              </label>
              <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 cursor-pointer"
                >
                  −
                </button>
                <span className="flex-1 text-center font-bold text-blue-700">
                  {guests} khách
                </span>
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.min(30, g + 1))}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Thời lượng (chuẩn {tour.days} ngày)
              </label>
              <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDays((d) => Math.max(1, d - 1))}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 cursor-pointer"
                >
                  −
                </button>
                <span className="flex-1 text-center font-bold text-gray-800">
                  {days} ngày
                </span>
                <button
                  type="button"
                  onClick={() => setDays((d) => Math.min(7, d + 1))}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Bước 2: Timeline Lịch trình trực quan — Xem trước, bấm nút để Đổi hoặc Bỏ */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Lịch trình chi tiết từng ngày
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Ưng ý lịch trình chuẩn? Bạn chỉ cần bấm <strong>Đặt ngay</strong> ở cuối trang. Muốn thay đổi mục nào, hãy bấm nút{' '}
                  <span className="font-semibold text-blue-700">🔄 Đổi lựa chọn khác</span> hoặc{' '}
                  <span className="font-semibold text-rose-600">✕ Bỏ mục này</span>.
                </p>
              </div>
              {isModifiedFromOriginal && (
                <button
                  type="button"
                  onClick={handleResetToPreset}
                  className="px-3 py-1.5 rounded-lg bg-white border border-blue-300 text-xs text-blue-700 hover:bg-blue-50 font-bold cursor-pointer shadow-2xs"
                >
                  ↺ Khôi phục toàn bộ về lịch trình gốc
                </button>
              )}
            </div>

            {dayNumbers.map((day) => {
              const daySteps = steps
                .map((s, idx) => ({ ...s, idx }))
                .filter((s) => s.dayNumber === day);

              return (
                <div
                  key={day}
                  className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-extrabold">
                        NGÀY {day}
                      </span>
                      {day > tour.days && (
                        <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                          Ngày mở rộng thêm
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {daySteps.filter((s) => s.noteType !== 'REMOVED').length} hoạt động được chọn
                    </span>
                  </div>

                  {/* Thông báo thân thiện nếu khách vừa tăng thêm ngày mới chưa có hoạt động */}
                  {daySteps.length === 0 && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                      ✨ <strong>Bạn vừa thêm Ngày {day} vào chuyến đi!</strong> Hãy bấm chọn hoạt động gợi ý bên dưới hoặc gõ mong muốn của bạn để Tour Guide sắp xếp lịch trình Ngày {day} giúp đoàn nhé.
                    </div>
                  )}

                  {/* Danh sách các thẻ hoạt động trong ngày (Timeline Cards) */}
                  <div className="space-y-2.5">
                    {daySteps.map((st) => {
                      const isRemoved = st.noteType === 'REMOVED';
                      const isModified = st.noteType === 'MODIFIED';
                      const isCustom = st.noteType === 'CUSTOM';
                      const isSwappingThis = swappingIdx === st.idx;

                      // Lọc các lựa chọn cùng danh mục trước, nếu không có thì hiển thị toàn bộ gợi ý vùng
                      const sameCategoryOptions = options.filter(
                        (o) => o.category.toLowerCase() === st.category.toLowerCase()
                      );
                      const swapCandidates =
                        sameCategoryOptions.length > 0 ? sameCategoryOptions : options;

                      const basePriceForDiff =
                        st.originalPricePerPerson ?? st.pricePerPerson;

                      return (
                        <div key={st.idx} className="space-y-2">
                          <div
                            className={`rounded-xl p-3 border transition-all flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 ${
                              isRemoved
                                ? 'bg-gray-50 border-gray-200 opacity-65'
                                : isCustom
                                ? 'bg-purple-50/70 border-purple-300'
                                : isModified
                                ? 'bg-amber-50/70 border-amber-300'
                                : 'bg-gray-50/60 border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            {/* Cột trái: Icon danh mục + Tên hoạt động + Dòng so sánh gốc */}
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 shrink-0 shadow-2xs">
                                {categoryIcon(st.category)} {st.category}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`text-sm font-bold ${
                                      isRemoved
                                        ? 'line-through text-gray-400'
                                        : 'text-gray-900'
                                    }`}
                                  >
                                    {st.title}
                                  </span>

                                  {isModified && (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                                      🔄 Đã đổi lựa chọn
                                    </span>
                                  )}
                                  {isRemoved && (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                                      ✕ Đã bỏ mục này
                                    </span>
                                  )}
                                  {isCustom && (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-200/80 text-purple-900">
                                      ✨ Yêu cầu thêm
                                    </span>
                                  )}
                                </div>

                                {/* Nếu đã đổi từ mục gốc -> Hiện rõ "Đã đổi từ: ..." để khách không bao giờ nhầm */}
                                {isModified && st.originalTitle && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Đã thay thế cho:{' '}
                                    <span className="line-through">
                                      {st.originalTitle} (
                                      {formatVnd(st.originalPricePerPerson)}/khách)
                                    </span>
                                  </p>
                                )}
                                {isRemoved && st.originalPricePerPerson != null && (
                                  <p className="text-xs text-rose-600 mt-0.5">
                                    Đã giảm trừ {formatVnd(st.originalPricePerPerson)}/khách khỏi lịch trình gốc
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Cột phải: Đơn giá & Nút thao tác 1 chạm */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <div className="text-right mr-1">
                                {isRemoved ? (
                                  <span className="text-xs font-bold text-gray-400">
                                    0đ (Đã bỏ)
                                  </span>
                                ) : isCustom && st.pricePerPerson === 0 ? (
                                  <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200">
                                    ⏳ Chờ Guide báo giá
                                  </span>
                                ) : (
                                  <span className="text-sm font-extrabold text-blue-700">
                                    {formatVnd(st.pricePerPerson)}
                                    <span className="text-xs font-normal text-gray-500">
                                      /khách
                                    </span>
                                  </span>
                                )}
                              </div>

                              {/* Nút Đổi lựa chọn khác (chỉ hiện cho mục chưa bị bỏ và không phải yêu cầu tự gõ) */}
                              {!isRemoved && !isCustom && swapCandidates.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSwappingIdx(isSwappingThis ? null : st.idx)
                                  }
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                    isSwappingThis
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-300'
                                  }`}
                                >
                                  🔄 {isSwappingThis ? 'Đóng bảng đổi' : 'Đổi lựa chọn khác'}
                                </button>
                              )}

                              {/* Nếu mục đã bị đổi -> Hiện nút khôi phục về mặc định */}
                              {isModified && st.originalTitle && (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreStepToOriginal(st.idx)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 cursor-pointer"
                                  title="Quay lại lựa chọn mặc định của Tour"
                                >
                                  ↺ Mặc định
                                </button>
                              )}

                              {/* Nút Bỏ mục này HOẶC Giữ lại */}
                              {isRemoved ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreStepToOriginal(st.idx)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs"
                                >
                                  ↺ Giữ lại mục này
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSoftRemoveOrDeleteStep(st.idx)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                                >
                                  ✕ Bỏ mục này
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Hộp chọn "Đổi lựa chọn khác" sổ xuống ngay bên dưới mục đang chọn */}
                          {isSwappingThis && (
                            <div className="bg-blue-50/90 border-2 border-blue-300 rounded-xl p-3.5 space-y-2.5 ml-2 sm:ml-6">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-900">
                                  🔄 Chọn dịch vụ thay thế cho "{st.originalTitle || st.title}" (Hệ thống sẽ tự động đổi, không bị trùng lặp):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSwappingIdx(null)}
                                  className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                                >
                                  ✕ Đóng
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {swapCandidates.map((opt) => {
                                  const diff = opt.pricePerPerson - basePriceForDiff;
                                  const isSelected = st.title === opt.title;
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => handleSwapStepWithOption(st.idx, opt)}
                                      className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                        isSelected
                                          ? 'bg-blue-600 text-white border-blue-700 font-bold'
                                          : 'bg-white hover:border-blue-500 border-gray-200 text-gray-800'
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <span className="text-xs font-bold block truncate">
                                          {opt.title}
                                        </span>
                                        <span
                                          className={`text-[11px] ${
                                            isSelected ? 'text-blue-100' : 'text-gray-500'
                                          }`}
                                        >
                                          Đơn giá: {formatVnd(opt.pricePerPerson)}/khách
                                        </span>
                                      </div>

                                      <span
                                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded shrink-0 ${
                                          isSelected
                                            ? 'bg-white/20 text-white'
                                            : diff > 0
                                            ? 'bg-amber-100 text-amber-900'
                                            : diff < 0
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}
                                      >
                                        {diff > 0
                                          ? `+${formatVnd(diff)}`
                                          : diff < 0
                                          ? `${formatVnd(diff)}`
                                          : 'Bằng giá gốc'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Khu vực Thêm hoạt động hoặc Yêu cầu riêng cho Ngày này */}
                  <div className="pt-2 border-t border-gray-100 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-gray-500 mr-1">
                        ⚡ Bấm 1 chạm để thêm nhanh vào Ngày {day}:
                      </span>

                      {options.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setAddingPresetDay(addingPresetDay === day ? null : day)
                          }
                          className="text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full cursor-pointer"
                        >
                          + Thêm điểm tham quan / dịch vụ có sẵn
                        </button>
                      )}

                      {QUICK_CUSTOM_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleAddCustomRequestText(day, chip)}
                          className="text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer font-medium"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>

                    {/* Nếu khách mở bảng "+ Thêm điểm tham quan / dịch vụ có sẵn" */}
                    {addingPresetDay === day && options.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-700">
                            Chọn dịch vụ có sẵn tại {tour.regionName} để cộng thêm vào Ngày {day}:
                          </span>
                          <button
                            type="button"
                            onClick={() => setAddingPresetDay(null)}
                            className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                          >
                            ✕ Đóng
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {options.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleAddExtraPresetOption(day, opt)}
                              className="text-xs bg-white hover:bg-blue-50 hover:border-blue-400 border border-gray-300 text-gray-800 px-3 py-1.5 rounded-lg cursor-pointer font-medium"
                            >
                              + {opt.title} ({formatVnd(opt.pricePerPerson)}/khách)
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ô tự gõ thêm yêu cầu riêng của khách vào ngày này (tự động lưu cả khi quên bấm nút + Thêm) */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customDraft[day] || ''}
                        onChange={(e) =>
                          setCustomDraft((prev) => ({ ...prev, [day]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomRequestText(day, customDraft[day] || '');
                          }
                        }}
                        placeholder={`Hoặc tự gõ yêu cầu riêng cho Ngày ${day} tại đây (VD: Muốn ghé chợ hải sản mua quà, thuê xe máy riêng...)`}
                        className="flex-1 bg-gray-50 focus:bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:border-purple-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleAddCustomRequestText(day, customDraft[day] || '')
                        }
                        className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer shrink-0"
                      >
                        + Thêm vào Ngày {day}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ghi chú dặn dò chung (Không làm mất trạng thái Giá chuẩn nếu khách không sửa lịch trình) */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
            <label className="block font-bold text-gray-800 mb-1">
              💬 Lời nhắn dặn dò gửi cho Tour Guide {tour.guide.fullName} (Không bắt buộc)
            </label>
            <textarea
              rows={2}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="VD: Đoàn có trẻ nhỏ và người lớn tuổi, nhờ Guide sắp xếp giờ giấc thư thả..."
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm"
            />
            <span className="text-[11px] text-gray-500 mt-1 block">
              * Nếu bạn giữ nguyên lịch trình chuẩn và chỉ ghi lời nhắn dặn dò tại đây, đơn vẫn được giữ nguyên mức Giá chuẩn ban đầu.
            </span>
          </div>

          {/* Thanh tổng kết giá & Nút Đặt Tour */}
          <div
            className={`rounded-xl p-4 border-2 flex flex-wrap items-center justify-between gap-4 ${
              isModifiedFromOriginal
                ? 'bg-amber-50/90 border-amber-300'
                : 'bg-emerald-50/90 border-emerald-300'
            }`}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded ${
                    isModifiedFromOriginal
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  {isModifiedFromOriginal
                    ? '✨ Lịch trình đã tuỳ chỉnh → Tour Guide sẽ kiểm tra & báo giá chốt'
                    : '✓ Giữ nguyên lịch trình chuẩn của Tour'}
                </span>

                {isModifiedFromOriginal && priceDiffPerPerson !== 0 && (
                  <span className="text-xs font-bold text-gray-700">
                    (Chênh lệch dự kiến:{' '}
                    {priceDiffPerPerson > 0
                      ? `+${formatVnd(priceDiffPerPerson)}`
                      : formatVnd(priceDiffPerPerson)}
                    /khách so với giá chuẩn)
                  </span>
                )}
              </div>

              <p className="text-xl font-extrabold text-gray-900">
                Tổng tạm tính: {formatVnd(estimatedPerPerson)}/khách × {guests} khách ={' '}
                <span className="text-blue-700">{formatVnd(estimatedTotal)}</span>
              </p>

              {hasCustomUnpriced && (
                <p className="text-xs font-semibold text-purple-800">
                  * Bạn có yêu cầu thêm mới chưa có sẵn đơn giá — Tour Guide {tour.guide.fullName} sẽ điền giá chi tiết và gửi lại cho bạn duyệt.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-2.5 rounded-xl text-white text-sm font-extrabold shadow-sm cursor-pointer disabled:opacity-50 ${
                  isModifiedFromOriginal
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitting
                  ? 'Đang gửi yêu cầu...'
                  : existingBooking
                  ? '📨 Lưu lịch trình & Gửi Guide báo giá lại'
                  : isModifiedFromOriginal
                  ? '📨 Gửi lịch trình tuỳ chỉnh & Nhờ Guide báo giá'
                  : '✓ Đặt ngay theo lịch trình chuẩn'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

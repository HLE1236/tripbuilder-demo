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

  // Danh sách các dòng hoạt động khách đang tuỳ chỉnh
  const [steps, setSteps] = useState<BookingStep[]>(() => {
    if (existingBooking) {
      return existingBooking.steps.map((s) => ({ ...s }));
    }
    return tour.steps.map((s) => ({
      dayNumber: s.dayNumber,
      category: s.category,
      title: s.title,
      pricePerPerson: s.pricePerPerson,
      noteType: 'PRESET',
    }));
  });

  // Ô nhập nhanh yêu cầu mới của khách cho từng ngày
  const [customDraft, setCustomDraft] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getOptionsByRegion(tour.regionId).then(setOptions);
  }, [tour.regionId]);

  // Kiểm tra xem khách đã thay đổi gì so với Tour Preset gốc chưa
  const isModifiedFromOriginal =
    days !== tour.days ||
    customerNote.trim().length > 0 ||
    steps.length !== tour.steps.length ||
    steps.some((s) => s.noteType !== 'PRESET');

  const estimatedPerPerson = steps.reduce((sum, s) => sum + (Number(s.pricePerPerson) || 0), 0);
  const estimatedTotal = estimatedPerPerson * guests;
  const hasCustomUnpriced = steps.some((s) => s.noteType === 'CUSTOM' && s.pricePerPerson === 0);

  const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

  const handleEditStepTitle = (idx: number, newTitle: string) => {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === idx
          ? {
              ...s,
              title: newTitle,
              noteType: s.noteType === 'CUSTOM' ? 'CUSTOM' : 'MODIFIED',
            }
          : s
      )
    );
  };

  const handleRemoveStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddPresetOption = (dayNumber: number, opt: PresetOption) => {
    setSteps((prev) => [
      ...prev,
      {
        dayNumber,
        category: opt.category,
        title: `Thêm/Đổi: ${opt.title}`,
        pricePerPerson: opt.pricePerPerson,
        noteType: 'MODIFIED',
      },
    ]);
  };

  const handleAddCustomRequest = (dayNumber: number) => {
    const text = (customDraft[dayNumber] || '').trim();
    if (!text) return;
    setSteps((prev) => [
      ...prev,
      {
        dayNumber,
        category: 'Yêu cầu thêm',
        title: text,
        pricePerPerson: 0, // Giá = 0 để chờ Tour Guide báo giá lại
        noteType: 'CUSTOM',
      },
    ]);
    setCustomDraft((prev) => ({ ...prev, [dayNumber]: '' }));
  };

  const handleResetToPreset = () => {
    setDays(tour.days);
    setCustomerNote('');
    setSteps(
      tour.steps.map((s) => ({
        dayNumber: s.dayNumber,
        category: s.category,
        title: s.title,
        pricePerPerson: s.pricePerPerson,
        noteType: 'PRESET',
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const validSteps = steps.filter((s) => s.dayNumber <= days && s.title.trim().length > 0);
      if (validSteps.length === 0) {
        throw new Error('Lịch trình cần có ít nhất 1 hoạt động.');
      }

      if (existingBooking) {
        const updated = await customizeBooking(existingBooking.id, {
          startDate,
          days,
          guests,
          customerNote,
          steps: validSteps,
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
          customized: isModifiedFromOriginal,
          steps: validSteps,
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
      className="fixed inset-0 bg-black/55 flex items-center justify-center p-3 sm:p-4 z-50"
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
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider bg-blue-600 px-2 py-0.5 rounded">
                  {tour.regionName} ({tour.province})
                </span>
                <h2 className="text-xl font-bold mt-1">{tour.title}</h2>
                <p className="text-xs text-gray-200">
                  Tour Guide bản địa: <strong>{tour.guide.fullName}</strong> ({tour.guide.phone})
                </p>
              </div>
              <div className="text-right bg-black/40 backdrop-blur-xs px-3 py-2 rounded-lg border border-white/20">
                <span className="text-[11px] text-gray-300 block">Giá gốc Tour Preset</span>
                <span className="text-lg font-extrabold text-amber-300">
                  {formatVnd(tour.basePricePerPerson)} / khách
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nội dung chỉnh sửa & đặt tour */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Thông số chuyến đi */}
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
              <input
                type="number"
                min={1}
                max={30}
                required
                value={guests}
                onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 font-bold text-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Số ngày đi (chuẩn {tour.days} ngày)
              </label>
              <input
                type="number"
                min={1}
                max={7}
                required
                value={days}
                onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 font-medium"
              />
            </div>
          </div>

          {/* Khu vực Lịch trình: Cho phép giữ nguyên hoặc tự chỉnh sửa theo ý muốn */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Lịch trình chuyến đi — Bạn có thể giữ nguyên hoặc chỉnh sửa trực tiếp bên dưới
                </h3>
                <p className="text-xs text-gray-500">
                  Sửa trực tiếp chữ trên từng dòng, bấm <strong>✕ Bỏ</strong> mục không thích, chọn từ gợi ý hoặc tự gõ thêm yêu cầu mới.
                </p>
              </div>
              {isModifiedFromOriginal && (
                <button
                  type="button"
                  onClick={handleResetToPreset}
                  className="text-xs text-blue-700 hover:underline font-medium cursor-pointer"
                >
                  ↺ Khôi phục về lịch trình gốc
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
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-md bg-gray-900 text-white text-xs font-bold">
                      NGÀY {day}
                    </span>
                    <span className="text-xs text-gray-500">
                      {daySteps.length} hoạt động trong Ngày {day}
                    </span>
                  </div>

                  {/* Danh sách các dòng hoạt động trong ngày */}
                  <div className="space-y-2">
                    {daySteps.map((st) => (
                      <div
                        key={st.idx}
                        className={`rounded-lg p-2.5 border flex flex-wrap sm:flex-nowrap items-center gap-2 text-sm ${
                          st.noteType === 'CUSTOM'
                            ? 'bg-purple-50/70 border-purple-300'
                            : st.noteType === 'MODIFIED'
                            ? 'bg-amber-50/70 border-amber-300'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700 shrink-0">
                          {st.category}
                        </span>

                        <input
                          type="text"
                          value={st.title}
                          onChange={(e) => handleEditStepTitle(st.idx, e.target.value)}
                          className="flex-1 min-w-[200px] bg-white border border-gray-300 rounded px-2.5 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                        />

                        <div className="text-right shrink-0 min-w-[130px]">
                          {st.noteType === 'CUSTOM' && st.pricePerPerson === 0 ? (
                            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded">
                              Chờ Guide báo giá
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-gray-700">
                              {formatVnd(st.pricePerPerson)}/khách
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveStep(st.idx)}
                          className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded font-medium cursor-pointer shrink-0"
                          title="Bỏ mục này khỏi lịch trình"
                        >
                          ✕ Bỏ
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Hàng 1: Gợi ý đổi/thêm dịch vụ có sẵn của khu vực */}
                  {options.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-gray-500 mr-1">
                        + Chọn thêm / Đổi dịch vụ có sẵn:
                      </span>
                      {options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleAddPresetOption(day, opt)}
                          className="text-[11px] bg-white hover:bg-amber-50 hover:border-amber-400 border border-gray-300 text-gray-700 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          + {opt.title} ({formatVnd(opt.pricePerPerson)})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Hàng 2: Ô tự gõ thêm yêu cầu riêng của khách vào ngày này */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={customDraft[day] || ''}
                      onChange={(e) =>
                        setCustomDraft((prev) => ({ ...prev, [day]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomRequest(day);
                        }
                      }}
                      placeholder={`Tự gõ thêm hoạt động / yêu cầu riêng cho Ngày ${day} (VD: Muốn ăn tối BBQ trên bãi biển, thuê xe máy riêng...)`}
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustomRequest(day)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer shrink-0"
                    >
                      + Thêm vào Ngày {day}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ghi chú chung */}
          <div className="text-sm">
            <label className="block font-bold text-gray-800 mb-1">
              Lời nhắn / Yêu cầu đặc biệt gửi cho Tour Guide {tour.guide.fullName}
            </label>
            <textarea
              rows={2}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="VD: Đoàn có người lớn tuổi, mong Guide sắp xếp lịch trình thư thả, đổi khách sạn gần biển..."
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm"
            />
          </div>

          {/* Thanh tổng kết giá & Nút Book */}
          <div
            className={`rounded-xl p-4 border flex flex-wrap items-center justify-between gap-4 ${
              isModifiedFromOriginal
                ? 'bg-amber-50 border-amber-300'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    isModifiedFromOriginal
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  {isModifiedFromOriginal
                    ? 'Lịch trình đã chỉnh sửa theo ý muốn → Guide sẽ báo giá lại'
                    : 'Giữ nguyên lịch trình chuẩn của Tour Preset'}
                </span>
              </div>
              <p className="text-xl font-extrabold text-gray-900 mt-1">
                Tạm tính: {formatVnd(estimatedPerPerson)}/khách × {guests} khách ={' '}
                <span className="text-blue-700">{formatVnd(estimatedTotal)}</span>
              </p>
              {hasCustomUnpriced && (
                <p className="text-xs font-medium text-purple-800 mt-0.5">
                  * Bạn có mục mới tự gõ thêm, Tour Guide sẽ điền giá cụ thể và gửi Báo giá lại cho bạn.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 cursor-pointer"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-2.5 rounded-lg text-white text-sm font-bold shadow-sm cursor-pointer disabled:opacity-50 ${
                  isModifiedFromOriginal
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitting
                  ? 'Đang xử lý...'
                  : existingBooking
                  ? 'Gửi bản chỉnh sửa & Yêu cầu Báo giá lại'
                  : isModifiedFromOriginal
                  ? 'Book Tour & Yêu cầu Guide Báo giá lại'
                  : 'Book ngay theo Giá gốc'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

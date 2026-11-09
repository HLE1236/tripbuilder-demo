import { useEffect, useState } from 'react';
import {
  createTour,
  formatVnd,
  getOptionsByRegion,
  getRegions,
  updateTour,
  type PresetOption,
  type Region,
  type Tour,
  type TourStep,
} from '../api';

interface Props {
  guideId: number;
  guideName: string;
  /** Nếu truyền initialTour vào -> chế độ Chỉnh sửa Tour Preset đã đăng. */
  initialTour?: Tour | null;
  onCancel: () => void;
  onSaved: (tour: Tour) => void;
}

const CATEGORIES = ['Di chuyển', 'Khách sạn', 'Trải nghiệm', 'Ăn uống'];

export default function GuidePresetEditor({
  guideId,
  guideName,
  initialTour,
  onCancel,
  onSaved,
}: Props) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionId, setRegionId] = useState<number>(initialTour?.regionId || 0);
  const [options, setOptions] = useState<PresetOption[]>([]);

  const [title, setTitle] = useState(initialTour?.title || '');
  const [days, setDays] = useState(initialTour?.days || 2);
  const [description, setDescription] = useState(initialTour?.description || '');
  const [imageUrl, setImageUrl] = useState(initialTour?.imageUrl || '');
  const [steps, setSteps] = useState<TourStep[]>(
    initialTour?.steps.map((s) => ({ ...s })) || [
      { dayNumber: 1, category: 'Di chuyển', title: 'Xe đón đoàn & Guide bản địa đồng hành', pricePerPerson: 400000 },
      { dayNumber: 1, category: 'Khách sạn', title: 'Nhận phòng khách sạn nghỉ ngơi', pricePerPerson: 700000 },
      { dayNumber: 2, category: 'Trải nghiệm', title: 'Tham quan các điểm nổi bật & thưởng thức đặc sản', pricePerPerson: 500000 },
    ]
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getRegions().then((list) => {
      setRegions(list);
      if (!regionId && list.length > 0) {
        setRegionId(list[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!regionId) return;
    getOptionsByRegion(regionId).then(setOptions);
  }, [regionId]);

  const basePricePerPerson = steps.reduce((sum, s) => sum + (Number(s.pricePerPerson) || 0), 0);
  const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

  const addBlankStep = (dayNumber: number) => {
    setSteps((prev) => [
      ...prev,
      { dayNumber, category: 'Trải nghiệm', title: '', pricePerPerson: 300000 },
    ]);
  };

  const addOptionStep = (dayNumber: number, opt: PresetOption) => {
    setSteps((prev) => [
      ...prev,
      {
        dayNumber,
        category: opt.category,
        title: opt.title,
        pricePerPerson: opt.pricePerPerson,
      },
    ]);
  };

  const updateStep = (idx: number, patch: Partial<TourStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        guideId,
        regionId,
        title,
        description,
        imageUrl,
        days,
        steps,
      };
      const saved = initialTour
        ? await updateTour(initialTour.id, payload)
        : await createTour(payload);
      onSaved(saved);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
            {initialTour ? 'Chỉnh sửa Tour Preset' : 'Tour Guide đăng Tour mới'}
          </span>
          <h2 className="text-xl font-bold text-gray-900 mt-1">
            {initialTour ? `Sửa Tour: ${initialTour.title}` : 'Thiết kế Tour Preset mới'}
          </h2>
          <p className="text-xs text-gray-500">
            Tour Guide phụ trách: <strong>{guideName}</strong> · Giá gốc/khách được cộng tự động từ các hoạt động bên dưới.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          ✕ Đóng
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Thông tin cơ bản */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="sm:col-span-2">
          <label className="block font-semibold text-gray-700 mb-1">Tên Tour Preset *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Hạ Long 2N1Đ — Khám phá Vịnh & Chèo Kayak"
            className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Khu vực *</label>
            <select
              value={regionId}
              onChange={(e) => setRegionId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Số ngày *</label>
            <input
              type="number"
              min={1}
              max={7}
              required
              value={days}
              onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block font-semibold text-gray-700 mb-1">Mô tả ngắn về chuyến đi</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Giới thiệu điểm hấp dẫn nhất của lịch trình này..."
            className="w-full border border-gray-300 rounded-lg px-3.5 py-2"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Ảnh bìa (để trống tự lấy ảnh khu vực)
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono"
          />
        </div>
      </div>

      {/* Lịch trình theo từng ngày */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-gray-900 text-base">
            Lịch trình chuẩn theo từng ngày (Gõ trực tiếp hoặc bấm chọn nhanh gợi ý)
          </h3>
          <span className="text-xs text-gray-500">
            Mỗi dòng nhập đơn giá / 1 khách để khách dễ nhìn và dễ tuỳ chỉnh
          </span>
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-bold">
                  NGÀY {day}
                </span>
                <button
                  type="button"
                  onClick={() => addBlankStep(day)}
                  className="text-xs font-semibold text-blue-700 hover:bg-blue-100 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg cursor-pointer"
                >
                  + Tự gõ thêm dòng vào Ngày {day}
                </button>
              </div>

              {/* Các nút gợi ý chọn nhanh tại khu vực */}
              {options.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-gray-500 mr-1">Chèn nhanh:</span>
                  {options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => addOptionStep(day, opt)}
                      className="text-[11px] bg-white hover:bg-emerald-50 hover:border-emerald-400 border border-gray-300 text-gray-700 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                    >
                      + {opt.title} ({formatVnd(opt.pricePerPerson)})
                    </button>
                  ))}
                </div>
              )}

              {/* Danh sách các dòng hoạt động trong ngày */}
              {daySteps.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">
                  Chưa có hoạt động nào trong Ngày {day}. Hãy bấm chèn nhanh hoặc tự gõ thêm dòng.
                </p>
              ) : (
                <div className="space-y-2">
                  {daySteps.map((st) => (
                    <div
                      key={st.idx}
                      className="bg-white border border-gray-200 rounded-lg p-2.5 flex flex-wrap sm:flex-nowrap items-center gap-2 text-sm"
                    >
                      <select
                        value={st.category}
                        onChange={(e) => updateStep(st.idx, { category: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1.5 text-xs font-medium bg-gray-50 shrink-0"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        required
                        value={st.title}
                        onChange={(e) => updateStep(st.idx, { title: e.target.value })}
                        placeholder="Nhập nội dung hoạt động / khách sạn / xe / ăn uống..."
                        className="flex-1 min-w-[200px] border border-gray-300 rounded px-3 py-1.5 text-sm"
                      />

                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          step={50000}
                          min={0}
                          value={st.pricePerPerson}
                          onChange={(e) =>
                            updateStep(st.idx, { pricePerPerson: Number(e.target.value) || 0 })
                          }
                          className="w-28 border border-gray-300 rounded px-2.5 py-1.5 text-right font-semibold text-blue-700"
                        />
                        <span className="text-xs text-gray-500">đ/khách</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeStep(st.idx)}
                        className="text-xs text-red-600 hover:bg-red-50 px-2 py-1.5 rounded cursor-pointer shrink-0"
                        title="Xoá dòng này"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tổng giá gốc / khách & Nút lưu */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-emerald-800 block">
            Tổng Giá gốc của Tour Preset (1 khách)
          </span>
          <span className="text-2xl font-extrabold text-emerald-700">
            {formatVnd(basePricePerPerson)} / khách
          </span>
          <span className="text-xs text-emerald-700 ml-2">
            ({steps.length} hoạt động trong {days} ngày)
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 cursor-pointer"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={submitting || steps.length === 0}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs cursor-pointer disabled:opacity-50"
          >
            {submitting
              ? 'Đang lưu...'
              : initialTour
              ? 'Lưu cập nhật Tour Preset'
              : 'Đăng Tour Preset lên hệ thống'}
          </button>
        </div>
      </div>
    </form>
  );
}

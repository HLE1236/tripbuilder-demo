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
import Icon from './Icon';

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
    getRegions()
      .then((list) => {
        setRegions(list);
        if (!regionId && list.length > 0) {
          setRegionId(list[0].id);
        }
      })
      .catch(() => setRegions([]));
  }, []);

  useEffect(() => {
    if (!regionId) return;
    getOptionsByRegion(regionId)
      .then(setOptions)
      .catch(() => setOptions([]));
  }, [regionId]);

  const basePricePerPerson = steps
    .filter((s) => s.dayNumber <= days)
    .reduce((sum, s) => sum + (Number(s.pricePerPerson) || 0), 0);
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
      const validSteps = steps.filter((s) => s.dayNumber <= days && s.title.trim().length > 0);
      if (validSteps.length === 0) {
        throw new Error('Tour cần có ít nhất 1 hoạt động hợp lệ.');
      }
      const payload = {
        guideId,
        regionId,
        title,
        description,
        imageUrl,
        days,
        steps: validSteps,
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
      className="rounded-lg border border-hairline bg-stock shadow-coupon overflow-hidden"
    >
      <div className="bg-navy text-navy-ink px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="coupon-head text-[0.72rem] text-[#f2c14e]">
            {initialTour ? 'Cập nhật lịch trình chuẩn' : 'Soạn tour mới'} · Guide {guideName}
          </span>
          <h1 className="font-head text-2xl font-bold uppercase tracking-wide text-white mt-0.5">
            {initialTour ? initialTour.title : 'Thiết kế Tour mới'}
          </h1>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="btn btn-sm border-white/20 bg-white/10 text-white hover:bg-white/20"
        >
          <Icon name="x" size={14} />
          Đóng
        </button>
      </div>

      <div className="p-5 space-y-6">
        {error && (
          <div role="alert" className="rounded-md border border-red/40 bg-red-soft px-4 py-3 text-sm text-ink flex items-center gap-2">
            <Icon name="alert" size={16} className="text-red" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="sm:col-span-2">
            <label htmlFor="tour-title" className="block font-semibold text-ink mb-1">
              Tên tour *
            </label>
            <input
              id="tour-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Hạ Long 2N1Đ — Khám phá Vịnh & Chèo Kayak"
              className="field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tour-region" className="block font-semibold text-ink mb-1">
                Khu vực *
              </label>
              <select
                id="tour-region"
                value={regionId}
                onChange={(e) => setRegionId(Number(e.target.value))}
                className="field"
              >
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tour-days" className="block font-semibold text-ink mb-1">
                Số ngày *
              </label>
              <input
                id="tour-days"
                type="number"
                min={1}
                max={7}
                required
                value={days}
                onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
                className="field num"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="tour-desc" className="block font-semibold text-ink mb-1">
              Mô tả ngắn về chuyến đi
            </label>
            <input
              id="tour-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu điểm hấp dẫn nhất của lịch trình này..."
              className="field"
            />
          </div>

          <div>
            <label htmlFor="tour-img" className="block font-semibold text-ink mb-1">
              Ảnh bìa (trống = tự lấy ảnh vùng)
            </label>
            <input
              id="tour-img"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="field num text-xs"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-head text-xl font-bold uppercase tracking-wide text-ink">
              Các coupon hoạt động theo ngày
            </h2>
            <span className="text-xs text-ink-3">
              Nhập đơn giá mỗi khách trên từng dòng để hệ thống tự cộng tổng giá chuẩn.
            </span>
          </div>

          {dayNumbers.map((day) => {
            const daySteps = steps
              .map((s, idx) => ({ ...s, idx }))
              .filter((s) => s.dayNumber === day);

            return (
              <section
                key={day}
                aria-label={`Thiết kế ngày ${day}`}
                className="rounded-lg border border-hairline bg-stock-2/60 overflow-hidden"
              >
                <div className="bg-stock-2 px-4 py-2.5 border-b border-hairline flex flex-wrap items-center justify-between gap-2">
                  <span className="coupon-head text-sm text-ink">Coupon ngày {day}</span>
                  <button
                    type="button"
                    onClick={() => addBlankStep(day)}
                    className="btn btn-ghost btn-sm"
                  >
                    <Icon name="plus" size={14} />
                    Tự gõ thêm dòng vào Ngày {day}
                  </button>
                </div>

                {options.length > 0 && (
                  <div className="px-4 py-2.5 border-b border-hairline flex flex-wrap items-center gap-1.5">
                    <span className="coupon-head text-[0.7rem] text-ink-3 mr-1">Chèn nhanh:</span>
                    {options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => addOptionStep(day, opt)}
                        className="chip"
                      >
                        <Icon name="plus" size={12} />
                        {opt.title}
                        <span className="num text-xs text-carbon">{formatVnd(opt.pricePerPerson)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {daySteps.length === 0 ? (
                  <p className="px-4 py-4 text-xs text-ink-3">
                    Chưa có hoạt động nào trong Ngày {day}. Bấm chèn nhanh hoặc tự gõ thêm dòng.
                  </p>
                ) : (
                  <div className="divide-y divide-hairline bg-stock">
                    {daySteps.map((st) => (
                      <div
                        key={st.idx}
                        className="px-4 py-3 flex flex-wrap sm:flex-nowrap items-center gap-2.5"
                      >
                        <label className="sr-only" htmlFor={`preset-cat-${st.idx}`}>Danh mục</label>
                        <select
                          id={`preset-cat-${st.idx}`}
                          value={st.category}
                          onChange={(e) => updateStep(st.idx, { category: e.target.value })}
                          className="field w-auto py-1.5 text-xs font-medium shrink-0"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>

                        <label className="sr-only" htmlFor={`preset-title-${st.idx}`}>Nội dung hoạt động</label>
                        <input
                          id={`preset-title-${st.idx}`}
                          type="text"
                          required
                          value={st.title}
                          onChange={(e) => updateStep(st.idx, { title: e.target.value })}
                          placeholder="Nhập nội dung hoạt động / khách sạn / xe / ăn uống..."
                          className="field flex-1 min-w-[200px] py-1.5 text-sm"
                        />

                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className="sr-only" htmlFor={`preset-price-${st.idx}`}>Đơn giá mỗi khách</label>
                          <input
                            id={`preset-price-${st.idx}`}
                            type="number"
                            step={50000}
                            min={0}
                            value={st.pricePerPerson}
                            onChange={(e) =>
                              updateStep(st.idx, { pricePerPerson: Number(e.target.value) || 0 })
                            }
                            className="field num w-32 py-1.5 text-right font-bold text-carbon"
                          />
                          <span className="text-xs text-ink-3">đ/khách</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeStep(st.idx)}
                          aria-label="Xoá dòng này"
                          className="btn btn-danger btn-sm"
                        >
                          <Icon name="x" size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="perf-x pt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="coupon-head block text-[0.7rem] text-ink-3">
              Tổng giá lịch trình chuẩn (1 khách)
            </span>
            <span className="num text-2xl font-bold text-carbon">
              {formatVnd(basePricePerPerson)}
            </span>
            <span className="text-xs text-ink-3 ml-1.5">
              /khách ({steps.filter((s) => s.dayNumber <= days).length} hoạt động trong {days} ngày)
            </span>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="btn btn-ghost">
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting || steps.length === 0}
              className="btn btn-primary btn-lg"
            >
              <Icon name="check" size={16} />
              {submitting
                ? 'Đang lưu...'
                : initialTour
                ? 'Lưu cập nhật tour'
                : 'Đăng tour lên hệ thống'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

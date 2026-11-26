import { useEffect, useMemo, useState } from 'react';
import type { GuideApplication, GuideApplicationStatus } from '../../api';
import {
  AlertIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  SearchIcon,
  XIcon,
} from '../../components/icon';
import {
  useAdminGuideApplicationsQuery,
  useAdminRegionsQuery,
  useApproveGuideApplicationMutation,
  useRejectGuideApplicationMutation,
} from '../../hooks';
import { formatDateTime } from '../../utils/format';

const STATUS_FILTERS: { value: GuideApplicationStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Bị từ chối' },
];

function appStatusMeta(status: GuideApplicationStatus) {
  switch (status) {
    case 'APPROVED':
      return { label: 'Đã duyệt', tagClass: 'tag-forest', icon: CheckCircleIcon };
    case 'REJECTED':
      return { label: 'Bị từ chối', tagClass: 'tag-crimson', icon: AlertIcon };
    default:
      return { label: 'Chờ duyệt', tagClass: 'tag-ochre', icon: ClockIcon };
  }
}

export function GuideApplicationsPanel() {
  const [statusFilter, setStatusFilter] = useState<GuideApplicationStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GuideApplication | null>(null);
  const [targetRegionId, setTargetRegionId] = useState<string>('');
  const [reviewNote, setReviewNote] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const appsQuery = useAdminGuideApplicationsQuery(statusFilter);
  const regionsQuery = useAdminRegionsQuery();
  const approveMutation = useApproveGuideApplicationMutation();
  const rejectMutation = useRejectGuideApplicationMutation();

  const apps = appsQuery.data ?? [];
  const regions = regionsQuery.data ?? [];

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (a) =>
        a.applicationCode.toLowerCase().includes(q) ||
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.regionName.toLowerCase().includes(q)
    );
  }, [apps, search]);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  function openDetail(app: GuideApplication) {
    setSelected(app);
    setTargetRegionId(String(app.regionId));
    setReviewNote(app.reviewNote ?? '');
    setModalError(null);
  }

  async function handleApprove() {
    if (!selected) return;
    setModalError(null);
    const parsedRegion = Number(targetRegionId);
    try {
      await approveMutation.mutateAsync({
        id: selected.id,
        payload: {
          regionId: Number.isFinite(parsedRegion) && parsedRegion > 0 ? parsedRegion : undefined,
          reviewNote: reviewNote.trim() || undefined,
        },
      });
      setSelected(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Duyệt hồ sơ thất bại');
    }
  }

  async function handleReject() {
    if (!selected) return;
    setModalError(null);
    if (!reviewNote.trim()) {
      setModalError('Vui lòng nhập lý do từ chối hồ sơ để ứng viên biết cần bổ sung gì.');
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        id: selected.id,
        payload: { reviewNote: reviewNote.trim() },
      });
      setSelected(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Từ chối hồ sơ thất bại');
    }
  }

  const busy = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flagship-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
              className="chip"
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <SearchIcon
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã hồ sơ, tên, email..."
            className="field pl-9"
          />
        </div>
      </div>

      {appsQuery.error instanceof Error && (
        <div className="rounded-lg border border-crimson/30 bg-crimson-soft px-4 py-2.5 text-sm text-crimson flex items-center gap-2">
          <AlertIcon size={15} />
          <span>{appsQuery.error.message}</span>
        </div>
      )}

      {/* Table */}
      <div className="flagship-card overflow-x-auto">
        {appsQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-ink-2">
            Đang tải danh sách hồ sơ đăng ký HDV...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-2">
            Không có hồ sơ đăng ký Hướng dẫn viên nào phù hợp.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-rule bg-surface-2 text-xs text-ink-2">
                <th className="py-3 px-4 font-medium">Mã hồ sơ</th>
                <th className="py-3 px-4 font-medium">Ứng viên</th>
                <th className="py-3 px-4 font-medium">Vùng đề xuất</th>
                <th className="py-3 px-4 font-medium">Kinh nghiệm &amp; Thẻ HDV</th>
                <th className="py-3 px-4 font-medium">Trạng thái</th>
                <th className="py-3 px-4 font-medium">Ngày gửi</th>
                <th className="py-3 px-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule text-sm">
              {filteredApps.map((app) => {
                const st = appStatusMeta(app.status);
                const StIcon = st.icon;
                return (
                  <tr key={app.id} className="hover:bg-surface-2/60 transition">
                    <td className="py-3 px-4 num text-xs font-semibold text-ink">
                      {app.applicationCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-ink">{app.fullName}</div>
                      <div className="num text-xs text-ink-2">{app.email}</div>
                      <div className="num text-xs text-ink-3">{app.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-ink-2">
                      <div className="font-medium text-ink">{app.regionName}</div>
                      <div className="text-ink-3">{app.province}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-ink-2">
                      <div>
                        {app.yearsExperience != null ? `${app.yearsExperience} năm KN` : 'Chưa rõ KN'}
                      </div>
                      <div className="num text-ink-3">
                        {app.licenseNumber || 'Chưa cung cấp thẻ'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`tag ${st.tagClass} inline-flex items-center gap-1`}>
                        <StIcon size={12} />
                        <span>{st.label}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 num text-xs text-ink-2">
                      {formatDateTime(app.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openDetail(app)}
                        className={`btn py-1.5 px-3 text-xs ${
                          app.status === 'PENDING' ? 'btn-primary' : 'btn-ghost'
                        }`}
                      >
                        {app.status === 'PENDING' ? 'Xem & Xét duyệt' : 'Chi tiết'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal xét duyệt chi tiết */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Hồ sơ ${selected.applicationCode}`}
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setSelected(null);
          }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="flagship-card w-full max-w-lg p-6 space-y-5 bg-surface max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="num text-xs text-ink-3">{selected.applicationCode}</div>
                <h3 className="font-display text-lg font-semibold text-ink mt-0.5">
                  {selected.fullName}
                </h3>
                <p className="text-xs text-ink-2 mt-0.5">
                  {selected.email} · {selected.phone}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 cursor-pointer"
                aria-label="Đóng"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="rounded-lg border border-rule bg-surface-2 p-4 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                  <MapPinIcon size={14} className="text-coral" />
                  <span>
                    Vùng đề xuất: {selected.regionName} ({selected.province})
                  </span>
                </span>
                <span className="num text-ink-2">
                  {selected.yearsExperience != null
                    ? `${selected.yearsExperience} năm kinh nghiệm`
                    : 'Chưa khai báo số năm'}
                </span>
              </div>
              <div className="text-ink-2">
                <strong>Số thẻ HDV / CCCD:</strong>{' '}
                <span className="num">{selected.licenseNumber || 'Chưa cung cấp'}</span>
              </div>
              <div className="text-ink-2">
                <strong>Ngôn ngữ:</strong> {selected.languages || 'Chưa cung cấp'}
              </div>
              <div className="pt-2 border-t border-rule text-ink leading-relaxed">
                <div className="font-semibold mb-1 text-ink-2">Giới thiệu bản địa &amp; chuyên môn:</div>
                <p>{selected.bio}</p>
              </div>
            </div>

            {modalError && (
              <div className="rounded-lg border border-crimson/30 bg-crimson-soft px-3 py-2 text-xs text-crimson">
                {modalError}
              </div>
            )}

            {selected.status === 'PENDING' ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-ink-2">
                    Vùng phụ trách khi cấp tài khoản *
                  </label>
                  <select
                    value={targetRegionId}
                    onChange={(e) => setTargetRegionId(e.target.value)}
                    disabled={busy}
                    className="field"
                  >
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.province})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-ink-2">
                    Ghi chú duyệt / Lý do từ chối (bắt buộc nếu từ chối)
                  </label>
                  <textarea
                    rows={3}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    disabled={busy}
                    placeholder="Ví dụ: Đã xác minh thẻ HDV hợp lệ. Hoặc: Vui lòng bổ sung số thẻ HDV nội địa/quốc tế..."
                    className="field"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-rule">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleReject()}
                    className="btn btn-danger text-xs py-2 px-3.5"
                  >
                    {rejectMutation.isPending ? 'Đang từ chối...' : 'Từ chối hồ sơ'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleApprove()}
                    className="btn btn-primary text-xs py-2 px-4"
                  >
                    {approveMutation.isPending
                      ? 'Đang cấp tài khoản...'
                      : 'Duyệt & Cấp tài khoản HDV'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-rule bg-surface-2 p-4 space-y-1.5 text-xs text-ink-2">
                <div>
                  <strong>Trạng thái:</strong> {appStatusMeta(selected.status).label}
                </div>
                {selected.reviewedByName && (
                  <div>
                    <strong>Người xử lý:</strong> {selected.reviewedByName} (
                    {formatDateTime(selected.reviewedAt)})
                  </div>
                )}
                {selected.reviewNote && (
                  <div>
                    <strong>Ghi chú:</strong> {selected.reviewNote}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

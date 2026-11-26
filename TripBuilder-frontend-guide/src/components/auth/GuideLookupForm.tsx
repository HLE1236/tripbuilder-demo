import { useEffect, useState, type FormEvent } from 'react';
import type { GuideApplicationStatus, GuideApplicationStatusInfo } from '@/api/types';
import {
  AlertIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  SearchIcon,
} from '@/components/icon';
import { useLookupGuideApplicationMutation } from '@/hooks/api';

interface GuideLookupFormProps {
  initialEmail?: string;
  initialCode?: string;
  onGoToLogin: (email?: string) => void;
  onGoToApply: () => void;
}

function statusBadge(status: GuideApplicationStatus) {
  switch (status) {
    case 'APPROVED':
      return { label: 'Đã được duyệt', tagClass: 'tag-forest', icon: CheckCircleIcon };
    case 'REJECTED':
      return { label: 'Bị từ chối', tagClass: 'tag-crimson', icon: AlertIcon };
    default:
      return { label: 'Chờ xét duyệt', tagClass: 'tag-ochre', icon: ClockIcon };
  }
}

export function GuideLookupForm({
  initialEmail = '',
  initialCode = '',
  onGoToLogin,
  onGoToApply,
}: GuideLookupFormProps) {
  const lookupMutation = useLookupGuideApplicationMutation();
  const [email, setEmail] = useState(initialEmail);
  const [applicationCode, setApplicationCode] = useState(initialCode);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GuideApplicationStatusInfo | null>(null);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (initialCode) setApplicationCode(initialCode);
  }, [initialEmail, initialCode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    try {
      const data = await lookupMutation.mutateAsync({
        email: email.trim(),
        applicationCode: applicationCode.trim(),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tìm thấy hồ sơ phù hợp');
    }
  };

  const badge = result ? statusBadge(result.status) : null;
  const BadgeIcon = badge?.icon;

  return (
    <div className="p-6 space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label htmlFor="lookup-email" className="block text-xs font-medium text-ink-2">
              Email đã đăng ký *
            </label>
            <input
              id="lookup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="phuc.dalat.apply@tripbuilder.vn"
              className="field text-sm"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="lookup-code" className="block text-xs font-medium text-ink-2">
              Mã hồ sơ *
            </label>
            <input
              id="lookup-code"
              type="text"
              required
              value={applicationCode}
              onChange={(e) => setApplicationCode(e.target.value)}
              placeholder="GA-2026-1001"
              className="field text-sm num uppercase"
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-crimson/35 bg-crimson-soft px-4 py-3 flex items-start gap-2.5 text-sm text-crimson"
          >
            <AlertIcon size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={lookupMutation.isPending}
          className="btn btn-primary w-full py-2.5 text-sm"
        >
          <SearchIcon size={16} />
          <span>{lookupMutation.isPending ? 'Đang tra cứu...' : 'Kiểm tra trạng thái hồ sơ'}</span>
        </button>
      </form>

      {result && badge && BadgeIcon && (
        <div className="rounded-xl border border-rule bg-surface-2 p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="num text-xs text-ink-3">{result.applicationCode}</div>
              <div className="text-base font-semibold text-ink mt-0.5">{result.fullName}</div>
              <div className="text-xs text-ink-2 flex items-center gap-1.5 mt-1">
                <MapPinIcon size={13} className="text-coral shrink-0" />
                <span>
                  Vùng đăng ký: {result.regionName} ({result.province})
                </span>
              </div>
            </div>

            <span className={`tag ${badge.tagClass} inline-flex items-center gap-1.5`}>
              <BadgeIcon size={14} />
              <span>{badge.label}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink-2 border-t border-rule pt-3">
            <div>
              Ngày nộp:{' '}
              <strong className="num text-ink">
                {new Date(result.createdAt).toLocaleDateString('vi-VN')}
              </strong>
            </div>
            {result.reviewedAt && (
              <div>
                Ngày xét duyệt:{' '}
                <strong className="num text-ink">
                  {new Date(result.reviewedAt).toLocaleDateString('vi-VN')}
                </strong>
              </div>
            )}
          </div>

          {result.reviewNote && (
            <div className="rounded-lg border border-rule bg-surface px-3.5 py-2.5 text-xs text-ink-2">
              <div className="font-semibold text-ink mb-0.5">Phản hồi từ Ban điều hành:</div>
              <p>{result.reviewNote}</p>
            </div>
          )}

          {result.status === 'APPROVED' && (
            <button
              type="button"
              onClick={() => onGoToLogin(result.email)}
              className="btn btn-primary w-full py-2.5 text-sm"
            >
              <span>Đăng nhập Cổng Tour Guide ngay</span>
              <ArrowRightIcon size={16} />
            </button>
          )}

          {result.status === 'REJECTED' && (
            <button
              type="button"
              onClick={onGoToApply}
              className="btn btn-ghost w-full py-2.5 text-sm"
            >
              <span>Nộp lại hồ sơ mới</span>
              <ArrowRightIcon size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import type { GuideApplicationStatusInfo } from '@/api/types';
import {
  AlertIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  ClipboardIcon,
} from '@/components/icon';
import {
  useRegionsQuery,
  useSubmitGuideApplicationMutation,
} from '@/hooks/api';

interface GuideApplyFormProps {
  onGoToLookup: (email: string, applicationCode: string) => void;
  onGoToLogin: () => void;
}

export function GuideApplyForm({ onGoToLookup, onGoToLogin }: GuideApplyFormProps) {
  const { data: regions = [], isLoading: loadingRegions } = useRegionsQuery(true);
  const submitMutation = useSubmitGuideApplicationMutation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regionId, setRegionId] = useState<string>('');
  const [yearsExperience, setYearsExperience] = useState('3');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [languages, setLanguages] = useState('Tiếng Việt, Tiếng Anh');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<GuideApplicationStatusInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const effectiveRegionId = regionId || (regions[0] ? String(regions[0].id) : '');

  const handleCopyCode = async () => {
    if (!submitted?.applicationCode) return;
    try {
      await navigator.clipboard.writeText(submitted.applicationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedRegion = Number(effectiveRegionId);
    if (!parsedRegion) {
      setError('Vui lòng chọn vùng hoạt động chính.');
      return;
    }
    if (bio.trim().length < 20) {
      setError('Giới thiệu chuyên môn & hiểu biết bản địa cần tối thiểu 20 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!acceptedTerms) {
      setError('Vui lòng đồng ý với điều khoản đối tác Hướng dẫn viên.');
      return;
    }

    const parsedYears = Number(yearsExperience);
    try {
      const result = await submitMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
        regionId: parsedRegion,
        yearsExperience: Number.isFinite(parsedYears) && parsedYears >= 0 ? parsedYears : undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        languages: languages.trim() || undefined,
        bio: bio.trim(),
        acceptedTerms,
      });
      setSubmitted(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi hồ sơ đăng ký thất bại');
    }
  };

  if (submitted) {
    return (
      <div className="p-6 space-y-5">
        <div className="rounded-xl border border-emerald/30 bg-emerald-soft p-5 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircleIcon size={22} className="text-emerald shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-base font-semibold text-ink">
                Đã tiếp nhận hồ sơ Hướng dẫn viên!
              </div>
              <p className="text-sm text-ink-2">
                Hồ sơ của <strong>{submitted.fullName}</strong> cho vùng{' '}
                <strong>
                  {submitted.regionName} ({submitted.province})
                </strong>{' '}
                đang chờ Admin thẩm định. Sau khi được duyệt, bạn có thể đăng nhập bằng email{' '}
                <span className="num font-medium text-ink">{submitted.email}</span> và mật khẩu vừa tạo.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-rule bg-surface px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-ink-3">Mã hồ sơ của bạn (lưu lại để tra cứu)</div>
              <div className="num text-xl font-semibold text-coral tracking-wide mt-0.5">
                {submitted.applicationCode}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyCode()}
              className="btn btn-ghost text-sm py-2 px-3"
            >
              {copied ? <CheckIcon size={15} className="text-emerald" /> : <ClipboardIcon size={15} />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép mã'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onGoToLookup(submitted.email, submitted.applicationCode)}
            className="btn btn-primary flex-1 py-2.5 text-sm"
          >
            <span>Tra cứu trạng thái hồ sơ</span>
            <ArrowRightIcon size={16} />
          </button>
          <button
            type="button"
            onClick={onGoToLogin}
            className="btn btn-ghost py-2.5 px-4 text-sm"
          >
            Về đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-crimson/35 bg-crimson-soft px-4 py-3 flex items-start gap-2.5 text-sm text-crimson"
        >
          <AlertIcon size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label htmlFor="ga-fullname" className="block text-xs font-medium text-ink-2">
            Họ và tên *
          </label>
          <input
            id="ga-fullname"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Hoàng Phúc"
            className="field text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="ga-phone" className="block text-xs font-medium text-ink-2">
            Số điện thoại *
          </label>
          <input
            id="ga-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678"
            className="field text-sm num"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label htmlFor="ga-email" className="block text-xs font-medium text-ink-2">
            Email làm việc (dùng đăng nhập) *
          </label>
          <input
            id="ga-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tenban.guide@gmail.com"
            className="field text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="ga-region" className="block text-xs font-medium text-ink-2">
            Vùng hoạt động chính (1 vùng) *
          </label>
          <select
            id="ga-region"
            required
            disabled={loadingRegions}
            value={effectiveRegionId}
            onChange={(e) => setRegionId(e.target.value)}
            className="field text-sm"
          >
            {loadingRegions && <option value="">Đang tải khu vực...</option>}
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.province})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="space-y-1">
          <label htmlFor="ga-years" className="block text-xs font-medium text-ink-2">
            Số năm kinh nghiệm
          </label>
          <input
            id="ga-years"
            type="number"
            min={0}
            max={60}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            className="field text-sm num"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="ga-license" className="block text-xs font-medium text-ink-2">
            Số thẻ HDV / CCCD
          </label>
          <input
            id="ga-license"
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="HDV-LD-2024-..."
            className="field text-sm num"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="ga-lang" className="block text-xs font-medium text-ink-2">
            Ngôn ngữ dẫn tour
          </label>
          <input
            id="ga-lang"
            type="text"
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            placeholder="Tiếng Việt, Tiếng Anh"
            className="field text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="ga-bio" className="block text-xs font-medium text-ink-2">
          Giới thiệu chuyên môn &amp; am hiểu bản địa *
        </label>
        <textarea
          id="ga-bio"
          required
          rows={3}
          minLength={20}
          maxLength={1000}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Chia sẻ kinh nghiệm dẫn đoàn, thế mạnh tuyến điểm tại vùng bạn đăng ký (tối thiểu 20 ký tự)..."
          className="field text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label htmlFor="ga-pass" className="block text-xs font-medium text-ink-2">
            Mật khẩu tài khoản *
          </label>
          <input
            id="ga-pass"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8+ ký tự, gồm chữ hoa, thường & số"
            className="field text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="ga-confirm" className="block text-xs font-medium text-ink-2">
            Xác nhận mật khẩu *
          </label>
          <input
            id="ga-confirm"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu"
            className="field text-sm"
          />
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-xs text-ink-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="h-4 w-4 mt-0.5 rounded border-rule accent-coral cursor-pointer shrink-0"
        />
        <span>
          Tôi cam kết thông tin cung cấp là trung thực, chỉ vận hành tour trong{' '}
          <strong>1 vùng bản địa đã chọn</strong> và tuân thủ quy chuẩn báo giá của TripBuilder.
        </span>
      </label>

      <button
        type="submit"
        disabled={submitMutation.isPending}
        className="btn btn-primary w-full py-3 text-base"
      >
        <span>{submitMutation.isPending ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ xét duyệt'}</span>
        <ArrowRightIcon size={18} />
      </button>
    </form>
  );
}

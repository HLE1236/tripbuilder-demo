import { useState, type FormEvent } from 'react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { resolveMediaUrl, type User } from '../../api';
import { PasswordInput, PasswordStrengthMeter } from '../../components/auth';
import { AlertIcon, ArrowLeftIcon, CheckCircleIcon, CheckIcon, ShieldCheckIcon } from '../../components/icon';
import { useChangePasswordMutation, useUpdateProfileMutation } from '../../hooks/api';
import { checkPasswordStrength, isValidVnPhone } from '../../utils/validation';

const PRESET_AVATARS = [
  { path: '/images/avatars/01-guide-minh.jpg', label: 'Minh' },
  { path: '/images/avatars/02-guide-lan.jpg', label: 'Lan' },
  { path: '/images/avatars/03-guide-tuan.jpg', label: 'Tuấn' },
  { path: '/images/avatars/04-traveler-linh.jpg', label: 'Linh' },
  { path: '/images/avatars/05-traveler-hung.jpg', label: 'Hùng' },
  { path: '/images/avatars/06-traveler-mai.jpg', label: 'Mai' },
];

interface ProfileViewProps {
  user: User;
  onUserUpdated: (user: User) => void;
  onBack: () => void;
}

export function ProfileView({ user, onUserUpdated, onBack }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile form state
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const updateProfileMutation = useUpdateProfileMutation();
  const changePasswordMutation = useChangePasswordMutation();

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim()) {
      setProfileError('Vui lòng nhập họ và tên.');
      return;
    }

    if (phone.trim() && !isValidVnPhone(phone)) {
      setProfileError('Số điện thoại không đúng định dạng Việt Nam (vd: 0901234567).');
      return;
    }

    try {
      const updated = await updateProfileMutation.mutateAsync({
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim() || null,
      });
      onUserUpdated(updated);
      setProfileSuccess('Đã cập nhật thông tin cá nhân thành công.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Không thể cập nhật thông tin');
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    const strength = checkPasswordStrength(newPassword);
    if (!strength.isValid) {
      setPasswordError('Mật khẩu mới cần tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Đổi mật khẩu thành công.');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu');
    }
  };

  const previewAvatar = avatarUrl.trim() ? resolveMediaUrl(avatarUrl.trim()) : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink mb-2 cursor-pointer"
          >
            <ArrowLeftIcon size={15} />
            <span>Quay lại khám phá</span>
          </button>
          <h1 className="text-3xl font-semibold text-ink">Hồ sơ cá nhân</h1>
          <p className="text-base text-ink-2 mt-1">
            Quản lý thông tin liên hệ hiển thị với hướng dẫn viên và bảo mật tài khoản.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-rule bg-surface px-4 py-3">
          <Avatar src={previewAvatar} name={fullName || user.fullName} size="md" />
          <div className="min-w-0">
            <div className="text-base font-semibold text-ink truncate">
              {fullName || user.fullName}
            </div>
            <div className="text-sm text-ink-3 truncate">{user.email}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-rule">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'text-ink font-semibold' : 'text-ink-2 hover:text-ink'
          }`}
        >
          <span>Thông tin cá nhân</span>
          {activeTab === 'profile' && (
            <span className="absolute inset-x-0 bottom-0 h-[2px] bg-coral" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'password' ? 'text-ink font-semibold' : 'text-ink-2 hover:text-ink'
          }`}
        >
          <span>Đổi mật khẩu</span>
          {activeTab === 'password' && (
            <span className="absolute inset-x-0 bottom-0 h-[2px] bg-coral" />
          )}
        </button>
      </div>

      {activeTab === 'profile' ? (
        <form onSubmit={handleProfileSubmit} className="flagship-card p-6 space-y-6">
          {profileError && (
            <div className="rounded-xl border border-crimson/30 bg-crimson-soft px-4 py-3 text-sm font-medium text-crimson flex items-start gap-2.5">
              <AlertIcon size={18} className="mt-0.5 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="rounded-xl border border-emerald/30 bg-emerald-soft px-4 py-3 text-sm font-medium text-emerald flex items-start gap-2.5">
              <CheckCircleIcon size={18} className="mt-0.5 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="profile-fullname" className="editorial-kicker text-ink-2 block">
                Họ và tên
              </label>
              <input
                id="profile-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="field"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-phone" className="editorial-kicker text-ink-2 block">
                Số điện thoại
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901 234 567"
                className="field num"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-email" className="editorial-kicker text-ink-2 block">
              Email tài khoản
            </label>
            <input
              id="profile-email"
              type="email"
              disabled
              value={user.email}
              className="field opacity-65 cursor-not-allowed"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-rule">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="editorial-kicker text-ink-2">Chọn ảnh đại diện</span>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-sm text-ink-3 hover:text-ink cursor-pointer"
                >
                  Xoá ảnh đại diện
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {PRESET_AVATARS.map((preset) => {
                const selected = avatarUrl.trim() === preset.path;
                return (
                  <button
                    key={preset.path}
                    type="button"
                    onClick={() => setAvatarUrl(preset.path)}
                    className={`relative rounded-xl border p-2 flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                      selected
                        ? 'border-coral bg-coral-soft'
                        : 'border-rule bg-surface-2 hover:border-rule-strong'
                    }`}
                  >
                    <img
                      src={resolveMediaUrl(preset.path)}
                      alt={preset.label}
                      className="h-14 w-14 rounded-full object-cover border border-rule"
                    />
                    <span className="text-sm font-medium text-ink">{preset.label}</span>
                    {selected && (
                      <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-coral text-white flex items-center justify-center">
                        <CheckIcon size={12} strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 pt-1">
              <label htmlFor="profile-avatar-url" className="text-sm text-ink-3 block">
                Hoặc nhập đường dẫn ảnh tuỳ chỉnh
              </label>
              <input
                id="profile-avatar-url"
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="/images/avatars/06-traveler-mai.jpg hoặc https://..."
                className="field"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="btn btn-primary font-semibold"
            >
              {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="flagship-card p-6 space-y-5">
          <div className="flex items-center gap-2.5 text-sm text-ink-2 pb-3 border-b border-rule">
            <ShieldCheckIcon size={18} className="text-coral shrink-0" />
            <span>
              Nên sử dụng mật khẩu mạnh kết hợp chữ hoa, chữ thường và chữ số để bảo vệ hồ sơ đặt
              chuyến.
            </span>
          </div>

          {passwordError && (
            <div className="rounded-xl border border-crimson/30 bg-crimson-soft px-4 py-3 text-sm font-medium text-crimson flex items-start gap-2.5">
              <AlertIcon size={18} className="mt-0.5 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="rounded-xl border border-emerald/30 bg-emerald-soft px-4 py-3 text-sm font-medium text-emerald flex items-start gap-2.5">
              <CheckCircleIcon size={18} className="mt-0.5 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="current-password" className="editorial-kicker text-ink-2 block">
              Mật khẩu hiện tại
            </label>
            <PasswordInput
              id="current-password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              className="num"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="new-password" className="editorial-kicker text-ink-2 block">
              Mật khẩu mới
            </label>
            <PasswordInput
              id="new-password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="num"
            />
            <PasswordStrengthMeter password={newPassword} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-new-password" className="editorial-kicker text-ink-2 block">
              Xác nhận mật khẩu mới
            </label>
            <PasswordInput
              id="confirm-new-password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="num"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="btn btn-primary font-semibold"
            >
              {changePasswordMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

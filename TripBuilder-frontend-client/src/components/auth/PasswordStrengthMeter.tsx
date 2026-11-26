import { checkPasswordStrength } from '../../utils/validation';
import { CheckIcon } from '../icon';

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const result = checkPasswordStrength(password);

  const barColor =
    result.label === 'Mạnh'
      ? 'bg-emerald'
      : result.label === 'Trung bình'
        ? 'bg-amber'
        : 'bg-crimson';

  const labelColor =
    result.label === 'Mạnh'
      ? 'text-emerald'
      : result.label === 'Trung bình'
        ? 'text-amber'
        : 'text-crimson';

  const items = [
    { key: 'minLength', label: 'Tối thiểu 8 ký tự', ok: result.minLength },
    { key: 'hasUpper', label: 'Ít nhất 1 chữ hoa (A-Z)', ok: result.hasUpper },
    { key: 'hasLower', label: 'Ít nhất 1 chữ thường (a-z)', ok: result.hasLower },
    { key: 'hasDigit', label: 'Ít nhất 1 chữ số (0-9)', ok: result.hasDigit },
  ];

  return (
    <div className="space-y-2.5 pt-1">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-ink-3">Độ mạnh mật khẩu</span>
        <span className={`font-semibold ${password ? labelColor : 'text-ink-3'}`}>
          {password ? result.label : 'Chưa nhập'}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-1.5 rounded-full transition-colors duration-150 ${
              password && result.score >= step ? barColor : 'bg-surface-2'
            }`}
          />
        ))}
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
        {items.map((item) => (
          <li
            key={item.key}
            className={`flex items-center gap-1.5 transition-colors ${
              item.ok ? 'text-emerald font-medium' : 'text-ink-3'
            }`}
          >
            <span
              className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 border ${
                item.ok
                  ? 'bg-emerald-soft border-emerald/40 text-emerald'
                  : 'border-rule-strong bg-surface-2 text-transparent'
              }`}
            >
              <CheckIcon size={11} strokeWidth={2.5} />
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

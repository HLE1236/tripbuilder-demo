export interface PasswordCheckResult {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasDigit: boolean;
  score: number;
  label: 'Yếu' | 'Trung bình' | 'Mạnh';
  isValid: boolean;
}

export function checkPasswordStrength(password: string): PasswordCheckResult {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  const score = [minLength, hasUpper, hasLower, hasDigit].filter(Boolean).length;

  let label: PasswordCheckResult['label'] = 'Yếu';
  if (score >= 4) {
    label = 'Mạnh';
  } else if (score >= 2) {
    label = 'Trung bình';
  }

  return {
    minLength,
    hasUpper,
    hasLower,
    hasDigit,
    score,
    label,
    isValid: minLength && hasUpper && hasLower && hasDigit,
  };
}

export function normalizeVnPhone(phone: string): string {
  return phone.replace(/[\s.-]/g, '').trim();
}

export function isValidVnPhone(phone: string): boolean {
  const normalized = normalizeVnPhone(phone);
  return /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(normalized);
}

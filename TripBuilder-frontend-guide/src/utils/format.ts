export const DEFAULT_TRAVEL_IMAGE = '/images/tours/ha-long/01-bay-panorama.jpg';

export function resolveMediaUrl(url?: string | null): string {
  const trimmed = url?.trim();
  if (!trimmed) return DEFAULT_TRAVEL_IMAGE;
  if (trimmed.startsWith('/images/')) {
    const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
    return apiBase ? `${apiBase}${trimmed}` : trimmed;
  }
  return trimmed;
}

export function formatVnd(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return amount.toLocaleString('vi-VN') + 'đ';
}

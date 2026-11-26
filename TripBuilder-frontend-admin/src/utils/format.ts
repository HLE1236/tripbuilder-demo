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
  if (amount == null || Number.isNaN(amount)) return '—';
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const trimmed = iso.trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    return `${dateOnlyMatch[3]}/${dateOnlyMatch[2]}/${dateOnlyMatch[1]}`;
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

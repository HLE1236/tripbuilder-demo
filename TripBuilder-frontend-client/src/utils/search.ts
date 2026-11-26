export function normalizeVietnamese(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

export function matchesVietnameseQuery(
  text: string | null | undefined,
  query: string
): boolean {
  const normalizedQuery = normalizeVietnamese(query);
  if (!normalizedQuery) return true;
  if (!text) return false;
  return normalizeVietnamese(text).includes(normalizedQuery);
}

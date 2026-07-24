export interface MediaUrlOptions {
  baseUrl?: string;
}

export const resolveMediaUrl = (
  value: string | null | undefined,
  options: MediaUrlOptions = {}
): string | null => {
  const raw = (value || '').trim();
  if (!raw) return null;
  if (/^(https?:|data:|blob:|mailto:|tel:)/i.test(raw)) return raw;

  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  const base = options.baseUrl || '';
  if (!base) return normalized;
  return `${base.replace(/\/$/, '')}${normalized}`;
};

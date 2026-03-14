// All timestamps are stored as UTC ISO 8601 strings.
// This utility provides helpers to convert from UTC to local time
// for display while keeping storage format stable and unambiguous.

export const nowUtcIso = (): string => {
  return new Date().toISOString();
};

export const toUtcIso = (date: Date): string => {
  return date.toISOString();
};

export const formatLocalFromUtc = (
  utcIso: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = new Date(utcIso);
  if (Number.isNaN(date.getTime())) {
    return utcIso;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(date);
};

export const getLocalDateKeyFromUtc = (utcIso: string): string => {
  const date = new Date(utcIso);
  if (Number.isNaN(date.getTime())) {
    return utcIso;
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};


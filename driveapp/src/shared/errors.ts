/** Turn Supabase / network failures into a readable string for UI and XState actors. */
export function formatUnknownError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (error && typeof error === 'object') {
    const o = error as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [o.message, o.details, o.hint, o.code].filter(
      (p): p is string => typeof p === 'string' && p.trim().length > 0,
    );
    if (parts.length > 0) return parts.join(' — ');
  }
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

export function toError(error: unknown, fallback: string): Error {
  return new Error(formatUnknownError(error, fallback));
}

export function isUniqueConstraintError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('number' in error)) {
    return false;
  }

  const code = (error as { number: number }).number;

  return code === 2627 || code === 2601;
}

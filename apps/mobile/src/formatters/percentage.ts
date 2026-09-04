/**
 * Calculates a progress percentage clamped between 0 and 100.
 * Safely handles divide by zero and negative inputs.
 */
export function calculateProgress(
  spent: number | null | undefined,
  budget: number | null | undefined,
): number {
  const s = Number(spent) || 0;
  const b = Number(budget) || 0;

  if (b <= 0) return s > 0 ? 100 : 0;
  if (s <= 0) return 0;

  const percent = (s / b) * 100;
  return Math.min(Math.max(percent, 0), 100);
}

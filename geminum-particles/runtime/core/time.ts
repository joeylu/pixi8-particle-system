/** Relative tolerance for representational error, without a minimum time step. */
export function timeTolerance(a: number, b: number): number {
  return 8 * Number.EPSILON * Math.max(Math.abs(a), Math.abs(b), Number.MIN_VALUE);
}
export function sameTime(a: number, b: number): boolean {
  return Math.abs(a - b) <= timeTolerance(a, b);
}

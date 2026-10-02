/** Relative tolerance for representational error, without a minimum time step. */
export function timeTolerance(a, b) {
    return 8 * Number.EPSILON * Math.max(Math.abs(a), Math.abs(b), Number.MIN_VALUE);
}
export function sameTime(a, b) {
    return Math.abs(a - b) <= timeTolerance(a, b);
}

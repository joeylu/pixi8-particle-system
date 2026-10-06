export function sampleDuration(speed) {
  if (!Number.isFinite(speed) || speed < 0) throw new RangeError('Flight speed must be finite and nonnegative');
  return Math.min(1 / 120, speed > 0 ? 4 / speed : 1 / 120);
}

export function sampleFrame(seconds, speed) {
  const maximum = sampleDuration(speed);
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Frame seconds must be finite and nonnegative');
  const count = Math.ceil(seconds / maximum);
  return { count, seconds: count ? seconds / count : 0 };
}

export function stepFlight(point, target, speed, seconds) {
  sampleDuration(speed);
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Flight seconds must be finite and nonnegative');
  const dx = target.x - point.x, dy = target.y - point.y, distance = Math.hypot(dx, dy);
  const amount = Math.min(distance, speed * seconds), arrived = amount >= distance;
  return { point: arrived ? { ...target } : { x: point.x + dx / distance * amount, y: point.y + dy / distance * amount }, angle: Math.atan2(dy, dx), arrived };
}

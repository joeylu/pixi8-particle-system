import type { ParticleField, ParticleState } from './contracts.js';

export const PARTICLE_FIELDS: readonly ParticleField[] = Object.freeze([
  'x', 'y', 'vx', 'vy', 'rotation', 'scaleX', 'scaleY', 'alpha', 'tint',
]);
export function object(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || 'then' in value) {
    throw new TypeError(`${label} must be a synchronous object`);
  }
}
export function finite(value: unknown, label: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
}
export function integer(value: unknown, label: string, minimum: number): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) {
    throw new RangeError(`${label} must be a safe integer >= ${minimum}`);
  }
}
export function knownKeys(value: object, allowed: readonly string[], label: string): void {
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !allowed.includes(key)) throw new TypeError(`Unknown ${label} field: ${String(key)}`);
  }
}
/** Read exactly one own data field; an explicit field never falls back to a default. */
export function aliasValue(config: object, canonical: string, alias: string, fallback?: unknown): unknown {
  const first = Object.getOwnPropertyDescriptor(config, canonical);
  const second = Object.getOwnPropertyDescriptor(config, alias);
  if (first && second) throw new TypeError(`${canonical} and ${alias} are mutually exclusive`);
  const descriptor = first ?? second;
  if (descriptor) {
    if (!('value' in descriptor)) throw new TypeError(`${first ? canonical : alias} must be a data property`);
    return descriptor.value;
  }
  if (arguments.length < 4) throw new TypeError(`${canonical} or ${alias} is required`);
  return fallback;
}
export function syncFunction(value: unknown, label: string): asserts value is (...args: never[]) => unknown {
  if (typeof value !== 'function' || value.constructor.name === 'AsyncFunction' || value.constructor.name === 'AsyncGeneratorFunction') {
    throw new TypeError(`${label} must be a synchronous function`);
  }
}
export function undefinedResult(value: unknown): void {
  if (value !== undefined) throw new TypeError('Hook must return undefined synchronously');
}
export function checkFields<T extends object>(p: ParticleState<T>, fields: readonly ParticleField[], moduleId = 'Core'): void {
  for (const field of fields) {
    const label = `${moduleId}: particle.${field} (actual ${String(p[field])})`;
    finite(p[field], label);
    if (field === 'alpha' && (p.alpha < 0 || p.alpha > 1)) throw new RangeError(`${label} must be in [0, 1]`);
    if (field === 'tint') integer(p.tint, label, 0);
    if (field === 'tint' && p.tint > 0xffffff) throw new RangeError(`${label} must be 24-bit RGB`);
  }
}
export function declaration(value: unknown, label: string): readonly ParticleField[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const result: ParticleField[] = [];
  for (const field of value) {
    if (!PARTICLE_FIELDS.includes(field) || result.includes(field)) throw new TypeError(`Invalid ${label} field: ${String(field)}`);
    result.push(field);
  }
  return Object.freeze(result);
}

export const PARTICLE_FIELDS = Object.freeze([
    'x', 'y', 'vx', 'vy', 'rotation', 'scaleX', 'scaleY', 'alpha', 'tint',
]);
export function object(value, label) {
    if (value === null || typeof value !== 'object' || Array.isArray(value) || 'then' in value) {
        throw new TypeError(`${label} must be a synchronous object`);
    }
}
export function finite(value, label) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        throw new TypeError(`${label} must be finite`);
}
export function integer(value, label, minimum) {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) {
        throw new RangeError(`${label} must be a safe integer >= ${minimum}`);
    }
}
export function knownKeys(value, allowed, label) {
    for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== 'string' || !allowed.includes(key))
            throw new TypeError(`Unknown ${label} field: ${String(key)}`);
    }
}
/** Read exactly one own data field; an explicit field never falls back to a default. */
export function aliasValue(config, canonical, alias, fallback) {
    const first = Object.getOwnPropertyDescriptor(config, canonical);
    const second = Object.getOwnPropertyDescriptor(config, alias);
    if (first && second)
        throw new TypeError(`${canonical} and ${alias} are mutually exclusive`);
    const descriptor = first ?? second;
    if (descriptor) {
        if (!('value' in descriptor))
            throw new TypeError(`${first ? canonical : alias} must be a data property`);
        return descriptor.value;
    }
    if (arguments.length < 4)
        throw new TypeError(`${canonical} or ${alias} is required`);
    return fallback;
}
export function syncFunction(value, label) {
    if (typeof value !== 'function' || value.constructor.name === 'AsyncFunction' || value.constructor.name === 'AsyncGeneratorFunction') {
        throw new TypeError(`${label} must be a synchronous function`);
    }
}
export function undefinedResult(value) {
    if (value !== undefined)
        throw new TypeError('Hook must return undefined synchronously');
}
export function checkFields(p, fields, moduleId = 'Core') {
    for (const field of fields) {
        const label = `${moduleId}: particle.${field} (actual ${String(p[field])})`;
        finite(p[field], label);
        if (field === 'alpha' && (p.alpha < 0 || p.alpha > 1))
            throw new RangeError(`${label} must be in [0, 1]`);
        if (field === 'tint')
            integer(p.tint, label, 0);
        if (field === 'tint' && p.tint > 0xffffff)
            throw new RangeError(`${label} must be 24-bit RGB`);
    }
}
export function declaration(value, label) {
    if (!Array.isArray(value))
        throw new TypeError(`${label} must be an array`);
    const result = [];
    for (const field of value) {
        if (!PARTICLE_FIELDS.includes(field) || result.includes(field))
            throw new TypeError(`Invalid ${label} field: ${String(field)}`);
        result.push(field);
    }
    return Object.freeze(result);
}

import { finite } from './validation.js';
export function environmentObject(input, keys, required, label) {
    if (!input || typeof input !== 'object' || Array.isArray(input))
        throw new TypeError(`${label} must be a plain object`);
    const prototype = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null)
        throw new TypeError(`${label} must be a plain object`);
    for (const key of Reflect.ownKeys(input)) {
        const descriptor = Object.getOwnPropertyDescriptor(input, key);
        if (typeof key !== 'string' || !keys.includes(key))
            throw new TypeError(`Unknown ${label} field: ${String(key)}`);
        if (!descriptor.enumerable || !('value' in descriptor))
            throw new TypeError(`${label}.${key} must be an enumerable data property`);
    }
    for (const key of required)
        if (!Object.prototype.hasOwnProperty.call(input, key))
            throw new TypeError(`${label}.${key} is required`);
    return input;
}
export function snapshotParticleVector2(input) {
    const vector = environmentObject(input, ['x', 'y'], ['x', 'y'], 'gravity');
    finite(vector.x, 'gravity.x');
    finite(vector.y, 'gravity.y');
    return Object.freeze({ x: vector.x, y: vector.y });
}
export function snapshotParticleAffineTransform(input) {
    const transform = environmentObject(input, ['a', 'b', 'c', 'd', 'tx', 'ty'], ['a', 'b', 'c', 'd', 'tx', 'ty'], 'emitterTransform');
    for (const key of ['a', 'b', 'c', 'd', 'tx', 'ty'])
        finite(transform[key], `emitterTransform.${key}`);
    const { a, b, c, d, tx, ty } = transform;
    const determinant = a * d - b * c;
    finite(determinant, 'emitterTransform determinant');
    if (determinant === 0)
        throw new RangeError('emitterTransform must be invertible');
    for (const value of [d / determinant, -b / determinant, -c / determinant, a / determinant,
        (c * ty - d * tx) / determinant, (b * tx - a * ty) / determinant])
        finite(value, 'emitterTransform inverse');
    return Object.freeze({ a, b, c, d, tx, ty });
}
export function snapshotParticleEnvironment(input) {
    const snapshot = environmentObject(input, ['emitterTransform', 'gravity'], ['emitterTransform', 'gravity'], 'environment snapshot');
    return Object.freeze({ emitterTransform: snapshotParticleAffineTransform(snapshot.emitterTransform), gravity: snapshotParticleVector2(snapshot.gravity) });
}

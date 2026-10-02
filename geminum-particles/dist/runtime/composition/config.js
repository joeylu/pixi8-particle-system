import { aliasValue, finite, integer, knownKeys, object } from '../core/validation.js';
export function optionalNumber(config, key, fallback) {
    const value = key in config ? config[key] : fallback;
    finite(value, key);
    return value;
}
export function nonnegative(value, label) {
    finite(value, label);
    if (value < 0)
        throw new RangeError(`${label} must be nonnegative`);
    return value;
}
export function unit(value, label) {
    finite(value, label);
    if (value < 0 || value > 1)
        throw new RangeError(`${label} must be in [0, 1]`);
    return value;
}
export function tint(value, label) {
    integer(value, label, 0);
    if (value > 0xffffff)
        throw new RangeError(`${label} must be 24-bit RGB`);
    return value;
}
export function seedSnapshot(seed) {
    integer(seed, 'seed', 0);
    if (seed > 0xffffffff)
        throw new RangeError('seed must be uint32');
    return seed;
}
export function rangeSnapshot(value, label, nonnegativeOnly) {
    if (typeof value === 'number') {
        finite(value, label);
        if (nonnegativeOnly)
            nonnegative(value, label);
        return value;
    }
    object(value, label);
    knownKeys(value, ['min', 'max'], label);
    finite(value.min, `${label}.min`);
    finite(value.max, `${label}.max`);
    if (value.min > value.max)
        throw new RangeError(`${label}.min must be <= max`);
    if (nonnegativeOnly)
        nonnegative(value.min, `${label}.min`);
    return Object.freeze({ min: value.min, max: value.max });
}
export function startSnapshot(config) {
    object(config, 'StartValues config');
    const rotation = aliasValue(config, 'startRotation', 'startRotationRadians', 0);
    knownKeys(config, ['startSpeed', 'startScale', 'startRotation', 'startRotationRadians', 'startTint', 'startAlpha'], 'StartValues');
    return Object.freeze({
        startSpeed: rangeSnapshot('startSpeed' in config ? config.startSpeed : 0, 'startSpeed', true),
        startScale: rangeSnapshot('startScale' in config ? config.startScale : 1, 'startScale', true),
        startRotationRadians: rangeSnapshot(rotation, 'startRotation/startRotationRadians', false),
        startTint: tint(optionalNumber(config, 'startTint', 0xffffff), 'startTint'),
        startAlpha: unit(optionalNumber(config, 'startAlpha', 1), 'startAlpha'),
    });
}
export function shapeSnapshot(config) {
    object(config, 'Shape config');
    const type = aliasValue(config, 'shapeType', 'type');
    if (type !== 'point' && type !== 'circle' && type !== 'rectangle')
        throw new TypeError('Invalid shape type');
    const specific = type === 'circle' ? ['radius'] : type === 'rectangle' ? ['width', 'height'] : [];
    knownKeys(config, ['shapeType', 'type', 'offsetX', 'offsetY', 'directionRadians', 'spreadRadians', ...specific], 'Shape');
    const spreadRadians = optionalNumber(config, 'spreadRadians', 0);
    if (spreadRadians < 0 || spreadRadians > 2 * Math.PI)
        throw new RangeError('spreadRadians must be in [0, 2π]');
    return Object.freeze({
        type, offsetX: optionalNumber(config, 'offsetX', 0), offsetY: optionalNumber(config, 'offsetY', 0),
        directionRadians: optionalNumber(config, 'directionRadians', 0), spreadRadians,
        radius: type === 'circle' ? nonnegative(optionalNumber(config, 'radius', 10), 'radius') : 0,
        width: type === 'rectangle' ? nonnegative(optionalNumber(config, 'width', 20), 'width') : 0,
        height: type === 'rectangle' ? nonnegative(optionalNumber(config, 'height', 20), 'height') : 0,
    });
}

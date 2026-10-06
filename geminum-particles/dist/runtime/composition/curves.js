import { finite, knownKeys, object } from '../core/validation.js';
export function curveSnapshot(input, label, maximum = Infinity) {
    if (!Array.isArray(input) || input.length < 2 || input.length > 8)
        throw new TypeError(`${label} requires 2–8 keys`);
    let previous = -1;
    const result = input.map(key => {
        object(key, label);
        knownKeys(key, ['t', 'value'], label);
        finite(key.t, `${label}.t`);
        finite(key.value, `${label}.value`);
        if (key.t <= previous || key.t < 0 || key.t > 1 || key.value < 0 || key.value > maximum)
            throw new RangeError(`Invalid ${label} key`);
        if (maximum === 0xffffff && !Number.isInteger(key.value))
            throw new RangeError('colorCurve value must be RGB integer');
        previous = key.t;
        return Object.freeze({ t: key.t, value: key.value });
    });
    if (result[0].t !== 0 || result[result.length - 1].t !== 1)
        throw new RangeError(`${label} must cover 0..1`);
    return Object.freeze(result);
}
export function evaluateCurve(curve, t, color = false) {
    let i = 1;
    while (i < curve.length - 1 && t > curve[i].t)
        i++;
    const a = curve[i - 1], b = curve[i];
    const f = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t)));
    if (!color)
        return (1 - f) * a.value + f * b.value;
    const channel = (shift) => Math.round((1 - f) * ((a.value >>> shift) & 255) + f * ((b.value >>> shift) & 255));
    return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

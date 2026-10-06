import { integer } from '../core/validation.js';
import { seedSnapshot } from './config.js';
export const RandomChannel = Object.freeze({ ShapeX: 1, ShapeY: 2, Direction: 3, Speed: 4, Scale: 5, Rotation: 6, Lifetime: 8, Alpha: 9, AngularSpeed: 10, Clip: 11, Fps: 12, Phase: 13 });
function mix(value) {
    let word = value >>> 0;
    word ^= word >>> 16;
    word = Math.imul(word, 0x7feb352d);
    word ^= word >>> 15;
    word = Math.imul(word, 0x846ca68b);
    return (word ^ (word >>> 16)) >>> 0;
}
/** Stateless [0, 1) sampling keyed by seed, both birth-index words and channel. */
export function sampleUnit(seed, birthIndex, channel) {
    seedSnapshot(seed);
    integer(birthIndex, 'birthIndex', 0);
    integer(channel, 'random channel', 1);
    const low = birthIndex >>> 0;
    const high = Math.floor(birthIndex / 0x100000000) >>> 0;
    const hash = mix(mix(seed ^ 0x9e3779b9) ^ mix(low ^ 0x85ebca6b) ^ mix(high ^ 0xc2b2ae35) ^ mix(channel));
    return hash / 0x100000000;
}
export function sampleRange(range, seed, birthIndex, channel) {
    if (typeof range === 'number')
        return range;
    const t = sampleUnit(seed, birthIndex, channel);
    // Weighted endpoints avoid overflow of max-min for finite opposite-sign endpoints.
    return (1 - t) * range.min + t * range.max;
}

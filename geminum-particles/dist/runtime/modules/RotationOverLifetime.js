import { rangeSnapshot, seedSnapshot } from '../composition/config.js';
import { RandomChannel, sampleRange } from '../composition/random.js';
import { aliasValue, knownKeys, object } from '../core/validation.js';
export function createRotationOverLifetime(config, seed = 1) {
    object(config, 'RotationOverLifetime config');
    const angularSpeedRadians = aliasValue(config, 'z', 'angularSpeedRadians', 0);
    knownKeys(config, ['z', 'angularSpeedRadians'], 'RotationOverLifetime');
    const range = rangeSnapshot(angularSpeedRadians, 'z', false), seedValue = seedSnapshot(seed);
    return () => ({
        id: 'RotationOverLifetime', phase: 'appearance', updateWrites: ['rotation'],
        update(p, ctx) {
            p.rotation = p.data.startRotationRadians + sampleRange(range, seedValue, p.data.birthIndex, RandomChannel.AngularSpeed) * ctx.ageSeconds;
            return undefined;
        },
    });
}
export { createRotationOverLifetime as createRotationOverLifetimeModule };

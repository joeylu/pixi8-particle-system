import { nonnegative, optionalNumber } from '../composition/config.js';
import { curveSnapshot, evaluateCurve } from '../composition/curves.js';
import { knownKeys, object } from '../core/validation.js';
export function createSizeOverLifetime(config) {
    object(config, 'SizeOverLifetime config');
    knownKeys(config, ['endScaleFactor', 'scaleCurve'], 'SizeOverLifetime');
    const endScaleFactor = nonnegative(optionalNumber(config, 'endScaleFactor', 1), 'endScaleFactor');
    const curve = config.scaleCurve ? curveSnapshot(config.scaleCurve, 'scaleCurve') : undefined;
    return () => ({
        id: 'SizeOverLifetime', phase: 'appearance', updateWrites: ['scaleX', 'scaleY'],
        update(p, ctx) {
            const factor = curve ? evaluateCurve(curve, ctx.normalizedAge) : (1 - ctx.normalizedAge) + endScaleFactor * ctx.normalizedAge;
            p.scaleX = p.data.startScaleX * factor;
            p.scaleY = p.data.startScaleY * factor;
            return undefined;
        },
    });
}
export { createSizeOverLifetime as createSizeOverLifetimeModule };

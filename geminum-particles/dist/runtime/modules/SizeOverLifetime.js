import { nonnegative, optionalNumber } from '../composition/config.js';
import { knownKeys, object } from '../core/validation.js';
export function createSizeOverLifetime(config) {
    object(config, 'SizeOverLifetime config');
    knownKeys(config, ['endScaleFactor'], 'SizeOverLifetime');
    const endScaleFactor = nonnegative(optionalNumber(config, 'endScaleFactor', 1), 'endScaleFactor');
    return () => ({
        id: 'SizeOverLifetime', phase: 'appearance', updateWrites: ['scaleX', 'scaleY'],
        update(p, ctx) {
            const factor = (1 - ctx.normalizedAge) + endScaleFactor * ctx.normalizedAge;
            p.scaleX = p.data.startScaleX * factor;
            p.scaleY = p.data.startScaleY * factor;
            return undefined;
        },
    });
}
export { createSizeOverLifetime as createSizeOverLifetimeModule };

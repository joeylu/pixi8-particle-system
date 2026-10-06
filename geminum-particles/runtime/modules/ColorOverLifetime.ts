import type { ParticleCurve } from '../composition/contracts.js';
import type { ParticleBehavior } from '../core/contracts.js';
import type { ColorOverLifetimeConfig, ParticleModuleData } from '../composition/contracts.js';
import { optionalNumber, tint, unit } from '../composition/config.js';
import { curveSnapshot, evaluateCurve } from '../composition/curves.js';
import { knownKeys, object } from '../core/validation.js';

export function createColorOverLifetime(config: ColorOverLifetimeConfig): () => ParticleBehavior<ParticleModuleData> {
  object(config, 'ColorOverLifetime config'); knownKeys(config, ['endTint', 'endAlphaFactor', 'alphaCurve', 'colorCurve'], 'ColorOverLifetime');
  const endAlphaFactor = unit(optionalNumber(config, 'endAlphaFactor', 0), 'endAlphaFactor');
  const endTint = 'endTint' in config ? tint(optionalNumber(config, 'endTint', 0xffffff), 'endTint') : undefined;
  const alphaCurve = config.alphaCurve ? curveSnapshot(config.alphaCurve as ParticleCurve, 'alphaCurve', 1) : undefined;
  const colorCurve = config.colorCurve ? curveSnapshot(config.colorCurve as ParticleCurve, 'colorCurve', 0xffffff) : undefined;
  return () => ({
    id: 'ColorOverLifetime', phase: 'appearance', updateWrites: endTint === undefined && !colorCurve ? ['alpha'] : ['alpha', 'tint'],
    update(p, ctx) {
      const t = ctx.normalizedAge;
      p.alpha = p.data.startAlpha * (alphaCurve ? evaluateCurve(alphaCurve, t) : ((1 - t) + endAlphaFactor * t));
      if (colorCurve) {
        const color = evaluateCurve(colorCurve, t, true);
        const channel = (shift: number): number => Math.round(((p.data.startTint >>> shift) & 255) * ((color >>> shift) & 255) / 255);
        p.tint = (channel(16) << 16) | (channel(8) << 8) | channel(0);
      } else if (endTint !== undefined) {
        const channel = (shift: number): number => {
          const from = (p.data.startTint >>> shift) & 0xff, to = (endTint >>> shift) & 0xff;
          return Math.round((1 - t) * from + t * to);
        };
        p.tint = (channel(16) << 16) | (channel(8) << 8) | channel(0);
      }
      return undefined;
    },
  });
}
export { createColorOverLifetime as createColorOverLifetimeModule };

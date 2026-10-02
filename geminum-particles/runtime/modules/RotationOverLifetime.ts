import type { ParticleBehavior } from '../core/contracts.js';
import type { ParticleModuleData, RotationOverLifetimeConfig } from '../composition/contracts.js';
import { aliasValue, finite, knownKeys, object } from '../core/validation.js';

export function createRotationOverLifetime(config: RotationOverLifetimeConfig): () => ParticleBehavior<ParticleModuleData> {
  object(config, 'RotationOverLifetime config');
  const angularSpeedRadians = aliasValue(config, 'z', 'angularSpeedRadians', 0);
  knownKeys(config, ['z', 'angularSpeedRadians'], 'RotationOverLifetime');
  finite(angularSpeedRadians, 'z/angularSpeedRadians');
  return () => ({
    id: 'RotationOverLifetime', phase: 'appearance', updateWrites: ['rotation'],
    update(p, ctx) {
      p.rotation = p.data.startRotationRadians + angularSpeedRadians * ctx.ageSeconds;
      return undefined;
    },
  });
}
export { createRotationOverLifetime as createRotationOverLifetimeModule };

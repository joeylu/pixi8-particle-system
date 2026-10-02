import type { ParticleBehavior } from '../core/contracts.js';
import type { ParticleModuleData, StartValuesConfig } from '../composition/contracts.js';
import { seedSnapshot, startSnapshot } from '../composition/config.js';
import { RandomChannel, sampleRange } from '../composition/random.js';

export function createStartValues(config: StartValuesConfig, seed = 1): () => ParticleBehavior<ParticleModuleData> {
  if (arguments.length > 1 && arguments[1] === undefined) throw new TypeError('seed cannot be explicitly undefined');
  const values = startSnapshot(config), seedValue = seedSnapshot(seed);
  return () => ({
    id: 'StartValues', phase: 'appearance', initWrites: ['vx', 'vy', 'scaleX', 'scaleY', 'rotation', 'tint', 'alpha'],
    init(p, ctx) {
      const index = p.data.birthIndex;
      const speed = sampleRange(values.startSpeed, seedValue, index, RandomChannel.Speed);
      const scale = sampleRange(values.startScale, seedValue, index, RandomChannel.Scale);
      p.vx = speed * Math.cos(p.data.directionRadians); p.vy = speed * Math.sin(p.data.directionRadians);
      if (ctx.simulationSpace === 'world') {
        if (!ctx.environment) throw new TypeError('World StartValues requires environment');
        const matrix = ctx.environment.emitterTransform, vx = p.vx, vy = p.vy;
        p.vx = matrix.a * vx + matrix.c * vy; p.vy = matrix.b * vx + matrix.d * vy;
      }
      p.scaleX = scale; p.scaleY = scale;
      p.rotation = sampleRange(values.startRotationRadians, seedValue, index, RandomChannel.Rotation);
      p.tint = values.startTint; p.alpha = values.startAlpha;
      p.data.startScaleX = p.scaleX; p.data.startScaleY = p.scaleY;
      p.data.startRotationRadians = p.rotation; p.data.startTint = p.tint; p.data.startAlpha = p.alpha;
      return undefined;
    },
  });
}
export { createStartValues as createMainStartValues };

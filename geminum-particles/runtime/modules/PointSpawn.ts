import type { ParticleInitializer } from '../core/contracts.js';
import { finite, knownKeys, object } from '../core/validation.js';

export function createPointSpawn<T extends object = Record<string, never>>(
  config: { offsetX?: number; offsetY?: number; velocityX?: number; velocityY?: number } = {},
): () => ParticleInitializer<T> {
  object(config, 'PointSpawn config');
  knownKeys(config, ['offsetX', 'offsetY', 'velocityX', 'velocityY'], 'PointSpawn');
  const read = (key: keyof typeof config): number => {
    const value = key in config ? config[key] : 0;
    finite(value, key);
    return value;
  };
  const offsetX = read('offsetX'), offsetY = read('offsetY');
  const velocityX = read('velocityX'), velocityY = read('velocityY');
  return () => ({
    id: 'PointSpawn', initWrites: ['x', 'y', 'vx', 'vy'],
    init(p, ctx) {
      p.x = ctx.origin.x + offsetX; p.y = ctx.origin.y + offsetY;
      p.vx = velocityX; p.vy = velocityY;
      if (ctx.simulationSpace === 'world') {
        if (!ctx.environment) throw new TypeError('World PointSpawn requires environment');
        const matrix = ctx.environment.emitterTransform, x = p.x, y = p.y;
        p.x = matrix.a * x + matrix.c * y + matrix.tx;
        p.y = matrix.b * x + matrix.d * y + matrix.ty;
        p.vx = matrix.a * velocityX + matrix.c * velocityY;
        p.vy = matrix.b * velocityX + matrix.d * velocityY;
      }
      return undefined;
    },
  });
}

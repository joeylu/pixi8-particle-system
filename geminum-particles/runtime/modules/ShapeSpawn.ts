import type { ParticleInitializer } from '../core/contracts.js';
import type { ParticleModuleData, ShapeConfig } from '../composition/contracts.js';
import { shapeSnapshot, seedSnapshot } from '../composition/config.js';
import { RandomChannel, sampleUnit } from '../composition/random.js';

export function createShapeSpawn(config: ShapeConfig, seed = 1): () => ParticleInitializer<ParticleModuleData> {
  if (arguments.length > 1 && arguments[1] === undefined) throw new TypeError('seed cannot be explicitly undefined');
  const shape = shapeSnapshot(config), seedValue = seedSnapshot(seed);
  return () => {
    let birthIndex = 0;
    return {
      id: 'ShapeSpawn', initWrites: ['x', 'y'],
      init(p, ctx) {
        if (!Number.isSafeInteger(birthIndex)) throw new RangeError('birthIndex overflow');
        const index = birthIndex++;
        let x = 0, y = 0;
        if (shape.type === 'circle') {
          const radius = shape.radius * Math.sqrt(sampleUnit(seedValue, index, RandomChannel.ShapeX));
          const angle = 2 * Math.PI * sampleUnit(seedValue, index, RandomChannel.ShapeY);
          x = radius * Math.cos(angle); y = radius * Math.sin(angle);
        } else if (shape.type === 'rectangle') {
          x = shape.width * (sampleUnit(seedValue, index, RandomChannel.ShapeX) - 0.5);
          y = shape.height * (sampleUnit(seedValue, index, RandomChannel.ShapeY) - 0.5);
        }
        p.x = ctx.origin.x + shape.offsetX + x; p.y = ctx.origin.y + shape.offsetY + y;
        if (ctx.simulationSpace === 'world') {
          if (!ctx.environment) throw new TypeError('World ShapeSpawn requires environment');
          const matrix = ctx.environment.emitterTransform, localX = p.x, localY = p.y;
          p.x = matrix.a * localX + matrix.c * localY + matrix.tx;
          p.y = matrix.b * localX + matrix.d * localY + matrix.ty;
        }
        p.data.birthIndex = index;
        p.data.directionRadians = shape.directionRadians + shape.spreadRadians * (sampleUnit(seedValue, index, RandomChannel.Direction) - 0.5);
        return undefined;
      },
      reset() { birthIndex = 0; return undefined; },
    };
  };
}
export { createShapeSpawn as createShapeModule };

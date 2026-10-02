import type { ParticleBehavior } from '../core/contracts.js';

export function createLinearMotion<T extends object = Record<string, never>>(): () => ParticleBehavior<T> {
  return () => ({
    id: 'LinearMotion', phase: 'motion', updateWrites: ['x', 'y'],
    update(p, ctx) {
      if (ctx.gravityModifier !== undefined && ctx.gravityModifier !== 0) throw new TypeError('Nonzero gravityModifier requires KinematicMotion');
      p.x += p.vx * ctx.dtSeconds; p.y += p.vy * ctx.dtSeconds;
      return undefined;
    },
  });
}

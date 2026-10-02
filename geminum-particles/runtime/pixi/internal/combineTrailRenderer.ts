import type { ParticleRenderer, ParticleLifecycleObserver } from '../../core/contracts.js';
import type { ParticleTrails } from '../../modules/Trails.js';
import { PixiTrailRenderer, validatePixiTrailRenderOptions, type PixiTrailRenderOptions } from '../PixiTrailRenderer.js';
import { syncFunction, undefinedResult } from '../../core/validation.js';

export function requireTrailBinding(observers: readonly ParticleLifecycleObserver[] | undefined, options?: PixiTrailRenderOptions): ParticleTrails | undefined {
  const trails = observers?.find(observer => observer.id === 'trails') as ParticleTrails | undefined;
  if (!!trails !== !!options) throw new TypeError('Trails and trailRenderer must be provided together');
  if (options) validatePixiTrailRenderOptions(options);
  return trails;
}
export function combineTrailRenderer<T extends object>(body: ParticleRenderer<T>, trails: ParticleTrails | undefined, options?: PixiTrailRenderOptions) {
  let tail: PixiTrailRenderer | undefined;
  try {
    syncFunction(body.sync, 'body renderer.sync'); syncFunction(body.destroy, 'body renderer.destroy');
    if (trails) { tail = new PixiTrailRenderer({ ...options!, trails }); syncFunction(tail.sync, 'trail renderer.sync'); syncFunction(tail.destroy, 'trail renderer.destroy'); }
  }
  catch (error) { const failures: unknown[] = []; for (const child of [body, tail]) try { if (child) undefinedResult(child.destroy()); } catch (failure) { failures.push(failure); } if (failures.length) throw Object.assign(new Error('Trail construction and cleanup failed'), { cause: error, cleanupErrors: failures }); throw error; }
  let cleanupFailure: Error | undefined;
  const disposed = new Set<ParticleRenderer<T> | PixiTrailRenderer>();
  const renderer: ParticleRenderer<T> = {
    sync(snapshot) { undefinedResult(body.sync(snapshot)); if (tail) undefinedResult(tail.sync()); return undefined; },
    destroy() { const errors: unknown[] = []; for (const child of [body, tail]) { if (!child || disposed.has(child)) continue; try { undefinedResult(child.destroy()); disposed.add(child); } catch (error) { errors.push(error); } } if (errors.length && !cleanupFailure) cleanupFailure = Object.assign(new Error('Particle renderer cleanup failed'), { cleanupErrors: errors }); if (cleanupFailure) throw cleanupFailure; return undefined; },
  };
  return { renderer, trailContainer: tail?.container };
}

import type { Container, ParticleContainer, Texture, Rectangle } from 'pixi.js';
import { ParticleSystem } from '../core/ParticleSystem.js';
import type { ParticleSystemOptions } from '../core/contracts.js';
import { PixiParticleRenderer } from './PixiParticleRenderer.js';
import { createPixiParticleSpaceRuntime, type PixiParticleSpaceOptions } from './space.js';
import type { PixiTrailRenderOptions } from './PixiTrailRenderer.js';
import { combineTrailRenderer, requireTrailBinding } from './internal/combineTrailRenderer.js';

export type PixiParticleSystemOptions<T extends object = Record<string, never>> =
  Omit<ParticleSystemOptions<T>, 'renderer'> & { texture: Texture; blendMode?: 'normal' | 'add'; boundsArea?: Rectangle; trailRenderer?: PixiTrailRenderOptions } & PixiParticleSpaceOptions;

export function createPixiParticleSystem<T extends object = Record<string, never>>(
  options: PixiParticleSystemOptions<T>,
): { system: ParticleSystem<T>; container: ParticleContainer; trailContainer?: Container } {
  const { texture, blendMode, boundsArea, space, gravity, trailRenderer, ...coreOptions } = options;
  if ('trailRenderer' in options && trailRenderer === undefined) throw new TypeError('trailRenderer cannot be undefined');
  if (('space' in options || 'gravity' in options) && 'environment' in options) throw new TypeError('space/gravity and environment are mutually exclusive');
  if ('space' in options && space === undefined || 'gravity' in options && gravity === undefined) throw new TypeError('space and gravity cannot be undefined');
  const runtime = !('environment' in options) || 'space' in options ? createPixiParticleSpaceRuntime(options, [coreOptions.main]) : undefined;
  let renderer: PixiParticleRenderer<T> | undefined;
  let system: ParticleSystem<T> | undefined;
  let combined: ReturnType<typeof combineTrailRenderer<T>> | undefined;
  let trailWorldSpace = false;
  try {
    system = new ParticleSystem<T>({
      ...coreOptions,
      ...(runtime ? { environment: () => ({ sample: () => ({ emitterTransform: runtime.sample(), gravity: runtime.gravity }) }) } : {}),
      renderer: ({ updateWrites, observers }) => {
        const trails = requireTrailBinding(observers, trailRenderer);
        if (trails?.config.worldSpace && !space) throw new TypeError('World-space trails require space');
        trailWorldSpace = trails?.config.worldSpace ?? false;
        renderer = new PixiParticleRenderer<T>({ texture, blendMode, boundsArea, updateWrites });
        combined = combineTrailRenderer(renderer, trails, trailRenderer);
        return combined.renderer;
      },
    });
    if (runtime) {
      const trail = combined?.trailContainer;
      if (trail) runtime.attach(trail, trailWorldSpace ? 'world' : coreOptions.main.simulationSpace ?? 'local');
      runtime.attach(renderer!.container, coreOptions.main.simulationSpace ?? 'local');
    }
    return { system, container: renderer!.container, ...(combined?.trailContainer ? { trailContainer: combined.trailContainer } : {}) };
  } catch (error) {
    if (system || renderer) {
      try { if (system) system.destroy(); else renderer!.destroy(); } catch (cleanupError) {
        throw Object.assign(new Error('Particle system construction and cleanup failed'), { constructionError: error, cleanupErrors: [cleanupError] });
      }
    }
    throw error;
  }
}

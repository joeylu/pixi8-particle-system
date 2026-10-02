import { ParticleSystem } from '../../core/ParticleSystem.js';
import type { ParticleSystemOptions } from '../../core/contracts.js';
import type { ParticleModuleData } from '../../composition/contracts.js';
import { normalizeParticleFrameSelection } from '../../entity/index.js';
import { PixiFrameParticleRenderer, type PixiFrameParticleRendererOptions } from '../PixiFrameParticleRenderer.js';
import type { PixiTrailRenderOptions } from '../PixiTrailRenderer.js';
import { combineTrailRenderer, requireTrailBinding } from './combineTrailRenderer.js';
import type { ParticleRenderer } from '../../core/contracts.js';

/** Shared construction owner for compiled single-layer and entity effects. */
export function createCompiledFrameEffect(compiled: Omit<ParticleSystemOptions<ParticleModuleData>, 'renderer'>,
  options: Omit<PixiFrameParticleRendererOptions, 'updateWrites'>, trailOptions?: PixiTrailRenderOptions) {
  const selection = normalizeParticleFrameSelection(options.textureSheetAnimation ?? options.selection!);
  const lifetime = compiled.main.startLifetime ?? compiled.main.lifetimeSeconds!;
  if (selection.mode === 'sequence' && !Number.isFinite(selection.fps * lifetime)) throw new RangeError('Sequence fps times lifetime must be finite');
  let renderer: PixiFrameParticleRenderer | undefined;
  let combined: ReturnType<typeof combineTrailRenderer<ParticleModuleData>> | undefined;
  let ownedRenderer: ParticleRenderer<ParticleModuleData> | undefined;
  try {
    const system = new ParticleSystem<ParticleModuleData>({ ...compiled, renderer: ({ updateWrites, observers }) => {
      const trails = requireTrailBinding(observers, trailOptions);
      renderer = new PixiFrameParticleRenderer({ ...options, updateWrites } as PixiFrameParticleRendererOptions);
      combined = combineTrailRenderer(renderer, trails, trailOptions); ownedRenderer = combined.renderer;
      return ownedRenderer;
    } });
    return { system, container: renderer!.container, ...(combined?.trailContainer ? { trailContainer: combined.trailContainer } : {}) };
  } catch (error) {
    if (ownedRenderer || renderer) try { (ownedRenderer ?? renderer)!.destroy(); } catch (cleanupError) {
      throw Object.assign(new Error('Frame effect construction and cleanup failed'), { cause: error, cleanupErrors: [cleanupError] });
    }
    throw error;
  }
}

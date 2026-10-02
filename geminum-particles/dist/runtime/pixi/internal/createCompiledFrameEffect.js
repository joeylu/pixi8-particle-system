import { ParticleSystem } from '../../core/ParticleSystem.js';
import { normalizeParticleFrameSelection } from '../../entity/index.js';
import { PixiFrameParticleRenderer } from '../PixiFrameParticleRenderer.js';
import { combineTrailRenderer, requireTrailBinding } from './combineTrailRenderer.js';
/** Shared construction owner for compiled single-layer and entity effects. */
export function createCompiledFrameEffect(compiled, options, trailOptions) {
    const selection = normalizeParticleFrameSelection(options.textureSheetAnimation ?? options.selection);
    const lifetime = compiled.main.startLifetime ?? compiled.main.lifetimeSeconds;
    if (selection.mode === 'sequence' && !Number.isFinite(selection.fps * lifetime))
        throw new RangeError('Sequence fps times lifetime must be finite');
    let renderer;
    let combined;
    let ownedRenderer;
    try {
        const system = new ParticleSystem({ ...compiled, renderer: ({ updateWrites, observers }) => {
                const trails = requireTrailBinding(observers, trailOptions);
                renderer = new PixiFrameParticleRenderer({ ...options, updateWrites });
                combined = combineTrailRenderer(renderer, trails, trailOptions);
                ownedRenderer = combined.renderer;
                return ownedRenderer;
            } });
        return { system, container: renderer.container, ...(combined?.trailContainer ? { trailContainer: combined.trailContainer } : {}) };
    }
    catch (error) {
        if (ownedRenderer || renderer)
            try {
                (ownedRenderer ?? renderer).destroy();
            }
            catch (cleanupError) {
                throw Object.assign(new Error('Frame effect construction and cleanup failed'), { cause: error, cleanupErrors: [cleanupError] });
            }
        throw error;
    }
}

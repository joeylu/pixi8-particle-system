import { ParticleSystem } from '../../core/ParticleSystem.js';
import type { ParticleSystemOptions } from '../../core/contracts.js';
import type { ParticleModuleData } from '../../composition/contracts.js';
import { type PixiFrameParticleRendererOptions } from '../PixiFrameParticleRenderer.js';
import type { PixiTrailRenderOptions } from '../PixiTrailRenderer.js';
/** Shared construction owner for compiled single-layer and entity effects. */
export declare function createCompiledFrameEffect(compiled: Omit<ParticleSystemOptions<ParticleModuleData>, 'renderer'>, options: Omit<PixiFrameParticleRendererOptions, 'updateWrites'>, trailOptions?: PixiTrailRenderOptions): {
    trailContainer?: import("pixi.js").Container<import("pixi.js").ContainerChild> | undefined;
    system: ParticleSystem<ParticleModuleData>;
    container: import("pixi.js").ParticleContainer<import("pixi.js").Particle>;
};

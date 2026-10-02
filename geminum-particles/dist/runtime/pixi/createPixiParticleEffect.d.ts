import type { Container, Texture, Rectangle, ParticleContainer } from 'pixi.js';
import type { PixiTrailRenderOptions } from './PixiTrailRenderer.js';
import type { ParticleSystem } from '../core/ParticleSystem.js';
import type { ParticleEffectConfig, ParticleModuleData } from '../composition/contracts.js';
import type { PixiParticleSpaceOptions } from './space.js';
export type CreatePixiParticleEffectOptions = ParticleEffectConfig & {
    texture: Texture;
    blendMode?: 'normal' | 'add';
    boundsArea?: Rectangle;
    trailRenderer?: PixiTrailRenderOptions;
} & PixiParticleSpaceOptions;
/** Compile effect modules and reuse the existing host-owned-texture Pixi adapter. */
export declare function createPixiParticleEffect(options: CreatePixiParticleEffectOptions): {
    system: ParticleSystem<ParticleModuleData>;
    container: ParticleContainer;
    trailContainer?: Container;
};

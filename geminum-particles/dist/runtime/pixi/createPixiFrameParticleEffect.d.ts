import type { Container, Particle, ParticleContainer, Rectangle, Texture } from 'pixi.js';
import type { PixiTrailRenderOptions } from './PixiTrailRenderer.js';
import type { ParticleSystem } from '../core/ParticleSystem.js';
import type { ParticleEffectConfig, ParticleModuleData } from '../composition/contracts.js';
import { type ParticleFrameSelection } from '../entity/index.js';
import { type PixiParticleSpaceOptions } from './space.js';
export type CreatePixiFrameParticleEffectOptions = ParticleEffectConfig & {
    textures: readonly Texture[];
    blendMode?: 'normal' | 'add';
    boundsArea?: Rectangle;
    trailRenderer?: PixiTrailRenderOptions;
} & PixiParticleSpaceOptions & ({
    textureSheetAnimation: ParticleFrameSelection;
    selection?: never;
} | {
    selection: ParticleFrameSelection;
    textureSheetAnimation?: never;
});
export declare function createPixiFrameParticleEffect(options: CreatePixiFrameParticleEffectOptions): {
    system: ParticleSystem<ParticleModuleData>;
    container: ParticleContainer<Particle>;
    trailContainer?: Container;
};

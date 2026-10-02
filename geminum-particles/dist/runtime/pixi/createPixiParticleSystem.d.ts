import type { Container, ParticleContainer, Texture, Rectangle } from 'pixi.js';
import { ParticleSystem } from '../core/ParticleSystem.js';
import type { ParticleSystemOptions } from '../core/contracts.js';
import { type PixiParticleSpaceOptions } from './space.js';
import type { PixiTrailRenderOptions } from './PixiTrailRenderer.js';
export type PixiParticleSystemOptions<T extends object = Record<string, never>> = Omit<ParticleSystemOptions<T>, 'renderer'> & {
    texture: Texture;
    blendMode?: 'normal' | 'add';
    boundsArea?: Rectangle;
    trailRenderer?: PixiTrailRenderOptions;
} & PixiParticleSpaceOptions;
export declare function createPixiParticleSystem<T extends object = Record<string, never>>(options: PixiParticleSystemOptions<T>): {
    system: ParticleSystem<T>;
    container: ParticleContainer;
    trailContainer?: Container;
};

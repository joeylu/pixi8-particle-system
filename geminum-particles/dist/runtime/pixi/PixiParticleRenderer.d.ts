import { Particle, ParticleContainer, Rectangle, Texture } from 'pixi.js';
import type { ParticleField, ParticleRenderer, ParticleRenderSnapshot } from '../core/contracts.js';
export interface PixiParticleRendererOptions {
    texture: Texture;
    updateWrites: readonly ParticleField[];
    blendMode?: 'normal' | 'add';
    boundsArea?: Rectangle;
}
/** Owns presentation objects; the host retains ownership of the supplied texture. */
export declare class PixiParticleRenderer<T extends object = Record<string, never>> implements ParticleRenderer<T> {
    readonly container: ParticleContainer<Particle>;
    private texture;
    private readonly particles;
    private membershipVersion;
    private disposing;
    constructor(options: PixiParticleRendererOptions);
    sync(snapshot: ParticleRenderSnapshot<T>): undefined;
    destroy(): undefined;
}

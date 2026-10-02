import { Particle, ParticleContainer, Rectangle, Texture } from 'pixi.js';
import type { ParticleField, ParticleRenderer, ParticleRenderSnapshot } from '../core/contracts.js';
import type { ParticleModuleData } from '../composition/contracts.js';
import { type ParticleFrameSelection } from '../entity/index.js';
export type PixiFrameParticleRendererOptions = {
    textures: readonly Texture[];
    updateWrites: readonly ParticleField[];
    blendMode?: 'normal' | 'add';
    boundsArea?: Rectangle;
} & ({
    textureSheetAnimation: ParticleFrameSelection;
    selection?: never;
} | {
    selection: ParticleFrameSelection;
    textureSheetAnimation?: never;
}) & ({
    randomSeed?: number;
    seed?: never;
} | {
    seed?: number;
    randomSeed?: never;
});
export declare class PixiFrameParticleRenderer<T extends ParticleModuleData = ParticleModuleData> implements ParticleRenderer<T> {
    readonly container: ParticleContainer<Particle>;
    private textures;
    private readonly entries;
    private readonly select;
    private readonly sequence;
    private version;
    private disposing;
    private cleanupFailure;
    private source;
    constructor(options: PixiFrameParticleRendererOptions);
    sync(snapshot: ParticleRenderSnapshot<T>): undefined;
    destroy(): undefined;
}

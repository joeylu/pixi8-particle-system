import { Texture } from 'pixi.js';
import type { ParticleGridDimensions } from '../entity/index.js';
/** Validate public texture geometry without taking ownership of its source. */
export declare function validateParticleTexture(texture: Texture): void;
/** Row-major views share the host source; the caller owns only these views. */
export declare function createGridParticleTextures(texture: Texture, grid: ParticleGridDimensions): readonly Texture[];

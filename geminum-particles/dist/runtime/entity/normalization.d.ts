import type { ParticleEffectConfig, ParticleEffectMainConfig } from '../composition/contracts.js';
import type { NormalizedParticleFrameSelection, ParticleEntityLayerConfig, ParticleFrameSelection, ParticleGridDimensions } from './contracts.js';
export declare function normalizeParticleGridDimensions(grid: ParticleGridDimensions): Readonly<{
    columns: number;
    rows: number;
}>;
/** selectionMode denotes frame selection, independently of texture layout. */
export declare function normalizeParticleFrameSelection(selection: ParticleFrameSelection): NormalizedParticleFrameSelection;
/** Accessors operate on layers returned by validateParticleEntityConfig or parseParticleEntityConfig. */
export declare function getParticleEntityLayerMain(layer: ParticleEntityLayerConfig): ParticleEffectMainConfig | undefined;
export declare function getParticleEntityLayerTextureSheetAnimation(layer: ParticleEntityLayerConfig): ParticleFrameSelection;
export declare function getParticleEntityLayerEffectConfig(layer: ParticleEntityLayerConfig): ParticleEffectConfig;

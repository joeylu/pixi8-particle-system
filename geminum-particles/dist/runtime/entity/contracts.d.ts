import type { ParticleEffectConfig, ParticleEffectMainConfig } from '../composition/contracts.js';
export interface ParticleTextureReference {
    asset: string;
    frame?: string;
}
export type ParticleGridDimensions = ({
    numTilesX: number;
    columns?: never;
} | {
    columns: number;
    numTilesX?: never;
}) & ({
    numTilesY: number;
    rows?: never;
} | {
    rows: number;
    numTilesY?: never;
});
export type ParticleTextureSetConfig = {
    id: string;
    textures: readonly ParticleTextureReference[];
    grid?: never;
} | {
    id: string;
    grid: ParticleGridDimensions & {
        asset: string;
    };
    textures?: never;
};
type SelectionMode<M extends string> = {
    selectionMode: M;
    mode?: never;
} | {
    mode: M;
    selectionMode?: never;
};
export type ParticleTextureSheetAnimationConfig = (SelectionMode<'single'> & {
    index?: number;
}) | SelectionMode<'random'> | (SelectionMode<'sequence'> & {
    fps: number;
    loop?: boolean;
});
export type TextureSheetAnimationConfig = ParticleTextureSheetAnimationConfig;
export type ParticleFrameSelection = ParticleTextureSheetAnimationConfig;
export type NormalizedParticleFrameSelection = Readonly<{
    mode: 'single';
    index?: number;
}> | Readonly<{
    mode: 'random';
}> | Readonly<{
    mode: 'sequence';
    fps: number;
    loop?: boolean;
}>;
type EntityModules = Omit<ParticleEffectConfig, 'main'> & {
    textureSheetAnimation?: ParticleTextureSheetAnimationConfig;
};
interface ParticleEntityLayerBase {
    id: string;
    origin?: {
        x: number;
        y: number;
    };
    activation: {
        mode: 'continuous';
    } | {
        mode: 'burst';
        count: number;
    };
    core?: ParticleEffectMainConfig;
    main?: ParticleEffectMainConfig;
    modules?: EntityModules;
    renderer: {
        textureSet: string;
        selection?: ParticleFrameSelection;
        blendMode?: 'normal' | 'add';
        trail?: {
            textureSet: string;
            blendMode?: 'normal' | 'add';
            tint?: number;
            alpha?: number;
        };
        boundsArea?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    };
}
export type ParticleEntityLayerConfig = ParticleEntityLayerBase & ({
    main?: ParticleEffectMainConfig;
    core?: never;
} | {
    core?: ParticleEffectMainConfig;
    main?: never;
}) & ({
    modules: EntityModules & {
        textureSheetAnimation: ParticleTextureSheetAnimationConfig;
    };
    renderer: ParticleEntityLayerBase['renderer'] & {
        selection?: never;
    };
} | {
    modules?: EntityModules & {
        textureSheetAnimation?: never;
    };
    renderer: ParticleEntityLayerBase['renderer'] & {
        selection: ParticleFrameSelection;
    };
});
export interface ParticleEntityConfig {
    schemaVersion: 1;
    id: string;
    textureSets: readonly ParticleTextureSetConfig[];
    layers: readonly ParticleEntityLayerConfig[];
}
export {};

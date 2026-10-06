import type { TrailsConfig } from '../modules/Trails.js';
import type { ParticleAffineTransform, ParticleRendererFactory, ParticleVector2 } from '../core/contracts.js';
export type ScalarRange = number | Readonly<{
    min: number;
    max: number;
}>;
export interface StartValuesConfig {
    startSpeed?: ScalarRange;
    startScale?: ScalarRange;
    startRotationRadians?: ScalarRange;
    startRotation?: ScalarRange;
    startTint?: number;
    startAlpha?: ScalarRange;
    startScaleAspect?: {
        x: number;
        y: number;
    };
}
export interface ParticleEffectMainConfig extends StartValuesConfig {
    maxParticles?: number;
    maxBirthsPerUpdate?: number;
    lifetimeSeconds?: number;
    startLifetime?: ScalarRange;
    seed?: number;
    randomSeed?: number;
    simulationSpace?: 'local' | 'world';
    gravityModifier?: number;
}
export interface ShapeCommonConfig {
    offsetX?: number;
    offsetY?: number;
    directionRadians?: number;
    spreadRadians?: number;
    directionMode?: 'fixed' | 'outward' | 'inward';
}
type ShapeName<T extends string> = {
    shapeType: T;
    type?: never;
} | {
    type: T;
    shapeType?: never;
};
export type ShapeConfig = (ShapeCommonConfig & ShapeName<'point'>) | (ShapeCommonConfig & ShapeName<'circle'> & {
    radius?: number;
    innerRadius?: number;
}) | (ShapeCommonConfig & ShapeName<'rectangle'> & {
    width?: number;
    height?: number;
});
export interface ForceOverLifetimeConfig {
    x?: number;
    y?: number;
    accelerationX?: number;
    accelerationY?: number;
}
export type ForceConfig = ForceOverLifetimeConfig;
export interface EmissionModuleConfig {
    rateOverTime?: number;
    ratePerSecond?: number;
    startDelay?: number;
    duration?: number;
    loop?: boolean;
    bursts?: readonly {
        time: number;
        count: number;
    }[];
}
export interface ConstantForce {
    readonly accelerationX: number;
    readonly accelerationY: number;
}
export type ConstantForceFactory = () => ConstantForce;
export type ParticleCurve = readonly {
    t: number;
    value: number;
}[];
export interface ColorOverLifetimeConfig {
    endTint?: number;
    endAlphaFactor?: number;
    alphaCurve?: ParticleCurve;
    colorCurve?: ParticleCurve;
}
export interface SizeOverLifetimeConfig {
    endScaleFactor?: number;
    scaleCurve?: ParticleCurve;
}
export interface RotationOverLifetimeConfig {
    z?: ScalarRange;
    angularSpeedRadians?: ScalarRange;
}
export interface ParticleEffectConfig {
    trails?: TrailsConfig;
    main?: ParticleEffectMainConfig;
    emission?: EmissionModuleConfig;
    shape?: ShapeConfig;
    limitVelocityOverLifetime?: {
        drag: number;
    };
    force?: ForceConfig;
    forceOverLifetime?: ForceOverLifetimeConfig;
    colorOverLifetime?: ColorOverLifetimeConfig;
    sizeOverLifetime?: SizeOverLifetimeConfig;
    rotationOverLifetime?: RotationOverLifetimeConfig;
}
export interface ParticleModuleData {
    birthIndex: number;
    directionRadians: number;
    startScaleX: number;
    startScaleY: number;
    startRotationRadians: number;
    startTint: number;
    startAlpha: number;
}
export type CreateParticleEffectOptions = ParticleEffectConfig & {
    renderer: ParticleRendererFactory<ParticleModuleData>;
    environment?: ParticleEffectEnvironment;
};
export interface ParticleEffectEnvironment {
    gravity?: ParticleVector2;
    getEmitterTransform?: () => ParticleAffineTransform;
}
export {};

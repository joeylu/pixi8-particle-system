import type { BirthContext, ParticleAdvanceContext, ParticleDeathContext, ParticleLifecycleObserver, ParticleObservation, ParticleUpdateContext } from '../core/contracts.js';
export interface TrailsConfig {
    lifetime?: number;
    minVertexDistance?: number;
    worldSpace?: boolean;
    dieWithParticles?: boolean;
    width?: number;
    maxPointsPerTrail?: number;
    maxTrails?: number;
    breakDistance?: number;
    textureMode?: 'stretch';
}
export interface ParticleTrailPoint {
    readonly x: number;
    readonly y: number;
    readonly timeSeconds: number;
    readonly breakBefore: boolean;
}
export interface ParticleTrailSnapshot {
    readonly birthId: number;
    readonly points: readonly ParticleTrailPoint[];
}
/** Records observed motion slices in a bounded trail basis. */
export declare class ParticleTrails implements ParticleLifecycleObserver {
    readonly id = "trails";
    readonly config: Readonly<Required<TrailsConfig>>;
    readonly requiresEnvironment: boolean;
    private records;
    private cached;
    private destroyed;
    constructor(config: TrailsConfig);
    private live;
    private point;
    onBirth(p: ParticleObservation, ctx: BirthContext): undefined;
    private sample;
    onUpdate(p: ParticleObservation, ctx: ParticleUpdateContext): undefined;
    onDeath(p: ParticleObservation, ctx: ParticleDeathContext): undefined;
    onAdvance(ctx: ParticleAdvanceContext): undefined;
    hasPendingWork(): boolean;
    snapshot(): readonly ParticleTrailSnapshot[];
    reset(): undefined;
    destroy(): undefined;
}
export declare function createTrailsModule(config: TrailsConfig): () => ParticleTrails;

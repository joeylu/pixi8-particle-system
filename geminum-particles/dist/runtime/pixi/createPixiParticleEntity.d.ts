import { Container, Texture, type Particle, type ParticleContainer } from 'pixi.js';
import type { ParticleSystem } from '../core/ParticleSystem.js';
import type { ParticleModuleData } from '../composition/contracts.js';
import { type ParticleEntityConfig, type ParticleTextureReference } from '../entity/index.js';
import { type PixiParticleSpaceOptions, type PixiParticleSpaceRuntime } from './space.js';
export interface PixiParticleEntityLayer {
    readonly id: string;
    readonly system: ParticleSystem<ParticleModuleData>;
    readonly container: ParticleContainer<Particle>;
    readonly trailContainer?: Container;
}
export type PixiParticleEntityState = 'stopped' | 'playing' | 'draining' | 'paused' | 'faulted' | 'destroyed';
export interface CreatePixiParticleEntityOptions extends PixiParticleSpaceOptions {
    config: unknown;
    resolveTexture: (reference: ParticleTextureReference) => Texture | Promise<Texture>;
}
export declare class PixiParticleEntity {
    readonly container: Container;
    private readonly config;
    private readonly ownedViews;
    private readonly spaceRuntime?;
    readonly layers: readonly PixiParticleEntityLayer[];
    private mode;
    private previous;
    private failure;
    private busy;
    private cleanupFailure;
    constructor(container: Container, layers: readonly PixiParticleEntityLayer[], config: ParticleEntityConfig, ownedViews: Texture[], spaceRuntime?: PixiParticleSpaceRuntime | undefined);
    get state(): PixiParticleEntityState;
    get particleCount(): number;
    get error(): unknown;
    private guard;
    private healthy;
    private run;
    play(): void;
    pause(): void;
    resume(): void;
    stop(options?: {
        killLayerIds?: readonly string[];
    }): void;
    reset(): void;
    setOrigin(x: number, y: number): void;
    update(seconds: number): void;
    destroy(): void;
}
export declare function createPixiParticleEntity(options: CreatePixiParticleEntityOptions): Promise<PixiParticleEntity>;

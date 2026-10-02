import { Container } from 'pixi.js';
import type { ParticleAffineTransform, ParticleVector2 } from '../core/contracts.js';
import type { ParticleEffectEnvironment } from '../composition/contracts.js';
export interface PixiParticleSpaceBindings {
    emitter: Container;
    world: Container;
}
export interface PixiParticleSpaceOptions {
    space?: PixiParticleSpaceBindings;
    gravity?: ParticleVector2;
}
type SpaceMain = {
    simulationSpace?: 'local' | 'world';
    gravityModifier?: number;
};
/** Coordinates host transforms while retaining ownership only of output poses. */
export declare class PixiParticleSpaceRuntime {
    readonly bindings: PixiParticleSpaceBindings;
    readonly gravity: ParticleVector2;
    private readonly owned;
    private cached;
    constructor(bindings: PixiParticleSpaceBindings, gravity?: ParticleVector2);
    private read;
    sample(): ParticleAffineTransform;
    begin(): void;
    end(): void;
    environment(): ParticleEffectEnvironment;
    attach(container: Container, mode: 'local' | 'world', parent?: Container<import("pixi.js").ContainerChild>): void;
}
export declare function createPixiParticleSpaceRuntime(options: PixiParticleSpaceOptions, mains: readonly SpaceMain[]): PixiParticleSpaceRuntime | undefined;
export {};

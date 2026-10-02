import type { ParticleRenderer, ParticleLifecycleObserver } from '../../core/contracts.js';
import type { ParticleTrails } from '../../modules/Trails.js';
import { type PixiTrailRenderOptions } from '../PixiTrailRenderer.js';
export declare function requireTrailBinding(observers: readonly ParticleLifecycleObserver[] | undefined, options?: PixiTrailRenderOptions): ParticleTrails | undefined;
export declare function combineTrailRenderer<T extends object>(body: ParticleRenderer<T>, trails: ParticleTrails | undefined, options?: PixiTrailRenderOptions): {
    renderer: ParticleRenderer<T>;
    trailContainer: import("pixi.js").Container<import("pixi.js").ContainerChild> | undefined;
};

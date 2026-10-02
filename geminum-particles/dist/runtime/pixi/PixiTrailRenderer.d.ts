import 'pixi.js/mesh';
import { Container, Texture } from 'pixi.js';
import type { ParticleTrails } from '../modules/Trails.js';
export interface PixiTrailRenderOptions {
    texture: Texture;
    blendMode?: 'normal' | 'add';
    tint?: number;
    alpha?: number;
}
export interface PixiTrailRendererOptions extends PixiTrailRenderOptions {
    trails: ParticleTrails;
}
export declare function validatePixiTrailRenderOptions(options: PixiTrailRenderOptions): void;
/** Shared-edge ribbons use bounded miter joins and per-section cumulative arc-length UVs. */
export declare class PixiTrailRenderer {
    readonly container: Container;
    private entries;
    private free;
    private failure;
    private destroyed;
    private readonly source;
    private readonly texture;
    private readonly trails;
    constructor(options: PixiTrailRendererOptions);
    sync(): undefined;
    destroy(): undefined;
}

import type { ParticleInitializer } from '../core/contracts.js';
export declare function createPointSpawn<T extends object = Record<string, never>>(config?: {
    offsetX?: number;
    offsetY?: number;
    velocityX?: number;
    velocityY?: number;
}): () => ParticleInitializer<T>;

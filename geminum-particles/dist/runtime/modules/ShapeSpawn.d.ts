import type { ParticleInitializer } from '../core/contracts.js';
import type { ParticleModuleData, ShapeConfig } from '../composition/contracts.js';
export declare function createShapeSpawn(config: ShapeConfig, seed?: number): () => ParticleInitializer<ParticleModuleData>;
export { createShapeSpawn as createShapeModule };

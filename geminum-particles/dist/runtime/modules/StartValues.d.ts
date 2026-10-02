import type { ParticleBehavior } from '../core/contracts.js';
import type { ParticleModuleData, StartValuesConfig } from '../composition/contracts.js';
export declare function createStartValues(config: StartValuesConfig, seed?: number): () => ParticleBehavior<ParticleModuleData>;
export { createStartValues as createMainStartValues };

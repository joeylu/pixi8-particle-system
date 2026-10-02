import type { ParticleBehavior } from '../core/contracts.js';
import type { ColorOverLifetimeConfig, ParticleModuleData } from '../composition/contracts.js';
export declare function createColorOverLifetime(config: ColorOverLifetimeConfig): () => ParticleBehavior<ParticleModuleData>;
export { createColorOverLifetime as createColorOverLifetimeModule };

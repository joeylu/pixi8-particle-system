import type { ParticleBehavior } from '../core/contracts.js';
import type { ParticleModuleData, RotationOverLifetimeConfig } from '../composition/contracts.js';
export declare function createRotationOverLifetime(config: RotationOverLifetimeConfig): () => ParticleBehavior<ParticleModuleData>;
export { createRotationOverLifetime as createRotationOverLifetimeModule };

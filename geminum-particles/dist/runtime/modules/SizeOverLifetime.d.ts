import type { ParticleBehavior } from '../core/contracts.js';
import type { ParticleModuleData, SizeOverLifetimeConfig } from '../composition/contracts.js';
export declare function createSizeOverLifetime(config: SizeOverLifetimeConfig): () => ParticleBehavior<ParticleModuleData>;
export { createSizeOverLifetime as createSizeOverLifetimeModule };

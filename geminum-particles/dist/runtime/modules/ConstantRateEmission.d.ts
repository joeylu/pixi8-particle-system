import type { ParticleEmission } from '../core/contracts.js';
import type { EmissionModuleConfig } from '../composition/contracts.js';
export declare function createConstantRateEmission(config: EmissionModuleConfig): () => ParticleEmission;
export { createConstantRateEmission as createEmissionModule };

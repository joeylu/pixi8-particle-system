import type { ParticleEmission } from '../core/contracts.js';
import type { EmissionModuleConfig } from '../composition/contracts.js';
/** One emission clock: delay once, then optional repeated half-open windows. */
export declare function createConstantRateEmission(config: EmissionModuleConfig): () => ParticleEmission;
export { createConstantRateEmission as createEmissionModule };

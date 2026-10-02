import type { ParticleBehavior } from '../core/contracts.js';
import type { ConstantForceFactory, ParticleModuleData } from '../composition/contracts.js';
export declare function createKinematicMotion(config?: {
    force?: ConstantForceFactory;
}): () => ParticleBehavior<ParticleModuleData>;

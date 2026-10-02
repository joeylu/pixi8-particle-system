import type { ParticleSystemOptions } from '../core/contracts.js';
import type { ParticleEffectConfig, ParticleEffectEnvironment, ParticleModuleData } from './contracts.js';
export declare const PARTICLE_EFFECT_KEYS: readonly string[];
export declare function compileParticleEffectConfig(config?: ParticleEffectConfig, environment?: ParticleEffectEnvironment): Omit<ParticleSystemOptions<ParticleModuleData>, 'renderer'> & {
    main: {
        maxParticles: number;
        maxBirthsPerUpdate: number;
        lifetimeSeconds: number;
    };
};

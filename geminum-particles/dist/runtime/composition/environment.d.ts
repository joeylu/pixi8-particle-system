import type { ParticleEnvironmentFactory } from '../core/contracts.js';
import type { ParticleEffectEnvironment } from './contracts.js';
export declare function compileParticleEffectEnvironment(input: ParticleEffectEnvironment, simulationSpace: 'local' | 'world', gravityModifier: number): ParticleEnvironmentFactory;

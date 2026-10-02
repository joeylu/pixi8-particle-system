import type { ParticleEntityConfig } from './contracts.js';
/** Scan structure before JSON.parse so duplicate decoded property names cannot disappear. */
export declare function parseParticleEntityConfig(json: string): ParticleEntityConfig;

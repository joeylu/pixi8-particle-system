import type { ParticleBehavior } from '../core/contracts.js';
export declare function createLinearMotion<T extends object = Record<string, never>>(): () => ParticleBehavior<T>;

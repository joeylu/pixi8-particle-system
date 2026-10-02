import type { ParticleFrameSelection } from './contracts.js';
export declare function createParticleFrameSelector(selection: ParticleFrameSelection, frameCount: number, seed?: number): (birthIndex: number, ageSeconds: number) => number;

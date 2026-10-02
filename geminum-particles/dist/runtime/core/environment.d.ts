import type { ParticleAffineTransform, ParticleEnvironmentSnapshot, ParticleVector2 } from './contracts.js';
export declare function environmentObject(input: unknown, keys: readonly string[], required: readonly string[], label: string): Record<string, unknown>;
export declare function snapshotParticleVector2(input: unknown): ParticleVector2;
export declare function snapshotParticleAffineTransform(input: unknown): ParticleAffineTransform;
export declare function snapshotParticleEnvironment(input: unknown): ParticleEnvironmentSnapshot;

import type { ParticleField, ParticleState } from './contracts.js';
export declare const PARTICLE_FIELDS: readonly ParticleField[];
export declare function object(value: unknown, label: string): asserts value is Record<string, unknown>;
export declare function finite(value: unknown, label: string): asserts value is number;
export declare function integer(value: unknown, label: string, minimum: number): asserts value is number;
export declare function knownKeys(value: object, allowed: readonly string[], label: string): void;
/** Read exactly one own data field; an explicit field never falls back to a default. */
export declare function aliasValue(config: object, canonical: string, alias: string, fallback?: unknown): unknown;
export declare function syncFunction(value: unknown, label: string): asserts value is (...args: never[]) => unknown;
export declare function undefinedResult(value: unknown): void;
export declare function checkFields<T extends object>(p: ParticleState<T>, fields: readonly ParticleField[], moduleId?: string): void;
export declare function declaration(value: unknown, label: string): readonly ParticleField[];

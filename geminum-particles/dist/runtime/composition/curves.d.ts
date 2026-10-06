import type { ParticleCurve } from './contracts.js';
export declare function curveSnapshot(input: ParticleCurve, label: string, maximum?: number): ParticleCurve;
export declare function evaluateCurve(curve: ParticleCurve, t: number, color?: boolean): number;

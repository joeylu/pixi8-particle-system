import type { ScalarRange } from './contracts.js';
export declare const RandomChannel: Readonly<{
    ShapeX: 1;
    ShapeY: 2;
    Direction: 3;
    Speed: 4;
    Scale: 5;
    Rotation: 6;
    Lifetime: 8;
    Alpha: 9;
    AngularSpeed: 10;
    Clip: 11;
    Fps: 12;
    Phase: 13;
}>;
/** Stateless [0, 1) sampling keyed by seed, both birth-index words and channel. */
export declare function sampleUnit(seed: number, birthIndex: number, channel: number): number;
export declare function sampleRange(range: ScalarRange, seed: number, birthIndex: number, channel: number): number;

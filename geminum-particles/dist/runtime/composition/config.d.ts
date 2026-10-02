import type { ScalarRange, ShapeConfig, StartValuesConfig } from './contracts.js';
export declare function optionalNumber(config: object, key: string, fallback: number): number;
export declare function nonnegative(value: number, label: string): number;
export declare function unit(value: number, label: string): number;
export declare function tint(value: number, label: string): number;
export declare function seedSnapshot(seed: number): number;
export declare function rangeSnapshot(value: unknown, label: string, nonnegativeOnly: boolean): ScalarRange;
export declare function startSnapshot(config: StartValuesConfig): Required<Omit<StartValuesConfig, 'startRotation'>>;
export type ShapeSnapshot = Readonly<{
    type: 'point' | 'circle' | 'rectangle';
    offsetX: number;
    offsetY: number;
    directionRadians: number;
    spreadRadians: number;
    radius: number;
    width: number;
    height: number;
}>;
export declare function shapeSnapshot(config: ShapeConfig): ShapeSnapshot;

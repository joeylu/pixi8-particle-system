import type { ParticleFrameSelection } from './contracts.js';
import { finite, integer } from '../core/validation.js';
import { seedSnapshot } from '../composition/config.js';
import { RandomChannel, sampleRange, sampleUnit } from '../composition/random.js';
import { normalizeParticleFrameSelection } from './normalization.js';
export function createParticleFrameSelector(selection: ParticleFrameSelection, frameCount: number, seed = 1): (birthIndex: number, ageSeconds: number) => number {
    const s = normalizeParticleFrameSelection(selection);
    integer(frameCount, 'frameCount', 1);
    const seedValue = seedSnapshot(seed);
    const pool = (input: readonly number[], label: string): readonly number[] => {
        if (!Array.isArray(input) || input.length === 0)
            throw new TypeError(`${label} must be nonempty`);
        const seen = new Set();
        for (const n of input) {
            integer(n, label, 0);
            if (n >= frameCount || seen.has(n))
                throw new RangeError(`Invalid ${label} ordinal`);
            seen.add(n);
        }
        return Object.freeze([...input]);
    };
    const all = Array.from({ length: frameCount }, (_, i) => i);
    const indices = s.mode === 'random' ? pool(s.indices ?? all, 'indices') : all;
    let clips: readonly (readonly number[])[] = [all];
    if (s.mode === 'sequence' && s.clips !== undefined) {
        if (!Array.isArray(s.clips) || !s.clips.length)
            throw new TypeError('clips must be nonempty');
        clips = Object.freeze(s.clips.map(c => pool(c, 'clip')));
    }
    if (s.mode === 'single')
        pool([s.index ?? 0], 'index');
    return (birthIndex, ageSeconds) => {
        integer(birthIndex, 'birthIndex', 0);
        finite(ageSeconds, 'ageSeconds');
        if (ageSeconds < 0)
            throw new RangeError('ageSeconds must be nonnegative');
        if (s.mode === 'single')
            return s.index ?? 0;
        if (s.mode === 'random')
            return indices[Math.floor(sampleUnit(seedValue, birthIndex, 7) * indices.length)];
        const clip = clips[Math.floor(sampleUnit(seedValue, birthIndex, RandomChannel.Clip) * clips.length)];
        const fps = sampleRange(s.fps, seedValue, birthIndex, RandomChannel.Fps);
        const phase = s.randomStartFrame ? sampleUnit(seedValue, birthIndex, RandomChannel.Phase) * clip.length : 0;
        const progress = ageSeconds * fps + phase;
        finite(progress, 'animation progress');
        const ordinal = Math.floor(progress);
        return clip[s.loop ? ordinal % clip.length : Math.min(ordinal, clip.length - 1)];
    };
}

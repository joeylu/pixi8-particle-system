import type { ParticleFrameSelection } from './contracts.js';
import { finite, integer } from '../core/validation.js';
import { seedSnapshot } from '../composition/config.js';
import { sampleUnit } from '../composition/random.js';
import { normalizeParticleFrameSelection } from './normalization.js';

export function createParticleFrameSelector(
  selection: ParticleFrameSelection, frameCount: number, seed = 1,
): (birthIndex: number, ageSeconds: number) => number {
  if (arguments.length > 2 && arguments[2] === undefined) throw new TypeError('seed cannot be explicitly undefined');
  const normalized = normalizeParticleFrameSelection(selection);
  integer(frameCount, 'frameCount', 1);
  const seedValue = seedSnapshot(seed);
  const mode = normalized.mode;
  let index = 0, fps = 0, loop = false;
  if (mode === 'single') {
    index = 'index' in normalized ? normalized.index! : 0;
    integer(index, 'selection.index', 0);
    if (index >= frameCount) throw new RangeError('selection.index is outside frameCount');
  } else if (mode === 'random') {
    // The normalizer validates the mode-specific keys.
  } else if (mode === 'sequence') {
    finite(normalized.fps, 'selection.fps');
    if (normalized.fps <= 0) throw new RangeError('selection.fps must be positive');
    fps = normalized.fps;
    if ('loop' in normalized) {
      if (typeof normalized.loop !== 'boolean') throw new TypeError('selection.loop must be boolean');
      loop = normalized.loop;
    }
  } else throw new TypeError('selection.mode must be single, random or sequence');
  return (birthIndex, ageSeconds) => {
    integer(birthIndex, 'birthIndex', 0); finite(ageSeconds, 'ageSeconds');
    if (ageSeconds < 0) throw new RangeError('ageSeconds must be nonnegative');
    if (mode === 'single') return index;
    if (mode === 'random') return Math.floor(sampleUnit(seedValue, birthIndex, 7) * frameCount);
    const progress = ageSeconds * fps;
    finite(progress, 'ageSeconds * selection.fps');
    const frame = Math.floor(progress);
    return loop ? frame % frameCount : Math.min(frame, frameCount - 1);
  };
}

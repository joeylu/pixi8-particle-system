import type { BirthRequest, ParticleEmission } from '../core/contracts.js';
import { aliasValue, finite, integer, knownKeys, object } from '../core/validation.js';
import type { EmissionModuleConfig } from '../composition/contracts.js';
import { sameTime } from '../core/time.js';

export function createConstantRateEmission(config: EmissionModuleConfig): () => ParticleEmission {
  object(config, 'ConstantRateEmission config');
  const rate = aliasValue(config, 'rateOverTime', 'ratePerSecond');
  knownKeys(config, ['rateOverTime', 'ratePerSecond'], 'ConstantRateEmission');
  finite(rate, 'rateOverTime/ratePerSecond');
  if (rate < 0) throw new RangeError('ratePerSecond must be nonnegative');
  if (rate > 0 && !Number.isFinite(1 / rate)) throw new RangeError('Birth interval cannot be represented');
  return () => {
    let emitted = 0;
    const requests: { offsetSeconds: number; count: number }[] = [];
    const plan: ParticleEmission['plan'] = (ctx): readonly BirthRequest[] => {
      if (rate === 0) { requests.length = 0; return requests; }
      const product = ctx.endTimeSeconds * rate;
      finite(product, 'emission count');
      const nearest = Math.round(product);
      const target = sameTime(product, nearest) ? nearest : Math.floor(product);
      integer(target, 'emission count', 0);
      const count = target - emitted;
      integer(count, 'birth count', 0);
      if (count > ctx.maxBirths) throw new RangeError('Birth budget exceeded');
      const previousLength = requests.length;
      for (let i = 0; i < count; i++) {
        const birthTime = (emitted + i + 1) / rate;
        let offsetSeconds = birthTime - ctx.startTimeSeconds;
        // The endpoint uses the same count-space decision that includes this birth.
        if (emitted + i + 1 === target && sameTime(product, target)) offsetSeconds = ctx.dtSeconds;
        if (!(offsetSeconds > 0) || (i > 0 && offsetSeconds <= requests[i - 1]!.offsetSeconds)) {
          throw new RangeError('Birth time cannot make positive progress');
        }
        if (i < previousLength) requests[i]!.offsetSeconds = offsetSeconds;
        else requests.push({ offsetSeconds, count: 1 });
      }
      requests.length = count;
      emitted = target;
      return requests;
    };
    return { id: 'ConstantRateEmission', plan, reset() { emitted = 0; requests.length = 0; return undefined; } };
  };
}
export { createConstantRateEmission as createEmissionModule };

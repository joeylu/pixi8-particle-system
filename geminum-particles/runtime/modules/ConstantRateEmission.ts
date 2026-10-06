import type { ParticleEmission } from '../core/contracts.js';
import type { EmissionModuleConfig } from '../composition/contracts.js';
import { aliasValue, finite, integer, knownKeys, object } from '../core/validation.js';
import { sameTime } from '../core/time.js';
/** One emission clock: delay once, then optional repeated half-open windows. */
export function createConstantRateEmission(config: EmissionModuleConfig): () => ParticleEmission {
    object(config, 'Emission config');
    knownKeys(config, ['rateOverTime', 'ratePerSecond', 'startDelay', 'duration', 'loop', 'bursts'], 'Emission');
    const rate = aliasValue(config, 'rateOverTime', 'ratePerSecond', 0);
    const delay = (config.startDelay ?? 0), duration = (config.duration ?? Infinity) as number, loop = config.loop ?? false;
    if ('duration' in config)
        finite(config.duration, 'duration');
    finite(rate, 'rateOverTime');
    finite(delay, 'startDelay');
    if (rate < 0 || delay < 0)
        throw new RangeError('Emission rate and delay must be nonnegative');
    if (rate > 0 && !Number.isFinite(1 / rate))
        throw new RangeError('Birth interval cannot be represented');
    if ('duration' in config) {
        if (duration < 0)
            throw new RangeError('duration must be nonnegative');
    }
    if (typeof loop !== 'boolean' || (loop && (!Number.isFinite(duration) || duration <= 0)))
        throw new RangeError('loop requires positive finite duration');
    if (duration === 0 && (rate !== 0 || loop))
        throw new RangeError('Zero duration only supports non-looping bursts');
    if (config.bursts !== undefined && !Array.isArray(config.bursts))
        throw new TypeError('bursts must be an array');
    const bursts = (config.bursts ?? []).map(b => {
        object(b, 'burst');
        knownKeys(b, ['time', 'count'], 'burst');
        finite(b.time, 'burst.time');
        integer(b.count, 'burst.count', 1);
        if (b.time < 0 || (duration === 0 ? b.time !== 0 : b.time >= duration))
            throw new RangeError('burst time outside emission window');
        return Object.freeze({ time: b.time, count: b.count });
    });
    const lastContinuous = Number.isFinite(duration) && rate > 0 ? Math.max(0, Math.ceil(duration * rate) - 1) / rate : rate > 0 ? Infinity : -Infinity;
    const lastEvent = Math.max(lastContinuous > 0 ? lastContinuous : -Infinity, ...bursts.map(b => b.time));
    return () => {
        let started = false;
        return {
            id: 'ConstantRateEmission',
            hasFutureEvents(time) { return lastEvent !== -Infinity && (loop || delay + lastEvent > time); },
            plan(ctx) {
                const events = new Map<number, number>();
                let total = 0;
                const add = (time: number, count: number): void => {
                    finite(time, 'emission event time');
                    const atEnd = sameTime(time, ctx.endTimeSeconds);
                    if (time > ctx.endTimeSeconds && !atEnd)
                        return;
                    if (time < ctx.startTimeSeconds || (started && (time === ctx.startTimeSeconds || sameTime(time, ctx.startTimeSeconds))))
                        return;
                    total += count;
                    if (!Number.isSafeInteger(total) || total > ctx.maxBirths)
                        throw new RangeError('Birth budget exceeded');
                    const offset = atEnd ? ctx.dtSeconds : Math.max(0, time - ctx.startTimeSeconds);
                    events.set(offset, (events.get(offset) ?? 0) + count);
                };
                if (lastEvent !== -Infinity && ctx.endTimeSeconds >= delay) {
                    const first = loop ? Math.max(0, Math.floor((ctx.startTimeSeconds - delay) / duration)) : 0;
                    const last = loop ? Math.max(0, Math.floor((ctx.endTimeSeconds - delay) / duration)) : 0;
                    if (!Number.isSafeInteger(last))
                        throw new RangeError('Emission cycle count overflow');
                    for (let cycle = first; cycle <= last; cycle++) {
                        const origin = delay + cycle * (loop ? duration : 0);
                        for (const burst of bursts)
                            add(origin + burst.time, burst.count);
                        if (rate > 0) {
                            const from = Math.max(1, Math.floor(Math.max(0, ctx.startTimeSeconds - origin) * rate));
                            const endpoint = Math.min(ctx.endTimeSeconds - origin, duration);
                            const product = endpoint * rate;
                            finite(product, 'emission count');
                            const target = sameTime(product, Math.round(product)) ? Math.round(product) : Math.floor(product);
                            integer(target, 'emission count', 0);
                            // Preflight avoids iterating an unbounded request count.
                            if (target - from > ctx.maxBirths)
                                throw new RangeError('Birth budget exceeded');
                            for (let n = from; n <= target; n++) {
                                const t = n / rate;
                                if (t < duration)
                                    add(origin + t, 1);
                            }
                        }
                    }
                }
                started = true;
                return Array.from(events, ([offsetSeconds, count]) => ({ offsetSeconds, count })).sort((a, b) => a.offsetSeconds - b.offsetSeconds);
            },
            reset() { started = false; return undefined; },
        };
    };
}
export { createConstantRateEmission as createEmissionModule };

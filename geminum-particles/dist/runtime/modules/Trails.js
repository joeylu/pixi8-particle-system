import { finite, integer, knownKeys, object } from '../core/validation.js';
function configSnapshot(input) {
    object(input, 'Trails config');
    knownKeys(input, ['lifetime', 'minVertexDistance', 'worldSpace', 'dieWithParticles', 'width', 'maxPointsPerTrail', 'maxTrails', 'breakDistance', 'textureMode'], 'Trails');
    const number = (key, fallback) => {
        const value = key in input ? input[key] : fallback;
        finite(value, `Trails.${key}`);
        if (value <= 0)
            throw new RangeError(`Trails.${key} must be positive`);
        return value;
    };
    const boolean = (key) => {
        const value = key in input ? input[key] : false;
        if (typeof value !== 'boolean')
            throw new TypeError(`Trails.${key} must be boolean`);
        return value;
    };
    const config = { lifetime: number('lifetime', .3), minVertexDistance: number('minVertexDistance', 4),
        worldSpace: boolean('worldSpace'), dieWithParticles: boolean('dieWithParticles'), width: number('width', 8),
        maxPointsPerTrail: number('maxPointsPerTrail', 64), maxTrails: number('maxTrails', 256),
        breakDistance: number('breakDistance', 256), textureMode: 'textureMode' in input ? input.textureMode : 'stretch' };
    integer(config.maxPointsPerTrail, 'Trails.maxPointsPerTrail', 2);
    integer(config.maxTrails, 'Trails.maxTrails', 1);
    if (config.breakDistance < config.minVertexDistance)
        throw new RangeError('Trails.breakDistance must be >= minVertexDistance');
    if (config.textureMode !== 'stretch')
        throw new TypeError('Trails.textureMode must be stretch');
    return Object.freeze({ ...config, textureMode: 'stretch' });
}
/** Records observed motion slices in a bounded trail basis. */
export class ParticleTrails {
    constructor(config) {
        this.id = 'trails';
        this.records = new Map();
        this.destroyed = false;
        this.config = configSnapshot(config);
        this.requiresEnvironment = this.config.worldSpace;
    }
    live() { if (this.destroyed)
        throw new Error('Trails observer is destroyed'); }
    point(p, ctx, timeSeconds) {
        let x = p.x, y = p.y;
        if (this.config.worldSpace && ctx.simulationSpace !== 'world') {
            if (!ctx.environment)
                throw new TypeError('World-space trails require an environment');
            const a = ctx.environment.emitterTransform;
            x = a.a * p.x + a.c * p.y + a.tx;
            y = a.b * p.x + a.d * p.y + a.ty;
        }
        finite(x, 'Trails.x');
        finite(y, 'Trails.y');
        finite(timeSeconds, 'Trails.timeSeconds');
        return Object.freeze({ x, y, timeSeconds, breakBefore: false });
    }
    onBirth(p, ctx) {
        this.live();
        if (this.records.size >= this.config.maxTrails)
            throw new RangeError('Trails capacity exceeded');
        const ttl = p.lifetimeSeconds * this.config.lifetime;
        finite(ttl, 'Trails TTL');
        if (ttl <= 0)
            throw new RangeError('Trails TTL must be positive');
        const head = this.point(p, ctx, ctx.timeSeconds);
        this.records.set(p.birthId, { birthId: p.birthId, ttl, alive: true, points: [head], head });
        this.cached = undefined;
        return undefined;
    }
    sample(record, head) {
        const anchor = record.points[record.points.length - 1];
        const movement = Math.hypot(head.x - record.head.x, head.y - record.head.y);
        if (movement > this.config.breakDistance) {
            if (anchor && (anchor.x !== record.head.x || anchor.y !== record.head.y))
                record.points.push(record.head);
            head = Object.freeze({ ...head, breakBefore: true });
            record.points.push(head);
        }
        else if (!anchor || Math.hypot(head.x - anchor.x, head.y - anchor.y) >= this.config.minVertexDistance)
            record.points.push(head);
        record.head = head;
        const last = record.points[record.points.length - 1];
        const extraHead = last && last.x === head.x && last.y === head.y ? 0 : 1;
        while (record.points.length + extraHead > this.config.maxPointsPerTrail)
            record.points.shift();
        this.cached = undefined;
    }
    onUpdate(p, ctx) {
        this.live();
        const record = this.records.get(p.birthId);
        if (record)
            this.sample(record, this.point(p, ctx, ctx.endTimeSeconds));
        return undefined;
    }
    onDeath(p, ctx) {
        this.live();
        const record = this.records.get(p.birthId);
        if (record) {
            this.sample(record, this.point(p, ctx, ctx.timeSeconds));
            record.alive = false;
            if (this.config.dieWithParticles)
                this.records.delete(p.birthId);
            this.cached = undefined;
        }
        return undefined;
    }
    onAdvance(ctx) {
        this.live();
        for (const [id, record] of this.records) {
            record.points = record.points.filter((point) => ctx.endTimeSeconds - point.timeSeconds < record.ttl);
            if (!record.alive && ctx.endTimeSeconds - record.head.timeSeconds >= record.ttl)
                this.records.delete(id);
        }
        this.cached = undefined;
        return undefined;
    }
    hasPendingWork() { this.live(); return this.records.size > 0; }
    snapshot() {
        this.live();
        if (!this.cached) {
            const result = [];
            for (const record of this.records.values()) {
                const points = [...record.points];
                const last = points[points.length - 1];
                if (!last || last.x !== record.head.x || last.y !== record.head.y)
                    points.push(record.head);
                const drawable = points.some((point, index) => index > 0 && !point.breakBefore
                    && (point.x !== points[index - 1].x || point.y !== points[index - 1].y));
                if (drawable)
                    result.push(Object.freeze({ birthId: record.birthId, points: Object.freeze(points) }));
            }
            this.cached = Object.freeze(result);
        }
        return this.cached;
    }
    reset() { this.live(); this.records.clear(); this.cached = undefined; return undefined; }
    destroy() { this.records.clear(); this.cached = undefined; this.destroyed = true; return undefined; }
}
export function createTrailsModule(config) {
    const snapshot = configSnapshot(config);
    return () => new ParticleTrails(snapshot);
}

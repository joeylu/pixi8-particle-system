import { aliasValue, checkFields, declaration, finite, integer, knownKeys, object, PARTICLE_FIELDS, syncFunction, undefinedResult } from './validation.js';
import { sameTime } from './time.js';
import { environmentObject, snapshotParticleEnvironment } from './environment.js';
const claimedRuntimes = new WeakSet();
function claim(value, label) {
    object(value, label);
    if (claimedRuntimes.has(value))
        throw new TypeError(`${label} runtime is already owned by a system`);
    claimedRuntimes.add(value);
}
function mainSnapshot(config) {
    object(config, 'Main config');
    const lifetimeSeconds = aliasValue(config, 'startLifetime', 'lifetimeSeconds');
    knownKeys(config, ['maxParticles', 'startLifetime', 'lifetimeSeconds', 'maxBirthsPerUpdate', 'scaleX', 'scaleY', 'rotation', 'alpha', 'tint', 'simulationSpace', 'gravityModifier'], 'Main');
    integer(config.maxParticles, 'maxParticles', 1);
    finite(lifetimeSeconds, 'startLifetime/lifetimeSeconds');
    if (lifetimeSeconds <= 0)
        throw new RangeError('lifetimeSeconds must be positive');
    const read = (key, fallback) => {
        const value = key in config ? config[key] : fallback;
        finite(value, key);
        return value;
    };
    const result = {
        maxParticles: config.maxParticles, lifetimeSeconds,
        maxBirthsPerUpdate: read('maxBirthsPerUpdate', config.maxParticles),
        scaleX: read('scaleX', 1), scaleY: read('scaleY', 1), rotation: read('rotation', 0),
        alpha: read('alpha', 1), tint: read('tint', 0xffffff),
        simulationSpace: 'simulationSpace' in config ? config.simulationSpace : 'local',
        gravityModifier: read('gravityModifier', 0),
    };
    if (result.simulationSpace !== 'local' && result.simulationSpace !== 'world')
        throw new TypeError('simulationSpace must be local or world');
    integer(result.maxBirthsPerUpdate, 'maxBirthsPerUpdate', 1);
    if (result.alpha < 0 || result.alpha > 1)
        throw new RangeError('alpha must be in [0, 1]');
    integer(result.tint, 'tint', 0);
    if (result.tint > 0xffffff)
        throw new RangeError('tint must be 24-bit RGB');
    return Object.freeze(result);
}
/** A synchronous, explicitly clocked particle simulation in the selected simulation space. */
export class ParticleSystem {
    constructor(options) {
        this.mode = 'stopped';
        this.previousMode = 'playing';
        this.operation = '';
        this.busy = false;
        this.time = 0;
        this.timeCompensation = 0;
        this.originX = 0;
        this.originY = 0;
        this.membershipVersion = 0;
        this.active = [];
        this.free = [];
        this.renderParticles = [];
        this.allocated = 0;
        this.nextBirthId = 0;
        this.observers = [];
        this.initializers = [];
        this.updates = [];
        this.resets = [];
        this.dataOwners = new WeakMap();
        object(options, 'ParticleSystem options');
        knownKeys(options, ['main', 'spawn', 'emission', 'sampleLifetime', 'behaviors', 'data', 'renderer', 'environment', 'observers'], 'ParticleSystem options');
        this.main = mainSnapshot(options.main);
        if ('sampleLifetime' in options)
            syncFunction(options.sampleLifetime, 'sampleLifetime');
        this.sampleLifetime = options.sampleLifetime;
        if ('environment' in options) {
            syncFunction(options.environment, 'environment factory');
            const created = options.environment();
            const runtime = environmentObject(created, ['sample'], ['sample'], 'environment runtime');
            claim(created, 'environment');
            syncFunction(runtime.sample, 'environment.sample');
            this.environment = { sample: created.sample.bind(created) };
        }
        else if (this.main.simulationSpace === 'world' || this.main.gravityModifier !== 0) {
            throw new TypeError('World simulation or nonzero gravityModifier requires an environment factory');
        }
        syncFunction(options.spawn, 'spawn factory');
        syncFunction(options.renderer, 'renderer factory');
        if ('emission' in options)
            syncFunction(options.emission, 'emission factory');
        if ('behaviors' in options && !Array.isArray(options.behaviors))
            throw new TypeError('behaviors must be an array');
        if ('data' in options) {
            object(options.data, 'data');
            knownKeys(options.data, ['create', 'reset'], 'data');
            syncFunction(options.data.create, 'data.create');
            syncFunction(options.data.reset, 'data.reset');
            this.data = { create: options.data.create, reset: options.data.reset };
        }
        const ids = new Set();
        const initFields = new Set();
        const updateFields = new Set();
        const identify = (runtime) => {
            if (typeof runtime.id !== 'string' || runtime.id.length === 0 || ids.has(runtime.id))
                throw new TypeError('Module IDs must be nonempty and unique');
            ids.add(runtime.id);
        };
        const addFields = (fields, owner) => {
            for (const field of fields) {
                if (owner.has(field))
                    throw new TypeError(`Conflicting write declaration: ${field}`);
                owner.add(field);
            }
        };
        const addReset = (runtime) => {
            if ('reset' in runtime) {
                syncFunction(runtime.reset, 'module reset');
                this.resets.push({ id: runtime.id, call: runtime.reset.bind(runtime) });
            }
        };
        const spawn = options.spawn();
        claim(spawn, 'spawn');
        identify(spawn);
        syncFunction(spawn.init, 'spawn.init');
        const spawnWrites = declaration(spawn.initWrites, 'spawn.initWrites');
        addFields(spawnWrites, initFields);
        this.initializers.push({ id: spawn.id, call: spawn.init.bind(spawn), fields: spawnWrites });
        addReset(spawn);
        if (options.emission) {
            const emission = options.emission();
            claim(emission, 'emission');
            identify(emission);
            syncFunction(emission.plan, 'emission.plan');
            syncFunction(emission.reset, 'emission.reset');
            if (emission.hasFutureEvents)
                syncFunction(emission.hasFutureEvents, 'emission.hasFutureEvents');
            this.emission = { id: emission.id, plan: emission.plan.bind(emission), reset: emission.reset.bind(emission), ...(emission.hasFutureEvents ? { hasFutureEvents: emission.hasFutureEvents.bind(emission) } : {}) };
            this.resets.push({ id: emission.id, call: this.emission.reset });
        }
        const motion = [], appearance = [];
        for (const factory of options.behaviors ?? []) {
            syncFunction(factory, 'behavior factory');
            const behavior = factory();
            claim(behavior, 'behavior');
            identify(behavior);
            if (behavior.phase !== 'motion' && behavior.phase !== 'appearance')
                throw new TypeError('Invalid behavior phase');
            if (!('init' in behavior) && !('update' in behavior))
                throw new TypeError('Behavior requires init or update');
            if ('init' in behavior) {
                syncFunction(behavior.init, 'behavior.init');
                const fields = declaration('initWrites' in behavior ? behavior.initWrites : [], 'behavior.initWrites');
                addFields(fields, initFields);
                this.initializers.push({ id: behavior.id, call: behavior.init.bind(behavior), fields });
            }
            else if ('initWrites' in behavior)
                throw new TypeError('initWrites requires init');
            if ('update' in behavior) {
                syncFunction(behavior.update, 'behavior.update');
                const fields = declaration('updateWrites' in behavior ? behavior.updateWrites : [], 'behavior.updateWrites');
                addFields(fields, updateFields);
                (behavior.phase === 'motion' ? motion : appearance).push({ id: behavior.id, call: behavior.update.bind(behavior), fields });
            }
            else if ('updateWrites' in behavior)
                throw new TypeError('updateWrites requires update');
            addReset(behavior);
        }
        this.updates = [...motion, ...appearance];
        if ('observers' in options && !Array.isArray(options.observers))
            throw new TypeError('observers must be an array');
        let created;
        let owned = false;
        try {
            for (const factory of options.observers ?? []) {
                syncFunction(factory, 'observer factory');
                const observer = factory();
                claim(observer, 'observer');
                this.observers.push(observer);
                identify(observer);
                if ('requiresEnvironment' in observer && typeof observer.requiresEnvironment !== 'boolean')
                    throw new TypeError('Observer requiresEnvironment must be boolean');
                if (observer.requiresEnvironment && !this.environment)
                    throw new TypeError('Observer requires an environment factory');
                for (const key of ['reset', 'destroy', 'hasPendingWork'])
                    syncFunction(observer[key], `observer.${key}`);
                for (const key of ['onBirth', 'onUpdate', 'onDeath', 'onAdvance'])
                    if (key in observer)
                        syncFunction(observer[key], `observer.${key}`);
            }
            created = options.renderer(Object.freeze({ updateWrites: Object.freeze([...updateFields]), ...(this.observers.length ? { observers: Object.freeze([...this.observers]) } : {}) }));
            object(created, 'renderer');
            if (claimedRuntimes.has(created))
                throw new TypeError('renderer runtime is already owned by a system');
            owned = true;
            claim(created, 'renderer');
            syncFunction(created.sync, 'renderer.sync');
            syncFunction(created.destroy, 'renderer.destroy');
            this.renderer = { sync: created.sync.bind(created), destroy: created.destroy.bind(created) };
        }
        catch (error) {
            const cleanupErrors = [];
            if (owned && created && typeof created.destroy === 'function') {
                try {
                    undefinedResult(created.destroy());
                }
                catch (cleanupError) {
                    cleanupErrors.push(cleanupError);
                }
            }
            for (const observer of this.observers) {
                try {
                    if (typeof observer.destroy === 'function')
                        undefinedResult(observer.destroy());
                }
                catch (cleanupError) {
                    cleanupErrors.push(cleanupError);
                }
            }
            if (cleanupErrors.length) {
                const failure = new Error('ParticleSystem construction and resource cleanup failed');
                failure.cause = error;
                failure.cleanupErrors = Object.freeze(cleanupErrors);
                throw failure;
            }
            throw error;
        }
    }
    pending() {
        let pending = this.active.length > 0 || (this.mode === 'playing' && (this.emission?.hasFutureEvents?.(this.time) ?? !!this.emission));
        for (const observer of this.observers) {
            this.moduleId = observer.id;
            const result = observer.hasPendingWork();
            if (typeof result !== 'boolean')
                throw new TypeError('Observer hasPendingWork must return boolean synchronously');
            pending = pending || result;
        }
        this.moduleId = undefined;
        return pending;
    }
    get hasPendingWork() {
        this.guard(['stopped', 'playing', 'draining', 'paused']);
        let result = false;
        this.run('hasPendingWork', () => { result = this.pending(); });
        return result;
    }
    observation(slot) {
        const p = slot.particle;
        return Object.freeze({ birthId: slot.birthId, ageSeconds: p.ageSeconds, lifetimeSeconds: p.lifetimeSeconds,
            x: p.x, y: p.y, vx: p.vx, vy: p.vy, rotation: p.rotation, scaleX: p.scaleX, scaleY: p.scaleY, alpha: p.alpha, tint: p.tint });
    }
    get state() { return this.mode; }
    get particleCount() { return this.active.length; }
    get error() { return this.failure; }
    get diagnostic() { return this.failureDiagnostic; }
    guard(allowed) {
        if (this.busy)
            throw new Error('ParticleSystem mutation is not reentrant');
        if (!allowed.includes(this.mode))
            throw new Error(`Operation is not allowed in ${this.mode}`);
    }
    run(name, operation) {
        this.busy = true;
        this.operation = name;
        this.moduleId = undefined;
        try {
            operation();
        }
        catch (error) {
            this.mode = 'faulted';
            this.failure = error;
            this.failureDiagnostic = Object.freeze({ operation: this.operation, ...(this.moduleId === undefined ? {} : { moduleId: this.moduleId }) });
            throw error;
        }
        finally {
            this.busy = false;
        }
    }
    resetRun() {
        this.nextBirthId = 0;
        this.time = 0;
        this.timeCompensation = 0;
        for (const reset of this.resets) {
            this.moduleId = reset.id;
            undefinedResult(reset.call());
        }
        for (const observer of this.observers) {
            this.moduleId = observer.id;
            undefinedResult(observer.reset());
        }
        this.moduleId = undefined;
    }
    sampleEnvironment() {
        if (!this.environment)
            return;
        this.moduleId = 'environment.sample';
        this.environmentSnapshot = snapshotParticleEnvironment(this.environment.sample());
        this.moduleId = undefined;
    }
    environmentContext() {
        return this.environmentSnapshot ? {
            simulationSpace: this.main.simulationSpace, gravityModifier: this.main.gravityModifier, environment: this.environmentSnapshot,
        } : {};
    }
    play() {
        this.guard(['stopped']);
        this.run('play', () => {
            this.resetRun();
            this.nextBirthId = 0;
            this.mode = 'playing';
            this.sampleEnvironment();
            if (this.emission) {
                const requests = this.emission.plan(Object.freeze({ startTimeSeconds: 0, endTimeSeconds: 0, dtSeconds: 0, maxBirths: this.main.maxBirthsPerUpdate }));
                this.checkPlan(requests, 0);
                for (const request of requests)
                    this.birth(request.count, 0, this.originX, this.originY);
                if (this.emission.hasFutureEvents && !this.emission.hasFutureEvents(0))
                    this.mode = this.active.length ? 'draining' : 'stopped';
            }
            this.sync();
        });
    }
    pause() {
        this.guard(['playing', 'draining']);
        this.previousMode = this.mode;
        this.mode = 'paused';
    }
    resume() {
        this.guard(['paused']);
        this.mode = this.previousMode;
    }
    stop(options) {
        this.guard(['stopped', 'playing', 'draining', 'paused']);
        if (options !== undefined) {
            object(options, 'Stop options');
            knownKeys(options, ['killParticles'], 'Stop');
            if ('killParticles' in options && typeof options.killParticles !== 'boolean')
                throw new TypeError('killParticles must be boolean');
        }
        this.run('stop', () => {
            if (this.mode === 'playing')
                this.mode = 'draining';
            if (this.mode === 'paused')
                this.previousMode = 'draining';
            if (options?.killParticles) {
                this.sampleEnvironment();
                const ctx = Object.freeze({ timeSeconds: this.time, ...this.environmentContext() });
                for (const slot of this.active) {
                    for (const observer of this.observers) {
                        this.moduleId = observer.id;
                        if (observer.onDeath)
                            undefinedResult(observer.onDeath(this.observation(slot), ctx));
                    }
                    this.moduleId = undefined;
                    this.free.push(slot);
                    this.membershipVersion++;
                }
                this.active.length = 0;
            }
            if (!this.pending())
                this.mode = 'stopped';
            else if (this.mode === 'paused')
                this.previousMode = 'draining';
            else
                this.mode = 'draining';
            if (options?.killParticles)
                this.sync();
        });
    }
    setOrigin(x, y) {
        this.guard(['stopped', 'playing', 'draining', 'paused']);
        finite(x, 'origin.x');
        finite(y, 'origin.y');
        this.originX = x;
        this.originY = y;
    }
    emit(count) {
        this.guard(['stopped', 'playing', 'draining']);
        integer(count, 'count', 0);
        if (count === 0)
            return;
        this.run('emit', () => {
            if (count > this.main.maxBirthsPerUpdate)
                throw new RangeError('Birth budget exceeded');
            if (count > this.main.maxParticles - this.active.length)
                throw new RangeError('Particle capacity exceeded');
            this.sampleEnvironment();
            if (this.mode === 'stopped') {
                this.resetRun();
                this.mode = 'draining';
            }
            this.birth(count, this.time, this.originX, this.originY);
            this.sync();
        });
    }
    reset() {
        this.guard(['stopped', 'playing', 'draining', 'paused']);
        this.run('reset', () => {
            for (const slot of this.active)
                this.free.push(slot);
            this.active.length = 0;
            this.membershipVersion++;
            this.resetRun();
            this.mode = 'stopped';
            this.previousMode = 'playing';
            this.sync();
        });
    }
    update(dtSeconds) {
        this.guard(['stopped', 'playing', 'draining', 'paused']);
        finite(dtSeconds, 'dtSeconds');
        if (dtSeconds < 0)
            throw new RangeError('dtSeconds must be nonnegative');
        if (dtSeconds === 0 || this.mode === 'stopped' || this.mode === 'paused') {
            if (this.environment)
                this.run('update', () => { this.sampleEnvironment(); });
            return;
        }
        this.run('update', () => {
            this.sampleEnvironment();
            const start = this.time;
            const increment = dtSeconds - this.timeCompensation;
            const end = start + increment;
            const compensation = (end - start) - increment;
            const actualDt = end - start;
            finite(end, 'endTimeSeconds');
            if (!(end > start))
                throw new RangeError('Simulation time cannot make positive progress');
            const originX = this.originX, originY = this.originY;
            let requests = [];
            if (this.mode === 'playing' && this.emission) {
                this.moduleId = this.emission.id;
                requests = this.emission.plan(Object.freeze({ startTimeSeconds: start, endTimeSeconds: end, dtSeconds: actualDt, maxBirths: this.main.maxBirthsPerUpdate }));
                this.checkPlan(requests, actualDt);
                this.moduleId = undefined;
            }
            let cursor = start;
            for (const request of requests) {
                const at = request.offsetSeconds === actualDt ? end : start + request.offsetSeconds;
                if (at < cursor)
                    throw new RangeError('Birth time moved backwards');
                if (at > cursor)
                    this.advance(cursor, at);
                this.birth(request.count, at, originX, originY);
                cursor = at;
            }
            if (end > cursor)
                this.advance(cursor, end);
            this.time = end;
            this.timeCompensation = compensation;
            if (this.mode === 'playing' && this.emission?.hasFutureEvents && !this.emission.hasFutureEvents(end))
                this.mode = 'draining';
            if (this.mode === 'draining' && !this.pending())
                this.mode = 'stopped';
            this.sync();
        });
    }
    checkPlan(requests, dt) {
        if (!Array.isArray(requests))
            throw new TypeError('Emission plan must be a synchronous array');
        let total = 0, previous = -1;
        if (requests.length > this.main.maxBirthsPerUpdate)
            throw new RangeError('Birth budget exceeded');
        for (const request of requests) {
            object(request, 'birth request');
            knownKeys(request, ['offsetSeconds', 'count'], 'birth request');
            finite(request.offsetSeconds, 'offsetSeconds');
            integer(request.count, 'birth count', 1);
            if (request.offsetSeconds < 0 || !(request.offsetSeconds > previous) || request.offsetSeconds > dt)
                throw new RangeError('Birth offsets must strictly increase in [0, dtSeconds]');
            total += request.count;
            integer(total, 'total birth count', 0);
            if (total > this.main.maxBirthsPerUpdate)
                throw new RangeError('Birth budget exceeded');
            previous = request.offsetSeconds;
        }
    }
    birth(count, time, x, y) {
        if (count > this.main.maxParticles - this.active.length)
            throw new RangeError('Particle capacity exceeded');
        const ctx = Object.freeze({ timeSeconds: time, origin: Object.freeze({ x, y }), ...this.environmentContext() });
        for (let i = 0; i < count; i++) {
            integer(this.nextBirthId, 'birthId', 0);
            const birthId = this.nextBirthId++;
            let slot = this.free.pop();
            if (!slot) {
                if (this.allocated >= this.main.maxParticles)
                    throw new RangeError('Particle pool capacity exceeded');
                this.moduleId = this.data ? 'data.create' : undefined;
                const data = this.data ? this.data.create() : {};
                object(data, 'particle data');
                const record = { age: 0, birthTime: time };
                record.particle = {
                    get ageSeconds() { return record.age; }, get lifetimeSeconds() { return record.lifetime; },
                    x: 0, y: 0, vx: 0, vy: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1, tint: 0xffffff, data,
                };
                slot = record;
                this.allocated++;
            }
            const p = slot.particle;
            slot.lifetime = this.sampleLifetime ? this.sampleLifetime(birthId) : this.main.lifetimeSeconds;
            finite(slot.lifetime, 'particle lifetime');
            if (slot.lifetime <= 0)
                throw new RangeError('particle lifetime must be positive');
            slot.birthId = birthId;
            slot.age = 0;
            slot.birthTime = time;
            p.x = 0;
            p.y = 0;
            p.vx = 0;
            p.vy = 0;
            p.rotation = this.main.rotation;
            p.scaleX = this.main.scaleX;
            p.scaleY = this.main.scaleY;
            p.alpha = this.main.alpha;
            p.tint = this.main.tint;
            if (this.data) {
                this.moduleId = 'data.reset';
                undefinedResult(this.data.reset(p.data));
            }
            this.checkDataOwnership(p.data, slot);
            for (const hook of this.initializers) {
                this.moduleId = hook.id;
                undefinedResult(hook.call(p, ctx));
                checkFields(p, hook.fields, hook.id);
            }
            for (const hook of this.updates.filter(h => !['x', 'y', 'vx', 'vy'].some(f => h.fields.includes(f)))) {
                this.moduleId = hook.id;
                undefinedResult(hook.call(p, Object.freeze({ startTimeSeconds: time, endTimeSeconds: time, dtSeconds: 0, ageSeconds: 0, normalizedAge: 0, ...this.environmentContext() })));
            }
            this.moduleId = undefined;
            checkFields(p, PARTICLE_FIELDS);
            for (const observer of this.observers) {
                this.moduleId = observer.id;
                if (observer.onBirth)
                    undefinedResult(observer.onBirth(this.observation(slot), ctx));
            }
            this.moduleId = undefined;
            this.active.push(slot);
            this.membershipVersion++;
        }
    }
    checkDataOwnership(data, slot) {
        const seen = new Set();
        const visit = (value) => {
            if (seen.has(value))
                return;
            seen.add(value);
            const owner = this.dataOwners.get(value);
            if (owner && owner !== slot)
                throw new TypeError('Mutable particle data cannot be shared between particles');
            this.dataOwners.set(value, slot);
            for (const item of Object.values(value))
                if (item !== null && typeof item === 'object')
                    visit(item);
        };
        visit(data);
    }
    advance(start, end) {
        const span = end - start;
        let write = 0;
        for (const slot of this.active) {
            const p = slot.particle;
            const remaining = slot.lifetime - slot.age;
            // Age and absolute lifetime endpoints share a relative rounding boundary.
            // The absolute endpoint also bounds error when clock spacing exceeds age spacing.
            const dies = span >= remaining || sameTime(slot.age + span, slot.lifetime)
                || sameTime(end, slot.birthTime + slot.lifetime);
            const actual = dies ? Math.min(span, remaining) : span;
            if (actual > 0) {
                const nextAge = dies ? slot.lifetime : slot.age + actual;
                if (!(nextAge > slot.age))
                    throw new RangeError('Particle age cannot make positive progress');
                slot.age = nextAge;
                const actualEnd = dies ? start + actual : end;
                const ctx = Object.freeze({
                    startTimeSeconds: start, endTimeSeconds: actualEnd, dtSeconds: actualEnd - start,
                    ageSeconds: slot.age, normalizedAge: slot.age / slot.lifetime,
                    ...this.environmentContext(),
                });
                if (!(ctx.dtSeconds > 0))
                    throw new RangeError('Particle update time cannot make positive progress');
                for (const hook of this.updates) {
                    this.moduleId = hook.id;
                    undefinedResult(hook.call(p, ctx));
                    checkFields(p, hook.fields, hook.id);
                }
                checkFields(p, PARTICLE_FIELDS);
                for (const observer of this.observers) {
                    this.moduleId = observer.id;
                    if (observer.onUpdate)
                        undefinedResult(observer.onUpdate(this.observation(slot), ctx));
                }
                this.moduleId = undefined;
            }
            if (dies) {
                const ctx = Object.freeze({ timeSeconds: start + actual, ...this.environmentContext() });
                for (const observer of this.observers) {
                    this.moduleId = observer.id;
                    if (observer.onDeath)
                        undefinedResult(observer.onDeath(this.observation(slot), ctx));
                }
                this.moduleId = undefined;
            }
            if (dies) {
                this.free.push(slot);
                this.membershipVersion++;
            }
            else
                this.active[write++] = slot;
        }
        this.active.length = write;
        const ctx = Object.freeze({ startTimeSeconds: start, endTimeSeconds: end, dtSeconds: span });
        for (const observer of this.observers) {
            this.moduleId = observer.id;
            if (observer.onAdvance)
                undefinedResult(observer.onAdvance(ctx));
        }
        this.moduleId = undefined;
    }
    sync() {
        this.renderParticles.length = this.active.length;
        for (let i = 0; i < this.active.length; i++) {
            const p = this.active[i].particle;
            checkFields(p, PARTICLE_FIELDS);
            this.renderParticles[i] = p;
        }
        this.moduleId = 'renderer';
        undefinedResult(this.renderer.sync({ particles: this.renderParticles, membershipVersion: this.membershipVersion }));
        this.moduleId = undefined;
    }
    destroy() {
        this.guard(['stopped', 'playing', 'draining', 'paused', 'faulted', 'destroyed']);
        if (this.mode === 'destroyed')
            return;
        this.run('destroy', () => {
            this.active.length = 0;
            this.free.length = 0;
            this.renderParticles.length = 0;
            this.allocated = 0;
            this.initializers.length = 0;
            this.updates.length = 0;
            this.resets.length = 0;
            this.emission = undefined;
            this.data = undefined;
            this.dataOwners = new WeakMap();
            this.environment = undefined;
            this.environmentSnapshot = undefined;
            let failure;
            let failed = false;
            let failedId;
            const cleanupErrors = [];
            const remaining = [];
            for (const observer of this.observers) {
                try {
                    this.moduleId = observer.id;
                    undefinedResult(observer.destroy());
                }
                catch (error) {
                    cleanupErrors.push(error);
                    if (!failed) {
                        failure = error;
                        failed = true;
                        failedId = this.moduleId;
                    }
                    remaining.push(observer);
                }
            }
            this.observers = remaining;
            if (this.renderer) {
                try {
                    this.moduleId = 'renderer';
                    undefinedResult(this.renderer.destroy());
                    this.renderer = undefined;
                }
                catch (error) {
                    cleanupErrors.push(error);
                    if (!failed) {
                        failure = error;
                        failed = true;
                        failedId = this.moduleId;
                    }
                }
            }
            if (failed) {
                this.moduleId = failedId;
                if (cleanupErrors.length > 1) {
                    const aggregate = new Error('ParticleSystem resource cleanup failed');
                    aggregate.cause = failure;
                    aggregate.cleanupErrors = Object.freeze(cleanupErrors);
                    throw aggregate;
                }
                throw failure;
            }
            this.mode = 'destroyed';
        });
    }
}

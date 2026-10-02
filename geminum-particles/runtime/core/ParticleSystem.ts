import type {
  ParticleLifecycleObserver, ParticleObservation, BirthContext, BirthRequest, MainConfig, ParticleBehavior, ParticleEmission, ParticleField,
  ParticleEnvironment, ParticleEnvironmentSnapshot, ParticleInitializer, ParticleRenderer, ParticleState, ParticleSystemOptions, ParticleUpdateContext,
} from './contracts.js';
import { aliasValue, checkFields, declaration, finite, integer, knownKeys, object, PARTICLE_FIELDS, syncFunction, undefinedResult } from './validation.js';
import { sameTime } from './time.js';
import { environmentObject, snapshotParticleEnvironment } from './environment.js';

export type ParticleSystemState = 'stopped' | 'playing' | 'draining' | 'paused' | 'faulted' | 'destroyed';
type Slot<T extends object> = { particle: ParticleState<T>; age: number; birthTime: number; birthId: number };
type InitCall<T extends object> = { id: string; call: ParticleInitializer<T>['init']; fields: readonly ParticleField[] };
type UpdateCall<T extends object> = { id: string; call: NonNullable<ParticleBehavior<T>['update']>; fields: readonly ParticleField[] };
const claimedRuntimes = new WeakSet<object>();

function claim(value: unknown, label: string): asserts value is Record<string, unknown> {
  object(value, label);
  if (claimedRuntimes.has(value)) throw new TypeError(`${label} runtime is already owned by a system`);
  claimedRuntimes.add(value);
}

type ResolvedMain = Required<Omit<MainConfig, 'startLifetime' | 'lifetimeSeconds'>> & { lifetimeSeconds: number };
function mainSnapshot(config: MainConfig): ResolvedMain {
  object(config, 'Main config');
  const lifetimeSeconds = aliasValue(config, 'startLifetime', 'lifetimeSeconds');
  knownKeys(config, ['maxParticles', 'startLifetime', 'lifetimeSeconds', 'maxBirthsPerUpdate', 'scaleX', 'scaleY', 'rotation', 'alpha', 'tint', 'simulationSpace', 'gravityModifier'], 'Main');
  integer(config.maxParticles, 'maxParticles', 1);
  finite(lifetimeSeconds, 'startLifetime/lifetimeSeconds');
  if (lifetimeSeconds <= 0) throw new RangeError('lifetimeSeconds must be positive');
  const read = (key: keyof MainConfig, fallback: number): number => {
    const value = key in config ? config[key] : fallback;
    finite(value, key);
    return value;
  };
  const result = {
    maxParticles: config.maxParticles, lifetimeSeconds,
    maxBirthsPerUpdate: read('maxBirthsPerUpdate', config.maxParticles),
    scaleX: read('scaleX', 1), scaleY: read('scaleY', 1), rotation: read('rotation', 0),
    alpha: read('alpha', 1), tint: read('tint', 0xffffff),
    simulationSpace: 'simulationSpace' in config ? config.simulationSpace! : 'local' as const,
    gravityModifier: read('gravityModifier', 0),
  };
  if (result.simulationSpace !== 'local' && result.simulationSpace !== 'world') throw new TypeError('simulationSpace must be local or world');
  integer(result.maxBirthsPerUpdate, 'maxBirthsPerUpdate', 1);
  if (result.alpha < 0 || result.alpha > 1) throw new RangeError('alpha must be in [0, 1]');
  integer(result.tint, 'tint', 0);
  if (result.tint > 0xffffff) throw new RangeError('tint must be 24-bit RGB');
  return Object.freeze(result);
}

/** A synchronous, explicitly clocked particle simulation in the selected simulation space. */
export class ParticleSystem<T extends object = Record<string, never>> {
  private mode: ParticleSystemState = 'stopped';
  private previousMode: 'playing' | 'draining' = 'playing';
  private failure: unknown;
  private failureDiagnostic: Readonly<{ operation: string; moduleId?: string }> | undefined;
  private operation = '';
  private moduleId: string | undefined;
  private busy = false;
  private time = 0;
  private timeCompensation = 0;
  private originX = 0;
  private originY = 0;
  private membershipVersion = 0;
  private active: Slot<T>[] = [];
  private free: Slot<T>[] = [];
  private renderParticles: ParticleState<T>[] = [];
  private allocated = 0;
  private nextBirthId = 0;
  private observers: ParticleLifecycleObserver[] = [];
  private main: ResolvedMain;
  private initializers: InitCall<T>[] = [];
  private updates: UpdateCall<T>[] = [];
  private resets: { id: string; call: () => undefined }[] = [];
  private emission: ParticleEmission | undefined;
  private renderer: ParticleRenderer<T> | undefined;
  private data: ParticleSystemOptions<T>['data'];
  private dataOwners = new WeakMap<object, Slot<T>>();
  private environment: ParticleEnvironment | undefined;
  private environmentSnapshot: ParticleEnvironmentSnapshot | undefined;

  constructor(options: ParticleSystemOptions<T>) {
    object(options, 'ParticleSystem options');
    knownKeys(options, ['main', 'spawn', 'emission', 'behaviors', 'data', 'renderer', 'environment', 'observers'], 'ParticleSystem options');
    this.main = mainSnapshot(options.main);
    if ('environment' in options) {
      syncFunction(options.environment, 'environment factory');
      const created = options.environment!();
      const runtime = environmentObject(created, ['sample'], ['sample'], 'environment runtime');
      claim(created, 'environment'); syncFunction(runtime.sample, 'environment.sample');
      this.environment = { sample: created.sample.bind(created) };
    } else if (this.main.simulationSpace === 'world' || this.main.gravityModifier !== 0) {
      throw new TypeError('World simulation or nonzero gravityModifier requires an environment factory');
    }
    syncFunction(options.spawn, 'spawn factory');
    syncFunction(options.renderer, 'renderer factory');
    if ('emission' in options) syncFunction(options.emission, 'emission factory');
    if ('behaviors' in options && !Array.isArray(options.behaviors)) throw new TypeError('behaviors must be an array');
    if ('data' in options) {
      object(options.data, 'data');
      knownKeys(options.data, ['create', 'reset'], 'data');
      syncFunction(options.data.create, 'data.create'); syncFunction(options.data.reset, 'data.reset');
      this.data = { create: options.data.create, reset: options.data.reset };
    }
    const ids = new Set<string>();
    const initFields = new Set<ParticleField>();
    const updateFields = new Set<ParticleField>();
    const identify = (runtime: { id: string }): void => {
      if (typeof runtime.id !== 'string' || runtime.id.length === 0 || ids.has(runtime.id)) throw new TypeError('Module IDs must be nonempty and unique');
      ids.add(runtime.id);
    };
    const addFields = (fields: readonly ParticleField[], owner: Set<ParticleField>): void => {
      for (const field of fields) {
        if (owner.has(field)) throw new TypeError(`Conflicting write declaration: ${field}`);
        owner.add(field);
      }
    };
    const addReset = (runtime: { id: string; reset?: () => undefined }): void => {
      if ('reset' in runtime) {
        syncFunction(runtime.reset, 'module reset');
        this.resets.push({ id: runtime.id, call: runtime.reset!.bind(runtime) });
      }
    };
    const spawn = options.spawn();
    claim(spawn, 'spawn'); identify(spawn);
    syncFunction(spawn.init, 'spawn.init');
    const spawnWrites = declaration(spawn.initWrites, 'spawn.initWrites');
    addFields(spawnWrites, initFields);
    this.initializers.push({ id: spawn.id, call: spawn.init.bind(spawn), fields: spawnWrites });
    addReset(spawn);
    if (options.emission) {
      const emission = options.emission();
      claim(emission, 'emission'); identify(emission);
      syncFunction(emission.plan, 'emission.plan'); syncFunction(emission.reset, 'emission.reset');
      this.emission = { id: emission.id, plan: emission.plan.bind(emission), reset: emission.reset.bind(emission) };
      this.resets.push({ id: emission.id, call: this.emission.reset });
    }
    const motion: UpdateCall<T>[] = [], appearance: UpdateCall<T>[] = [];
    for (const factory of options.behaviors ?? []) {
      syncFunction(factory, 'behavior factory');
      const behavior = factory();
      claim(behavior, 'behavior'); identify(behavior);
      if (behavior.phase !== 'motion' && behavior.phase !== 'appearance') throw new TypeError('Invalid behavior phase');
      if (!('init' in behavior) && !('update' in behavior)) throw new TypeError('Behavior requires init or update');
      if ('init' in behavior) {
        syncFunction(behavior.init, 'behavior.init');
        const fields = declaration('initWrites' in behavior ? behavior.initWrites : [], 'behavior.initWrites');
        addFields(fields, initFields);
        this.initializers.push({ id: behavior.id, call: behavior.init!.bind(behavior), fields });
      } else if ('initWrites' in behavior) throw new TypeError('initWrites requires init');
      if ('update' in behavior) {
        syncFunction(behavior.update, 'behavior.update');
        const fields = declaration('updateWrites' in behavior ? behavior.updateWrites : [], 'behavior.updateWrites');
        addFields(fields, updateFields);
        (behavior.phase === 'motion' ? motion : appearance).push({ id: behavior.id, call: behavior.update!.bind(behavior), fields });
      } else if ('updateWrites' in behavior) throw new TypeError('updateWrites requires update');
      addReset(behavior);
    }
    this.updates = [...motion, ...appearance];
    if ('observers' in options && !Array.isArray(options.observers)) throw new TypeError('observers must be an array');
    let created: ParticleRenderer<T> | undefined;
    let owned = false;
    try {
      for (const factory of options.observers ?? []) {
        syncFunction(factory, 'observer factory');
        const observer = factory();
        claim(observer, 'observer');
        this.observers.push(observer);
        identify(observer);
        if ('requiresEnvironment' in observer && typeof observer.requiresEnvironment !== 'boolean') throw new TypeError('Observer requiresEnvironment must be boolean');
        if (observer.requiresEnvironment && !this.environment) throw new TypeError('Observer requires an environment factory');
        for (const key of ['reset', 'destroy', 'hasPendingWork'] as const) syncFunction(observer[key], `observer.${key}`);
        for (const key of ['onBirth', 'onUpdate', 'onDeath', 'onAdvance'] as const) if (key in observer) syncFunction(observer[key], `observer.${key}`);
      }
      created = options.renderer(Object.freeze({ updateWrites: Object.freeze([...updateFields]), ...(this.observers.length ? { observers: Object.freeze([...this.observers]) } : {}) }));
      object(created, 'renderer');
      if (claimedRuntimes.has(created)) throw new TypeError('renderer runtime is already owned by a system');
      owned = true;
      claim(created, 'renderer');
      syncFunction(created.sync, 'renderer.sync'); syncFunction(created.destroy, 'renderer.destroy');
      this.renderer = { sync: created.sync.bind(created), destroy: created.destroy.bind(created) };
    } catch (error) {
      const cleanupErrors: unknown[] = [];
      if (owned && created && typeof created.destroy === 'function') {
        try { undefinedResult(created.destroy()); } catch (cleanupError) { cleanupErrors.push(cleanupError); }
      }
      for (const observer of this.observers) { try { if (typeof observer.destroy === 'function') undefinedResult(observer.destroy()); } catch (cleanupError) { cleanupErrors.push(cleanupError); } }
      if (cleanupErrors.length) {
        const failure = new Error('ParticleSystem construction and resource cleanup failed') as Error & { cause: unknown; cleanupErrors: readonly unknown[] };
        failure.cause = error; failure.cleanupErrors = Object.freeze(cleanupErrors); throw failure;
      }
      throw error;
    }
  }

  private pending(): boolean {
    let pending = this.active.length > 0;
    for (const observer of this.observers) {
      this.moduleId = observer.id;
      const result = observer.hasPendingWork();
      if (typeof result !== 'boolean') throw new TypeError('Observer hasPendingWork must return boolean synchronously');
      pending = pending || result;
    }
    this.moduleId = undefined;
    return pending;
  }
  get hasPendingWork(): boolean {
    this.guard(['stopped', 'playing', 'draining', 'paused']);
    let result = false;
    this.run('hasPendingWork', () => { result = this.pending(); });
    return result;
  }
  private observation(slot: Slot<T>): ParticleObservation {
    const p = slot.particle;
    return Object.freeze({ birthId: slot.birthId, ageSeconds: p.ageSeconds, lifetimeSeconds: p.lifetimeSeconds,
      x: p.x, y: p.y, vx: p.vx, vy: p.vy, rotation: p.rotation, scaleX: p.scaleX, scaleY: p.scaleY, alpha: p.alpha, tint: p.tint });
  }
  get state(): ParticleSystemState { return this.mode; }
  get particleCount(): number { return this.active.length; }
  get error(): unknown { return this.failure; }
  get diagnostic(): Readonly<{ operation: string; moduleId?: string }> | undefined { return this.failureDiagnostic; }

  private guard(allowed: readonly ParticleSystemState[]): void {
    if (this.busy) throw new Error('ParticleSystem mutation is not reentrant');
    if (!allowed.includes(this.mode)) throw new Error(`Operation is not allowed in ${this.mode}`);
  }

  private run(name: string, operation: () => void): void {
    this.busy = true;
    this.operation = name; this.moduleId = undefined;
    try { operation(); }
    catch (error) {
      this.mode = 'faulted'; this.failure = error;
      this.failureDiagnostic = Object.freeze({ operation: this.operation, ...(this.moduleId === undefined ? {} : { moduleId: this.moduleId }) });
      throw error;
    }
    finally { this.busy = false; }
  }

  private resetRun(): void {
    this.time = 0;
    this.timeCompensation = 0;
    for (const reset of this.resets) { this.moduleId = reset.id; undefinedResult(reset.call()); }
    for (const observer of this.observers) { this.moduleId = observer.id; undefinedResult(observer.reset()); }
    this.moduleId = undefined;
  }

  private sampleEnvironment(): void {
    if (!this.environment) return;
    this.moduleId = 'environment.sample';
    this.environmentSnapshot = snapshotParticleEnvironment(this.environment.sample());
    this.moduleId = undefined;
  }

  private environmentContext(): Pick<BirthContext, 'simulationSpace' | 'gravityModifier' | 'environment'> {
    return this.environmentSnapshot ? {
      simulationSpace: this.main.simulationSpace, gravityModifier: this.main.gravityModifier, environment: this.environmentSnapshot,
    } : {};
  }

  play(): void {
    this.guard(['stopped']);
    this.run('play', () => { this.resetRun(); this.mode = 'playing'; });
  }
  pause(): void {
    this.guard(['playing', 'draining']);
    this.previousMode = this.mode as 'playing' | 'draining'; this.mode = 'paused';
  }
  resume(): void {
    this.guard(['paused']); this.mode = this.previousMode;
  }
  stop(): void {
    this.guard(['stopped', 'playing', 'draining', 'paused']);
    this.run('stop', () => {
      if (!this.pending()) this.mode = 'stopped';
      else if (this.mode === 'paused') this.previousMode = 'draining';
      else this.mode = 'draining';
    });
  }
  setOrigin(x: number, y: number): void {
    this.guard(['stopped', 'playing', 'draining', 'paused']);
    finite(x, 'origin.x'); finite(y, 'origin.y');
    this.originX = x; this.originY = y;
  }
  emit(count: number): void {
    this.guard(['stopped', 'playing', 'draining']);
    integer(count, 'count', 0);
    if (count === 0) return;
    this.run('emit', () => {
      if (count > this.main.maxBirthsPerUpdate) throw new RangeError('Birth budget exceeded');
      if (count > this.main.maxParticles - this.active.length) throw new RangeError('Particle capacity exceeded');
      this.sampleEnvironment();
      if (this.mode === 'stopped') { this.resetRun(); this.mode = 'draining'; }
      this.birth(count, this.time, this.originX, this.originY);
      this.sync();
    });
  }
  reset(): void {
    this.guard(['stopped', 'playing', 'draining', 'paused']);
    this.run('reset', () => {
      for (const slot of this.active) this.free.push(slot);
      this.active.length = 0;
      this.membershipVersion++;
      this.resetRun(); this.mode = 'stopped'; this.previousMode = 'playing';
      this.sync();
    });
  }

  update(dtSeconds: number): void {
    this.guard(['stopped', 'playing', 'draining', 'paused']);
    finite(dtSeconds, 'dtSeconds');
    if (dtSeconds < 0) throw new RangeError('dtSeconds must be nonnegative');
    if (dtSeconds === 0 || this.mode === 'stopped' || this.mode === 'paused') {
      if (this.environment) this.run('update', () => { this.sampleEnvironment(); });
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
      if (!(end > start)) throw new RangeError('Simulation time cannot make positive progress');
      const originX = this.originX, originY = this.originY;
      let requests: readonly BirthRequest[] = [];
      if (this.mode === 'playing' && this.emission) {
        this.moduleId = this.emission.id;
        requests = this.emission.plan(Object.freeze({ startTimeSeconds: start, endTimeSeconds: end, dtSeconds: actualDt, maxBirths: this.main.maxBirthsPerUpdate }));
        this.checkPlan(requests, actualDt);
        this.moduleId = undefined;
      }
      let cursor = start;
      for (const request of requests) {
        const at = request.offsetSeconds === actualDt ? end : start + request.offsetSeconds;
        if (!(at > cursor)) throw new RangeError('Birth time cannot make positive progress');
        this.advance(cursor, at);
        this.birth(request.count, at, originX, originY);
        cursor = at;
      }
      if (end > cursor) this.advance(cursor, end);
      this.time = end;
      this.timeCompensation = compensation;
      if (this.mode === 'draining' && !this.pending()) this.mode = 'stopped';
      this.sync();
    });
  }

  private checkPlan(requests: readonly BirthRequest[], dt: number): void {
    if (!Array.isArray(requests)) throw new TypeError('Emission plan must be a synchronous array');
    let total = 0, previous = 0;
    if (requests.length > this.main.maxBirthsPerUpdate) throw new RangeError('Birth budget exceeded');
    for (const request of requests) {
      object(request, 'birth request');
      knownKeys(request, ['offsetSeconds', 'count'], 'birth request');
      finite(request.offsetSeconds, 'offsetSeconds'); integer(request.count, 'birth count', 1);
      if (!(request.offsetSeconds > previous) || request.offsetSeconds > dt) throw new RangeError('Birth offsets must strictly increase in (0, dtSeconds]');
      total += request.count; integer(total, 'total birth count', 0);
      if (total > this.main.maxBirthsPerUpdate) throw new RangeError('Birth budget exceeded');
      previous = request.offsetSeconds;
    }
  }

  private birth(count: number, time: number, x: number, y: number): void {
    if (count > this.main.maxParticles - this.active.length) throw new RangeError('Particle capacity exceeded');
    const ctx: BirthContext = Object.freeze({ timeSeconds: time, origin: Object.freeze({ x, y }), ...this.environmentContext() });
    for (let i = 0; i < count; i++) {
      integer(this.nextBirthId, 'birthId', 0);
      const birthId = this.nextBirthId++;
      let slot = this.free.pop();
      if (!slot) {
        if (this.allocated >= this.main.maxParticles) throw new RangeError('Particle pool capacity exceeded');
        this.moduleId = this.data ? 'data.create' : undefined;
        const data = this.data ? this.data.create() : {} as T;
        object(data, 'particle data');
        const record = { age: 0, birthTime: time } as Slot<T>;
        record.particle = {
          get ageSeconds() { return record.age; }, get lifetimeSeconds() { return lifetime; },
          x: 0, y: 0, vx: 0, vy: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1, tint: 0xffffff, data,
        };
        const lifetime = this.main.lifetimeSeconds;
        slot = record; this.allocated++;
      }
      const p = slot.particle;
      slot.birthId = birthId;
      slot.age = 0;
      slot.birthTime = time;
      p.x = 0; p.y = 0; p.vx = 0; p.vy = 0;
      p.rotation = this.main.rotation; p.scaleX = this.main.scaleX; p.scaleY = this.main.scaleY;
      p.alpha = this.main.alpha; p.tint = this.main.tint;
      if (this.data) { this.moduleId = 'data.reset'; undefinedResult(this.data.reset(p.data)); }
      this.checkDataOwnership(p.data, slot);
      for (const hook of this.initializers) {
        this.moduleId = hook.id;
        undefinedResult(hook.call(p, ctx)); checkFields(p, hook.fields, hook.id);
      }
      this.moduleId = undefined;
      checkFields(p, PARTICLE_FIELDS);
      for (const observer of this.observers) { this.moduleId = observer.id; if (observer.onBirth) undefinedResult(observer.onBirth(this.observation(slot), ctx)); }
      this.moduleId = undefined;
      this.active.push(slot); this.membershipVersion++;
    }
  }

  private checkDataOwnership(data: object, slot: Slot<T>): void {
    const seen = new Set<object>();
    const visit = (value: object): void => {
      if (seen.has(value)) return;
      seen.add(value);
      const owner = this.dataOwners.get(value);
      if (owner && owner !== slot) throw new TypeError('Mutable particle data cannot be shared between particles');
      this.dataOwners.set(value, slot);
      for (const item of Object.values(value)) if (item !== null && typeof item === 'object') visit(item);
    };
    visit(data);
  }

  private advance(start: number, end: number): void {
    const span = end - start;
    let write = 0;
    for (const slot of this.active) {
      const p = slot.particle;
      const remaining = this.main.lifetimeSeconds - slot.age;
      // Age and absolute lifetime endpoints share a relative rounding boundary.
      // The absolute endpoint also bounds error when clock spacing exceeds age spacing.
      const dies = span >= remaining || sameTime(slot.age + span, this.main.lifetimeSeconds)
        || sameTime(end, slot.birthTime + this.main.lifetimeSeconds);
      const actual = dies ? Math.min(span, remaining) : span;
      if (actual > 0) {
        const nextAge = dies ? this.main.lifetimeSeconds : slot.age + actual;
        if (!(nextAge > slot.age)) throw new RangeError('Particle age cannot make positive progress');
        slot.age = nextAge;
        const actualEnd = dies ? start + actual : end;
        const ctx: ParticleUpdateContext = Object.freeze({
          startTimeSeconds: start, endTimeSeconds: actualEnd, dtSeconds: actualEnd - start,
          ageSeconds: slot.age, normalizedAge: slot.age / this.main.lifetimeSeconds,
          ...this.environmentContext(),
        });
        if (!(ctx.dtSeconds > 0)) throw new RangeError('Particle update time cannot make positive progress');
        for (const hook of this.updates) {
          this.moduleId = hook.id;
          undefinedResult(hook.call(p, ctx)); checkFields(p, hook.fields, hook.id);
        }
        checkFields(p, PARTICLE_FIELDS);
        for (const observer of this.observers) { this.moduleId = observer.id; if (observer.onUpdate) undefinedResult(observer.onUpdate(this.observation(slot), ctx)); }
        this.moduleId = undefined;
      }
      if (dies) {
        const ctx = Object.freeze({ timeSeconds: start + actual, ...this.environmentContext() });
        for (const observer of this.observers) { this.moduleId = observer.id; if (observer.onDeath) undefinedResult(observer.onDeath(this.observation(slot), ctx)); }
        this.moduleId = undefined;
      }
      if (dies) { this.free.push(slot); this.membershipVersion++; }
      else this.active[write++] = slot;
    }
    this.active.length = write;
    const ctx = Object.freeze({ startTimeSeconds: start, endTimeSeconds: end, dtSeconds: span });
    for (const observer of this.observers) { this.moduleId = observer.id; if (observer.onAdvance) undefinedResult(observer.onAdvance(ctx)); }
    this.moduleId = undefined;
  }

  private sync(): void {
    this.renderParticles.length = this.active.length;
    for (let i = 0; i < this.active.length; i++) {
      const p = this.active[i]!.particle;
      checkFields(p, PARTICLE_FIELDS);
      this.renderParticles[i] = p;
    }
    this.moduleId = 'renderer';
    undefinedResult(this.renderer!.sync({ particles: this.renderParticles, membershipVersion: this.membershipVersion }));
    this.moduleId = undefined;
  }

  destroy(): void {
    this.guard(['stopped', 'playing', 'draining', 'paused', 'faulted', 'destroyed']);
    if (this.mode === 'destroyed') return;
    this.run('destroy', () => {
      this.active.length = 0; this.free.length = 0; this.renderParticles.length = 0;
      this.allocated = 0; this.initializers.length = 0; this.updates.length = 0; this.resets.length = 0;
      this.emission = undefined; this.data = undefined; this.dataOwners = new WeakMap();
      this.environment = undefined; this.environmentSnapshot = undefined;
      let failure: unknown; let failed = false; let failedId: string | undefined;
      const cleanupErrors: unknown[] = [];
      const remaining: ParticleLifecycleObserver[] = [];
      for (const observer of this.observers) {
        try { this.moduleId = observer.id; undefinedResult(observer.destroy()); }
        catch (error) { cleanupErrors.push(error); if (!failed) { failure = error; failed = true; failedId = this.moduleId; } remaining.push(observer); }
      }
      this.observers = remaining;
      if (this.renderer) { try { this.moduleId = 'renderer'; undefinedResult(this.renderer.destroy()); this.renderer = undefined; } catch (error) { cleanupErrors.push(error); if (!failed) { failure = error; failed = true; failedId = this.moduleId; } } }
      if (failed) {
        this.moduleId = failedId;
        if (cleanupErrors.length > 1) {
          const aggregate = new Error('ParticleSystem resource cleanup failed') as Error & { cause: unknown; cleanupErrors: readonly unknown[] };
          aggregate.cause = failure; aggregate.cleanupErrors = Object.freeze(cleanupErrors); throw aggregate;
        }
        throw failure;
      }
      this.mode = 'destroyed';
    });
  }
}

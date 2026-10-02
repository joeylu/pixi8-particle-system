export type ParticleField = 'x' | 'y' | 'vx' | 'vy' | 'rotation' | 'scaleX' | 'scaleY' | 'alpha' | 'tint';
export interface ParticleState<T extends object = Record<string, never>> {
  readonly ageSeconds: number;
  readonly lifetimeSeconds: number;
  x: number; y: number; vx: number; vy: number;
  rotation: number; scaleX: number; scaleY: number; alpha: number; tint: number;
  data: T;
}
export interface ParticleVector2 { readonly x: number; readonly y: number }
export interface ParticleAffineTransform { readonly a: number; readonly b: number; readonly c: number; readonly d: number; readonly tx: number; readonly ty: number }
export interface ParticleEnvironmentSnapshot { readonly emitterTransform: ParticleAffineTransform; readonly gravity: ParticleVector2 }
export interface ParticleEnvironment { sample: () => ParticleEnvironmentSnapshot }
export type ParticleEnvironmentFactory = () => ParticleEnvironment;
export interface BirthContext {
  readonly timeSeconds: number; readonly origin: { readonly x: number; readonly y: number };
  readonly simulationSpace?: 'local' | 'world'; readonly gravityModifier?: number; readonly environment?: ParticleEnvironmentSnapshot;
}
export interface ParticleUpdateContext {
  readonly startTimeSeconds: number; readonly endTimeSeconds: number; readonly dtSeconds: number;
  readonly ageSeconds: number; readonly normalizedAge: number;
  readonly simulationSpace?: 'local' | 'world'; readonly gravityModifier?: number; readonly environment?: ParticleEnvironmentSnapshot;
}
export interface BirthRequest { readonly offsetSeconds: number; readonly count: number }
export interface EmissionContext {
  readonly startTimeSeconds: number; readonly endTimeSeconds: number; readonly dtSeconds: number; readonly maxBirths: number;
}
export interface ParticleInitializer<T extends object = Record<string, never>> {
  readonly id: string; readonly initWrites: readonly ParticleField[];
  init: (p: ParticleState<T>, ctx: BirthContext) => undefined;
  reset?: () => undefined;
}
export interface ParticleBehavior<T extends object = Record<string, never>> {
  readonly id: string; readonly phase: 'motion' | 'appearance';
  readonly initWrites?: readonly ParticleField[]; readonly updateWrites?: readonly ParticleField[];
  init?: (p: ParticleState<T>, ctx: BirthContext) => undefined;
  update?: (p: ParticleState<T>, ctx: ParticleUpdateContext) => undefined;
  reset?: () => undefined;
}
export interface ParticleEmission {
  readonly id: string; plan: (ctx: EmissionContext) => readonly BirthRequest[]; reset: () => undefined;
}
export interface ParticleRenderSnapshot<T extends object = Record<string, never>> {
  readonly particles: readonly ParticleState<T>[]; readonly membershipVersion: number;
}
export interface ParticleRenderer<T extends object = Record<string, never>> {
  sync: (snapshot: ParticleRenderSnapshot<T>) => undefined; destroy: () => undefined;
}
export type ParticleRendererFactory<T extends object = Record<string, never>> =
  (requirements: { readonly updateWrites: readonly ParticleField[]; readonly observers?: readonly ParticleLifecycleObserver[] }) => ParticleRenderer<T>;
export type MainConfig = {
  maxParticles: number; maxBirthsPerUpdate?: number;
  scaleX?: number; scaleY?: number; rotation?: number; alpha?: number; tint?: number;
  simulationSpace?: 'local' | 'world'; gravityModifier?: number;
} & ({ startLifetime: number; lifetimeSeconds?: never } | { lifetimeSeconds: number; startLifetime?: never });
export interface ParticleSystemOptions<T extends object = Record<string, never>> {
  main: MainConfig; spawn: () => ParticleInitializer<T>; emission?: () => ParticleEmission;
  behaviors?: readonly (() => ParticleBehavior<T>)[];
  data?: { create: () => T & { readonly then?: never }; reset: (data: T) => undefined };
  renderer: ParticleRendererFactory<T>;
  environment?: ParticleEnvironmentFactory;
  observers?: readonly (() => ParticleLifecycleObserver)[];
}

export type ParticleObservation = Readonly<Omit<ParticleState, 'data'> & { birthId: number }>;
export type ParticleDeathContext = Readonly<Pick<BirthContext, 'timeSeconds' | 'simulationSpace' | 'gravityModifier' | 'environment'>>;
export interface ParticleAdvanceContext { readonly startTimeSeconds: number; readonly endTimeSeconds: number; readonly dtSeconds: number }
export interface ParticleLifecycleObserver {
  readonly id: string;
  readonly requiresEnvironment?: boolean;
  onBirth?: (p: ParticleObservation, ctx: BirthContext) => undefined;
  onUpdate?: (p: ParticleObservation, ctx: ParticleUpdateContext) => undefined;
  onDeath?: (p: ParticleObservation, ctx: ParticleDeathContext) => undefined;
  onAdvance?: (ctx: ParticleAdvanceContext) => undefined;
  reset: () => undefined;
  destroy: () => undefined;
  hasPendingWork: () => boolean;
}

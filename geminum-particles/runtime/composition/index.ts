export type {
  ParticleCurve, ScalarRange, StartValuesConfig, ParticleEffectMainConfig, ShapeConfig, ShapeCommonConfig,
  ForceConfig, ForceOverLifetimeConfig, EmissionModuleConfig, ConstantForce, ConstantForceFactory, ColorOverLifetimeConfig, SizeOverLifetimeConfig,
  RotationOverLifetimeConfig, ParticleEffectConfig, ParticleEffectEnvironment, ParticleModuleData, CreateParticleEffectOptions,
} from './contracts.js';
export { compileParticleEffectConfig } from './compileParticleEffectConfig.js';
export { createParticleEffect } from './createParticleEffect.js';
export { createEmissionModule } from '../modules/ConstantRateEmission.js';
export { createShapeSpawn, createShapeModule } from '../modules/ShapeSpawn.js';
export { createStartValues, createMainStartValues } from '../modules/StartValues.js';
export { createConstantForce, createForceOverLifetimeModule } from '../modules/ConstantForce.js';
export { createKinematicMotion } from '../modules/KinematicMotion.js';
export { createColorOverLifetime, createColorOverLifetimeModule } from '../modules/ColorOverLifetime.js';
export { createSizeOverLifetime, createSizeOverLifetimeModule } from '../modules/SizeOverLifetime.js';
export { createRotationOverLifetime, createRotationOverLifetimeModule } from '../modules/RotationOverLifetime.js';
export * from '../entity/index.js';
export type { ParticleVector2, ParticleAffineTransform, ParticleEnvironmentSnapshot, ParticleEnvironment, ParticleEnvironmentFactory } from '../core/contracts.js';
export { snapshotParticleAffineTransform, snapshotParticleVector2 } from '../core/environment.js';

export { ParticleTrails, createTrailsModule } from '../modules/Trails.js';
export type { TrailsConfig, ParticleTrailPoint, ParticleTrailSnapshot } from '../modules/Trails.js';
export type { ParticleObservation, ParticleLifecycleObserver, ParticleDeathContext, ParticleAdvanceContext } from '../core/contracts.js';

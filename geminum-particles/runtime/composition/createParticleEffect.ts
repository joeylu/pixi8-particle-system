import { ParticleSystem } from '../core/ParticleSystem.js';
import { knownKeys, object, syncFunction } from '../core/validation.js';
import type { CreateParticleEffectOptions, ParticleEffectConfig, ParticleModuleData } from './contracts.js';
import { compileParticleEffectConfig, PARTICLE_EFFECT_KEYS } from './compileParticleEffectConfig.js';

export function createParticleEffect(config: CreateParticleEffectOptions): ParticleSystem<ParticleModuleData> {
  object(config, 'CreateParticleEffect options');
  knownKeys(config, [...PARTICLE_EFFECT_KEYS, 'renderer', 'environment'], 'CreateParticleEffect');
  syncFunction(config.renderer, 'renderer factory');
  const effect: ParticleEffectConfig = {};
  for (const key of PARTICLE_EFFECT_KEYS) {
    if (key in config) Object.assign(effect, { [key]: (config as unknown as Record<string, unknown>)[key] });
  }
  const compiled = 'environment' in config ? compileParticleEffectConfig(effect, config.environment) : compileParticleEffectConfig(effect);
  return new ParticleSystem({ ...compiled, renderer: config.renderer });
}

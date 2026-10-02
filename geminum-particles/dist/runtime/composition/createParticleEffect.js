import { ParticleSystem } from '../core/ParticleSystem.js';
import { knownKeys, object, syncFunction } from '../core/validation.js';
import { compileParticleEffectConfig, PARTICLE_EFFECT_KEYS } from './compileParticleEffectConfig.js';
export function createParticleEffect(config) {
    object(config, 'CreateParticleEffect options');
    knownKeys(config, [...PARTICLE_EFFECT_KEYS, 'renderer', 'environment'], 'CreateParticleEffect');
    syncFunction(config.renderer, 'renderer factory');
    const effect = {};
    for (const key of PARTICLE_EFFECT_KEYS) {
        if (key in config)
            Object.assign(effect, { [key]: config[key] });
    }
    const compiled = 'environment' in config ? compileParticleEffectConfig(effect, config.environment) : compileParticleEffectConfig(effect);
    return new ParticleSystem({ ...compiled, renderer: config.renderer });
}

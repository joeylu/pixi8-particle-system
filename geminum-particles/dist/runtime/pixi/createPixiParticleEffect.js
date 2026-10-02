import { object, knownKeys } from '../core/validation.js';
import { compileParticleEffectConfig, PARTICLE_EFFECT_KEYS } from '../composition/compileParticleEffectConfig.js';
import { createPixiParticleSystem } from './createPixiParticleSystem.js';
/** Compile effect modules and reuse the existing host-owned-texture Pixi adapter. */
export function createPixiParticleEffect(options) {
    object(options, 'Particle effect options');
    const keys = [...PARTICLE_EFFECT_KEYS, 'texture', 'blendMode', 'boundsArea', 'space', 'gravity', 'trailRenderer'];
    knownKeys(options, keys, 'Particle effect options');
    for (const key of keys) {
        if (key in options && options[key] === undefined)
            throw new TypeError(`Particle effect option ${key} cannot be undefined`);
    }
    const config = {};
    for (const key of PARTICLE_EFFECT_KEYS) {
        if (key in options)
            Object.assign(config, { [key]: options[key] });
    }
    const { texture, blendMode, boundsArea } = options;
    return createPixiParticleSystem({
        ...compileParticleEffectConfig(config), texture,
        ...('blendMode' in options ? { blendMode } : {}),
        ...('boundsArea' in options ? { boundsArea } : {}),
        ...('space' in options ? { space: options.space } : {}),
        ...('gravity' in options ? { gravity: options.gravity } : {}),
        ...('trailRenderer' in options ? { trailRenderer: options.trailRenderer } : {}),
    });
}

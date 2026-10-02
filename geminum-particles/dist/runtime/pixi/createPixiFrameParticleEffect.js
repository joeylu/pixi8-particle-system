import { aliasValue, knownKeys, object } from '../core/validation.js';
import { compileParticleEffectConfig, PARTICLE_EFFECT_KEYS } from '../composition/compileParticleEffectConfig.js';
import { normalizeParticleFrameSelection } from '../entity/index.js';
import { createCompiledFrameEffect } from './internal/createCompiledFrameEffect.js';
import { createPixiParticleSpaceRuntime } from './space.js';
export function createPixiFrameParticleEffect(options) {
    object(options, 'Frame effect options');
    const keys = [...PARTICLE_EFFECT_KEYS, 'textures', 'textureSheetAnimation', 'selection', 'blendMode', 'boundsArea', 'space', 'gravity', 'trailRenderer'];
    knownKeys(options, keys, 'Frame effect options');
    for (const key of keys)
        if (key in options && options[key] === undefined)
            throw new TypeError(`${key} cannot be undefined`);
    const config = {};
    for (const key of PARTICLE_EFFECT_KEYS)
        if (key in options)
            Object.assign(config, { [key]: options[key] });
    const validated = compileParticleEffectConfig(config);
    if (config.trails?.worldSpace && !options.space)
        throw new TypeError('World-space trails require space');
    const runtime = createPixiParticleSpaceRuntime(options, [validated.main]);
    const compiled = runtime ? compileParticleEffectConfig(config, runtime.environment()) : validated;
    const selection = normalizeParticleFrameSelection(aliasValue(options, 'textureSheetAnimation', 'selection'));
    const effect = createCompiledFrameEffect(compiled, { textures: options.textures, textureSheetAnimation: selection,
        randomSeed: config.main ? aliasValue(config.main, 'randomSeed', 'seed', 1) : 1,
        ...('blendMode' in options ? { blendMode: options.blendMode } : {}),
        ...('boundsArea' in options ? { boundsArea: options.boundsArea } : {}) }, options.trailRenderer);
    try {
        if (runtime) {
            if (effect.trailContainer)
                runtime.attach(effect.trailContainer, config.trails?.worldSpace ? 'world' : config.main?.simulationSpace ?? 'local');
            runtime.attach(effect.container, config.main?.simulationSpace ?? 'local');
        }
        return effect;
    }
    catch (error) {
        try {
            effect.system.destroy();
        }
        catch (cleanupError) {
            throw Object.assign(new Error('Frame effect construction and cleanup failed'), { cause: error, cleanupErrors: [cleanupError] });
        }
        throw error;
    }
}

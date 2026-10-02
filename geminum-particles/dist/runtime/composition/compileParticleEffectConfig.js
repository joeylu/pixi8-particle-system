import { createTrailsModule } from '../modules/Trails.js';
import { aliasValue, finite, integer, knownKeys, object } from '../core/validation.js';
import { optionalNumber, seedSnapshot } from './config.js';
import { createParticleModuleData, resetParticleModuleData } from './data.js';
import { createConstantRateEmission } from '../modules/ConstantRateEmission.js';
import { createShapeSpawn } from '../modules/ShapeSpawn.js';
import { createStartValues } from '../modules/StartValues.js';
import { createConstantForce } from '../modules/ConstantForce.js';
import { createKinematicMotion } from '../modules/KinematicMotion.js';
import { createColorOverLifetime } from '../modules/ColorOverLifetime.js';
import { createSizeOverLifetime } from '../modules/SizeOverLifetime.js';
import { createRotationOverLifetime } from '../modules/RotationOverLifetime.js';
import { compileParticleEffectEnvironment } from './environment.js';
export const PARTICLE_EFFECT_KEYS = Object.freeze([
    'trails', 'main', 'emission', 'shape', 'force', 'forceOverLifetime', 'colorOverLifetime', 'sizeOverLifetime', 'rotationOverLifetime',
]);
export function compileParticleEffectConfig(config = {}, environment) {
    if (arguments.length > 0 && arguments[0] === undefined)
        throw new TypeError('ParticleEffect config cannot be explicitly undefined');
    if (arguments.length > 1 && arguments[1] === undefined)
        throw new TypeError('ParticleEffect environment cannot be explicitly undefined');
    object(config, 'ParticleEffect config');
    const forceConfig = aliasValue(config, 'forceOverLifetime', 'force', undefined);
    knownKeys(config, PARTICLE_EFFECT_KEYS, 'ParticleEffect');
    const main = 'main' in config ? config.main : {};
    object(main, 'ParticleEffect Main');
    const lifetimeSeconds = aliasValue(main, 'startLifetime', 'lifetimeSeconds', 1);
    const seedInput = aliasValue(main, 'randomSeed', 'seed', 1);
    aliasValue(main, 'startRotation', 'startRotationRadians', 0);
    knownKeys(main, ['maxParticles', 'maxBirthsPerUpdate', 'startLifetime', 'lifetimeSeconds', 'startSpeed', 'startScale', 'startRotation', 'startRotationRadians', 'startTint', 'startAlpha', 'randomSeed', 'seed', 'simulationSpace', 'gravityModifier'], 'ParticleEffect Main');
    const maxParticles = optionalNumber(main, 'maxParticles', 128);
    integer(maxParticles, 'maxParticles', 1);
    const maxBirthsPerUpdate = optionalNumber(main, 'maxBirthsPerUpdate', maxParticles);
    integer(maxBirthsPerUpdate, 'maxBirthsPerUpdate', 1);
    finite(lifetimeSeconds, 'startLifetime/lifetimeSeconds');
    if (lifetimeSeconds <= 0)
        throw new RangeError('lifetimeSeconds must be positive');
    finite(seedInput, 'randomSeed/seed');
    const seed = seedSnapshot(seedInput);
    const simulationSpace = 'simulationSpace' in main ? main.simulationSpace : 'local';
    if (simulationSpace !== 'local' && simulationSpace !== 'world')
        throw new TypeError('simulationSpace must be local or world');
    const gravityModifier = optionalNumber(main, 'gravityModifier', 0);
    const trails = 'trails' in config ? createTrailsModule(config.trails) : undefined;
    if (trails) {
        const ttl = lifetimeSeconds * ('lifetime' in config.trails ? config.trails.lifetime : .3);
        finite(ttl, 'Trails TTL');
        if (ttl <= 0)
            throw new RangeError('Trails TTL must be positive');
    }
    const worldTrails = trails ? config.trails.worldSpace === true : false;
    const environmentFactory = environment ? compileParticleEffectEnvironment(environment, worldTrails ? 'world' : simulationSpace, gravityModifier) : undefined;
    if (arguments.length > 1 && !environment)
        throw new TypeError('ParticleEffect environment must be an object');
    const startConfig = {};
    for (const key of ['startSpeed', 'startScale', 'startRotation', 'startRotationRadians', 'startTint', 'startAlpha']) {
        if (key in main)
            Object.assign(startConfig, { [key]: main[key] });
    }
    const spawn = createShapeSpawn('shape' in config ? config.shape : { type: 'point' }, seed);
    const start = createStartValues(startConfig, seed);
    const force = 'forceOverLifetime' in config || 'force' in config ? createConstantForce(forceConfig) : undefined;
    const behaviors = [start, createKinematicMotion(force ? { force } : {})];
    if ('colorOverLifetime' in config)
        behaviors.push(createColorOverLifetime(config.colorOverLifetime));
    if ('sizeOverLifetime' in config)
        behaviors.push(createSizeOverLifetime(config.sizeOverLifetime));
    if ('rotationOverLifetime' in config)
        behaviors.push(createRotationOverLifetime(config.rotationOverLifetime));
    const emission = 'emission' in config ? createConstantRateEmission(config.emission) : undefined;
    return {
        main: Object.freeze({ maxParticles, maxBirthsPerUpdate, lifetimeSeconds,
            ...('simulationSpace' in main ? { simulationSpace } : {}), ...('gravityModifier' in main ? { gravityModifier } : {}),
        }), spawn,
        behaviors: Object.freeze(behaviors),
        data: Object.freeze({ create: createParticleModuleData, reset: resetParticleModuleData }),
        ...(emission ? { emission } : {}),
        ...(trails ? { observers: Object.freeze([trails]) } : {}),
        ...(environmentFactory ? { environment: environmentFactory } : {}),
    };
}

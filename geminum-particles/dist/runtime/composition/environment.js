import { environmentObject, snapshotParticleAffineTransform, snapshotParticleVector2 } from '../core/environment.js';
import { syncFunction } from '../core/validation.js';
const identity = Object.freeze({ a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 });
export function compileParticleEffectEnvironment(input, simulationSpace, gravityModifier) {
    const environment = environmentObject(input, ['gravity', 'getEmitterTransform'], [], 'ParticleEffect environment');
    if (simulationSpace === 'world' && !('getEmitterTransform' in environment))
        throw new TypeError('World simulation requires getEmitterTransform');
    if (gravityModifier !== 0 && !('gravity' in environment))
        throw new TypeError('Nonzero gravityModifier requires explicit gravity');
    const gravity = snapshotParticleVector2('gravity' in environment ? environment.gravity : { x: 0, y: 0 });
    let getter = () => identity;
    if ('getEmitterTransform' in environment) {
        syncFunction(environment.getEmitterTransform, 'getEmitterTransform');
        getter = environment.getEmitterTransform.bind(input);
    }
    return () => ({ sample: () => Object.freeze({ emitterTransform: snapshotParticleAffineTransform(getter()), gravity }) });
}

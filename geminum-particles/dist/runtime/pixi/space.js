import { Container, Matrix } from 'pixi.js';
import { environmentObject, snapshotParticleAffineTransform, snapshotParticleVector2 } from '../core/environment.js';
const identity = Object.freeze({ a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 });
function affine(matrix) {
    return snapshotParticleAffineTransform({ a: matrix.a, b: matrix.b, c: matrix.c, d: matrix.d, tx: matrix.tx, ty: matrix.ty });
}
function descendant(node, ancestor) {
    for (let current = node; current; current = current.parent)
        if (current === ancestor)
            return true;
    return false;
}
function same(a, b) {
    return ['a', 'b', 'c', 'd', 'tx', 'ty'].every(key => Math.abs(a[key] - b[key]) <= 32 * Number.EPSILON * Math.max(1, Math.abs(a[key]), Math.abs(b[key])));
}
/** Coordinates host transforms while retaining ownership only of output poses. */
export class PixiParticleSpaceRuntime {
    constructor(bindings, gravity) {
        this.bindings = bindings;
        this.owned = [];
        const input = environmentObject(bindings, ['emitter', 'world'], ['emitter', 'world'], 'space');
        if (!(input.emitter instanceof Container) || !(input.world instanceof Container))
            throw new TypeError('space emitter and world must be Containers');
        this.bindings = Object.freeze({ emitter: input.emitter, world: input.world });
        this.gravity = snapshotParticleVector2(gravity ?? { x: 0, y: 0 });
        this.read();
    }
    read() {
        const { emitter, world } = this.bindings;
        if (emitter.destroyed || world.destroyed || !descendant(emitter, world))
            throw new Error('Particle space hosts must be live and world must contain emitter');
        for (const item of this.owned) {
            if (item.container.destroyed || item.container.parent !== item.parent || descendant(emitter, item.container))
                throw new Error('Owned particle space hierarchy changed');
            item.container.updateLocalTransform();
            if (!same(affine(item.container.localTransform), item.expected))
                throw new Error('Owned particle space transform changed');
        }
        const worldMatrix = world.getGlobalTransform(new Matrix(), false);
        affine(worldMatrix);
        const emitterMatrix = emitter.getGlobalTransform(new Matrix(), false);
        affine(emitterMatrix);
        return affine(worldMatrix.invert().append(emitterMatrix));
    }
    sample() {
        if (this.cached)
            return this.cached;
        const transform = this.read();
        for (const item of this.owned) {
            const pose = item.mode === 'local' ? transform : identity;
            item.container.setFromMatrix(new Matrix(pose.a, pose.b, pose.c, pose.d, pose.tx, pose.ty));
            item.container.updateLocalTransform();
            item.expected = affine(item.container.localTransform);
        }
        return transform;
    }
    begin() { this.cached = this.sample(); }
    end() { this.cached = undefined; }
    environment() { return { gravity: this.gravity, getEmitterTransform: () => this.sample() }; }
    attach(container, mode, parent = this.bindings.world) {
        const transform = this.sample();
        if (descendant(this.bindings.emitter, container))
            throw new Error('Emitter cannot be in the owned particle tree');
        const pose = mode === 'local' ? transform : identity;
        container.setFromMatrix(new Matrix(pose.a, pose.b, pose.c, pose.d, pose.tx, pose.ty));
        parent.addChild(container);
        container.updateLocalTransform();
        this.owned.push({ container, parent, mode, expected: affine(container.localTransform) });
    }
}
export function createPixiParticleSpaceRuntime(options, mains) {
    const gravity = 'gravity' in options ? snapshotParticleVector2(options.gravity) : undefined;
    if ('gravity' in options && !('space' in options))
        throw new TypeError('Pixi gravity requires space');
    if (mains.some(main => main.simulationSpace === 'world' || (main.gravityModifier ?? 0) !== 0) && !('space' in options))
        throw new TypeError('World simulation or nonzero gravityModifier requires space');
    if (mains.some(main => (main.gravityModifier ?? 0) !== 0) && !('gravity' in options))
        throw new TypeError('Nonzero gravityModifier requires explicit gravity');
    if ('space' in options)
        return new PixiParticleSpaceRuntime(options.space, gravity);
    return undefined;
}

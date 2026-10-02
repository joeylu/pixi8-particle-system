import { Container, Matrix } from 'pixi.js';
import type { ParticleAffineTransform, ParticleVector2 } from '../core/contracts.js';
import { environmentObject, snapshotParticleAffineTransform, snapshotParticleVector2 } from '../core/environment.js';
import type { ParticleEffectEnvironment } from '../composition/contracts.js';

export interface PixiParticleSpaceBindings { emitter: Container; world: Container }
export interface PixiParticleSpaceOptions { space?: PixiParticleSpaceBindings; gravity?: ParticleVector2 }
type SpaceMain = { simulationSpace?: 'local' | 'world'; gravityModifier?: number };
const identity = Object.freeze({ a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 });
function affine(matrix: Matrix): ParticleAffineTransform {
  return snapshotParticleAffineTransform({ a: matrix.a, b: matrix.b, c: matrix.c, d: matrix.d, tx: matrix.tx, ty: matrix.ty });
}
function descendant(node: Container, ancestor: Container): boolean {
  for (let current: Container | null = node; current; current = current.parent) if (current === ancestor) return true;
  return false;
}
function same(a: ParticleAffineTransform, b: ParticleAffineTransform): boolean {
  return (['a', 'b', 'c', 'd', 'tx', 'ty'] as const).every(key => Math.abs(a[key] - b[key]) <= 32 * Number.EPSILON * Math.max(1, Math.abs(a[key]), Math.abs(b[key])));
}

/** Coordinates host transforms while retaining ownership only of output poses. */
export class PixiParticleSpaceRuntime {
  readonly gravity: ParticleVector2;
  private readonly owned: { container: Container; parent: Container; mode: 'local' | 'world'; expected: ParticleAffineTransform }[] = [];
  private cached: ParticleAffineTransform | undefined;
  constructor(readonly bindings: PixiParticleSpaceBindings, gravity?: ParticleVector2) {
    const input = environmentObject(bindings, ['emitter', 'world'], ['emitter', 'world'], 'space');
    if (!(input.emitter instanceof Container) || !(input.world instanceof Container)) throw new TypeError('space emitter and world must be Containers');
    this.bindings = Object.freeze({ emitter: input.emitter, world: input.world });
    this.gravity = snapshotParticleVector2(gravity ?? { x: 0, y: 0 });
    this.read();
  }
  private read(): ParticleAffineTransform {
    const { emitter, world } = this.bindings;
    if (emitter.destroyed || world.destroyed || !descendant(emitter, world)) throw new Error('Particle space hosts must be live and world must contain emitter');
    for (const item of this.owned) {
      if (item.container.destroyed || item.container.parent !== item.parent || descendant(emitter, item.container)) throw new Error('Owned particle space hierarchy changed');
      item.container.updateLocalTransform();
      if (!same(affine(item.container.localTransform), item.expected)) throw new Error('Owned particle space transform changed');
    }
    const worldMatrix = world.getGlobalTransform(new Matrix(), false);
    affine(worldMatrix);
    const emitterMatrix = emitter.getGlobalTransform(new Matrix(), false);
    affine(emitterMatrix);
    return affine(worldMatrix.invert().append(emitterMatrix));
  }
  sample(): ParticleAffineTransform {
    if (this.cached) return this.cached;
    const transform = this.read();
    for (const item of this.owned) {
      const pose = item.mode === 'local' ? transform : identity;
      item.container.setFromMatrix(new Matrix(pose.a, pose.b, pose.c, pose.d, pose.tx, pose.ty));
      item.container.updateLocalTransform();
      item.expected = affine(item.container.localTransform);
    }
    return transform;
  }
  begin(): void { this.cached = this.sample(); }
  end(): void { this.cached = undefined; }
  environment(): ParticleEffectEnvironment { return { gravity: this.gravity, getEmitterTransform: () => this.sample() }; }
  attach(container: Container, mode: 'local' | 'world', parent = this.bindings.world): void {
    const transform = this.sample();
    if (descendant(this.bindings.emitter, container)) throw new Error('Emitter cannot be in the owned particle tree');
    const pose = mode === 'local' ? transform : identity;
    container.setFromMatrix(new Matrix(pose.a, pose.b, pose.c, pose.d, pose.tx, pose.ty));
    parent.addChild(container);
    container.updateLocalTransform();
    this.owned.push({ container, parent, mode, expected: affine(container.localTransform) });
  }
}

export function createPixiParticleSpaceRuntime(options: PixiParticleSpaceOptions, mains: readonly SpaceMain[]): PixiParticleSpaceRuntime | undefined {
  const gravity = 'gravity' in options ? snapshotParticleVector2(options.gravity) : undefined;
  if ('gravity' in options && !('space' in options)) throw new TypeError('Pixi gravity requires space');
  if (mains.some(main => main.simulationSpace === 'world' || (main.gravityModifier ?? 0) !== 0) && !('space' in options)) throw new TypeError('World simulation or nonzero gravityModifier requires space');
  if (mains.some(main => (main.gravityModifier ?? 0) !== 0) && !('gravity' in options)) throw new TypeError('Nonzero gravityModifier requires explicit gravity');
  if ('space' in options) return new PixiParticleSpaceRuntime(options.space!, gravity);
  return undefined;
}

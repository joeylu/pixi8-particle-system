import test from 'node:test';
import assert from 'node:assert/strict';
import { createParticleEffect } from '../dist/runtime/composition/createParticleEffect.js';
import { createConstantRateEmission } from '../dist/runtime/modules/ConstantRateEmission.js';
import { createParticleFrameSelector } from '../dist/runtime/entity/createParticleFrameSelector.js';
import { curveSnapshot, evaluateCurve } from '../dist/runtime/composition/curves.js';
import { createPixiParticleEntity } from '../dist/runtime/pixi/createPixiParticleEntity.js';
import { Container, Texture, TextureSource } from 'pixi.js';
import { ParticleSystem } from '../dist/runtime/core/ParticleSystem.js';
import { compileParticleEffectConfig } from '../dist/runtime/composition/compileParticleEffectConfig.js';

const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test('kill stop reports current death age/time once, synchronizes membership and preserves original observer error', () => {
  const deaths = []; const frames = [];
  const compiled = compileParticleEffectConfig({ main: { startLifetime: 5 }, emission: { rateOverTime: 10 } });
  const observer = () => ({ id: 'death-check', onDeath(p, ctx) { deaths.push([p.birthId, p.ageSeconds, ctx.timeSeconds]); }, reset() {}, destroy() {}, hasPendingWork() { return false; } });
  const system = new ParticleSystem({ ...compiled, observers: [observer], renderer: () => ({ sync(s) { frames.push([s.particles.length, s.membershipVersion]); }, destroy() {} }) });
  system.emit(2); system.update(.25); const previousVersion = frames.at(-1)[1];
  assert.throws(() => system.stop({ killParticles: undefined }), /boolean/); assert.equal(system.particleCount, 2);
  system.stop({ killParticles: true }); assert.equal(system.particleCount, 0); assert.equal(system.state, 'stopped');
  assert.equal(frames.at(-1)[0], 0); assert.equal(frames.at(-1)[1], previousVersion + 2);
  assert.deepEqual(deaths.map(d => d.slice(1)), [[.25, .25], [.25, .25]]);
  system.stop({ killParticles: true }); assert.equal(deaths.length, 2); system.update(1); assert.equal(system.particleCount, 0); system.destroy();
  const original = new Error('death failed');
  const bad = new ParticleSystem({ ...compileParticleEffectConfig({ main: { startLifetime: 5 } }), observers: [() => ({ ...observer(), onDeath() { throw original; } })], renderer: () => ({ sync() {}, destroy() {} }) });
  bad.emit(1); assert.throws(() => bad.stop({ killParticles: true }), e => e === original); assert.equal(bad.error, original); assert.equal(bad.state, 'faulted'); bad.destroy();
});

async function projectileEntity(dieWithParticles = false) {
  const source = new TextureSource({ width: 8, height: 8 }); const texture = new Texture({ source });
  const world = new Container(), emitter = new Container(); world.addChild(emitter);
  const entity = await createPixiParticleEntity({ space: { emitter, world }, resolveTexture: () => texture, config: { schemaVersion: 1, id: 'projectile',
    textureSets: [{ id: 'body', textures: [{ asset: 'body' }] }, { id: 'trail', textures: [{ asset: 'trail' }] }],
    layers: [{ id: 'head', main: { startLifetime: 2, startSpeed: 0 }, modules: { emission: { duration: 0, bursts: [{ time: 0, count: 1 }] }, trails: { worldSpace: true, dieWithParticles, lifetime: .25, minVertexDistance: 1 } }, renderer: { textureSet: 'body', selection: { mode: 'single' }, trail: { textureSet: 'trail' } } },
      { id: 'smoke', main: { startLifetime: .5, simulationSpace: 'world' }, modules: { emission: { duration: 0, bursts: [{ time: 0, count: 1 }] } }, renderer: { textureSet: 'body', selection: { mode: 'single' } } }] } });
  return { entity, world, emitter, cleanup() { entity.destroy(); world.destroy({ children: true }); texture.destroy(true); } };
}

test('selected head death keeps world trail at current hit endpoint while other smoke drains', async () => {
  const run = await projectileEntity(); const { entity, emitter } = run;
  entity.play(); emitter.x = 10; entity.update(.1); emitter.x = 20;
  const head = entity.layers[0];
  for (const options of [{ killLayerIds: ['head', 'missing'] }, { killLayerIds: ['head', 'head'] }, { killLayerIds: undefined }, { unknown: 1 }]) {
    assert.throws(() => entity.stop(options)); assert.equal(entity.particleCount, 2); assert.equal(entity.state, 'draining');
  }
  let samples = 0; const globalTransform = emitter.getGlobalTransform;
  emitter.getGlobalTransform = function (...args) { samples++; return globalTransform.apply(this, args); };
  entity.stop({ killLayerIds: ['head'] });
  assert.equal(samples, 1); emitter.getGlobalTransform = globalTransform;
  assert.equal(head.container.particleChildren.length, 0); assert.equal(entity.layers[1].container.particleChildren.length, 1);
  const mesh = head.trailContainer.children[0]; assert.ok(mesh.visible);
  const xs = Array.from(mesh.geometry.positions).filter((_, i) => i % 2 === 0); assert.ok(xs.includes(20)); assert.equal(Math.max(...xs), 20);
  entity.stop({ killLayerIds: ['head'] }); assert.equal(entity.particleCount, 1);
  entity.update(.41); assert.equal(entity.particleCount, 0); assert.equal(entity.state, 'draining');
  entity.update(.1); assert.equal(entity.state, 'stopped'); assert.equal(head.trailContainer.children.length, 0); run.cleanup();
});

test('paused selected death freezes retained trails and resumes draining; dieWithParticles clears immediately', async () => {
  const retained = await projectileEntity(); retained.entity.play(); retained.emitter.x = 10; retained.entity.update(.1); retained.entity.pause();
  retained.entity.stop({ killLayerIds: ['head', 'smoke'] }); assert.equal(retained.entity.state, 'paused'); assert.equal(retained.entity.particleCount, 0);
  retained.entity.stop({ killLayerIds: ['head'] }); retained.entity.update(1); assert.ok(retained.entity.layers[0].trailContainer.children.length);
  retained.entity.resume(); assert.equal(retained.entity.state, 'draining'); retained.entity.update(.6); assert.equal(retained.entity.state, 'stopped'); retained.cleanup();
  const dies = await projectileEntity(true); dies.entity.play(); dies.emitter.x = 10; dies.entity.update(.1); dies.entity.pause();
  dies.entity.stop({ killLayerIds: ['head', 'smoke'] }); assert.equal(dies.entity.state, 'stopped'); assert.equal(dies.entity.layers[0].trailContainer.children.length, 0); dies.cleanup();
});

test('default entity stop preserves the live head until natural lifetime', async () => {
  const run = await projectileEntity(); run.entity.play(); run.entity.stop(); assert.equal(run.entity.particleCount, 2);
  run.entity.update(.6); assert.equal(run.entity.layers[0].container.particleChildren.length, 1); run.cleanup();
});
function effect(config) {
  let particles = [];
  const runtime = createParticleEffect({ ...config, renderer: () => ({
    sync(snapshot) { particles = snapshot.particles.map(p => ({ ...p, lifetimeSeconds: p.lifetimeSeconds, ageSeconds: p.ageSeconds, data: { ...p.data } })); return undefined; },
    destroy() { return undefined; },
  }) });
  return { system: runtime, particles: () => particles };
}

test('ranged lifetime, alpha, rotation and inward annulus replay identically after reset', () => {
  const run = effect({ main: { maxParticles: 12, randomSeed: 123, startLifetime: { min: 1, max: 2 }, startSpeed: { min: 4, max: 9 }, startAlpha: { min: .2, max: .8 }, startScale: 2, startScaleAspect: { x: 2, y: .5 } },
    shape: { shapeType: 'circle', radius: 10, innerRadius: 5, directionMode: 'inward' }, rotationOverLifetime: { z: { min: -2, max: 2 } } });
  run.system.emit(12);
  const initial = run.particles();
  assert.equal(initial.length, 12);
  for (const p of initial) {
    assert.ok(p.lifetimeSeconds >= 1 && p.lifetimeSeconds <= 2);
    assert.ok(p.alpha >= .2 && p.alpha <= .8);
    assert.ok(Math.hypot(p.x, p.y) >= 5 && Math.hypot(p.x, p.y) <= 10);
    assert.ok(p.x * p.vx + p.y * p.vy < 0);
    near(p.scaleX, 4); near(p.scaleY, 1);
  }
  assert.ok(new Set(initial.map(p => p.lifetimeSeconds)).size > 1);
  run.system.update(.25); const updated = run.particles();
  assert.ok(new Set(updated.map(p => p.rotation)).size > 1);
  run.system.reset(); run.system.emit(12); assert.deepEqual(run.particles(), initial);
  run.system.update(.25); assert.deepEqual(run.particles(), updated);
  run.system.update(2); assert.equal(run.system.state, 'stopped'); assert.equal(run.system.particleCount, 0);
  run.system.destroy();
});

test('appearance curves apply at birth and interpolate RGB, size and alpha', () => {
  const run = effect({ main: { startLifetime: 2, startScale: 4, startAlpha: .8 },
    sizeOverLifetime: { scaleCurve: [{ t: 0, value: .5 }, { t: .5, value: 2 }, { t: 1, value: 0 }] },
    colorOverLifetime: { alphaCurve: [{ t: 0, value: .25 }, { t: 1, value: 1 }], colorCurve: [{ t: 0, value: 0xff0000 }, { t: 1, value: 0x0000ff }] } });
  run.system.emit(1); near(run.particles()[0].scaleX, 2); near(run.particles()[0].alpha, .2);
  assert.equal(run.particles()[0].tint, 0xff0000);
  run.system.update(1); const p = run.particles()[0]; near(p.scaleX, 8); near(p.alpha, .5); assert.equal(p.tint, 0x800080);
  assert.throws(() => curveSnapshot([{ t: .1, value: 1 }, { t: 1, value: 2 }], 'curve'));
  assert.throws(() => curveSnapshot([{ t: 0, value: 1 }, { t: 0, value: 2 }], 'curve'));
  assert.throws(() => curveSnapshot([{ t: 0, value: .5 }, { t: 1, value: 1 }], 'color', 0xffffff));
  near(evaluateCurve(curveSnapshot([{ t: 0, value: 0 }, { t: 1, value: 2 }], 'curve'), .25), .5);
  run.system.destroy();
});

test('drag plus constant force agrees with analytic motion and subdivision', () => {
  const config = { main: { startLifetime: 3, startSpeed: 10 }, shape: { type: 'point' }, forceOverLifetime: { x: 4, y: 2 }, limitVelocityOverLifetime: { drag: 2 } };
  const whole = effect(config), split = effect(config);
  whole.system.emit(1); split.system.emit(1); whole.system.update(1); for (let n = 0; n < 10; n++) split.system.update(.1);
  const p = whole.particles()[0], q = split.particles()[0], h = (1 - Math.exp(-2)) / 2, j = (1 - h) / 2;
  near(p.x, 10 * h + 4 * j); near(p.y, 2 * j); near(p.vx, 10 * Math.exp(-2) + 4 * h);
  for (const key of ['x', 'y', 'vx', 'vy']) near(p[key], q[key]);
  whole.system.destroy(); split.system.destroy();
});

test('emission delay, half-open windows, loop bursts, reset and birth budgets', () => {
  const factory = createConstantRateEmission({ rateOverTime: 2, startDelay: .5, duration: 1, loop: true, bursts: [{ time: 0, count: 2 }, { time: .5, count: 1 }] });
  const emitter = factory();
  const plan = (start, end, budget = 20) => emitter.plan({ startTimeSeconds: start, endTimeSeconds: end, dtSeconds: end - start, maxBirths: budget });
  assert.deepEqual(plan(0, 0), []); assert.deepEqual(plan(0, .5), [{ offsetSeconds: .5, count: 2 }]);
  assert.deepEqual(plan(.5, 1), [{ offsetSeconds: .5, count: 2 }]);
  assert.deepEqual(plan(1, 1.5), [{ offsetSeconds: .5, count: 2 }]);
  emitter.reset(); assert.deepEqual(plan(0, .5), [{ offsetSeconds: .5, count: 2 }]);
  emitter.reset(); assert.throws(() => plan(0, .5, 1), /Birth budget exceeded/);
  assert.throws(() => createConstantRateEmission({ duration: 1, bursts: [{ time: 1, count: 1 }] }), /outside emission window/);
});

test('finite emission starts zero-time bursts and drains to stopped without duplicate endpoints', () => {
  const run = effect({ main: { maxParticles: 10, startLifetime: .2 }, emission: { duration: 1, rateOverTime: 2, bursts: [{ time: 0, count: 2 }] } });
  run.system.play(); assert.equal(run.system.particleCount, 2); assert.equal(run.system.state, 'playing'); assert.equal(run.system.hasPendingWork, true);
  run.system.update(.5); assert.equal(run.system.particleCount, 1); assert.equal(run.system.state, 'draining');
  run.system.update(.2); assert.equal(run.system.state, 'stopped'); assert.equal(run.system.hasPendingWork, false);
  run.system.play(); assert.equal(run.system.particleCount, 2); run.system.stop(); assert.equal(run.system.state, 'draining'); run.system.update(.2); assert.equal(run.system.state, 'stopped');
  run.system.destroy();
});

test('delayed emission remains pending with no active particles and completes its last burst', () => {
  const run = effect({ main: { startLifetime: .25 }, emission: { startDelay: 1, duration: 0, bursts: [{ time: 0, count: 1 }] } });
  run.system.play(); assert.equal(run.system.particleCount, 0); assert.equal(run.system.hasPendingWork, true);
  run.system.update(.5); assert.equal(run.system.state, 'playing'); assert.equal(run.system.particleCount, 0);
  run.system.update(.5); assert.equal(run.system.state, 'draining'); assert.equal(run.system.particleCount, 1);
  run.system.update(.25); assert.equal(run.system.state, 'stopped'); assert.equal(run.system.hasPendingWork, false);
  run.system.destroy();
});

test('frame clips, restricted random frames and randomized sequence phase remain deterministic', () => {
  const sequence = createParticleFrameSelector({ mode: 'sequence', fps: 2, loop: false, clips: [[3, 1]] }, 4, 10);
  assert.equal(sequence(0, 0), 3); assert.equal(sequence(0, .5), 1); assert.equal(sequence(0, 10), 1);
  const random = createParticleFrameSelector({ mode: 'random', indices: [1, 3] }, 4, 10);
  for (let i = 0; i < 20; i++) { assert.ok([1, 3].includes(random(i, 0))); assert.equal(random(i, 0), random(i, 10)); }
  const selection = { mode: 'sequence', fps: { min: 2, max: 5 }, loop: true, clips: [[0, 1], [3, 2]], randomStartFrame: true };
  const a = createParticleFrameSelector(selection, 4, 93), b = createParticleFrameSelector(selection, 4, 93);
  for (let i = 0; i < 20; i++) for (const t of [0, .25, 2]) assert.equal(a(i, t), b(i, t));
  assert.throws(() => createParticleFrameSelector({ mode: 'sequence', fps: 1, randomStartFrame: true }, 4), /requires loop/);
  assert.throws(() => createParticleFrameSelector({ mode: 'sequence', fps: 1, clips: [[1, 1]] }, 4), /ordinal/);
  assert.throws(() => createParticleFrameSelector({ mode: 'random', indices: [4] }, 4), /ordinal/);
});

test('Pixi entity forwards velocity alignment and trails and cleans up owned views', async () => {
  const source = new TextureSource({ width: 8, height: 8 }); const texture = new Texture({ source });
  const entity = await createPixiParticleEntity({ resolveTexture: () => texture, config: { schemaVersion: 1, id: 'effect',
    textureSets: [{ id: 'frames', textures: [{ asset: 'sprite' }] }, { id: 'trail', textures: [{ asset: 'trail' }] }],
    layers: [{ id: 'layer', main: { startLifetime: .4, startSpeed: 2 }, modules: {
      emission: { duration: 0, bursts: [{ time: 0, count: 1 }] }, shape: { type: 'point', directionRadians: Math.PI / 2 },
      textureSheetAnimation: { selectionMode: 'single' }, trails: {},
    }, renderer: { textureSet: 'frames', alignment: 'velocity', forwardAngle: .2, trail: { textureSet: 'trail' } } }] } });
  entity.play(); assert.equal(entity.particleCount, 1); assert.ok(entity.layers[0].trailContainer);
  near(entity.layers[0].container.particleChildren[0].rotation, Math.PI / 2 - .2);
  entity.update(.1); assert.ok(entity.layers[0].trailContainer.children.length > 0);
  const frameContainer = entity.layers[0].container, trailContainer = entity.layers[0].trailContainer;
  entity.destroy(); assert.equal(entity.state, 'destroyed'); assert.equal(frameContainer.destroyed, true); assert.equal(trailContainer.destroyed, true);
  assert.equal(texture.destroyed, false); assert.equal(source.destroyed, false); texture.destroy(true);
});

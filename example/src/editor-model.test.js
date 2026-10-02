import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compileParticleEffectConfig } from 'geminant-particles/core';
import { ASSETS, PRESETS, createPreset, toRuntimeConfig } from './editor-model.js';

test('all four independent presets pass real SDK compilation', () => {
  for (const preset of PRESETS) {
    const state = createPreset(preset.id);
    const snapshot = structuredClone(state);
    const config = toRuntimeConfig(state);
    assert.equal(config.textureId, preset.textureId);
    assert.doesNotThrow(() => compileParticleEffectConfig(config.effect));
    assert.deepEqual(state, snapshot);
    state.main.startSpeed.min = 999;
    assert.notEqual(createPreset(preset.id).main.startSpeed.min, 999);
  }
  assert.throws(() => createPreset('missing'), /Unknown preset/);
});

test('all copied assets have actual PNG dimensions matching catalog', () => {
  assert.equal(ASSETS.length, 11);
  assert.equal(new Set(ASSETS.map((asset) => asset.id)).size, 11);
  for (const asset of ASSETS) {
    const bytes = readFileSync(new URL(asset.url));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(bytes.readUInt32BE(16), asset.width);
    assert.equal(bytes.readUInt32BE(20), asset.height);
  }
});

test('degrees, RGB, signed force and world gravity convert without mutation', () => {
  const state = createPreset();
  state.enabled.force = true; state.enabled.rotation = true; state.enabled.trails = true;
  state.main.startRotation = { min: -180, max: 180 };
  state.rotation.degreesPerSecond = -90;
  state.force = { x: -8, y: -12 }; state.scene.gravityY = -300;
  const config = toRuntimeConfig(state);
  assert.deepEqual(config.effect.main.startRotation, { min: -Math.PI, max: Math.PI });
  assert.equal(config.effect.shape.directionRadians, -Math.PI / 2);
  assert.equal(config.effect.rotationOverLifetime.z, -Math.PI / 2);
  assert.equal(config.effect.main.startTint, 0xffbf69);
  assert.deepEqual(config.effect.forceOverLifetime, state.force);
  assert.deepEqual(config.gravity, { x: 0, y: -300 });
  assert.equal(config.trail.tint, 0xffbc70);
  assert.equal(config.effect.trails.textureMode, 'stretch');
});

test('disabled groups are omitted and geometry only includes applicable fields', () => {
  const state = createPreset();
  for (const key of Object.keys(state.enabled)) state.enabled[key] = false;
  const config = toRuntimeConfig(state);
  assert.deepEqual(Object.keys(config.effect), ['main']);
  assert.equal('trail' in config, false);
  assert.equal(state.shape.radius, 12);
  state.enabled.shape = true;
  for (const shapeType of ['point', 'circle', 'rectangle']) {
    state.shape.shapeType = shapeType;
    const shape = toRuntimeConfig(state).effect.shape;
    assert.equal('radius' in shape, shapeType === 'circle');
    assert.equal('width' in shape, shapeType === 'rectangle');
    assert.equal('height' in shape, shapeType === 'rectangle');
  }
});

test('invalid ranges, scalar values, flags, enums and trails reject descriptively', () => {
  const cases = [
    ['main.startSpeed.min', 200, /startSpeed.min/],
    ['main.startScale.max', NaN, /startScale.max/],
    ['main.startLifetime', 0, /startLifetime/],
    ['main.maxParticles', 2.5, /maxParticles/],
    ['main.randomSeed', 0x100000000, /randomSeed/],
    ['main.startTint', '#123', /startTint/],
    ['main.simulationSpace', 'screen', /simulationSpace/],
    ['enabled.force', 1, /enabled.force/],
    ['emission.burstCount', 1201, /burstCount/],
    ['emission.rateOverTime', -1, /rateOverTime/],
    ['shape.spreadDegrees', 361, /spreadDegrees/],
    ['force.x', Infinity, /force.x/],
    ['color.endAlphaFactor', 2, /endAlphaFactor/],
    ['renderer.texture', 'missing', /renderer.texture/],
    ['renderer.trailBlendMode', 'multiply', /trailBlendMode/],
    ['renderer.trailAlpha', -1, /trailAlpha/],
    ['trails.breakDistance', 1, /breakDistance/],
    ['trails.maxPointsPerTrail', 1, /maxPointsPerTrail/],
    ['trails.worldSpace', 'true', /worldSpace/],
    ['scene.background', 'red', /background/],
    ['scene.timeScale', 0, /timeScale/],
  ];
  for (const [path, value, error] of cases) {
    const state = createPreset();
    state.enabled.force = true; state.enabled.trails = true;
    const keys = path.split('.');
    const key = keys.pop();
    keys.reduce((object, part) => object[part], state)[key] = value;
    assert.throws(() => toRuntimeConfig(state), error, path);
  }
  const state = createPreset();
  state.enabled.trails = true;
  state.trails.lifetime = Number.MIN_VALUE;
  state.main.startLifetime = Number.MIN_VALUE;
  assert.throws(() => toRuntimeConfig(state), /Trails TTL/);
  state.enabled.trails = false;
  state.main.startLifetime = 1;
  state.emission.rateOverTime = Number.MIN_VALUE;
  assert.throws(() => toRuntimeConfig(state), /Birth interval/);
});

test('invalid optional module values stop blocking when disabled and reject again when enabled', () => {
  const cases = [
    ['emission', 'emission', 'rateOverTime', -1, 'emission'],
    ['shape', 'shape', 'spreadDegrees', 361, 'shape'],
    ['force', 'force', 'x', Infinity, 'forceOverLifetime'],
    ['color', 'color', 'endTint', 'bad', 'colorOverLifetime'],
    ['size', 'size', 'endScaleFactor', -1, 'sizeOverLifetime'],
    ['rotation', 'rotation', 'degreesPerSecond', NaN, 'rotationOverLifetime'],
    ['trails', 'trails', 'width', 0, 'trails'],
    ['trails', 'renderer', 'trailTexture', 'missing', 'trails'],
    ['trails', 'renderer', 'trailTint', 'bad', 'trails'],
    ['trails', 'renderer', 'trailAlpha', -1, 'trails'],
    ['trails', 'renderer', 'trailBlendMode', 'multiply', 'trails'],
  ];
  for (const [module, group, key, value, outputKey] of cases) {
    const state = createPreset();
    state.enabled[module] = true; state[group][key] = value;
    assert.throws(() => toRuntimeConfig(state));
    state.enabled[module] = false;
    const config = toRuntimeConfig(state);
    assert.equal(outputKey in config.effect, false);
    if (module === 'trails') assert.equal('trail' in config, false);
    assert.equal(state[group][key], value);
    state.enabled[module] = true;
    assert.throws(() => toRuntimeConfig(state));
  }
  const state = createPreset();
  state.enabled.emission = false; state.emission.burstCount = 1201;
  assert.throws(() => toRuntimeConfig(state), /burstCount/);
});

import { compileParticleEffectConfig } from 'geminant-particles/core';

export const ASSETS = [
  { id: 'fire.spark', label: 'Spark', family: 'fire', url: new URL('./assets/particles/fire/fire-spark.png', import.meta.url).href, width: 64, height: 64 },
  { id: 'fire.ember', label: 'Ember', family: 'fire', url: new URL('./assets/particles/fire/fire-ember.png', import.meta.url).href, width: 64, height: 64 },
  { id: 'fire.smoke', label: 'Light smoke', family: 'fire', url: new URL('./assets/particles/fire/fire-smoke.png', import.meta.url).href, width: 96, height: 96 },
  { id: 'water.drop', label: 'Drop', family: 'water', url: new URL('./assets/particles/water/water-drop.png', import.meta.url).href, width: 64, height: 64 },
  { id: 'water.foam', label: 'Foam', family: 'water', url: new URL('./assets/particles/water/water-foam.png', import.meta.url).href, width: 64, height: 64 },
  { id: 'water.splash', label: 'Splash', family: 'water', url: new URL('./assets/particles/water/water-splash.png', import.meta.url).href, width: 96, height: 96 },
  { id: 'smoke.puff', label: 'Puff', family: 'smoke', url: new URL('./assets/particles/smoke/smoke-puff.png', import.meta.url).href, width: 96, height: 96 },
  { id: 'smoke.soft', label: 'Soft cloud', family: 'smoke', url: new URL('./assets/particles/smoke/smoke-soft.png', import.meta.url).href, width: 128, height: 128 },
  { id: 'dust.dot', label: 'Dust dot', family: 'dust', url: new URL('./assets/particles/dust/dust-dot.png', import.meta.url).href, width: 64, height: 64 },
  { id: 'dust.chip', label: 'Debris chip', family: 'dust', url: new URL('./assets/particles/dust/dust-chip.png', import.meta.url).href, width: 64, height: 64 },
  { id: 'dust.puff', label: 'Dust puff', family: 'dust', url: new URL('./assets/particles/dust/dust-puff.png', import.meta.url).href, width: 96, height: 96 },
];

export const PRESETS = [
  { id: 'embers', label: 'Embers', description: 'Warm sparks rising and fading', textureId: 'fire.spark' },
  { id: 'water', label: 'Water fountain', description: 'Cool droplets in a gravity arc', textureId: 'water.drop' },
  { id: 'smoke', label: 'Soft smoke', description: 'Slow clouds expanding upward', textureId: 'smoke.soft' },
  { id: 'dust', label: 'Dust & debris', description: 'Spinning fragments falling away', textureId: 'dust.chip' },
];

export function createPreset(id = 'embers') {
  if (!PRESETS.some((preset) => preset.id === id)) throw new Error(`Unknown preset: ${id}`);
  const state = {
    preset: id,
    enabled: { emission: true, shape: true, force: false, color: true, size: true, rotation: false, trails: false },
    main: { maxParticles: 1200, maxBirthsPerUpdate: 1200, startLifetime: 2.5,
      startSpeed: { min: 50, max: 160 }, startScale: { min: 0.12, max: 0.3 },
      startRotation: { min: -30, max: 30 }, startTint: '#ffbf69', startAlpha: 0.9,
      randomSeed: 8, simulationSpace: 'world', gravityModifier: 0 },
    emission: { rateOverTime: 90, burstCount: 40 },
    shape: { shapeType: 'circle', radius: 12, width: 60, height: 20, offsetX: 0, offsetY: 0, directionDegrees: -90, spreadDegrees: 55 },
    force: { x: 0, y: -12 },
    color: { endTint: '#df5e26', endAlphaFactor: 0 },
    size: { endScaleFactor: 0.1 },
    rotation: { degreesPerSecond: 45 },
    trails: { lifetime: 0.25, minVertexDistance: 4, width: 3, maxPointsPerTrail: 32, maxTrails: 2400, breakDistance: 256, worldSpace: false, dieWithParticles: true },
    renderer: { texture: 'fire.spark', blendMode: 'add', trailTexture: 'fire.spark', trailTint: '#ffbc70', trailAlpha: 0.35, trailBlendMode: 'add' },
    scene: { gravityX: 0, gravityY: 300, background: '#10151d', grid: true, followPointer: false, timeScale: 1 },
  };
  if (id === 'water') {
    Object.assign(state.main, { startLifetime: 2, startSpeed: { min: 220, max: 310 }, startScale: { min: 0.12, max: 0.23 }, startTint: '#b5e9ff', gravityModifier: 1 });
    Object.assign(state.shape, { radius: 6, spreadDegrees: 36 });
    Object.assign(state.emission, { rateOverTime: 75, burstCount: 50 });
    state.color.endTint = '#5ab9ee'; state.size.endScaleFactor = 0.55;
    Object.assign(state.renderer, { texture: 'water.drop', blendMode: 'normal', trailTexture: 'water.drop', trailTint: '#9fdcff', trailBlendMode: 'normal' });
  } else if (id === 'smoke') {
    Object.assign(state.main, { startLifetime: 4, startSpeed: { min: 18, max: 42 }, startScale: { min: 0.2, max: 0.4 }, startRotation: { min: -180, max: 180 }, startTint: '#bdc7d0', startAlpha: 0.32 });
    Object.assign(state.emission, { rateOverTime: 18, burstCount: 12 });
    Object.assign(state.shape, { radius: 16, spreadDegrees: 32 });
    state.enabled.force = true; state.enabled.rotation = true;
    Object.assign(state.force, { x: 5, y: -5 }); state.rotation.degreesPerSecond = 12;
    state.color.endTint = '#697785'; state.size.endScaleFactor = 3.5;
    Object.assign(state.renderer, { texture: 'smoke.soft', blendMode: 'normal', trailTexture: 'smoke.soft', trailTint: '#bdc7d0', trailBlendMode: 'normal' });
  } else if (id === 'dust') {
    Object.assign(state.main, { startLifetime: 1.6, startSpeed: { min: 110, max: 210 }, startScale: { min: 0.09, max: 0.19 }, startRotation: { min: -180, max: 180 }, startTint: '#d1b996', startAlpha: 0.85, gravityModifier: 1 });
    Object.assign(state.emission, { rateOverTime: 45, burstCount: 55 });
    Object.assign(state.shape, { shapeType: 'rectangle', width: 32, height: 8, spreadDegrees: 120 });
    state.enabled.rotation = true; state.rotation.degreesPerSecond = 240;
    state.color.endTint = '#856649'; state.size.endScaleFactor = 0.25;
    Object.assign(state.renderer, { texture: 'dust.chip', blendMode: 'normal', trailTexture: 'dust.chip', trailTint: '#d1b996', trailBlendMode: 'normal' });
  }
  return state;
}

function number(value, label, min = -Infinity, max = Infinity, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be finite`);
  if (value < min || value > max || (integer && !Number.isSafeInteger(value))) throw new Error(`${label} must be ${integer ? 'an integer ' : ''}in [${min}, ${max}]`);
}
function boolean(value, label) {
  if (typeof value !== 'boolean') throw new Error(`${label} must be boolean`);
}
function choice(value, values, label) {
  if (!values.includes(value)) throw new Error(`${label} must be one of ${values.join(', ')}`);
}
function tint(value, label) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`${label} must be #rrggbb`);
  return Number.parseInt(value.slice(1), 16);
}
const radians = (degrees) => degrees * (Math.PI / 180);
function range(value, label, nonnegative = false, angle = false) {
  if (!value || typeof value !== 'object') throw new Error(`${label} requires min and max`);
  number(value.min, `${label}.min`, nonnegative ? 0 : -Infinity);
  number(value.max, `${label}.max`, nonnegative ? 0 : -Infinity);
  if (value.min > value.max) throw new Error(`${label}.min must be <= max`);
  return { min: angle ? radians(value.min) : value.min, max: angle ? radians(value.max) : value.max };
}

export function toRuntimeConfig(state) {
  if (!state || typeof state !== 'object') throw new Error('Editor state must be an object');
  for (const key of ['enabled', 'main', 'emission', 'shape', 'force', 'color', 'size', 'rotation', 'trails', 'renderer', 'scene']) {
    if (!state[key] || typeof state[key] !== 'object') throw new Error(`${key} must be an object`);
  }
  const { main, emission, shape, force, color, size, rotation, trails, renderer, scene, enabled } = state;
  choice(state.preset, PRESETS.map((preset) => preset.id), 'preset');
  for (const key of ['emission', 'shape', 'force', 'color', 'size', 'rotation', 'trails']) boolean(enabled[key], `enabled.${key}`);
  number(main.maxParticles, 'main.maxParticles', 1, Number.MAX_SAFE_INTEGER, true);
  number(main.maxBirthsPerUpdate, 'main.maxBirthsPerUpdate', 1, Number.MAX_SAFE_INTEGER, true);
  number(main.startLifetime, 'main.startLifetime', Number.MIN_VALUE);
  number(main.randomSeed, 'main.randomSeed', 0, 0xffffffff, true);
  number(main.startAlpha, 'main.startAlpha', 0, 1);
  number(main.gravityModifier, 'main.gravityModifier');
  choice(main.simulationSpace, ['local', 'world'], 'main.simulationSpace');
  const effect = { main: { ...main, startSpeed: range(main.startSpeed, 'main.startSpeed', true), startScale: range(main.startScale, 'main.startScale', true), startRotation: range(main.startRotation, 'main.startRotation', false, true), startTint: tint(main.startTint, 'main.startTint') } };
  if (enabled.emission) number(emission.rateOverTime, 'emission.rateOverTime', 0);
  number(emission.burstCount, 'emission.burstCount', 1, Math.min(main.maxParticles, main.maxBirthsPerUpdate), true);
  if (enabled.shape) {
    choice(shape.shapeType, ['point', 'circle', 'rectangle'], 'shape.shapeType');
    if (shape.shapeType === 'circle') number(shape.radius, 'shape.radius', 0);
    if (shape.shapeType === 'rectangle') for (const key of ['width', 'height']) number(shape[key], `shape.${key}`, 0);
    for (const key of ['offsetX', 'offsetY', 'directionDegrees']) number(shape[key], `shape.${key}`);
    number(shape.spreadDegrees, 'shape.spreadDegrees', 0, 360);
  }
  if (enabled.force) { number(force.x, 'force.x'); number(force.y, 'force.y'); }
  const endTint = enabled.color ? tint(color.endTint, 'color.endTint') : undefined;
  if (enabled.color) number(color.endAlphaFactor, 'color.endAlphaFactor', 0, 1);
  if (enabled.size) number(size.endScaleFactor, 'size.endScaleFactor', 0);
  if (enabled.rotation) number(rotation.degreesPerSecond, 'rotation.degreesPerSecond');
  if (enabled.trails) {
    for (const key of ['lifetime', 'minVertexDistance', 'width', 'breakDistance']) number(trails[key], `trails.${key}`, Number.MIN_VALUE);
    number(trails.maxPointsPerTrail, 'trails.maxPointsPerTrail', 2, Number.MAX_SAFE_INTEGER, true);
    number(trails.maxTrails, 'trails.maxTrails', 1, Number.MAX_SAFE_INTEGER, true);
    boolean(trails.worldSpace, 'trails.worldSpace'); boolean(trails.dieWithParticles, 'trails.dieWithParticles');
    if (trails.breakDistance < trails.minVertexDistance) throw new Error('trails.breakDistance must be >= minVertexDistance');
  }
  choice(renderer.texture, ASSETS.map((asset) => asset.id), 'renderer.texture');
  choice(renderer.blendMode, ['normal', 'add'], 'renderer.blendMode');
  const trailTint = enabled.trails ? tint(renderer.trailTint, 'renderer.trailTint') : undefined;
  if (enabled.trails) {
    choice(renderer.trailTexture, ASSETS.map((asset) => asset.id), 'renderer.trailTexture');
    choice(renderer.trailBlendMode, ['normal', 'add'], 'renderer.trailBlendMode');
    number(renderer.trailAlpha, 'renderer.trailAlpha', 0, 1);
  }
  number(scene.gravityX, 'scene.gravityX'); number(scene.gravityY, 'scene.gravityY');
  tint(scene.background, 'scene.background'); boolean(scene.grid, 'scene.grid'); boolean(scene.followPointer, 'scene.followPointer');
  number(scene.timeScale, 'scene.timeScale', Number.MIN_VALUE);
  if (enabled.emission) effect.emission = { rateOverTime: emission.rateOverTime };
  if (enabled.shape) {
    effect.shape = { shapeType: shape.shapeType, offsetX: shape.offsetX, offsetY: shape.offsetY, directionRadians: radians(shape.directionDegrees), spreadRadians: radians(shape.spreadDegrees) };
    if (shape.shapeType === 'circle') effect.shape.radius = shape.radius;
    if (shape.shapeType === 'rectangle') Object.assign(effect.shape, { width: shape.width, height: shape.height });
  }
  if (enabled.force) effect.forceOverLifetime = { ...force };
  if (enabled.color) effect.colorOverLifetime = { endTint, endAlphaFactor: color.endAlphaFactor };
  if (enabled.size) effect.sizeOverLifetime = { ...size };
  if (enabled.rotation) effect.rotationOverLifetime = { z: radians(rotation.degreesPerSecond) };
  if (enabled.trails) effect.trails = { ...trails, textureMode: 'stretch' };
  compileParticleEffectConfig(effect);
  return { effect, textureId: renderer.texture, blendMode: renderer.blendMode, gravity: { x: scene.gravityX, y: scene.gravityY },
    ...(enabled.trails ? { trail: { textureId: renderer.trailTexture, blendMode: renderer.trailBlendMode, tint: trailTint, alpha: renderer.trailAlpha } } : {}) };
}

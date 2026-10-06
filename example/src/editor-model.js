import { validateParticleEntityConfig } from 'geminant-particles/config';

export const ASSETS = [
  ...[
    ['bolt', 'bolt-head', 128, 64], ['fire-core', 'fire-core', 96, 64],
    ['fire-shell', 'fire-shell', 128, 96], ['meteor', 'meteor-rock', 96, 96],
    ['energy-ribbon', 'energy-ribbon', 128, 64], ['flame-ribbon', 'flame-ribbon', 128, 64],
  ].map(([id, name, width, height]) => ({ id: `projectile.${id}`, label: name.replaceAll('-', ' '), family: 'projectile', format: 'SVG',
    url: new URL(`./assets/projectiles/${name}.svg`, import.meta.url).href, width, height })),
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
  state.id = 'particles'; state.label = PRESETS.find((preset) => preset.id === id).label;
  state.role = 'particle'; state.active = true;
  state.main.startLifetime = { min: state.main.startLifetime, max: state.main.startLifetime };
  state.main.startAlpha = { min: state.main.startAlpha, max: state.main.startAlpha };
  state.main.startScaleAspect = { x: 1, y: 1 };
  state.rotation.degreesPerSecond = { min: state.rotation.degreesPerSecond, max: state.rotation.degreesPerSecond };
  state.enabled.drag = false; state.drag = { drag: 0 };
  Object.assign(state.emission, { startDelay: 0, finite: false, duration: 1, loop: false, bursts: [] });
  Object.assign(state.shape, { innerRadius: 0, directionMode: 'fixed' });
  Object.assign(state.color, { useAlphaCurve: false, alphaCurve: [{ t: 0, value: 1 }, { t: 1, value: 0 }],
    useColorCurve: false, colorCurve: [{ t: 0, value: '#ffffff' }, { t: 1, value: state.color.endTint }] });
  Object.assign(state.size, { useScaleCurve: false, scaleCurve: [{ t: 0, value: 1 }, { t: 1, value: state.size.endScaleFactor }] });
  Object.assign(state.renderer, { alignment: 'fixed', forwardDegrees: 0 });
  delete state.preset;
  delete state.scene;
  return state;
}

export const PROJECTILE_PRESETS = [
  { id: 'energy-bolt', label: 'Energy bolt', description: 'A pointed cyan bolt with a narrow energy ribbon', textureId: 'projectile.bolt' },
  { id: 'fireball', label: 'Fireball', description: 'A white-hot core inside a broad flame shell with sparks', textureId: 'projectile.fire-core' },
  { id: 'meteor', label: 'Meteor', description: 'A solid hot-rimmed rock with broad flame and smoky debris', textureId: 'projectile.meteor' },
];

const pair = (value) => ({ min: value, max: value });
const identity = () => [{ t: 0, value: 1 }, { t: 1, value: 1 }];
const radians = (value) => value * Math.PI / 180;

export function createWorkspace(mode = 'particle', presetId) {
  choice(mode, ['particle', 'projectile'], 'mode');
  const presets = mode === 'particle' ? PRESETS : PROJECTILE_PRESETS;
  const preset = presetId ?? presets[0].id;
  if (!presets.some((entry) => entry.id === preset)) throw new Error(`Unknown preset: ${preset}`);
  let layers;
  if (mode === 'particle') layers = [createPreset(preset)];
  else {
    const material = presets.find((entry) => entry.id === preset).textureId;
    const head = createPreset(preset === 'meteor' ? 'dust' : 'embers');
    Object.assign(head, { id: 'head', label: preset === 'energy-bolt' ? 'Energy bolt head' : preset === 'fireball' ? 'White-hot core' : 'Meteor rock', role: 'head' });
    Object.assign(head.main, { maxParticles: 8, maxBirthsPerUpdate: 8, startLifetime: pair(12),
      startSpeed: pair(0), startScale: pair(preset === 'energy-bolt' ? 0.28 : 0.7),
      startRotation: pair(0), startAlpha: pair(1), simulationSpace: 'local', gravityModifier: 0,
      startTint: preset === 'energy-bolt' ? '#9ceaff' : '#ffb768', startScaleAspect: { x: preset === 'energy-bolt' ? 1.8 : 1, y: preset === 'energy-bolt' ? 0.6 : 1 } });
    Object.assign(head.emission, { rateOverTime: 0, finite: true, duration: 0, bursts: [{ time: 0, count: 1 }], burstCount: 1 });
    head.shape.shapeType = 'point'; head.shape.directionDegrees = 0; head.shape.spreadDegrees = 0;
    head.enabled.force = false; head.enabled.rotation = false; head.enabled.trails = true;
    Object.assign(head.color, { endTint: '#ffffff', endAlphaFactor: 1, useAlphaCurve: true, alphaCurve: identity(),
      useColorCurve: true, colorCurve: [{ t: 0, value: '#ffffff' }, { t: 1, value: '#ffffff' }] });
    Object.assign(head.size, { endScaleFactor: 1, useScaleCurve: true, scaleCurve: identity() });
    Object.assign(head.trails, { lifetime: 0.035, width: preset === 'energy-bolt' ? 10 : 18,
      maxPointsPerTrail: 128, maxTrails: 16, minVertexDistance: 3, worldSpace: true, dieWithParticles: false });
    Object.assign(head.renderer, { texture: material, blendMode: 'add', trailTexture: preset === 'energy-bolt' ? 'smoke.soft' : 'fire.spark',
      trailTint: head.main.startTint, trailAlpha: 0.8, trailBlendMode: 'add' });
    const tail = createPreset(preset === 'energy-bolt' ? 'embers' : 'smoke');
    Object.assign(tail, { id: 'tail', label: preset === 'energy-bolt' ? 'World sparks' : 'World smoke', role: 'tail' });
    Object.assign(tail.main, { simulationSpace: 'world', startLifetime: { min: 0.45, max: preset === 'energy-bolt' ? 0.8 : 1.7 },
      startSpeed: { min: 5, max: 24 }, startScale: { min: 0.13, max: 0.24 }, gravityModifier: 0 });
    Object.assign(tail.emission, { rateOverTime: preset === 'energy-bolt' ? 45 : 28 });
    Object.assign(tail.shape, { radius: 5, directionDegrees: 180, spreadDegrees: 60 });
    tail.force = { x: 0, y: -4 };
    if (preset === 'energy-bolt') {
      tail.renderer.texture = 'smoke.soft'; tail.renderer.blendMode = 'add';
      tail.main.startScale = { min: 0.04, max: 0.08 }; tail.main.startTint = '#9ceaff';
      tail.color.endTint = '#4fa7df';
    }
    if (preset === 'meteor') { tail.renderer.texture = 'dust.puff'; tail.main.startTint = '#9c8065'; }
    if (preset === 'fireball') { tail.renderer.texture = 'fire.smoke'; tail.main.startTint = '#ad8c77'; }
    // Colored projectile art uses neutral tint; the host owns its +X orientation.
    head.main.startTint = '#ffffff';
    head.main.maxParticles = 1; head.main.maxBirthsPerUpdate = 1;
    head.renderer.trailTint = '#ffffff';
    head.renderer.trailTexture = preset === 'energy-bolt' ? 'projectile.energy-ribbon' : 'projectile.flame-ribbon';
    head.main.startScale = pair(preset === 'energy-bolt' ? 60 / 128 : 38 / 96);
    head.main.startScaleAspect = { x: 1, y: preset === 'energy-bolt' ? 2 / 3 : preset === 'fireball' ? 26 / 64 / (38 / 96) : 1 };
    Object.assign(head.trails, { lifetime: (preset === 'energy-bolt' ? 0.28 : 0.2) / 12,
      width: preset === 'energy-bolt' ? 16 : 15, maxTrails: 4 });
    tail.enabled.force = false; tail.enabled.rotation = false;
    tail.emission.burstCount = 0;
    if (preset === 'energy-bolt') {
      tail.renderer.texture = 'smoke.soft'; tail.main.startLifetime = { min: 0.2, max: 0.4 };
      tail.main.startScale = { min: 0.02, max: 0.04 };
      tail.main.startAlpha = pair(0.65); tail.emission.rateOverTime = 12;
      layers = [tail, head];
    } else {
      tail.main.startTint = preset === 'fireball' ? '#51443e' : '#b0a69a';
      tail.main.startAlpha = pair(preset === 'fireball' ? 0.22 : 0.48);
      tail.main.startLifetime = preset === 'fireball' ? { min: 0.6, max: 0.9 } : { min: 1.1, max: 1.5 };
      tail.main.startScale = preset === 'fireball' ? { min: 0.16, max: 0.24 } : { min: 0.24, max: 0.36 };
      tail.renderer.texture = preset === 'fireball' ? 'fire.smoke' : 'smoke.puff';
      tail.emission.rateOverTime = preset === 'fireball' ? 16 : 22;
      tail.color.endTint = preset === 'fireball' ? '#393635' : '#6a6b70';
      tail.size.endScaleFactor = preset === 'fireball' ? 2.4 : 3;
      const fragments = createPreset(preset === 'fireball' ? 'embers' : 'dust');
      Object.assign(fragments, { id: preset === 'fireball' ? 'sparks' : 'debris',
        label: preset === 'fireball' ? 'Fire sparks' : 'Rock fragments', role: 'tail' });
      Object.assign(fragments.main, { startLifetime: preset === 'fireball' ? { min: 0.35, max: 0.65 } : { min: 0.45, max: 0.8 },
        startSpeed: { min: 18, max: 45 }, startScale: { min: 0.045, max: 0.09 }, gravityModifier: 0 });
      Object.assign(fragments.shape, { shapeType: 'circle', radius: 5, directionDegrees: 180, spreadDegrees: 70 });
      Object.assign(fragments.emission, { rateOverTime: preset === 'fireball' ? 14 : 9, burstCount: 0 });
      const shell = structuredClone(head);
      Object.assign(shell, { id: 'shell', label: preset === 'fireball' ? 'Broad flame shell' : 'Meteor flame envelope' });
      shell.renderer.texture = 'projectile.fire-shell'; shell.renderer.trailAlpha = 0.6;
      shell.main.startScale = pair((preset === 'fireball' ? 70 : 80) / 128);
      shell.main.startScaleAspect = { x: 1, y: (preset === 'fireball' ? 52 : 60) / 96 / shell.main.startScale.min };
      shell.main.startAlpha = pair(preset === 'fireball' ? 0.8 : 0.75);
      shell.trails.width = preset === 'fireball' ? 42 : 48;
      shell.trails.lifetime = (preset === 'fireball' ? 0.38 : 0.55) / 12;
      if (preset === 'meteor') { head.enabled.trails = false; head.renderer.blendMode = 'normal'; }
      layers = [tail, fragments, shell, head];
    }
  }
  return { mode, preset, selectedLayerId: layers.at(-1).id,
    scene: { gravityX: 0, gravityY: 300, background: '#10151d', grid: true, followPointer: false, timeScale: 1 },
    host: { speed: mode === 'projectile' ? 320 : 380, loop: mode === 'projectile', loopDelay: mode === 'projectile' ? 0.65 : 0.8, launchFlash: true, impact: true }, layers };
}

export function getSelectedLayer(workspace) {
  return workspace.layers.find((layer) => layer.id === workspace.selectedLayerId) ?? workspace.layers[0];
}

function number(value, label, min = -Infinity, max = Infinity, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isSafeInteger(value))) {
    throw new Error(`${label} must be ${integer ? 'an integer ' : ''}in [${min}, ${max}]`);
  }
  return value;
}
function boolean(value, label) {
  if (typeof value !== 'boolean') throw new Error(`${label} must be boolean`);
  return value;
}
function choice(value, values, label) {
  if (!values.includes(value)) throw new Error(`${label} must be one of ${values.join(', ')}`);
  return value;
}
function tint(value, label) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`${label} must be #RRGGBB`);
  return Number.parseInt(value.slice(1), 16);
}
function range(value, label, min = -Infinity, max = Infinity, angle = false) {
  if (!value || typeof value !== 'object') throw new Error(`${label} requires min and max`);
  number(value.min, `${label}.min`, min, max); number(value.max, `${label}.max`, min, max);
  if (value.min > value.max) throw new Error(`${label}.min must be <= max`);
  return { min: angle ? radians(value.min) : value.min, max: angle ? radians(value.max) : value.max };
}
function curve(nodes, label, rgb = false) {
  if (!Array.isArray(nodes) || nodes.length < 2 || nodes.length > 8) throw new Error(`${label} requires 2–8 nodes`);
  let previous = -1;
  const output = nodes.map((node) => {
    number(node.t, `${label}.t`, 0, 1);
    if (node.t <= previous) throw new Error(`${label}.t must be strictly increasing`);
    previous = node.t;
    return { t: node.t, value: rgb ? tint(node.value, `${label}.value`) : number(node.value, `${label}.value`, 0) };
  });
  if (output[0].t !== 0 || output.at(-1).t !== 1) throw new Error(`${label} must cover t=0 and t=1`);
  return output;
}

function convertLayer(layer, manual = false) {
  const { main, emission, enabled, shape, force, drag, color, size, rotation, trails, renderer } = layer;
  for (const key of ['emission', 'shape', 'force', 'drag', 'color', 'size', 'rotation', 'trails']) boolean(enabled[key], `enabled.${key}`);
  const output = { id: layer.id, main: {
    maxParticles: main.maxParticles, maxBirthsPerUpdate: main.maxBirthsPerUpdate,
    startLifetime: range(main.startLifetime, 'main.startLifetime', Number.MIN_VALUE),
    startAlpha: range(main.startAlpha, 'main.startAlpha', 0, 1),
    startSpeed: range(main.startSpeed, 'main.startSpeed', 0), startScale: range(main.startScale, 'main.startScale', 0),
    startScaleAspect: { x: number(main.startScaleAspect.x, 'main.startScaleAspect.x', Number.MIN_VALUE), y: number(main.startScaleAspect.y, 'main.startScaleAspect.y', Number.MIN_VALUE) },
    startRotation: range(main.startRotation, 'main.startRotation', -Infinity, Infinity, true),
    startTint: tint(main.startTint, 'main.startTint'), randomSeed: main.randomSeed,
    gravityModifier: main.gravityModifier, simulationSpace: main.simulationSpace }, modules: {},
    renderer: { textureSet: choice(renderer.texture, ASSETS.map((asset) => asset.id), 'renderer.texture'),
      selection: { selectionMode: 'single', index: 0 }, blendMode: renderer.blendMode,
      alignment: renderer.alignment, forwardAngle: radians(number(renderer.forwardDegrees, 'renderer.forwardDegrees')) } };
  const modules = output.modules;
  if (manual) {
    modules.emission = { rateOverTime: 0, duration: 0, loop: false, bursts: [{ time: 0,
      count: number(emission.burstCount, 'emission.burstCount', 1, Math.min(main.maxParticles, main.maxBirthsPerUpdate), true) }] };
  } else if (enabled.emission) {
    boolean(emission.finite, 'emission.finite'); boolean(emission.loop, 'emission.loop');
    modules.emission = { rateOverTime: emission.rateOverTime, startDelay: emission.startDelay,
      loop: emission.finite && emission.loop, bursts: emission.bursts.map(({ time, count }) => ({ time, count })) };
    if (emission.finite) modules.emission.duration = emission.duration;
  } else {
    // The SDK requires an emission schedule; disabled emission has no births.
    modules.emission = { rateOverTime: 0 };
  }
  if (enabled.shape) {
    modules.shape = { shapeType: shape.shapeType, directionMode: shape.shapeType === 'rectangle' ? 'fixed' : shape.directionMode,
      offsetX: shape.offsetX, offsetY: shape.offsetY,
      directionRadians: radians(number(shape.directionDegrees, 'shape.directionDegrees')),
      spreadRadians: radians(number(shape.spreadDegrees, 'shape.spreadDegrees', 0, 360)) };
    if (shape.shapeType === 'circle') Object.assign(modules.shape, { radius: shape.radius, innerRadius: shape.innerRadius });
    if (shape.shapeType === 'rectangle') Object.assign(modules.shape, { width: shape.width, height: shape.height });
  }
  if (enabled.force) modules.forceOverLifetime = { x: force.x, y: force.y };
  if (enabled.drag) modules.limitVelocityOverLifetime = { drag: drag.drag };
  if (enabled.color) {
    boolean(color.useAlphaCurve, 'color.useAlphaCurve'); boolean(color.useColorCurve, 'color.useColorCurve');
    modules.colorOverLifetime = {
      ...(color.useAlphaCurve ? { alphaCurve: curve(color.alphaCurve, 'color.alphaCurve') } : { endAlphaFactor: color.endAlphaFactor }),
      ...(color.useColorCurve ? { colorCurve: curve(color.colorCurve, 'color.colorCurve', true) } : { endTint: tint(color.endTint, 'color.endTint') }) };
  }
  if (enabled.size) {
    boolean(size.useScaleCurve, 'size.useScaleCurve');
    modules.sizeOverLifetime = size.useScaleCurve ? { scaleCurve: curve(size.scaleCurve, 'size.scaleCurve') } : { endScaleFactor: size.endScaleFactor };
  }
  if (enabled.rotation) modules.rotationOverLifetime = { z: range(rotation.degreesPerSecond, 'rotation.degreesPerSecond', -Infinity, Infinity, true) };
  if (enabled.trails) {
    modules.trails = { lifetime: trails.lifetime, minVertexDistance: trails.minVertexDistance, width: trails.width,
      maxPointsPerTrail: trails.maxPointsPerTrail, maxTrails: trails.maxTrails, breakDistance: trails.breakDistance,
      worldSpace: trails.worldSpace, dieWithParticles: trails.dieWithParticles, textureMode: 'stretch' };
    output.renderer.trail = { textureSet: choice(renderer.trailTexture, ASSETS.map((asset) => asset.id), 'renderer.trailTexture'),
      blendMode: renderer.trailBlendMode, tint: tint(renderer.trailTint, 'renderer.trailTint'), alpha: renderer.trailAlpha };
  }
  return output;
}

function entity(id, layers, manual = false) {
  if (!layers.length) return null;
  const converted = layers.map((layer) => convertLayer(layer, manual));
  const assetIds = new Set(converted.flatMap((layer) => [layer.renderer.textureSet, ...(layer.renderer.trail ? [layer.renderer.trail.textureSet] : [])]));
  return validateParticleEntityConfig({ schemaVersion: 1, id,
    textureSets: [...assetIds].map((asset) => ({ id: asset, textures: [{ asset }] })), layers: converted });
}
function transient(kind, preset) {
  const layer = createPreset('embers');
  Object.assign(layer, { id: kind, role: kind, label: kind });
  Object.assign(layer.main, { startLifetime: pair(kind === 'flash' ? 0.18 : 0.65),
    startSpeed: kind === 'flash' ? pair(10) : { min: 90, max: 180 }, startScale: { min: 0.18, max: kind === 'flash' ? 0.5 : 0.32 },
    startTint: preset === 'energy-bolt' ? '#9ceaff' : '#ffc078' });
  layer.shape.directionMode = 'outward'; layer.shape.spreadDegrees = 360;
  layer.renderer.texture = preset === 'energy-bolt' ? 'smoke.soft' : kind === 'flash' ? 'fire.ember' : 'fire.spark';
  if (preset === 'energy-bolt') layer.color.endTint = '#4fa7df';
  layer.emission.burstCount = kind === 'flash' ? 7 : 32;
  return entity(kind, [layer], true);
}

export function toRuntimeConfig(workspace) {
  choice(workspace.mode, ['particle', 'projectile'], 'mode');
  const { scene, host } = workspace;
  number(scene.gravityX, 'scene.gravityX'); number(scene.gravityY, 'scene.gravityY');
  tint(scene.background, 'scene.background'); boolean(scene.grid, 'scene.grid'); boolean(scene.followPointer, 'scene.followPointer');
  number(scene.timeScale, 'scene.timeScale', Number.MIN_VALUE);
  number(host.speed, 'host.speed', 100, 1000); number(host.loopDelay, 'host.loopDelay', 0, 5);
  for (const key of ['loop', 'launchFlash', 'impact']) boolean(host[key], `host.${key}`);
  if (!Array.isArray(workspace.layers) || !workspace.layers.length || workspace.layers.length > 8) throw new Error('workspace requires 1–8 layers');
  const layers = workspace.layers.filter((layer) => boolean(layer.active, `${layer.id}.active`));
  const projectile = workspace.mode === 'projectile';
  return { mode: workspace.mode, config: entity(`${workspace.mode}-${workspace.preset}`, layers),
    gravity: { x: scene.gravityX, y: scene.gravityY }, host: { ...host },
    killLayerIds: projectile ? layers.filter((layer) => layer.role === 'head').map((layer) => layer.id) : [],
    manualConfig: projectile ? null : entity('manual-burst', layers, true),
    flashConfig: projectile && host.launchFlash ? transient('flash', workspace.preset) : null,
    impactConfig: projectile && host.impact ? transient('impact', workspace.preset) : null };
}

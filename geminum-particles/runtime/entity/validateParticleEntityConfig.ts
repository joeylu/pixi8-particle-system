import type { ParticleEntityConfig, ParticleEntityLayerConfig } from './contracts.js';
import type { ParticleEffectConfig } from '../composition/contracts.js';
import { compileParticleEffectConfig } from '../composition/compileParticleEffectConfig.js';
import { createParticleFrameSelector } from './createParticleFrameSelector.js';
import { getParticleEntityLayerMain, getParticleEntityLayerTextureSheetAnimation, normalizeParticleFrameSelection, normalizeParticleGridDimensions } from './normalization.js';

type JsonObject = Record<string, unknown>;
function fail(path: string, message: string): never { throw new TypeError(`${path}: ${message}`); }
function clone(value: unknown, path: string, ancestors: Set<object>): unknown {
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') { if (!Number.isFinite(value)) fail(path, 'number must be finite'); return value; }
  if (!value || typeof value !== 'object') return fail(path, 'expected a JSON value');
  if (ancestors.has(value)) fail(path, 'cyclic value');
  const array = Array.isArray(value);
  const proto = Object.getPrototypeOf(value);
  if (array ? proto !== Array.prototype : proto !== Object.prototype && proto !== null) fail(path, 'expected a plain JSON object');
  ancestors.add(value);
  const output: JsonObject | unknown[] = array ? [] : {};
  const keys = Reflect.ownKeys(value);
  for (const key of keys) {
    if (typeof key !== 'string') fail(path, 'symbol keys are forbidden');
    if (array && key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (!descriptor.enumerable || !('value' in descriptor)) fail(`${path}.${key}`, 'expected an enumerable data property');
    if (key === 'then') fail(`${path}.then`, 'thenables are forbidden');
    if (array && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length)) fail(path, 'array has an extra property');
    Object.defineProperty(output, key, { value: clone(descriptor.value, `${path}.${key}`, ancestors), enumerable: true });
  }
  if (array) {
    for (let i = 0; i < value.length; i++) if (!Object.prototype.hasOwnProperty.call(value, i)) fail(`${path}[${i}]`, 'array holes are forbidden');
  }
  ancestors.delete(value);
  return Object.freeze(output);
}
function object(value: unknown, path: string, allowed: readonly string[], required: readonly string[] = []): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'expected an object');
  const result = value as JsonObject;
  for (const key of Object.keys(result)) if (!allowed.includes(key)) fail(`${path}.${key}`, 'unknown field');
  for (const key of required) if (!Object.prototype.hasOwnProperty.call(result, key)) fail(`${path}.${key}`, 'required field');
  return result;
}
function list(value: unknown, path: string): unknown[] { if (!Array.isArray(value) || !value.length) fail(path, 'expected a nonempty array'); return value; }
function number(value: unknown, path: string, minimum = -Infinity, safe = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || (safe && !Number.isSafeInteger(value))) fail(path, 'invalid number');
  return value;
}
function id(value: unknown, path: string): string { if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(value) || /[^A-Za-z0-9._-]/.test(value)) fail(path, 'invalid identifier'); return value; }
function text(value: unknown, path: string): void { if (typeof value !== 'string' || !value.length) fail(path, 'expected a nonempty string'); }

export function validateParticleEntityConfig(input: unknown): ParticleEntityConfig {
  const snapshot = clone(input, '$', new Set());
  const root = object(snapshot, '$', ['schemaVersion', 'id', 'textureSets', 'layers'], ['schemaVersion', 'id', 'textureSets', 'layers']);
  if (root.schemaVersion !== 1) fail('$.schemaVersion', 'expected 1');
  id(root.id, '$.id');
  const sets = new Map<string, number>();
  list(root.textureSets, '$.textureSets').forEach((value, index) => {
    const path = `$.textureSets[${index}]`;
    const set = object(value, path, ['id', 'textures', 'grid'], ['id']);
    const key = id(set.id, `${path}.id`); if (sets.has(key)) fail(`${path}.id`, 'duplicate identifier');
    if (Object.prototype.hasOwnProperty.call(set, 'textures') === Object.prototype.hasOwnProperty.call(set, 'grid')) fail(path, 'provide exactly one of textures or grid');
    let count: number;
    if ('textures' in set) {
      const textures = list(set.textures, `${path}.textures`); count = textures.length;
      textures.forEach((texture, i) => { const p = `${path}.textures[${i}]`; const ref = object(texture, p, ['asset', 'frame'], ['asset']); text(ref.asset, `${p}.asset`); if ('frame' in ref) text(ref.frame, `${p}.frame`); });
    } else {
      const grid = object(set.grid, `${path}.grid`, ['asset', 'numTilesX', 'numTilesY', 'columns', 'rows'], ['asset']);
      text(grid.asset, `${path}.grid.asset`);
      const dimensions = { ...grid }; delete dimensions.asset;
      const normalized = normalizeParticleGridDimensions(dimensions as never);
      count = normalized.columns * normalized.rows;
      if (!Number.isSafeInteger(count) || count > 4096) fail(`${path}.grid`, 'frame count must be safe and <= 4096');
    }
    sets.set(key, count);
  });
  const ids = new Set<string>();
  if (list(root.layers, '$.layers').length > 8) fail('$.layers', 'maximum 8 layers');
  list(root.layers, '$.layers').forEach((value, index) => {
    const path = `$.layers[${index}]`;
    const layer = object(value, path, ['id', 'origin', 'activation', 'main', 'core', 'modules', 'renderer'], ['id', 'renderer']);
    const key = id(layer.id, `${path}.id`); if (ids.has(key)) fail(`${path}.id`, 'duplicate identifier'); ids.add(key);
    if ('origin' in layer) { const o = object(layer.origin, `${path}.origin`, ['x', 'y'], ['x', 'y']); number(o.x, `${path}.origin.x`); number(o.y, `${path}.origin.y`); }
    const modules = 'modules' in layer ? object(layer.modules, `${path}.modules`, ['limitVelocityOverLifetime', 'emission', 'shape', 'forceOverLifetime', 'force', 'colorOverLifetime', 'sizeOverLifetime', 'rotationOverLifetime', 'textureSheetAnimation', 'trails']) : {};
    const config: JsonObject = {};
    const main = getParticleEntityLayerMain(layer as unknown as ParticleEntityLayerConfig);
    if (main !== undefined) {
      try { compileParticleEffectConfig({ main }); } catch (error) { fail(`${path}.main`, String(error)); }
      config.main = main;
    }
    for (const [name, group] of Object.entries(modules)) {
      if (name === 'textureSheetAnimation') continue;
      try { compileParticleEffectConfig({ [name]: group } as ParticleEffectConfig); } catch (error) { fail(`${path}.modules.${name}`, String(error)); }
      config[name] = group;
    }
    const compiled = compileParticleEffectConfig(config as ParticleEffectConfig);
    if (!('activation' in layer) && !('emission' in modules)) fail(path, 'activation or emission is required');
    if ('activation' in layer) {
    const activation = object(layer.activation, `${path}.activation`, ['mode', 'count'], ['mode']);
    if (activation.mode === 'continuous') { if ('count' in activation) fail(`${path}.activation.count`, 'unknown field'); if (!('emission' in modules)) fail(`${path}.modules.emission`, 'required for continuous activation'); }
    else if (activation.mode === 'burst') {
      const count = number(activation.count, `${path}.activation.count`, 1, true);
      if (count > compiled.main.maxParticles || count > compiled.main.maxBirthsPerUpdate!) fail(`${path}.activation.count`, 'exceeds capacity or birth budget');
    } else fail(`${path}.activation.mode`, 'invalid mode');
    }
    const renderer = object(layer.renderer, `${path}.renderer`, ['textureSet', 'selection', 'blendMode', 'boundsArea', 'trail', 'alignment', 'forwardAngle'], ['textureSet']);
    if (('trails' in modules) !== ('trail' in renderer)) fail(`${path}.renderer.trail`, 'trails and trail renderer must be provided together');
    if ('trail' in renderer) {
      const trail = object(renderer.trail, `${path}.renderer.trail`, ['textureSet', 'blendMode', 'tint', 'alpha'], ['textureSet']);
      if (sets.get(id(trail.textureSet, `${path}.renderer.trail.textureSet`)) !== 1) fail(`${path}.renderer.trail.textureSet`, 'trail texture set must contain exactly one frame');
      if ('blendMode' in trail && trail.blendMode !== 'normal' && trail.blendMode !== 'add') fail(path, 'invalid trail blendMode');
      if ('tint' in trail && number(trail.tint, path, 0, true) > 0xffffff) fail(path, 'invalid trail tint');
      if ('alpha' in trail && number(trail.alpha, path, 0) > 1) fail(path, 'invalid trail alpha');
    }
    const reference = id(renderer.textureSet, `${path}.renderer.textureSet`); const count = sets.get(reference);
    if (count === undefined) fail(`${path}.renderer.textureSet`, 'unknown texture set');
    const inputSelection = getParticleEntityLayerTextureSheetAnimation(layer as unknown as ParticleEntityLayerConfig);
    try { createParticleFrameSelector(inputSelection, count); } catch (error) { fail(`${path}.textureSheetAnimation`, String(error)); }
    const selection = normalizeParticleFrameSelection(inputSelection);
    if (selection.mode === 'sequence' && !Number.isFinite((typeof selection.fps === 'number' ? selection.fps : selection.fps.max) * compiled.main.lifetimeSeconds)) fail(`${path}.textureSheetAnimation.fps`, 'fps * lifetimeSeconds must be finite');
    if ('alignment' in renderer && renderer.alignment !== 'fixed' && renderer.alignment !== 'velocity') fail(path, 'invalid alignment');
    if ('forwardAngle' in renderer) number(renderer.forwardAngle, `${path}.renderer.forwardAngle`);
    if ('blendMode' in renderer && renderer.blendMode !== 'normal' && renderer.blendMode !== 'add') fail(`${path}.renderer.blendMode`, 'invalid blend mode');
    if ('boundsArea' in renderer) { const bounds = object(renderer.boundsArea, `${path}.renderer.boundsArea`, ['x', 'y', 'width', 'height'], ['x', 'y', 'width', 'height']); for (const axis of ['x', 'y', 'width', 'height']) number(bounds[axis], `${path}.renderer.boundsArea.${axis}`, axis === 'width' || axis === 'height' ? 0 : -Infinity); }
  });
  return snapshot as ParticleEntityConfig;
}

import { aliasValue, integer, knownKeys, object } from '../core/validation.js';
import { rangeSnapshot } from '../composition/config.js';
export function normalizeParticleGridDimensions(grid) {
    object(grid, 'Particle grid');
    knownKeys(grid, ['numTilesX', 'numTilesY', 'columns', 'rows'], 'Particle grid');
    const columns = aliasValue(grid, 'numTilesX', 'columns');
    const rows = aliasValue(grid, 'numTilesY', 'rows');
    integer(columns, 'numTilesX', 1);
    integer(rows, 'numTilesY', 1);
    if (columns * rows > 4096)
        throw new RangeError('Particle grid exceeds 4096 frames');
    return Object.freeze({ columns, rows });
}
/** selectionMode denotes frame selection, independently of texture layout. */
export function normalizeParticleFrameSelection(selection) {
    object(selection, 'Texture sheet animation');
    if (Object.getPrototypeOf(selection) !== Object.prototype && Object.getPrototypeOf(selection) !== null)
        throw new TypeError('Texture sheet animation must be a plain object');
    for (const key of Reflect.ownKeys(selection)) {
        const descriptor = Object.getOwnPropertyDescriptor(selection, key);
        if (typeof key !== 'string' || !descriptor.enumerable || !('value' in descriptor))
            throw new TypeError('Texture sheet animation must contain enumerable JSON data properties');
    }
    const mode = aliasValue(selection, 'selectionMode', 'mode');
    const data = selection;
    const allowed = mode === 'single' ? ['selectionMode', 'mode', 'index']
        : mode === 'random' ? ['selectionMode', 'mode', 'indices'] : mode === 'sequence' ? ['selectionMode', 'mode', 'fps', 'loop', 'clips', 'randomStartFrame'] : [];
    knownKeys(selection, allowed, 'Texture sheet animation');
    for (const key of allowed)
        if (key in selection && data[key] === undefined)
            throw new TypeError(`${key} cannot be undefined`);
    if (mode === 'single') {
        if ('index' in selection)
            integer(selection.index, 'index', 0);
        return Object.freeze({ mode, ...('index' in selection ? { index: selection.index } : {}) });
    }
    if (mode === 'random')
        return Object.freeze({ mode, ...('indices' in data ? { indices: data.indices } : {}) });
    if (mode === 'sequence') {
        const fps = rangeSnapshot(data.fps, 'fps', true);
        if ((typeof fps === 'number' ? fps : fps.min) <= 0)
            throw new RangeError('fps must be positive');
        if ('randomStartFrame' in data && typeof data.randomStartFrame !== 'boolean')
            throw new TypeError('randomStartFrame must be boolean');
        if (data.randomStartFrame === true && data.loop !== true)
            throw new RangeError('randomStartFrame requires loop');
        if ('loop' in selection && typeof selection.loop !== 'boolean')
            throw new TypeError('loop must be boolean');
        return Object.freeze({ mode, fps, ...('clips' in data ? { clips: data.clips } : {}), ...('randomStartFrame' in data ? { randomStartFrame: data.randomStartFrame } : {}), ...('loop' in selection ? { loop: selection.loop } : {}) });
    }
    throw new TypeError('selectionMode must be single, random or sequence');
}
/** Accessors operate on layers returned by validateParticleEntityConfig or parseParticleEntityConfig. */
export function getParticleEntityLayerMain(layer) {
    return aliasValue(layer, 'main', 'core', undefined);
}
export function getParticleEntityLayerTextureSheetAnimation(layer) {
    const canonical = layer.modules && 'textureSheetAnimation' in layer.modules;
    const legacy = 'selection' in layer.renderer;
    if (Boolean(canonical) === legacy)
        throw new TypeError('Provide exactly one textureSheetAnimation or renderer.selection');
    const selection = canonical ? layer.modules.textureSheetAnimation : layer.renderer.selection;
    if (selection === undefined)
        throw new TypeError('Texture sheet animation cannot be undefined');
    return selection;
}
export function getParticleEntityLayerEffectConfig(layer) {
    const config = {};
    const main = getParticleEntityLayerMain(layer);
    if (main !== undefined)
        config.main = main;
    for (const [key, value] of Object.entries(layer.modules ?? {})) {
        if (key !== 'textureSheetAnimation')
            Object.assign(config, { [key]: value });
    }
    return config;
}

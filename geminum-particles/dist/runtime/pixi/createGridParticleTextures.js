import { Rectangle, Texture } from 'pixi.js';
import { normalizeParticleGridDimensions } from '../entity/index.js';
/** Validate public texture geometry without taking ownership of its source. */
export function validateParticleTexture(texture) {
    if (!(texture instanceof Texture) || texture.destroyed || !texture.source || texture.source.destroyed) {
        throw new TypeError('A live Texture and TextureSource are required');
    }
    const { frame, orig, trim, source } = texture;
    const validRectangle = (r) => [r.x, r.y, r.width, r.height].every(Number.isFinite)
        && r.width > 0 && r.height > 0;
    if (!validRectangle(frame) || !validRectangle(orig) || frame.x < 0 || frame.y < 0
        || frame.x + frame.width > source.width || frame.y + frame.height > source.height
        || !Number.isFinite(source.resolution) || source.resolution <= 0
        || !Number.isInteger(texture.rotate) || texture.rotate < 0 || texture.rotate > 15
        || (trim && (!validRectangle(trim) || trim.x < 0 || trim.y < 0
            || trim.x + trim.width > orig.width || trim.y + trim.height > orig.height))) {
        throw new RangeError('Invalid particle texture geometry');
    }
}
/** Row-major views share the host source; the caller owns only these views. */
export function createGridParticleTextures(texture, grid) {
    validateParticleTexture(texture);
    const dimensions = normalizeParticleGridDimensions(grid);
    const { frame, orig, source } = texture;
    if (texture.trim || texture.rotate !== 0 || orig.width !== frame.width || orig.height !== frame.height) {
        throw new RangeError('Grid texture must be untrimmed and unrotated');
    }
    const width = frame.width / dimensions.columns;
    const height = frame.height / dimensions.rows;
    if (![width * source.resolution, height * source.resolution, frame.x * source.resolution,
        frame.y * source.resolution].every(Number.isSafeInteger)
        || width * source.resolution < 1 || height * source.resolution < 1) {
        throw new RangeError('Grid cells must align to whole physical pixels');
    }
    const result = [];
    try {
        for (let row = 0; row < dimensions.rows; row++) {
            for (let column = 0; column < dimensions.columns; column++) {
                result.push(new Texture({ source, frame: new Rectangle(frame.x + column * width, frame.y + row * height, width, height) }));
            }
        }
        return Object.freeze(result);
    }
    catch (error) {
        const cleanupErrors = [];
        for (const view of result) {
            try {
                view.destroy(false);
            }
            catch (failure) {
                cleanupErrors.push(failure);
            }
        }
        if (cleanupErrors.length)
            throw Object.assign(new Error('Grid creation and cleanup failed'), { cause: error, cleanupErrors });
        throw error;
    }
}

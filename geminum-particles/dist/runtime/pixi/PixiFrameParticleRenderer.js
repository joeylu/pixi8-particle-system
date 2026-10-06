import { Particle, ParticleContainer, Rectangle } from 'pixi.js';
import { aliasValue, declaration, finite, knownKeys, object } from '../core/validation.js';
import { createParticleFrameSelector, normalizeParticleFrameSelection } from '../entity/index.js';
import { validateParticleTexture } from './createGridParticleTextures.js';
export class PixiFrameParticleRenderer {
    constructor(options) {
        this.textures = [];
        this.entries = new Map();
        this.disposing = false;
        object(options, 'Frame renderer options');
        const keys = ['textures', 'textureSheetAnimation', 'selection', 'randomSeed', 'seed', 'updateWrites', 'blendMode', 'boundsArea', 'alignment', 'forwardAngle'];
        knownKeys(options, keys, 'Frame renderer options');
        for (const key of keys)
            if (key in options && options[key] === undefined)
                throw new TypeError(`${key} cannot be undefined`);
        if (!Array.isArray(options.textures) || !options.textures.length)
            throw new TypeError('Textures must be nonempty');
        const textures = Array.from(options.textures);
        for (const texture of textures)
            validateParticleTexture(texture);
        if (textures.some((texture) => texture.source !== textures[0].source))
            throw new TypeError('Particle frames must share one TextureSource');
        this.alignment = options.alignment ?? 'fixed';
        this.forwardAngle = options.forwardAngle ?? 0;
        finite(this.forwardAngle, 'forwardAngle');
        if (this.alignment !== 'fixed' && this.alignment !== 'velocity')
            throw new TypeError('Invalid alignment');
        const writes = new Set(declaration(options.updateWrites, 'updateWrites'));
        const blendMode = options.blendMode ?? 'normal';
        if (blendMode !== 'normal' && blendMode !== 'add')
            throw new TypeError('Unsupported blendMode');
        const bounds = options.boundsArea;
        if (bounds !== undefined && (!(bounds instanceof Rectangle) || ![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)
            || bounds.width < 0 || bounds.height < 0))
            throw new TypeError('Invalid boundsArea');
        const selection = normalizeParticleFrameSelection(aliasValue(options, 'textureSheetAnimation', 'selection'));
        this.select = createParticleFrameSelector(selection, textures.length, aliasValue(options, 'randomSeed', 'seed', 1));
        this.sequence = selection.mode === 'sequence';
        const geometry = (texture) => JSON.stringify([texture.orig.width, texture.orig.height,
            texture.trim?.x, texture.trim?.y, texture.trim?.width, texture.trim?.height, texture.frame.width, texture.frame.height]);
        const varyingGeometry = textures.some((texture) => geometry(texture) !== geometry(textures[0]));
        this.container = new ParticleContainer({ texture: textures[0], blendMode,
            ...(bounds ? { boundsArea: new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height) } : {}),
            dynamicProperties: {
                position: writes.has('x') || writes.has('y'), rotation: writes.has('rotation') || this.alignment === 'velocity',
                vertex: writes.has('scaleX') || writes.has('scaleY') || (this.sequence && varyingGeometry),
                color: writes.has('alpha') || writes.has('tint'), uvs: this.sequence && textures.length > 1,
            } });
        this.textures = Object.freeze(textures);
        this.source = textures[0].source;
    }
    sync(snapshot) {
        if (this.disposing || this.container.destroyed)
            throw new Error('Frame renderer is unavailable');
        for (const texture of this.textures) {
            validateParticleTexture(texture);
            if (texture.source !== this.source)
                throw new Error('Host particle TextureSource changed');
        }
        const changed = this.version !== snapshot.membershipVersion;
        if (changed)
            this.container.particleChildren.length = 0;
        for (const state of snapshot.particles) {
            let entry = this.entries.get(state);
            if (!entry) {
                entry = { particle: new Particle({ texture: this.textures[0], anchorX: .5, anchorY: .5 }), birthIndex: -1, index: 0, heading: 0 };
                this.entries.set(state, entry);
            }
            if (entry.birthIndex !== state.data.birthIndex)
                entry.heading = 0;
            if (this.alignment === 'velocity' && Math.hypot(state.vx, state.vy) > 1e-8)
                entry.heading = Math.atan2(state.vy, state.vx) - this.forwardAngle;
            if (this.sequence || changed || entry.birthIndex !== state.data.birthIndex) {
                entry.index = this.select(state.data.birthIndex, state.ageSeconds);
                entry.birthIndex = state.data.birthIndex;
            }
            const particle = entry.particle;
            particle.texture = this.textures[entry.index];
            particle.x = state.x;
            particle.y = state.y;
            particle.rotation = state.rotation + (this.alignment === 'velocity' ? entry.heading : 0);
            particle.scaleX = state.scaleX;
            particle.scaleY = state.scaleY;
            particle.tint = state.tint;
            particle.alpha = state.alpha;
            if (changed)
                this.container.particleChildren.push(particle);
        }
        if (changed) {
            this.container.update();
            this.version = snapshot.membershipVersion;
        }
        return undefined;
    }
    destroy() {
        this.disposing = true;
        const failures = [];
        const attempt = (fn) => { try {
            fn();
        }
        catch (error) {
            failures.push(error);
        } };
        attempt(() => this.container.removeFromParent());
        attempt(() => { this.container.particleChildren.length = 0; });
        attempt(() => { this.container.texture = null; });
        this.entries.clear();
        this.textures = [];
        this.source = undefined;
        this.version = undefined;
        if (!this.container.destroyed)
            attempt(() => this.container.destroy({ texture: false, textureSource: false }));
        if (failures.length && !this.cleanupFailure)
            this.cleanupFailure = Object.assign(new Error('Frame renderer cleanup failed'), { cleanupErrors: failures });
        if (this.cleanupFailure)
            throw this.cleanupFailure;
        return undefined;
    }
}

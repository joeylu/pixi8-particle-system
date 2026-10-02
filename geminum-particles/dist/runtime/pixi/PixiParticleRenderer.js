import { Particle, ParticleContainer, Rectangle, Texture } from 'pixi.js';
const fields = ['x', 'y', 'vx', 'vy', 'rotation', 'scaleX', 'scaleY', 'alpha', 'tint'];
/** Owns presentation objects; the host retains ownership of the supplied texture. */
export class PixiParticleRenderer {
    constructor(options) {
        this.particles = new Map();
        this.disposing = false;
        if (!options || Object.keys(options).some((key) => !['texture', 'updateWrites', 'blendMode', 'boundsArea'].includes(key))) {
            throw new TypeError('Invalid Pixi particle renderer options');
        }
        const { texture, updateWrites, blendMode = 'normal', boundsArea } = options;
        if (!(texture instanceof Texture) || texture.destroyed || !texture.source || texture.source.destroyed) {
            throw new TypeError('A live host-owned Texture and TextureSource are required');
        }
        if (!Array.isArray(updateWrites) || updateWrites.some((field) => !fields.includes(field))) {
            throw new TypeError('updateWrites must contain particle fields');
        }
        if (blendMode !== 'normal' && blendMode !== 'add')
            throw new TypeError('Unsupported particle blendMode');
        if (boundsArea !== undefined && (!(boundsArea instanceof Rectangle)
            || ![boundsArea.x, boundsArea.y, boundsArea.width, boundsArea.height].every(Number.isFinite)
            || boundsArea.width < 0 || boundsArea.height < 0))
            throw new TypeError('Invalid particle boundsArea');
        const writes = new Set(updateWrites);
        this.container = new ParticleContainer({
            texture, blendMode,
            boundsArea: boundsArea === undefined ? undefined : new Rectangle(boundsArea.x, boundsArea.y, boundsArea.width, boundsArea.height),
            dynamicProperties: {
                position: writes.has('x') || writes.has('y'),
                rotation: writes.has('rotation'),
                vertex: writes.has('scaleX') || writes.has('scaleY'),
                color: writes.has('alpha') || writes.has('tint'),
                uvs: false,
            },
        });
        this.texture = texture;
    }
    sync(snapshot) {
        if (this.disposing || !this.texture || this.container.destroyed)
            throw new Error('Particle renderer is unavailable');
        if (this.texture.destroyed || this.texture.source.destroyed)
            throw new Error('Host particle texture was destroyed');
        const changed = snapshot.membershipVersion !== this.membershipVersion;
        if (changed)
            this.container.particleChildren.length = 0;
        for (const state of snapshot.particles) {
            let particle = this.particles.get(state);
            if (!particle) {
                particle = new Particle({ texture: this.texture, anchorX: 0.5, anchorY: 0.5 });
                this.particles.set(state, particle);
            }
            particle.x = state.x;
            particle.y = state.y;
            particle.rotation = state.rotation;
            particle.scaleX = state.scaleX;
            particle.scaleY = state.scaleY;
            particle.tint = state.tint;
            particle.alpha = state.alpha;
            if (changed)
                this.container.particleChildren.push(particle);
        }
        if (changed) {
            this.container.update();
            this.membershipVersion = snapshot.membershipVersion;
        }
        return undefined;
    }
    destroy() {
        this.disposing = true;
        const failures = [];
        const attempt = (operation) => { try {
            operation();
        }
        catch (error) {
            failures.push(error);
        } };
        if (!this.container.destroyed) {
            attempt(() => this.container.removeFromParent());
            attempt(() => { this.container.particleChildren.length = 0; });
            // Clearing public references does not destroy shared texture resources.
            attempt(() => { this.container.texture = null; });
        }
        this.particles.clear();
        this.texture = undefined;
        this.membershipVersion = undefined;
        if (!this.container.destroyed)
            attempt(() => this.container.destroy({ texture: false, textureSource: false }));
        if (failures.length)
            throw Object.assign(new Error('Particle renderer cleanup failed'), { cleanupErrors: failures });
        return undefined;
    }
}

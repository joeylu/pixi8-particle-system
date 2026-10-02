import 'pixi.js/mesh';
import { Container, Mesh, MeshGeometry } from 'pixi.js';
import { knownKeys, object } from '../core/validation.js';
import { validateParticleTexture } from './createGridParticleTextures.js';
export function validatePixiTrailRenderOptions(options) {
    object(options, 'Trail renderer');
    knownKeys(options, ['texture', 'blendMode', 'tint', 'alpha'], 'Trail renderer');
    for (const key of ['texture', 'blendMode', 'tint', 'alpha'])
        if (key in options && options[key] === undefined)
            throw new TypeError(`${key} cannot be undefined`);
    validateParticleTexture(options.texture);
    if (options.texture.trim || options.texture.rotate !== 0)
        throw new TypeError('Trail texture must be untrimmed and unrotated');
    if ('blendMode' in options && options.blendMode !== 'normal' && options.blendMode !== 'add')
        throw new TypeError('Invalid trail blendMode');
    if ('tint' in options && (!Number.isInteger(options.tint) || options.tint < 0 || options.tint > 0xffffff))
        throw new RangeError('Trail tint must be RGB');
    if ('alpha' in options && (!Number.isFinite(options.alpha) || options.alpha < 0 || options.alpha > 1))
        throw new RangeError('Trail alpha must be in [0, 1]');
}
/** Shared-edge ribbons use bounded miter joins and per-section cumulative arc-length UVs. */
export class PixiTrailRenderer {
    constructor(options) {
        this.entries = new Map();
        this.free = [];
        this.destroyed = false;
        const { trails, ...render } = options;
        validatePixiTrailRenderOptions(render);
        if (!trails || trails.id !== 'trails' || typeof trails.snapshot !== 'function')
            throw new TypeError('A ParticleTrails observer is required');
        this.trails = trails;
        this.texture = render.texture;
        this.source = render.texture.source;
        this.container = new Container();
        this.container.blendMode = render.blendMode ?? 'normal';
        this.container.tint = render.tint ?? 0xffffff;
        this.container.alpha = render.alpha ?? 1;
    }
    sync() {
        if (this.destroyed || this.failure)
            throw this.failure ?? new Error('Trail renderer is destroyed');
        validateParticleTexture(this.texture);
        if (this.texture.source !== this.source)
            throw new Error('Trail texture source changed');
        const snapshots = this.trails.snapshot(), live = new Set(snapshots.map(trail => trail.birthId));
        for (const [id, entry] of this.entries)
            if (!live.has(id)) {
                entry.mesh.removeFromParent();
                entry.mesh.visible = false;
                this.free.push(entry);
                this.entries.delete(id);
            }
        for (const trail of snapshots) {
            const positions = [], uvs = [], indices = [];
            const sections = [];
            let section = [];
            for (const point of trail.points) {
                if (point.breakBefore && section.length) {
                    sections.push(section);
                    section = [];
                }
                const last = section[section.length - 1];
                if (last && last.x === point.x && last.y === point.y)
                    continue;
                if (section.length >= 2) {
                    const before = section[section.length - 2], ax = last.x - before.x, ay = last.y - before.y, bx = point.x - last.x, by = point.y - last.y;
                    const al = Math.hypot(ax, ay), bl = Math.hypot(bx, by);
                    if (!Number.isFinite(al) || !Number.isFinite(bl))
                        throw new RangeError('Trail distance must be finite');
                    if (ax / al * (bx / bl) + ay / al * (by / bl) < -.999) {
                        sections.push(section);
                        section = [last];
                    }
                }
                section.push(point);
            }
            if (section.length)
                sections.push(section);
            for (const points of sections) {
                const lengths = [0];
                for (let i = 1; i < points.length; i++)
                    lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
                const total = lengths[lengths.length - 1];
                if (!Number.isFinite(total))
                    throw new RangeError('Trail distance must be finite');
                if (!(total > 0))
                    continue;
                const normals = points.slice(1).map((p, i) => { const dx = p.x - points[i].x, dy = p.y - points[i].y, length = Math.hypot(dx, dy); return { x: -dy / length, y: dx / length }; });
                const base = positions.length / 2, half = this.trails.config.width / 2;
                for (let i = 0; i < points.length; i++) {
                    const previous = normals[Math.max(0, i - 1)], next = normals[Math.min(i, normals.length - 1)];
                    let nx = previous.x + next.x, ny = previous.y + next.y;
                    const norm = Math.hypot(nx, ny);
                    if (norm < 1e-6) {
                        nx = next.x;
                        ny = next.y;
                    }
                    else {
                        nx /= norm;
                        ny /= norm;
                    }
                    const denominator = nx * next.x + ny * next.y, extent = Math.min(half / Math.max(denominator, .5), 2 * half);
                    const point = points[i], vertices = [point.x + nx * extent, point.y + ny * extent, point.x - nx * extent, point.y - ny * extent];
                    const u = lengths[i] / total;
                    if (!vertices.every(value => Number.isFinite(value) && Number.isFinite(Math.fround(value))) || !Number.isFinite(u))
                        throw new RangeError('Trail geometry must be finite in Float32');
                    positions.push(...vertices);
                    uvs.push(u, 0, u, 1);
                    if (i > 0) {
                        const index = base + (i - 1) * 2;
                        indices.push(index, index + 1, index + 2, index + 2, index + 1, index + 3);
                    }
                }
            }
            let entry = this.entries.get(trail.birthId);
            if (!entry && positions.length) {
                entry = this.free.pop();
                if (!entry) {
                    const capacity = this.trails.config.maxPointsPerTrail;
                    const geometry = new MeshGeometry({ positions: new Float32Array(capacity * 8), uvs: new Float32Array(capacity * 8), indices: new Uint32Array(capacity * 6), topology: 'triangle-list' });
                    entry = { geometry, mesh: new Mesh({ geometry, texture: this.texture }) };
                }
                this.entries.set(trail.birthId, entry);
                this.container.addChild(entry.mesh);
            }
            if (entry) {
                const geometry = entry.geometry;
                geometry.positions.fill(positions[0] ?? 0);
                geometry.positions.set(positions);
                geometry.uvs.fill(0);
                geometry.uvs.set(uvs);
                geometry.indices.fill(0);
                geometry.indices.set(indices);
                geometry.getBuffer('aPosition').update();
                geometry.getBuffer('aUV').update();
                geometry.getIndex().update();
                entry.mesh.visible = positions.length > 0;
            }
        }
        return undefined;
    }
    destroy() {
        if (this.destroyed)
            return undefined;
        const errors = [];
        const attempt = (fn) => { try {
            fn();
        }
        catch (error) {
            errors.push(error);
        } };
        attempt(() => this.container.removeFromParent());
        for (const entry of [...this.entries.values(), ...this.free]) {
            attempt(() => entry.mesh.destroy({ texture: false, textureSource: false }));
            attempt(() => entry.geometry.destroy());
        }
        this.entries.clear();
        this.free.length = 0;
        attempt(() => this.container.destroy({ children: false }));
        if (errors.length && !this.failure)
            this.failure = Object.assign(new Error('Trail renderer cleanup failed'), { cleanupErrors: errors });
        if (this.failure)
            throw this.failure;
        this.destroyed = true;
        return undefined;
    }
}

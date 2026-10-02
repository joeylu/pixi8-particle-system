import { Container, Rectangle } from 'pixi.js';
import { finite, knownKeys, object } from '../core/validation.js';
import { parseParticleEntityConfig, validateParticleEntityConfig, getParticleEntityLayerEffectConfig, getParticleEntityLayerTextureSheetAnimation } from '../entity/index.js';
import { createGridParticleTextures, validateParticleTexture } from './createGridParticleTextures.js';
import { createCompiledFrameEffect } from './internal/createCompiledFrameEffect.js';
import { compileParticleEffectConfig } from '../composition/compileParticleEffectConfig.js';
import { aliasValue } from '../core/validation.js';
import { createPixiParticleSpaceRuntime } from './space.js';
export class PixiParticleEntity {
    constructor(container, layers, config, ownedViews, spaceRuntime) {
        this.container = container;
        this.config = config;
        this.ownedViews = ownedViews;
        this.spaceRuntime = spaceRuntime;
        this.mode = 'stopped';
        this.previous = 'playing';
        this.busy = false;
        this.layers = Object.freeze(Array.from(layers));
    }
    get state() { return this.mode; }
    get particleCount() { return this.layers.reduce((sum, layer) => sum + layer.system.particleCount, 0); }
    get error() { return this.failure; }
    guard(states) {
        if (this.busy)
            throw new Error('Particle entity mutation is not reentrant');
        if (!states.includes(this.mode))
            throw new Error(`Entity operation is not allowed in ${this.mode}`);
    }
    healthy() {
        for (const { system } of this.layers) {
            if (system.state === 'faulted' || system.state === 'destroyed')
                throw system.error ?? new Error(`Entity layer is ${system.state}`);
        }
    }
    run(operation) {
        this.busy = true;
        try {
            this.healthy();
            this.spaceRuntime?.begin();
            operation();
        }
        catch (error) {
            this.mode = 'faulted';
            this.failure = error;
            throw error;
        }
        finally {
            this.spaceRuntime?.end();
            this.busy = false;
        }
    }
    play() {
        this.guard(['stopped']);
        this.run(() => {
            if (this.layers.some(({ system }) => system.state !== 'stopped'))
                throw new Error('All layers must be stopped before play');
            this.layers.forEach(({ system }, index) => {
                const activation = this.config.layers[index].activation;
                if (activation.mode === 'continuous')
                    system.play();
                else
                    system.emit(activation.count);
            });
            this.mode = this.config.layers.some((layer) => layer.activation.mode === 'continuous') ? 'playing' : 'draining';
        });
    }
    pause() {
        this.guard(['playing', 'draining']);
        this.run(() => {
            this.previous = this.mode;
            for (const { system } of this.layers)
                if (system.state === 'playing' || system.state === 'draining')
                    system.pause();
            this.mode = 'paused';
        });
    }
    resume() {
        this.guard(['paused']);
        this.run(() => { for (const { system } of this.layers)
            if (system.state === 'paused')
                system.resume(); this.mode = this.previous; });
    }
    stop() {
        this.guard(['stopped', 'playing', 'draining', 'paused']);
        this.run(() => {
            for (const { system } of this.layers)
                system.stop();
            if (!this.layers.some(layer => layer.system.hasPendingWork))
                this.mode = 'stopped';
            else if (this.mode === 'paused')
                this.previous = 'draining';
            else
                this.mode = 'draining';
        });
    }
    reset() {
        this.guard(['stopped', 'playing', 'draining', 'paused']);
        this.run(() => { for (const { system } of this.layers)
            system.reset(); this.mode = 'stopped'; this.previous = 'playing'; });
    }
    setOrigin(x, y) {
        this.guard(['stopped', 'playing', 'draining', 'paused']);
        finite(x, 'origin.x');
        finite(y, 'origin.y');
        const origins = this.config.layers.map((layer) => ({ x: x + (layer.origin?.x ?? 0), y: y + (layer.origin?.y ?? 0) }));
        for (const origin of origins) {
            finite(origin.x, 'Layer origin.x');
            finite(origin.y, 'Layer origin.y');
        }
        this.run(() => { this.layers.forEach(({ system }, index) => system.setOrigin(origins[index].x, origins[index].y)); });
    }
    update(seconds) {
        this.guard(['stopped', 'playing', 'draining', 'paused']);
        finite(seconds, 'dtSeconds');
        if (seconds < 0)
            throw new RangeError('dtSeconds must be nonnegative');
        this.run(() => {
            if (seconds === 0 || this.mode === 'stopped' || this.mode === 'paused')
                return;
            for (const { system } of this.layers)
                system.update(seconds);
            if (this.mode === 'draining' && this.layers.every(({ system }) => system.state === 'stopped'))
                this.mode = 'stopped';
        });
    }
    destroy() {
        this.guard(['stopped', 'playing', 'draining', 'paused', 'faulted', 'destroyed']);
        if (this.mode === 'destroyed')
            return;
        this.busy = true;
        const failures = [];
        const attempt = (fn) => { try {
            fn();
        }
        catch (error) {
            failures.push(error);
        } };
        try {
            attempt(() => this.container.removeFromParent());
            for (const layer of this.layers) {
                attempt(() => layer.system.destroy());
                attempt(() => layer.container.removeFromParent());
            }
            for (const texture of this.ownedViews)
                if (!texture.destroyed)
                    attempt(() => texture.destroy(false));
            if (!this.container.destroyed)
                attempt(() => this.container.destroy({ children: false, texture: false, textureSource: false }));
            if (failures.length && !this.cleanupFailure)
                this.cleanupFailure = Object.assign(new Error('Entity cleanup failed'), { cleanupErrors: failures });
            if (this.cleanupFailure) {
                this.mode = 'faulted';
                this.failure = this.failure ?? this.cleanupFailure;
                throw this.cleanupFailure;
            }
            this.mode = 'destroyed';
        }
        finally {
            this.busy = false;
        }
    }
}
export async function createPixiParticleEntity(options) {
    object(options, 'Entity options');
    knownKeys(options, ['config', 'resolveTexture', 'space', 'gravity'], 'Entity options');
    if (!('config' in options) || options.config === undefined || typeof options.resolveTexture !== 'function')
        throw new TypeError('config and resolveTexture are required');
    const config = typeof options.config === 'string' ? parseParticleEntityConfig(options.config) : validateParticleEntityConfig(options.config);
    if (config.layers.some(layer => layer.modules?.trails?.worldSpace) && !options.space)
        throw new TypeError('World-space trails require space');
    const runtime = createPixiParticleSpaceRuntime(options, config.layers.map(layer => compileParticleEffectConfig(getParticleEntityLayerEffectConfig(layer)).main));
    const root = new Container();
    const layers = [];
    const ownedViews = [];
    try {
        const sets = new Map();
        for (const set of config.textureSets) {
            let textures;
            if (set.grid) {
                const base = await options.resolveTexture(Object.freeze({ asset: set.grid.asset }));
                const { asset: _asset, ...dimensions } = set.grid;
                textures = createGridParticleTextures(base, dimensions);
                ownedViews.push(...textures);
            }
            else {
                const resolved = [];
                for (const reference of set.textures)
                    resolved.push(await options.resolveTexture(reference));
                textures = Object.freeze(resolved);
            }
            for (const texture of textures)
                validateParticleTexture(texture);
            if (textures.some((texture) => texture.source !== textures[0].source))
                throw new TypeError('Each texture set must share one TextureSource');
            sets.set(set.id, textures);
        }
        for (const layer of config.layers) {
            const bounds = layer.renderer.boundsArea;
            const effectConfig = getParticleEntityLayerEffectConfig(layer);
            const compiled = runtime ? compileParticleEffectConfig(effectConfig, runtime.environment()) : compileParticleEffectConfig(effectConfig);
            const effect = createCompiledFrameEffect(compiled, { textures: sets.get(layer.renderer.textureSet),
                textureSheetAnimation: getParticleEntityLayerTextureSheetAnimation(layer),
                randomSeed: effectConfig.main ? aliasValue(effectConfig.main, 'randomSeed', 'seed', 1) : 1,
                ...('blendMode' in layer.renderer ? { blendMode: layer.renderer.blendMode } : {}),
                ...(bounds ? { boundsArea: new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height) } : {}) }, layer.renderer.trail ? {
                texture: sets.get(layer.renderer.trail.textureSet)[0],
                ...('blendMode' in layer.renderer.trail ? { blendMode: layer.renderer.trail.blendMode } : {}),
                ...('tint' in layer.renderer.trail ? { tint: layer.renderer.trail.tint } : {}),
                ...('alpha' in layer.renderer.trail ? { alpha: layer.renderer.trail.alpha } : {}),
            } : undefined);
            layers.push(Object.freeze({ id: layer.id, ...effect }));
            effect.system.setOrigin(layer.origin?.x ?? 0, layer.origin?.y ?? 0);
            if (runtime) {
                if (effect.trailContainer)
                    runtime.attach(effect.trailContainer, effectConfig.trails?.worldSpace ? 'world' : effectConfig.main?.simulationSpace ?? 'local', root);
                runtime.attach(effect.container, effectConfig.main?.simulationSpace ?? 'local', root);
            }
            else {
                if (effect.trailContainer)
                    root.addChild(effect.trailContainer);
                root.addChild(effect.container);
            }
        }
        if (runtime)
            runtime.attach(root, 'world');
        return new PixiParticleEntity(root, layers, config, ownedViews, runtime);
    }
    catch (error) {
        const cleanupErrors = [];
        const attempt = (fn) => { try {
            fn();
        }
        catch (failure) {
            cleanupErrors.push(failure);
        } };
        for (const layer of layers)
            attempt(() => layer.system.destroy());
        for (const texture of ownedViews)
            attempt(() => texture.destroy(false));
        attempt(() => root.removeFromParent());
        attempt(() => root.destroy({ children: false, texture: false, textureSource: false }));
        if (cleanupErrors.length)
            throw Object.assign(new Error('Entity construction and cleanup failed'), { cause: error, cleanupErrors });
        throw error;
    }
}

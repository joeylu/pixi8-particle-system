import 'pixi.js/particle-container';
import 'pixi.js/mesh';
import { Application, Assets, Container, Rectangle } from 'pixi.js';
import { createPixiParticleEffect } from 'geminant-particles/pixi';
import { ASSETS } from './editor-model.js';

export async function createParticlePreview(host, { onStats = () => {}, onError = () => {}, onEmitter = () => {} } = {}) {
  const app = new Application();
  try {
    await app.init({ preference: ['webgl'], autoStart: false, backgroundAlpha: 0,
      antialias: true, autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 2),
      width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight) });
  } catch (error) {
    try { app.destroy(true, { children: true }); } catch { /* Preserve initialization failure. */ }
    throw error;
  }
  const world = new Container();
  const emitter = new Container();
  app.stage.addChild(world);
  world.addChild(emitter);
  host.appendChild(app.canvas);
  app.canvas.setAttribute('aria-label', 'Particle system scene preview');
  app.canvas.style.touchAction = 'none';
  let current, currentConfig, destroyed = false, requestId = 0, frameId;
  const retiredSystems = new Set();
  let fault, transport = 'stopped', pausedTarget = 'playing';
  let elapsed = 0, lastTime, lastStats = 0, fps = 0, centered = true, dragPointer;
  let timeScale = 1, followPointer = false;
  const stats = () => onStats({ state: fault ? 'faulted' : transport, count: current?.system.particleCount ?? 0, fps, elapsed });
  const fail = (error) => { fault = error; stats(); onError(error); };
  const ensureLive = () => {
    if (destroyed) throw new Error('Particle preview has been destroyed');
    if (fault) throw fault;
    if (!current) throw new Error('No particle effect is ready');
  };
  const position = (x, y) => {
    emitter.position.set(Math.max(0, Math.min(app.screen.width, x)), Math.max(0, Math.min(app.screen.height, y)));
    onEmitter({ x: emitter.x, y: emitter.y });
  };
  const center = () => { centered = true; position(app.screen.width / 2, app.screen.height * 0.65); };
  center();
  const observer = new ResizeObserver(() => {
    if (destroyed || fault) return;
    try {
      app.renderer.resize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
      if (centered) center(); else position(emitter.x, emitter.y);
    } catch (error) { fail(error); }
  });
  observer.observe(host);
  const move = (event) => {
    if (destroyed || fault || (!followPointer && event.pointerId !== dragPointer)) return;
    const rect = app.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    centered = false;
    position((event.clientX - rect.left) * app.screen.width / rect.width,
      (event.clientY - rect.top) * app.screen.height / rect.height);
  };
  const down = (event) => {
    if (event.button !== 0 || fault) return;
    dragPointer = event.pointerId;
    app.canvas.setPointerCapture(event.pointerId);
    move(event);
  };
  const up = (event) => {
    if (event.pointerId !== dragPointer) return;
    dragPointer = undefined;
    if (app.canvas.hasPointerCapture(event.pointerId)) app.canvas.releasePointerCapture(event.pointerId);
  };
  app.canvas.addEventListener('pointerdown', down);
  app.canvas.addEventListener('pointermove', move);
  app.canvas.addEventListener('pointerup', up);
  app.canvas.addEventListener('pointercancel', up);
  app.canvas.addEventListener('lostpointercapture', up);
  const tick = (now) => {
    if (destroyed) return;
    const realDt = lastTime === undefined ? 0 : Math.max(0, (now - lastTime) / 1000);
    lastTime = now;
    fps = realDt > 0 ? Math.round(1 / realDt) : 0;
    if (!fault) {
      try {
        if (current) {
          const advancing = transport === 'playing' || transport === 'draining';
          const dt = advancing ? Math.min(realDt, 0.05) * timeScale : 0;
          current.system.update(dt);
          if (advancing) elapsed += dt;
          if (transport === 'draining' && current.system.state === 'stopped') transport = 'stopped';
        }
        app.render();
        if (current && now - lastStats >= 250) { lastStats = now; stats(); }
      } catch (error) { fail(error); }
    }
    frameId = requestAnimationFrame(tick);
  };
  frameId = requestAnimationFrame(tick);
  const texture = async (id) => {
    const asset = ASSETS.find((item) => item.id === id);
    if (!asset) throw new Error(`Unknown particle texture: ${id}`);
    return Assets.load(asset.url);
  };
  return {
    async apply(config) {
      if (destroyed) throw new Error('Particle preview has been destroyed');
      const id = ++requestId;
      // Snapshot before awaiting images; later UI mutations cannot alter this request.
      const snapshot = structuredClone(config);
      let candidate;
      try {
        const [body, tail] = await Promise.all([texture(snapshot.textureId),
          snapshot.trail ? texture(snapshot.trail.textureId) : Promise.resolve(undefined)]);
        if (destroyed || id !== requestId) return;
        candidate = createPixiParticleEffect({ ...snapshot.effect, texture: body,
          blendMode: snapshot.blendMode, space: { world, emitter }, gravity: snapshot.gravity,
          boundsArea: new Rectangle(-100000, -100000, 200000, 200000),
          ...(snapshot.trail ? { trailRenderer: { texture: tail, blendMode: snapshot.trail.blendMode,
            tint: snapshot.trail.tint, alpha: snapshot.trail.alpha } } : {}) });
        if (destroyed || id !== requestId) { candidate.system.destroy(); return; }
        const nextState = current ? transport : 'playing';
        if (nextState !== 'stopped') {
          candidate.system.play();
          if (nextState === 'paused') candidate.system.pause();
          else if (nextState === 'draining') candidate.system.stop();
        }
        candidate.system.update(0);
        const previous = current;
        current = candidate;
        candidate = undefined;
        currentConfig = snapshot;
        fault = undefined;
        transport = nextState === 'draining' ? current.system.state : nextState;
        elapsed = 0;
        stats();
        if (previous) {
          retiredSystems.add(previous.system);
          previous.system.destroy();
          retiredSystems.delete(previous.system);
        }
      } catch (error) {
        if (candidate) {
          try { candidate.system.destroy(); } catch (cleanupError) {
            retiredSystems.add(candidate.system); onError(cleanupError);
          }
        }
        // Superseded image requests must not overwrite the latest UI result.
        if (!destroyed && id === requestId) throw error;
      }
    },
    toggle() {
      ensureLive();
      if (transport === 'paused') {
        current.system.resume();
        transport = pausedTarget;
        if (pausedTarget === 'draining') { current.system.stop(); transport = current.system.state; }
      } else if (transport === 'stopped') {
        current.system.play(); transport = 'playing';
      } else {
        pausedTarget = transport; current.system.pause(); transport = 'paused';
      }
      stats();
      return transport;
    },
    restart() {
      ensureLive(); current.system.reset(); current.system.play();
      transport = 'playing'; pausedTarget = 'playing'; elapsed = 0; stats();
    },
    stop() {
      ensureLive();
      current.system.stop();
      if (transport === 'paused' && current.system.state === 'paused') pausedTarget = 'draining';
      else transport = current.system.state;
      stats();
    },
    burst(count) {
      ensureLive();
      if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('Burst count must be a nonnegative safe integer');
      if (transport === 'paused') throw new Error('Resume the simulation before emitting a burst');
      const main = currentConfig.effect.main ?? {};
      const capacity = main.maxParticles ?? 128;
      const budget = main.maxBirthsPerUpdate ?? capacity;
      if (count > budget) throw new RangeError(`Burst exceeds the per-update birth budget (${budget})`);
      const free = capacity - current.system.particleCount;
      if (count > free) throw new RangeError(`Burst exceeds free particle capacity (${free})`);
      current.system.emit(count); transport = current.system.state; stats();
    },
    center,
    setScene(scene) {
      if (destroyed) throw new Error('Particle preview has been destroyed');
      if (!Number.isFinite(scene.timeScale) || scene.timeScale < 0) throw new RangeError('Simulation speed must be finite and nonnegative');
      if (typeof scene.followPointer !== 'boolean') throw new TypeError('Follow pointer must be a boolean');
      timeScale = scene.timeScale; followPointer = scene.followPointer;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true; ++requestId; cancelAnimationFrame(frameId); observer.disconnect();
      const errors = [];
      for (const [type, handler] of [['pointerdown', down], ['pointermove', move], ['pointerup', up],
        ['pointercancel', up], ['lostpointercapture', up]]) app.canvas.removeEventListener(type, handler);
      for (const cleanup of [() => current?.system.destroy(),
        ...Array.from(retiredSystems, (system) => () => system.destroy()),
        () => app.destroy(true, { children: true, texture: false, textureSource: false })]) {
        try { cleanup(); } catch (error) { errors.push(error); }
      }
      if (errors.length) throw new AggregateError(errors, 'Particle preview cleanup failed');
    },
  };
}

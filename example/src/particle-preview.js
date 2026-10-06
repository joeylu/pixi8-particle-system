import 'pixi.js/particle-container';
import 'pixi.js/mesh';
import { Application, Assets, Container } from 'pixi.js';
import { createPixiParticleEntity } from 'geminant-particles/pixi';
import { ASSETS } from './editor-model.js';
import { stepFlight, sampleDuration } from './preview-flight.js';

export async function createParticlePreview(host, { onStats = () => {}, onError = () => {}, onEmitter = () => {}, onHandles = () => {} } = {}) {
  const app = new Application();
  try { await app.init({ preference: ['webgl'], autoStart: false, backgroundAlpha: 0, antialias: true, autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2), width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight) }); }
  catch (error) { try { app.destroy(true, { children: true }); } catch { /* Preserve original failure. */ } throw error; }
  const world = new Container(); app.stage.addChild(world); host.appendChild(app.canvas);
  app.canvas.setAttribute('aria-label', 'Particle and projectile scene preview'); app.canvas.style.touchAction = 'none';
  let current, packet, destroyed = false, requestId = 0, effectEpoch = 0, frameId, fault;
  let transport = 'stopped', phase = 'idle', pausedTarget = 'playing';
  let elapsed = 0, lastTime, lastStats = 0, fps = 0, centered = true, dragPointer, dragHandle;
  let timeScale = 1, followPointer = false, loopWait = 0, loopEnabled = false, pendingLaunch = false, pendingTransients = 0;
  let start = { x: 0, y: 0 }, target = { x: 0, y: 0 }, head = { x: 0, y: 0 };
  const transients = new Set(), owned = new Set();
  const handles = () => { onEmitter({ ...start }); onHandles({ start: { ...start }, target: { ...target }, head: { ...head } }); };
  const stats = () => onStats({ state: fault ? 'faulted' : transport, phase, fps, elapsed,
    count: (current?.entity.particleCount ?? 0) + [...transients].reduce((n, item) => n + item.entity.particleCount, 0),
    layers: current?.entity.layers.map(({ id, system }) => ({ id, count: system.particleCount, state: system.state })) ?? [] });
  const fail = (error) => { fault = error; stats(); onError(error); };
  const ensureLive = () => { if (destroyed) throw new Error('Preview has been destroyed'); if (fault) throw fault; if (!packet) throw new Error('Preview is not ready'); };
  const pose = (item, point, rotation = 0) => { item.emitter.position.set(point.x, point.y); item.emitter.rotation = rotation; };
  const angle = () => Math.atan2(target.y - head.y, target.x - head.x);
  const dispose = (item) => { if (!item) return; item.entity.destroy(); item.emitter.destroy(); owned.delete(item); transients.delete(item); };
  const resolveTexture = ({ asset }) => { const found = ASSETS.find((item) => item.id === asset); if (!found) throw new Error(`Unknown texture: ${asset}`); return Assets.load(found.url); };
  async function construct(config, point, rotation, gravity) {
    if (!config) return undefined;
    const emitter = new Container(); world.addChild(emitter); emitter.position.set(point.x, point.y); emitter.rotation = rotation;
    try { const entity = await createPixiParticleEntity({ config, resolveTexture, space: { emitter, world }, gravity }); const item = { emitter, entity }; owned.add(item); return item; }
    catch (error) { emitter.destroy(); throw error; }
  }
  async function transient(config, point, rotation = 0) {
    if (!config) return;
    const token = requestId, epoch = effectEpoch, snapshot = { ...point }, gravity = packet.gravity; let item;
    pendingTransients++;
    try { item = await construct(config, snapshot, rotation, gravity);
      if (destroyed || token !== requestId || epoch !== effectEpoch) { dispose(item); return; }
      item.entity.play(); item.entity.update(0); transients.add(item);
      if (transport === 'paused' && item.entity.state !== 'stopped') item.entity.pause(); stats();
    } catch (error) { if (item) { try { dispose(item); } catch (cleanup) { onError(cleanup); } } if (!destroyed && token === requestId && epoch === effectEpoch) { onError(error); throw error; } }
    finally { pendingTransients--; }
  }
  function beginFlight() {
    ++effectEpoch;
    head = { ...start }; phase = 'flying'; loopWait = 0; pendingLaunch = false;
    if (current) { current.entity.reset(); pose(current, head, angle()); current.entity.play(); current.entity.update(0); }
    transport = current ? 'playing' : 'stopped'; pausedTarget = 'playing'; handles();
  }
  function endFlight(withImpact) {
    if (phase !== 'flying') return Promise.resolve();
    const rotation = current?.emitter.rotation ?? angle();
    if (current) { pose(current, head, rotation); current.entity.stop({ killLayerIds: packet.killLayerIds ?? [] }); }
    phase = 'draining'; if (transport === 'paused') pausedTarget = 'draining'; else transport = 'draining';
    handles(); stats(); return withImpact && packet.host.impact ? transient(packet.impactConfig, head, rotation) : Promise.resolve();
  }
  function clamp(point) { return { x: Math.max(0, Math.min(app.screen.width, point.x)), y: Math.max(0, Math.min(app.screen.height, point.y)) }; }
  function center() {
    centered = true;
    if (packet?.mode === 'projectile') { start = { x: app.screen.width * .2, y: app.screen.height * .55 }; target = { x: app.screen.width * .8, y: app.screen.height * .4 }; }
    else { start = { x: app.screen.width * .5, y: app.screen.height * .65 }; target = { x: app.screen.width * .8, y: app.screen.height * .4 }; }
    if (packet?.mode !== 'projectile' || phase === 'idle' || phase === 'stopped') { head = { ...start }; if (current) pose(current, start); }
    handles();
  }
  center();
  const observer = new ResizeObserver(() => { if (destroyed) return; try { app.renderer.resize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight)); if (centered) center(); else { start = clamp(start); target = clamp(target); handles(); } } catch (error) { fail(error); } }); observer.observe(host);
  function pointerPoint(event) { const rect = app.canvas.getBoundingClientRect(); return clamp({ x: (event.clientX - rect.left) * app.screen.width / rect.width, y: (event.clientY - rect.top) * app.screen.height / rect.height }); }
  function move(event) {
    if (destroyed || fault || (event.pointerId !== dragPointer && !(followPointer && packet?.mode === 'particle'))) return;
    const point = pointerPoint(event); centered = false;
    if (dragHandle === 'target') target = point;
    else { start = point;
      if (packet?.mode !== 'projectile') { head = { ...start }; if (current) { pose(current, start); current.entity.update(0); } }
      else if (phase === 'flying') { void endFlight(false).catch(fail); pendingLaunch = true; }
    }
    // Endpoints edit the next flight sample; a live head never teleports.
    handles();
  }
  function down(event) { if (event.button !== 0 || fault) return;
    if (packet?.mode === 'projectile') { const point = pointerPoint(event), a = Math.hypot(point.x - start.x, point.y - start.y), b = Math.hypot(point.x - target.x, point.y - target.y); if (Math.min(a, b) > 24) return; dragHandle = a <= b ? 'start' : 'target'; }
    else dragHandle = 'start'; dragPointer = event.pointerId; app.canvas.setPointerCapture(event.pointerId); move(event);
  }
  function up(event) { if (event.pointerId !== dragPointer) return; dragPointer = undefined; dragHandle = undefined; if (app.canvas.hasPointerCapture(event.pointerId)) app.canvas.releasePointerCapture(event.pointerId); }
  const listeners = [['pointerdown', down], ['pointermove', move], ['pointerup', up], ['pointercancel', up], ['lostpointercapture', up]]; listeners.forEach(([type, fn]) => app.canvas.addEventListener(type, fn));
  function advance(dt) {
    let remaining = dt;
    while (remaining > 0) {
      const slice = Math.min(remaining, sampleDuration(packet?.mode === 'projectile' ? packet.host.speed : 0)); remaining -= slice;
      if (packet?.mode === 'projectile' && phase === 'flying') {
        const next = stepFlight(head, target, packet.host.speed, slice); head = next.point;
        if (current) { pose(current, head, next.angle); current.entity.update(slice); } handles();
        if (next.arrived) void endFlight(true).catch(fail);
      } else current?.entity.update(slice);
      for (const item of [...transients]) { item.entity.update(slice); if (item.entity.state === 'stopped') dispose(item); }
      elapsed += slice;
      const drained = (!current || current.entity.state === 'stopped') && !transients.size && !pendingTransients;
      if (packet?.mode === 'projectile' && phase === 'draining' && drained) { phase = loopEnabled || pendingLaunch ? 'waiting' : 'stopped'; transport = phase === 'waiting' ? 'playing' : 'stopped'; loopWait = pendingLaunch ? packet.host.loopDelay : 0; }
      else if (phase === 'waiting') { loopWait += slice; if (loopWait >= packet.host.loopDelay) { beginFlight(); if (packet.host.launchFlash) void transient(packet.flashConfig, start, angle()).catch(fail); } }
      else if (packet?.mode === 'particle' && drained) { transport = 'stopped'; phase = 'stopped'; }
    }
  }
  function tick(now) {
    if (destroyed) return; const realDt = lastTime === undefined ? 0 : Math.max(0, (now - lastTime) / 1000); lastTime = now; fps = realDt > 0 ? Math.round(1 / realDt) : 0;
    if (!fault) try { if (packet && (transport === 'playing' || transport === 'draining')) advance(Math.min(realDt, .1) * timeScale); app.render(); if (now - lastStats >= 250) { lastStats = now; stats(); } } catch (error) { fail(error); }
    frameId = requestAnimationFrame(tick);
  }
  frameId = requestAnimationFrame(tick);
  const api = {
    async apply(value) {
      if (destroyed) throw new Error('Preview has been destroyed');
      const token = ++requestId, snapshot = structuredClone(value), changedMode = packet?.mode !== snapshot.mode;
      let candidate;
      try {
        const initial = changedMode ? { x: app.screen.width * (snapshot.mode === 'projectile' ? .2 : .5), y: app.screen.height * (snapshot.mode === 'projectile' ? .55 : .65) } : head;
        candidate = await construct(snapshot.config, initial, changedMode ? 0 : current?.emitter.rotation ?? 0, snapshot.gravity);
        if (destroyed || token !== requestId) { dispose(candidate); return; }
        // Loading may span arrival, pause, stop, resize or pointer edits. Read intent now.
        const next = changedMode ? 'playing' : transport;
        const restartFlight = snapshot.mode === 'projectile' && (changedMode || next === 'playing' || (next === 'paused' && pausedTarget === 'playing'));
        const committedPhase = !snapshot.config ? 'idle' : next === 'stopped' ? 'stopped' : restartFlight ? 'flying' : changedMode ? 'playing' : next === 'draining' || (next === 'paused' && pausedTarget === 'draining') ? 'draining' : phase;
        const committedPoint = changedMode ? { x: app.screen.width * (snapshot.mode === 'projectile' ? .2 : .5), y: app.screen.height * (snapshot.mode === 'projectile' ? .55 : .65) } : restartFlight || snapshot.mode === 'particle' ? { ...start } : { ...head };
        const committedTarget = changedMode ? { x: app.screen.width * .8, y: app.screen.height * .4 } : target;
        if (candidate) {
          const committedRotation = snapshot.mode === 'projectile' ? restartFlight ? Math.atan2(committedTarget.y - committedPoint.y, committedTarget.x - committedPoint.x) : current?.emitter.rotation ?? 0 : 0;
          pose(candidate, committedPoint, committedRotation);
          if (next !== 'stopped') {
            candidate.entity.play();
            if (committedPhase === 'draining') candidate.entity.stop(snapshot.mode === 'projectile' ? { killLayerIds: snapshot.killLayerIds ?? [] } : undefined);
            if (next === 'paused' && candidate.entity.state !== 'stopped') candidate.entity.pause();
          }
          candidate.entity.update(0);
        }
        const previous = current; current = candidate; candidate = undefined; packet = snapshot; fault = undefined; loopEnabled = snapshot.host.loop;
        transport = snapshot.config ? next : 'stopped';
        phase = committedPhase;
        if (changedMode) { pendingLaunch = false; pausedTarget = 'playing'; elapsed = 0; center(); head = { ...committedPoint }; }
        else if (restartFlight && current) { pendingLaunch = false; head = { ...committedPoint }; elapsed = 0; }
        if (!snapshot.config) phase = 'idle';
        if (changedMode || !snapshot.config) for (const item of [...transients]) dispose(item);
        if (!snapshot.config) { ++effectEpoch; pendingLaunch = false; loopEnabled = false; }
        dispose(previous); handles(); stats();
        if (changedMode && current && snapshot.mode === 'projectile' && snapshot.host.launchFlash) await transient(snapshot.flashConfig, start, angle());
      } catch (error) { if (candidate) try { dispose(candidate); } catch (cleanup) { onError(cleanup); } if (!destroyed && token === requestId) { onError(error); throw error; } }
    },
    toggle() { ensureLive();
      if (transport === 'paused') { if (current?.entity.state === 'paused') current.entity.resume(); for (const item of transients) if (item.entity.state === 'paused') item.entity.resume(); transport = pausedTarget; }
      else if (transport === 'stopped') return api.restart();
      else { pausedTarget = transport; if (current && ['playing', 'draining'].includes(current.entity.state)) current.entity.pause(); for (const item of transients) if (['playing', 'draining'].includes(item.entity.state)) item.entity.pause(); transport = 'paused'; }
      stats(); return transport;
    },
    restart() { ensureLive(); ++effectEpoch; for (const item of [...transients]) dispose(item); elapsed = 0; loopEnabled = packet.host.loop;
      if (!current) { transport = 'stopped'; stats(); return transport; }
      if (packet.mode === 'projectile') { beginFlight(); if (packet.host.launchFlash) void transient(packet.flashConfig, start, angle()).catch(fail); }
      else { current.entity.reset(); pose(current, start); current.entity.play(); transport = 'playing'; phase = 'playing'; pausedTarget = 'playing'; }
      stats(); return transport;
    },
    stop() { ensureLive(); ++effectEpoch; loopEnabled = false; pendingLaunch = false;
      if (packet.mode === 'projectile' && phase === 'flying') void endFlight(false).catch(fail); else current?.entity.stop();
      for (const item of transients) item.entity.stop();
      if (transport === 'paused') pausedTarget = 'draining'; else transport = (current && current.entity.state !== 'stopped') || transients.size ? 'draining' : 'stopped';
      phase = transport === 'stopped' ? 'stopped' : 'draining'; stats();
    },
    async burst() { ensureLive(); if (packet.mode !== 'particle') return; if (transport === 'paused') throw new Error('Resume before emitting a burst'); await transient(packet.manualConfig, start); if (transients.size && transport === 'stopped') { transport = 'draining'; phase = 'draining'; } stats(); },
    async launch() { ensureLive(); if (packet.mode !== 'projectile' || !current) return; loopEnabled = packet.host.loop; if (phase === 'flying') await endFlight(false);
      if (current.entity.state !== 'stopped' || transients.size) { phase = 'draining'; if (transport === 'paused') { if (current.entity.state === 'paused') current.entity.resume(); for (const item of transients) if (item.entity.state === 'paused') item.entity.resume(); } transport = 'draining'; pendingLaunch = true; return; }
      beginFlight(); loopEnabled = packet.host.loop; if (packet.host.launchFlash) await transient(packet.flashConfig, start, angle()); stats();
    },
    async hit() { ensureLive(); if (packet.mode === 'projectile') await endFlight(true); },
    center,
    setScene(scene) { if (destroyed) throw new Error('Preview has been destroyed'); if (!Number.isFinite(scene.timeScale) || scene.timeScale < 0) throw new RangeError('Simulation speed must be finite and nonnegative'); timeScale = scene.timeScale; followPointer = scene.followPointer === true; },
    destroy() { if (destroyed) return; destroyed = true; ++requestId; cancelAnimationFrame(frameId); observer.disconnect(); listeners.forEach(([type, fn]) => app.canvas.removeEventListener(type, fn)); const errors = []; for (const item of [...owned]) try { dispose(item); } catch (error) { errors.push(error); } try { app.destroy(true, { children: true, texture: false, textureSource: false }); } catch (error) { errors.push(error); } if (errors.length) throw new AggregateError(errors, 'Preview cleanup failed'); },
  };
  return api;
}


import { Application, Texture } from 'pixi.js';
import { createPixiParticleEffect } from 'geminant-particles/pixi';

// Keep effect configuration separate from UI controls; the demo owns and releases its texture.
const effectConfig = {
  main: {
    maxParticles: 1600,
    lifetimeSeconds: 2.4,
    startSpeed: { min: 35, max: 180 },
    startScale: { min: 0.18, max: 0.55 },
    startTint: 0xa5efd2,
    seed: 8,
  },
  emission: { rateOverTime: 380 },
  shape: { type: 'circle', radius: 8, spreadRadians: Math.PI * 2 },
  colorOverLifetime: { endTint: 0x5c89ed, endAlphaFactor: 0 },
  sizeOverLifetime: { endScaleFactor: 0.1 },
};

function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.2, '#ffffff');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);
  return Texture.from(canvas);
}

export async function createParticleDemo(host, onCount) {
  const app = new Application();
  await app.init({
    resizeTo: host,
    background: '#0d1420',
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    preference: 'webgl',
  });

  const texture = createParticleTexture();
  const { system, container } = createPixiParticleEffect({
    ...effectConfig,
    texture,
    blendMode: 'add',
  });
  app.stage.addChild(container);
  host.appendChild(app.canvas);
  app.canvas.setAttribute('aria-label', 'PixiJS animated particle canvas');

  const center = () => system.setOrigin(app.screen.width / 2, app.screen.height / 2);
  const move = (event) => {
    const bounds = app.canvas.getBoundingClientRect();
    system.setOrigin(
      (event.clientX - bounds.left) * app.screen.width / bounds.width,
      (event.clientY - bounds.top) * app.screen.height / bounds.height,
    );
  };
  const tick = (ticker) => {
    system.update(Math.min(ticker.deltaMS / 1000, 0.05));
    onCount(system.particleCount);
  };
  center();
  system.play();
  app.ticker.add(tick);
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerleave', center);
  app.renderer.on('resize', center);

  return {
    toggle() {
      if (system.state === 'paused') system.resume();
      else system.pause();
      return system.state === 'paused';
    },
    reset() {
      system.reset();
      center();
      system.play();
      onCount(0);
    },
    destroy() {
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', center);
      app.renderer.off('resize', center);
      app.ticker.remove(tick);
      system.destroy();
      app.destroy(true, { children: true });
      texture.destroy(true);
    },
  };
}

# Particle Library

This directory is an asset library, not runtime game code.

Before using these assets in an H5 game, copy the required PNG files into `h5game/` and implement the particle runtime inside `h5game/src/`.

## Available Effects

- `fire`: sparks, embers, and light smoke.
- `water`: drops, foam, and splash shapes.
- `smoke`: soft puffs and diffuse clouds.
- `dust`: dots, chips, and puffs.

Each effect folder has a `manifest.js` with texture metadata and PixiJS v8-compatible layer parameters.
Texture entries use `file` for the source PNG path relative to that effect folder.

## Required PixiJS v8 Pattern

When implementing these effects in `h5game/src/`, use this API shape:

```js
import { Assets, Container, Particle, ParticleContainer, Rectangle } from 'pixi.js';
```

Rules:

- Load textures with `Assets.load(...)`.
- Create one `ParticleContainer` per layer.
- Every `ParticleContainer` layer must use exactly one texture.
- Add particles with `container.addParticle(new Particle(...))`.
- Remove particles with `container.removeParticle(...)`.
- Store particles with your own state array or `container.particleChildren`.
- Set `boundsArea` on every `ParticleContainer`.
- Enable `dynamicProperties` for animated particle fields.

Do not:

- Do not import this asset library directly from final runtime code.
- Do not reference `user-assets/` from built game code.
- Do not put `Sprite` children inside `ParticleContainer`.
- Do not use `container.addChild(...)` for particles.
- Do not use old Pixi v7 particle APIs.

## Integration Flow

1. Read this README and the relevant effect `manifest.js`.
2. Copy only the needed PNG files into `h5game/src/assets/particles/` or `h5game/public/assets/particles/`.
3. Implement the particle effect code in `h5game/src/systems/particles/`.
4. Map each manifest layer to one PixiJS v8 `ParticleContainer`.
5. Run the H5 project build validation.

# pixi8-particle-system

Modular particle effect logic for PixiJS 8 `ParticleContainer`.

Pixi handles rendering; this library adds emission, motion, lifetime, and playback control.

- Compatible with PixiJS 8 `ParticleContainer`.
- Composable modules for spawning, motion, color, size, rotation, and trails.
- Gravity, continuous emission, and manual `emit(count)` bursts.
- Projectile effects with smoke and trails; local/world simulation.
- A static Particle Lab website for exploring effects and adjusting parameters.

## Particle Lab

Live preview, modular Inspector, four presets, and controls for gravity, emit, and trails.

![Particle Lab](example/screenshots/particle-lab.jpg)

![Gravity, emit, and trails](example/screenshots/emit-trails.jpg)

## Run the demo

```sh
cd example
npm install
npm run dev
```

For static hosting, run `npm run build` and deploy `example/dist/`.

## Documentation

- [Demo setup and controls](example/README.md)
- [Library integration and API](.agents/skills/skill-pixi-geminant-particles/references/runtime-integration.md)
- [Effect configuration](.agents/skills/skill-pixi-geminant-particles/references/effect-contract.md)
- [Projectile and smoke recipes](.agents/skills/skill-pixi-geminant-particles/references/recipes.md)

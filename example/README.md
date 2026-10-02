# Particle Lab

A single-emitter particle editor using Vite, PixiJS 8 and the local `geminant-particles/pixi` module. On desktop, the preview occupies two thirds of the workspace and the independently scrolling Inspector occupies one third. Narrow screens stack the panels.

```sh
npm install
npm run dev
```

Open the local URL printed in the terminal.

## Editor controls

- Expandable modules: Main, Emission, Shape, Force / Color / Size / Rotation over Lifetime, Trails and Renderer.
- Main controls fixed lifetime, speed/scale/rotation ranges, color, opacity, simulation space, gravity multiplier, capacity, random seed and the per-update birth budget.
- Module checkboxes enable optional behaviors. Disabled modules retain editing values but do not participate in validation or the running effect.
- Sliders, numeric inputs, selects and color controls rebuild the effect automatically, preserving paused/stopped transport state. The UI uses degrees; the model converts them to SDK radians.
- Transport supports pause/resume, restart, stop-and-drain, manual bursts and 0.25–2× simulation speed.
- Drag on the canvas to move the emitter; Follow pointer moves it without dragging. Center restores its position; Grid toggles the background.
- Four single-layer starting points: embers, water fountain, soft smoke and dust/debris.
- Renderer offers all 11 supplied PNG textures and Normal/Additive blending. Trails has independent texture, color, opacity and blending controls.
- Invalid parameters show an error while preserving the last valid preview. Reset preset restores the selected starting point.

The supplied textures are single-frame PNGs, so this editor does not expose texture-sheet animation. Host gravity is `(0, 300)` px/s² and is scaled by Main's Gravity modifier. Editor values are not persisted across refreshes.

## Build and check

```sh
npm run build
npm run preview
node --test src/editor-model.test.js
```

The static build is written to `dist/` and uses relative asset paths for deployment under a subdirectory.
The local particle module uses the existing build artifacts in `../geminum-particles/dist`.

## Source responsibilities

- `src/editor-model.js`: editor state, presets, asset catalog, validation and SDK conversion.
- `src/inspector.js`: expandable modules and parameter controls.
- `src/particle-preview.js`: WebGL drawing, particle lifecycle, asynchronous texture replacement and emitter interaction.
- `src/main.js`: page coordination, configuration updates and error display.
- `index.html` / `src/style.css`: layout and visual styling.
- `src/assets/particles/`: runtime copies of the supplied PNGs; source `particle-library/` is unchanged.

WebGL initialization, missing textures and render errors are reported explicitly. The preview does not substitute a white texture or silently switch rendering backends.

References: [Vite](https://vite.dev/guide/) · [PixiJS Application](https://pixijs.com/8.x/guides/components/application).

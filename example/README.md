# Particle & Projectile Labs

Two independent workspaces using Vite, PixiJS 8 and the local `geminant-particles/pixi` module. Switch with the top navigation or open `/#particle` and `/#projectile`. On desktop, the preview occupies two thirds of the workspace and the independently scrolling Inspector occupies one third. Narrow screens stack the panels.

Build `../geminum-particles` before running the demo after runtime source changes. Both workspaces consume the shared entity JSON schema. Fixed effects are described in the [Particle skill](../.agents/skills/skill-geminum-particle/SKILL.md); moving effects and host lifecycle use the [Projectile skill](../.agents/skills/skill-geminum-projectile/SKILL.md). Integration and extension are covered by the [development skill](../.agents/skills/skill-pixi-geminant-particles/SKILL.md).

```sh
npm install
npm run dev
```

Open the local URL printed in the terminal.

## Editor controls

- Expandable modules: Main, Emission, Shape, Force / Limit Velocity / Color / Size / Rotation over Lifetime, Trails, Renderer and Scene.
- Main controls lifetime, speed, scale, rotation and opacity ranges, X/Y scale aspect, color, simulation space, gravity multiplier, capacity, random seed and birth budget.
- Emission exposes delay, optional finite duration, looping and editable timed bursts. Shape adds circle annuli and fixed/outward/inward directions. Drag, normalized-age opacity/color/scale curves and velocity alignment use the latest runtime fields.
- Curves have 2–8 points with fixed age endpoints 0/1; add/remove internal points and edit their age and value. Invalid ordering is reported without replacing the last valid effect.
- Module checkboxes enable optional behaviors. Disabled modules retain editing values but do not participate in validation or the running effect.
- Sliders, numeric inputs, selects and color controls rebuild the effect automatically, preserving paused/stopped transport state. The UI uses degrees; the model converts them to SDK radians.
- Transport supports pause/resume, restart, stop-and-drain and 0.25–2× simulation speed. Finite effects automatically finish after particles and retained trails drain.
- Particle: drag the emitter or use Follow pointer; four starting points are embers, water fountain, soft smoke and dust/debris. Manual bursts use independent fixed-pose entities, including when automatic emission is disabled.
- Projectile: energy bolt, fireball and meteor presets each combine a local head with world sparks/smoke. Select a layer to edit or disable it independently. Launch/Hit now, speed, loop delay and optional launch flash/impact are host controls.
- Drag TARGET to redirect a live flight. Drag START ends a live flight at its current pose, keeps its remainder, and launches from the new source after draining. Center restores endpoint positions. Grid toggles the background.
- On impact the host stops future emission and kills only head layer IDs through `entity.stop({killLayerIds})`; world smoke and retained ribbons continue draining. A loop waits for all effects to drain before its delay and next launch. Pause freezes flight and all effects.
- Renderer offers all 11 supplied PNG textures and Normal/Additive blending. Trails has independent texture, color, opacity and blending controls.
- Invalid parameters show an error while preserving the last valid preview. Reset preset restores the selected starting point. Switching workspaces preserves their separate edited parameters in memory.
- View JSON opens the active effect layers in the actual entity format; Copy JSON copies the validated configuration. Logical texture IDs resolve through `ASSETS`; scene/flight controls and separate flash/impact entities are not included in that effect JSON.

The supplied textures are single-frame PNGs, so this editor does not expose texture-sheet animation or claim to cover all twelve Projectile families. Energy bolt uses a neutral existing texture so its cyan tint survives texture multiplication. Scene gravity defaults to `(0, 300)` px/s² and is editable; Main's Gravity modifier scales it for each layer. The demo host moves along sampled straight segments toward TARGET; particle gravity affects effect layers, not this host trajectory. Arrival/Hit now simulate a host hit event; this example implements no game collision detection. Editor values reset on page refresh.

## Build and check

```sh
npm run build
npm run preview
npm test
```

The static build is written to `dist/` and uses relative asset paths for deployment under a subdirectory.
The local particle module uses the existing build artifacts in `../geminum-particles/dist`.

## Source responsibilities

- `src/editor-model.js`: editor state, presets, asset catalog, validation and SDK conversion.
- `src/inspector.js`: expandable modules and parameter controls.
- `src/particle-preview.js`: WebGL drawing, entity lifecycle, separate transients, asynchronous replacement and endpoint interaction.
- `src/preview-flight.js`: pure flight stepping and sampling interval; its tests cover arrival, zero distance and live redirection.
- `src/main.js`: page coordination, configuration updates and error display.
- `index.html` / `src/style.css`: layout and visual styling.
- `src/assets/particles/`: runtime copies of the supplied PNGs; source `particle-library/` is unchanged.

WebGL initialization, missing textures and render errors are reported explicitly. The preview does not substitute a white texture or silently switch rendering backends.

References: [Vite](https://vite.dev/guide/) · [PixiJS Application](https://pixijs.com/8.x/guides/components/application).

# Recipe suggestions

These recipes are adjustable starting points, not defaults, mandatory layer counts, or fixed deliverable combinations. See [Configuration design](config-design.md) for tradeoffs, the [Schema](effect.schema.json) and [Configuration contract](effect-contract.md) for fields, and [Configuration validation](config-validation.md) for checks. Add brief notes only when external inputs are needed.

| Recipe | Visual composition | Adjustment directions |
| --- | --- | --- |
| [Explicit-frame flame](../assets/fire.effect.json) | Smoke, age-sequenced flames, and sparks using explicit frame names | Adjust fps for asset order, together with lifetime, density, scale, and transparency |
| [Grid flame](../assets/fire-grid.effect.json) | Random smoke cells, sequenced flame cells, and single-image sparks, with three add layers | Respect the compositing goal; more solid smoke may use normal with adjusted layer order |
| [World trails](../assets/trails.effect.json) | Burst sparks, accelerated curves, and ribbons retained after parent death | Speed/acceleration change the path; width and trail lifetime change the dragging appearance |
| [Space/gravity droplets](../assets/space-gravity.effect.json) | World droplets and emitter-attached local droplets with different gravity multipliers | Choose one layer or combine them; the host provides gravity and negative multipliers reverse it |
| [Flying light-projectile trail](../assets/projectile-trail.effect.json) | One autonomous world light particle and an additive continuous ribbon | Speed/lifetime determine range; width/trail lifetime determine the light ribbon |
| [Discrete smoke path](../assets/projectile-smoke.effect.json) | A moving emission point leaves random world smoke with normal compositing | Emission rate and movement speed control spacing; lifetime/expansion control dissipation |
| [Smoke with glowing head and trail](../assets/projectile-smoke-glow.effect.json) | World smoke behind a local glowing head, with worldSpace trails recording movement | Adjust head and smoke independently; the external route determines overall motion |

## Asset conventions

Explicit flames need smoke variants, atlas flame frames, and sparks. Grid flames need smoke4x4, flame4x4, and a single-image spark. Confirm full-cell dimensions and order from asset metadata. sequence selects frames by age; random selects variations at birth. Reference values such as fps 12 do not guarantee a complete cycle: a lifetime shorter than frameCount/fps shows only the initial portion.

One set shares a Source; different layers may use different sets and Sources. A logical asset is not a file location. Describe its image and frames without guessing actual paths. Trails require a separate single-frame ribbon material without trim/rotate.

## External inputs for projectiles and smoke

The flying light projectile uses reference values a burst count of 1, world, lifetime 1 second, and speed 180, moving autonomously along emitter-local +X. spark-glow and trail-glow are single-frame assets. Trail lifetime multiplier 0.35 retains points for about 0.35 seconds; width 8 is a visual starting point. Supply launch position, direction, and trigger timing according to the goal.

Discrete smoke uses random smoke4x4 variants, continuous world emission at 40 particles/second, reference lifetime 0.8 seconds, lower birth speed, and full-direction spread, expanding and fading with age. A moving emission point leaves smoke; it does not automatically track another autonomous flying particle. The host supplies the route and emission end timing. Faster movement at the same rate increases smoke-cloud spacing.

Smoke with a glowing head and trail reuses the same smoke parameters. The head is local, speed 0, a burst count of 1, so it follows emitter movement; worldSpace trails retain traversed positions. The reference head window is 1 second. The host positions the emitter before triggering, moves for about 1 second, ends smoke emission, and then lets retained particles dissipate. Continuous smoke does not stop spawning when its own startLifetime or the head lifetime ends. This does not mean smoke automatically follows an autonomous projectile. Route and end timing are external inputs; JSON does not add duration, attach, or subemitters fields.

## Adjustment suggestions

Dense smoke may use just the smoke layer; a clear flight path may use just the light head and trail. When dense add regions are too bright, adjust overlap density and width as well as alpha. Increasing particle lifetime increases population; increasing trail lifetime increases trails retained after death. Assess capacity and budgets together. Keep suggested values separate from valid ranges; use the Schema to determine configuration validity.

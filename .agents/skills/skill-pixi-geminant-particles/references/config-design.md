# From effect descriptions to configuration

This topic helps select visual layers and parameter combinations without requiring a fixed production order. Read the [JSON Schema](effect.schema.json) for fields, defaults, and valid ranges; the [Configuration contract](effect-contract.md) for structure and semantic mapping; [Recipe suggestions](recipes.md) for complete examples; and [Configuration validation](config-validation.md) before delivery. Configuration design does not require SDK discovery or rendering API knowledge.

## Identify visual roles

One effect may combine a body, smoke, halo, sparks, and a historical path, or use just one layer. The layers array determines draw order and layer stacking. Choose layers for the user's goal rather than including every role: smoke emphasizes volume and dissipation, light points emphasize brightness, and continuous trails emphasize positions already traversed.

"projectile" describes a flying object's purpose, not a module name. A light projectile may combine a fast body and short trail. A smoke path may instead use a moving emission point to produce discrete world-space smoke without Trails. When the user says "laser", distinguish a flying light projectile from a persistent beam between two endpoints; clarify only when ambiguity affects delivery. Trails records historical paths and does not represent a two-endpoint beam. Do not invent beam or endpoint fields.

## How parameters combine visually

| Visual goal | Parameter combinations and tradeoffs |
| --- | --- |
| Longer flight or persistence | Increasing startLifetime also increases displacement, frame playback time, and population; constant-speed displacement is approximately speed*lifetime, while acceleration changes the later path |
| Denser or sparser effects | rateOverTime changes birth density; steady continuous population is approximately rate*lifetime, with startup, bursts, and death boundaries also considered in capacity/birth budgets |
| Tighter or wider spread | shape position ranges define the birth region, while directionRadians/spreadRadians define velocity direction; these are independent, and disk births do not imply radial outward motion |
| Fuller smoke | startScale combines with asset orig dimensions to determine initial visual size; sizeOverLifetime changes the terminal age multiplier; lower birth speed, longer lifetime, and alpha decay can suggest lingering smoke |
| Sharper sparks | Smaller asset scale, higher speed, shorter lifetime, and clear direction can combine; color and alpha decay determine disappearance |
| Curving or falling | forceOverLifetime is constant acceleration in the selected simulation basis; gravityModifier scales host-provided world gravity, negative reverses it, and 0 disables it |
| Birth variation | speed/scale/rotation ranges create stable random variation; randomSeed helps repeat the same effect and should not replace asset variation |
| Color transitions | startTint and endTint interpolate linearly per RGB channel; alpha uses its birth value multiplied by an age factor, with asset transparency also contributing |
| Rotation | startRotation sets initial orientation; rotationOverLifetime.z changes rotation with age; angles use radians and angular speed uses radians/second |

These are suggested relationships, not additional defaults or hard ranges. Capacity and budgets are explicit failure boundaries; allow reasonable headroom for target density, larger update intervals, and bursts. Increasing a budget does not automatically increase emission density.

## Space, assets, and compositing

local suits attached effects that move and rotate with the emitter; world suits smoke, sparks, and droplets that remain in the game world after birth. Emission direction remains emitter-local, with world birth velocity transformed afterward. world is not screen space. Emitter movement does not automatically impart movement velocity to particles.

normal usually suits occlusion and transparent smoke; add usually suits glowing flames, sparks, and halos. Respect an explicit user compositing choice. Additive overlap brightens dense regions; normal layer order affects occlusion. Evaluate density and asset brightness together when adjusting alpha.

single suits fixed images; random suits smoke-cloud or fragment variations selected at birth; sequence suits age animation described by the assets. Frame order must come from asset metadata; grids use row-major order. fps and lifetime determine how many frames can play, one cycle lasts frameCount/fps, and loop independently controls repetition. Images alone cannot determine emission frequency, speed, or trigger timing. Frames in one set share a Source; different visual layers may use different sets.

## Choosing historical trails

Trails retains the continuous path traversed by one particle. width sets an independent fixed width. minVertexDistance affects path detail and point pressure; smaller spacing with fast movement needs more points, and reducing spacing cannot reconstruct unsampled motion. maxPointsPerTrail limits retained point count; reaching the limit shortens the visible path. maxTrails includes trails retained after parent death. lifetime multiplies the parent's total lifetime; dieWithParticles determines whether the trail disappears with its parent. worldSpace retains paths in world space; false follows the Main simulation basis. breakDistance splits large jumps to avoid connecting teleported positions with a long line.

Trail color/alpha is independent of the body; body fading does not imply matching trail fading. Trail material is a single frame without trim/rotate, stretched along the path. This topic selects configuration; exact field relationships belong to the Schema and configuration validator.

## Notes accompanying JSON

When external inputs are needed, briefly describe relevant asset metadata, the source of a moving emission point or direction, host gravity, or trigger/end timing. Do not require a complete checklist for every configuration. Do not disguise external inputs as JSON callbacks, game endpoints, or gravity vectors. Configuration describes the effect's own parameters; the integrating caller supplies external behavior.

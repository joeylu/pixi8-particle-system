# JSON entity semantics

The package-local [Schema](effect.schema.json) is the sole JSON field source of truth for fields, branches, required properties, ranges, and defaults. This document explains effect and resource meaning. See [Configuration design](config-design.md) for design guidance, [Recipes](recipes.md) for optional references, and [Configuration validation](config-validation.md) for checks.

## Layers and resource information

An entity consists of texture sets and layers. The layers array order is the drawing order. Organize smoke, glowing bodies, sparks, or other roles according to the goal; no fixed layer count or order is required. main, with core as a compatible alias, describes each layer's particle starting values and simulation settings. modules describes emission, shape, force, appearance, frame animation, and trails. renderer specifies resources and compositing. origin is the layer's local birth offset; boundsArea provides rendering bounds information.

continuous means ongoing emission and requires emission; burst means a one-time birth and cannot include emission. Capacity limits live particles, while the per-update birth budget limits births within one advance. The budget may exceed capacity. The effect goal determines fps, emission rate, lifetime, speed, and activation; these application parameters cannot be inferred from images alone.

Logical asset names are separate from file paths; frame is an atlas frame name. Before design, confirm atlas frame order or grid dimensions, physical pixel dimensions, trim/rotate metadata, and transparent edges. Each set chooses explicit textures or grid. Explicit list order is frame order; grids run left to right, then top to bottom.

Grids must divide the full frame evenly; there are no spacing, padding, or partial frame parameters. Actual input frames cannot be trimmed or rotated, orig and frame dimensions must match, and cell edges and frame origins align to integer physical pixels. Consult the Schema for the grid-generated frame limit; explicit textures do not use that same count limit. JSON cannot establish that an image meets these conditions.

Frames in one set must share a TextureSource, usually provided by one atlas. Different sets may use different Sources. Independent images cannot directly serve as a same-source frame list. normal provides ordinary transparent compositing; add provides additive glow. Choose according to the visual goal.

## Frame animation

textureSheetAnimation's selectionMode, with mode as a compatible alias, selects single, random, or sequence. single uses a fixed index. random chooses once per birth, with randomSeed and birth index controlling reproducible selection. sequence advances by particle age, using floor(ageSeconds*fps); loop repeats when enabled and otherwise holds the last frame.

One cycle lasts N/fps for N frames. A lifetime shorter than one cycle shows only the initial portion. loop is independent of particle lifetime. Particle age does not change while paused. There is no frame offset or custom frame-selection field.

Each layer must provide exactly one of modules.textureSheetAnimation and the compatible renderer.selection. Canonical and alias fields together are rejected even when their values match. Prefer the canonical names in the Schema when generating configurations.

## Space, gravity, and trails

main.simulationSpace determines the particle simulation coordinate basis; gravityModifier scales host gravity. Gravity vectors and host transforms are not serialized into recipes. JSON may describe world simulation or nonzero gravity without an existing target runtime environment.

modules.trails and renderer.trail must both be present or both omitted. The referenced trail set contains exactly one frame. Trails use observed motion paths and cannot reconstruct unobserved internal motion curves. worldSpace determines the trail basis; dieWithParticles determines whether trails are removed with their parent particle. JSON does not contain observation callbacks, game endpoints, or host resource objects.

## Cross-field relationships

Texture-set IDs and layer IDs are each unique; all texture references exist. single indices are within the corresponding frame count, range endpoints are ordered, and positive emission rates have finite reciprocals. burst counts do not exceed capacity or birth budget after defaults apply. Sequence fps multiplied by particle lifetime is finite, and grid dimension products are valid. Trails additionally check module/material association, single-frame resources, lifetime products, and distance relationships.

Schema defaults are annotations; the validator does not write them into JSON. Always consult the Schema for exact structure and numeric limits. See [Configuration validation](config-validation.md) for complete cross-field checks.

---
name: skill-pixi-geminant-particles
description: Design Geminant particle JSON configurations or integrate and diagnose Geminant particle effects, including layered effects, frame animation, trails, simulation space and gravity.
---

# Geminant Particles

Choose the reading path according to the user's deliverable. When both configuration and integration are needed, read the relevant parts of each.

## Configuration design

For effect proposals, asset configuration, or validatable JSON:

1. Read [Configuration design](references/config-design.md) to identify the effect goal, asset information, and layer responsibilities.
2. Read [JSON semantics](references/effect-contract.md) and the [Schema](references/effect.schema.json) to generate the configuration.
3. When recipe references are useful, read [Recipes](references/recipes.md), then select and adjust them for the goal.
4. Check JSON with [Configuration validation](references/config-validation.md), noting resource information that still needs confirmation.

This path can be completed independently, without discovering the target SDK, reading the runtime API, or writing integration code.

## Runtime integration and diagnosis

For loading configurations, creating running effects, integrating update loops, extending behavior, or diagnosing failures:

1. Read [Runtime integration](references/runtime-integration.md) to discover actual entry points, resource resolution, and host responsibilities in the target project.
2. Read [Runtime API](references/runtime-api.md). For trails, read [Trails](references/trails.md); for emitter movement, space, or gravity, read [Space and gravity](references/space-gravity.md).
3. For runtime acceptance, read [Validation](references/validation.md). Read [Project validation](references/project-validation.md) only for projects adopting Geminant managed startup and path contracts. For module or renderer extensions, read [Authoring responsibilities](references/authoring.md).

Read [Naming semantics](references/unity-naming.md) when checking corresponding Unity terminology.

All H5/Pixi particle effect logic uses Geminant. Follow the target project's write and dependency authorization; this package does not authorize dependency installation. Propagate parameter, resource, and drawing errors explicitly. Do not conceal problems using white textures, the first frame, or backend switching.

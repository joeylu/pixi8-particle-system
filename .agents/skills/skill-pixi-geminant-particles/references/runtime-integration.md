# Runtime Integration

Use this reference to integrate, create, control, or diagnose an effect. Read [Runtime API](runtime-api.md) for parameters and interfaces, [JSON Entity Semantics](effect-contract.md) for JSON fields, and [Validation](validation.md) for acceptance checks. Configuration-only tasks use the independent [Configuration Design](config-design.md) path.

## Entry Points and Composition

Discover the Geminant SDK in the target project through symbols such as ParticleSystem, createParticleEffect, compileParticleEffectConfig, createPixiParticleEffect, createPixiFrameParticleEffect, and createPixiParticleEntity. Verify the actual version and interfaces before choosing import paths. Prefer existing scene responsibilities, resource resolvers, and update loops; avoid imposing a global manager just to integrate particles.

Installed packages' public metadata can also help discover entry points; do not assume a package name or directory. Pure logic and configuration entry points can operate without Pixi; rendering entry points depend on the host's Pixi. Confirm precise interfaces and compatibility requirements from the discovered runtime. The target environment determines whether to use source or built artifacts. Deliver independent-module integration through configuration and runtime acceptance checks; it does not require the managed project's overall SDK configuration, bootstrapper, or website directory.

createPixiParticleEntity({config,resolveTexture}) accepts a strict JSON string or object. It validates pure configuration before resolving resources and returns a Promise. A new entity is stopped, with no automatic play or ticker. After awaiting successful creation, attach entity.container to the host parent, call play, and update in seconds. When a space binding automatically attaches output to world, do not attach it again or change its output transform.

main (compatible alias core) maps to SDK main. Simulation groups in modules are promoted to their corresponding configuration names; textureSheetAnimation is passed to frame rendering. origin is a layer-local birth offset; boundsArea becomes a Rectangle. continuous layers call play, and burst layers call emit(count). Each layer has an independent system/render container; layers array order is draw order.

createPixiFrameParticleEffect handles multiple frames; createPixiParticleEffect handles a single Texture and cannot receive textureSheetAnimation or selection. Pure Core factories and renderer support custom rendering under the [Authoring Responsibilities](authoring.md).

## Resource Resolution and Rendering

The host's resolveTexture maps logical asset/atlas frame references to valid Textures. grid passes only {asset}; the SDK divides the input Texture.frame into equal views, left to right, then top to bottom. Physical pixel, trim/rotate, and shared-source requirements are in [JSON Entity Semantics](effect-contract.md). Missing frames, mixed sources, or invalid resources fail explicitly; do not substitute a white texture or first frame.

During operation, the host keeps Source identity/dimensions and Texture.frame/orig/trim/rotate/UV metadata stable. It may update image content with the same dimensions. Recreate the effect when changing frame layouts to avoid stale static UV/vertices and precomputed geometry.

random selects once using seed+birthIndex on channel 7, distinguishes a new birthIndex when a pool slot is reused, reproduces after reset, and does not affect other random channels. sequence selects directly from ageSeconds, without an independent ticker or accumulated clock.

Frame rendering explicitly configures five dynamicProperties groups. single/random static UVs upload on birth/membershipVersion changes; multi-frame sequence UVs are dynamic, and vertex is also dynamic when orig/trim geometry differs. anchorX=anchorY=0.5 is fixed and is not a JSON option. Particle instances are cached persistently, retain relative birth order, and receive tint/alpha separately.

## Entity Control and Ownership

entity exposes readonly container, layers (id/system/container and optional trailContainer), state, particleCount, and error. States are stopped/playing/draining/paused/faulted/destroyed. Control lifecycle through the entity; directly changing public layer.system can break coordination.

| Operation | Semantics |
| --- | --- |
| play | stopped; preflight every layer as stopped, call play for continuous and emit for burst; enter playing if any layer is continuous, otherwise draining |
| pause/resume | pause from playing/draining; resume from paused; call only layers in the corresponding states, keeping completed layers stopped |
| stop | Four normal states; stopped when no pending work remains; with pending work, paused stays paused with draining as its resume target, otherwise enter draining; continue update until drained |
| reset | Four normal states; clear and reset all layers while preserving the origin; entity becomes stopped |
| setOrigin(x,y) | Four normal states; baseOrigin+layer.origin affects future births; validate all sums as finite first; without space binding, use container transform to move existing particles together; with space, move the host emitter and let the SDK manage output pose |
| update(dtSeconds) | Four normal states; validate nonnegative finite seconds and layer health first; update each layer once with the same dt; stopped/paused/zero dt does not advance |
| destroy | Also allowed from faulted; best-effort cleanup of all owned resources; repeated calls after successful destroyed are no-ops; failures are explicit |

Runtime module or sync errors stop entity advancement; faulted permits only readonly diagnostics or destroy. Preserve the original error; simultaneous construction and cleanup failures are reported through cause and cleanupErrors. Public parameter errors must not be treated as successful advancement. Actual GPU drawing occurs outside sync; on draw errors the host must stop its own advancement and rethrow the original error.

The entity owns layer systems/containers, the root Container, and grid-generated views; views are released with destroy(false). Explicit Textures, grid input Texture, Source/Atlas, and the host parent remain externally owned and are not destroyed by the entity. With direct createGridParticleTextures calls, the caller owns generated views. Creation failures attempt to release all resources already created. For switching, successfully create a candidate before committing it; a failure preserves the current effect, and failures destroying the previous entity are still reported. Do not claim cleanup succeeded when it failed.

## Space, Gravity, and Trails

[Space and Gravity](space-gravity.md) defines main.simulationSpace/gravityModifier and runtime space/gravity bindings. JSON validation does not require a host environment. Bindings required for world, nonzero gravity, or worldSpace Trails are checked before entity creation and before calling the resolver. The host supplies the gravity vector; it is not serialized into recipes.

See [JSON Entity Semantics](effect-contract.md) for Trails configuration relationships and material selection; see [Trails](trails.md) for lifecycle observations, basis, geometry, and resource ownership. stop continues draining live particles and retained trails; particleCount=0 does not mean there is no pending work. Check system hasPendingWork/state. Pausing freezes simulation and trail age, reset clears them, and destroy releases owned resources.

Actual GPU drawing occurs outside synchronous simulation. On draw errors the host stops its own advancement and preserves the original error. Report configuration validation, type checks, and actual backend drawing separately; passing one does not imply all have passed.

# Runtime API

Discover actual entry exports before choosing import paths. Configuration units and field interactions belong to the [effect contract](../../skill-geminum-particle/references/effect-contract.md) and [Schema](../../skill-geminum-particle/references/effect.schema.json); this reference owns SDK wiring and extension responsibilities.

## Composition and Pixi entries

compileParticleEffectConfig(config={},environment?) returns ParticleSystemOptions<ParticleModuleData> without a renderer. createParticleEffect accepts composition configuration plus a renderer factory and optional environment. Pure simulation configuration places main, emission, shape, forceOverLifetime, limitVelocityOverLifetime, colorOverLifetime, sizeOverLifetime, rotationOverLifetime and trails at its top level; JSON entity modules are lifted into this configuration.

createPixiParticleEffect accepts composition configuration plus texture, optional blendMode/boundsArea and space/gravity. createPixiFrameParticleEffect accepts textures and textureSheetAnimation instead. Both return system/container, with optional trailContainer. The host owns external textures and sources. Options are snapshotted at creation; recreate to change configuration.

validateParticleEntityConfig(input:unknown) returns an independent deeply frozen ParticleEntityConfig. parseParticleEntityConfig(json:string) strictly parses and validates, rejecting duplicate keys and nonfinite JSON values. Validation preserves supplied field structure and does not apply Schema default annotations to JSON. Use these entry points for configuration verification; do not maintain another field validator in this skill.

createPixiParticleEntity({config,resolveTexture,space?,gravity?}) returns Promise<PixiParticleEntity>; validate before resolving resources. resolveTexture receives ParticleTextureReference{asset,frame?} and returns Texture or Promise<Texture>. A successful new entity starts stopped with no ticker. Await all resources before play.

createGridParticleTextures(texture,grid) produces equal row-major Texture views. Dimensions use numTilesX/numTilesY; physical cells/origins are integers, product is at most 4096, trim/rotate/spacing/padding are unsupported. Caller owns direct views and uses destroy(false), retaining input Texture/Source.

PixiFrameParticleRenderer receives textures, textureSheetAnimation, randomSeed?, updateWrites, blendMode?, boundsArea?, alignment?, forwardAngle?. Frames share one valid Source; anchor is fixed at 0.5. sync/destroy return undefined. Dynamic properties cover position, rotation, vertex, color and uvs: velocity alignment requires rotation, size changes require vertex, appearance changes require color, and sequence UV/frame geometry changes must upload. Membership changes refresh static birth values even with reused objects.

createTextureSheetAnimationFrameSelector(selection,frameCount,randomSeed=1) returns (birthIndex,ageSeconds)=>ordinal. Random variants, clip choice, fps and phase are deterministic at birth; frame progression derives from age without another ticker. See the effect contract for pools, clips and ranges.

## Core extension contract

new ParticleSystem<T>(options) requires main, spawn factory and renderer factory. Optional inputs are emission factory, sampleLifetime, behavior factories, observer factories, environment factory and data.create/reset. Factories create independent system instances. Module IDs are nonempty and unique.

ParticleState<T> exposes readonly ageSeconds/lifetimeSeconds and writable x/y/vx/vy/rotation/scaleX/scaleY/alpha/tint/data. sampleLifetime(birthIndex) is called at every birth, including pooled object reuse, and must synchronously return a finite positive number. If omitted, Core uses main.startLifetime/lifetimeSeconds. lifetimeSeconds exposes that particle's sampled total lifetime; individual death time, normalizedAge and trail point retention use it. data.create returns independent synchronous data; reset returns undefined and runs on initial allocation and reuse. Caller owns extension data validation and avoids shared nested objects.

Initializer initWrites and behavior initWrites/updateWrites declare every actual base-field write. Birth initializers execute before continuous updates; motion precedes appearance with stable order within each phase. Initialization and update write sets are separately exclusive. Lifetime and age belong to Core. Built-in composition uses KinematicMotion as the sole motion owner, combining drag, force and gravity there. Custom Core motion behaviors must preserve exclusive field ownership.

ParticleBehavior has id, phase=motion/appearance, optional init/update/reset and write declarations. Renderer factories receive updateWrites and readonly lifecycle observers; sync reads current particles/membershipVersion. Hooks are synchronous, do not return Promises, reenter system mutation or retain borrowed contexts/arrays. Persistent rendering identity caches are allowed, but old snapshots are not simulation input.

Emission plan receives startTimeSeconds/endTimeSeconds/dtSeconds/maxBirths and returns a synchronous array of offsetSeconds/count events. Offsets are finite and strictly increase in [0, dtSeconds]; combine simultaneous births into one request. Counts are positive safe integers and total requests fit the entire external update budget. Do not silently truncate, postpone or reset budget during slices. Core advances to event times; death precedes birth at equal time.

ParticleEmission.hasFutureEvents(timeSeconds) is an optional synchronous boolean predicate for events after that simulation time. Finite schedules need it for automatic completion: while playing, an emission module without this predicate is treated as having future emission. An empty plan for the current interval does not imply completion.

Composition installs ShapeSpawn, StartValues and KinematicMotion plus requested appearance/emission/trails. Birth baselines drive absolute-age appearance; t=0 is applied before initial rendering. Random sampling is seed/birthIndex/channel based and independent of observed frame rate. Do not add Math.random or let a new property shift other random streams.

## Control, time and ownership

Readonly state, particleCount, error, diagnostic and hasPendingWork expose status. Normal states are stopped/playing/draining/paused; faults preserve the original error, allowing diagnostics and destroy only.

- play starts a stopped system, resetting its run clock/module phase, then calls emission.plan({startTimeSeconds:0,endTimeSeconds:0,dtSeconds:0,maxBirths}) when emission exists. Core processes time-zero births, including built-in time-zero bursts, before renderer sync.
- pause freezes playing/draining; resume restores the prior state.
- stop(options?:{killParticles?:boolean}) cancels future emission and drains particles plus observer work. killParticles=true immediately ends every live particle through normal onDeath at the current simulation time and actual age, then synchronizes the renderer; observer work is not reset. dieWithParticles controls trail retention. Paused pending work remains paused and resumes draining; no pending work becomes stopped. Repeated stops do not deliver duplicate deaths.
- reset immediately clears active particles/extensions, preserves origin and bounded pool, and becomes stopped.
- emit(count) permits stopped/playing/draining and synchronizes nonzero births immediately; count is a nonnegative safe integer.
- setOrigin(x,y) changes future births, with finite emitter-local coordinates.
- update(dtSeconds) accepts finite nonnegative seconds; stopped/paused do not advance.
- destroy releases owned associations and is idempotent after successful completion.

Use entity control for layers, sharing play origin and dt; do not directly mutate layer.system. A finite emission window can be empty now but still have future events. Completion requires no future emission, no live particles and no observer work. Pool reuse changes birth identity, membershipVersion refreshes static render data, and relative birth order is stable.

entity.stop(options?:{killLayerIds?:readonly string[]}) stops every layer and immediately ends particles only in the named layers. Use real head layer IDs from the configuration, for example entity.stop({killLayerIds:['head']}) only when 'head' is the actual layer ID; smoke layers remain alive and drain. Unknown IDs, duplicate IDs, non-array values, and unknown options fail before any layer stops. Space binding samples the current host pose once for the operation, so retained world trails include the hit endpoint. Neither stop option detects collisions, chooses direction, or advances host motion. Host motion and hit detection remain external; these options are runtime calls, not JSON fields.

Invalid public parameters preserve state; capacity, budget, module output or renderer sync faults rethrow the original error. Already executed steps are not rolled back. Destruction failures remain explicit. Actual GPU drawing occurs after sync, so the host must stop advancement and preserve draw exceptions.

The host registers pixi.js/particle-container before renderer initialization; trails also need pixi.js/mesh. The SDK owns its systems, containers, caches and entity-generated grid views; the host retains external Texture/Source, parent, emitter/world and ticker. [Runtime integration](runtime-integration.md), [space/gravity](space-gravity.md) and [trails](trails.md) detail those boundaries.

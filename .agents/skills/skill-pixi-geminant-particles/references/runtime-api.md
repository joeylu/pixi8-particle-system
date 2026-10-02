# Runtime API

Discover the Geminant SDK in the target project through symbols such as ParticleSystem, createParticleEffect, compileParticleEffectConfig, and createPixiParticleEffect. Verify interfaces before choosing import locations. This reference defines base SDK parameters, defaults, units, and runtime APIs. The space/gravity environment and rendering basis belong to the space and gravity reference; [Runtime Integration](runtime-integration.md) covers JSON and composite assembly.

## Configuration Facade

ParticleEffectConfig has optional top-level main, emission, shape, forceOverLifetime (alias force), colorOverLifetime, sizeOverLifetime, and rotationOverLifetime. compileParticleEffectConfig(config={}) returns ParticleSystemOptions<ParticleModuleData> without renderer. Omitting the entire argument is allowed; explicit undefined is rejected. createParticleEffect accepts this configuration plus a renderer factory and returns ParticleSystem<ParticleModuleData>. Both are pure Core entry points. createPixiParticleEffect accepts the configuration plus texture and optional blendMode/boundsArea, returning system/container with a fixed texture. Configuration is snapshotted at creation; later mutations to the input do not alter behavior.

ParticleEffectMainConfig is composition configuration, not low-level MainConfig.

| main field | Default | Type/constraint/unit |
| --- | --- | --- |
| maxParticles | 128 | Positive safe-integer capacity |
| maxBirthsPerUpdate | maxParticles | Positive safe-integer birth budget per update |
| startLifetime (alias lifetimeSeconds) | 1 | Positive finite seconds; fixed lifetime |
| startSpeed | 0 | ScalarRange; nonnegative emitter-local units/second; world initial velocity then passes through A's linear transform |
| startScale | 1 | ScalarRange; nonnegative, dimensionless, assigned to both axes |
| startRotation (alias startRotationRadians) | 0 | ScalarRange; finite radians |
| startTint | 0xffffff | 24-bit RGB integer |
| startAlpha | 1 | Finite [0,1] |
| randomSeed (alias seed) | 1 | uint32 integer [0,0xffffffff] |
| simulationSpace | local | local/world |
| gravityModifier | 0 | Finite signed constant; 0 disables gravity, negative reverses it |

ScalarRange is a single number or {min,max}; endpoints are finite, min≤max, and min≥0 for nonnegative fields. Sample once per birth; constants are used directly. Unknown keys, Symbol, non-enumerable unknown keys, thenable configurations, explicit undefined/NaN/Infinity, missing endpoints, and reversed ranges are rejected. Defaults apply only to omitted fields.

Omitting the entire shape defaults to point. When a shape object exists, exactly one of shapeType/type is required. offsetX/offsetY/directionRadians/spreadRadians default to 0 for every shape. The first two are finite local coordinates, direction is finite radians, and spread is in [0,2π]. point is at origin+offset. circle radius defaults to 10 and is finite nonnegative; r=radius*sqrt(u), with an independent angle, samples disk area uniformly. rectangle width/height default to 20 and are finite nonnegative, sampled within ±dimension/2 around origin+offset. Only dimensions belonging to that shape are accepted; position is independent of direction. Direction=direction+spread*(u-0.5): 0 is directional and 2π disperses. vx/vy derive from speed*cos/sin of the direction.

directionRadians=0 points along emitter-local +x; positive/negative y follow the host coordinate convention. direction/spread remain locally defined, and world initial velocity is subsequently converted to the world basis.

When present, emission is {rateOverTime} (alias ratePerSecond, exactly one required), a finite nonnegative particles/second value. When omitted, only emit produces births. Positive rate requires 1/rate to be a finite interval in seconds, otherwise creation rejects it. Constant-rate births occur at n/rate seconds; rate=0 is valid with no automatic births. When present, forceOverLifetime (alias force) is {x?,y?} (aliases accelerationX/accelerationY), defaulting both axes to 0, in finite selected simulation-basis units/second². The sole KinematicMotion owner analytically integrates actual dt: position+=velocity*dt+acceleration*dt²/2 and velocity+=acceleration*dt.

Appearance modules calculate absolute values from birth baselines, with t=normalizedAge:

| Configuration | Default/constraint | Rule |
| --- | --- | --- |
| colorOverLifetime.endTint | Omitted preserves birth color; explicit 24-bit RGB | Each RGB channel uses round((1-t)*birth+t*end) |
| colorOverLifetime.endAlphaFactor | 0, [0,1] | alpha=birth alpha*((1-t)+factor*t) |
| sizeOverLifetime.endScaleFactor | 1, finite nonnegative | Each axis scale=birth scale*((1-t)+factor*t) |
| rotationOverLifetime.z (alias angularSpeedRadians) | 0, finite radians/second | rotation=birth rotation+angular velocity*ageSeconds |

Omitted appearance groups do not install their behaviors. An empty color object installs default fade-out; empty size/rotation objects install their default behaviors.

The configuration compiler assembles ShapeSpawn, StartValues, and KinematicMotion, then optional Color/Size/RotationOverLifetime and emission. The SDK provides ParticleModuleData create/reset; gameplay need not reimplement internal resetting. data contains birthIndex, directionRadians, startScaleX/Y, startRotationRadians, and startTint/startAlpha.

| Module | Initialization writes | Continuous writes |
| --- | --- | --- |
| ShapeSpawn | x/y and data.birthIndex/direction | None |
| StartValues | vx/vy/scaleX/Y/rotation/tint/alpha; stores data baselines | None |
| KinematicMotion | None | x/y/vx/vy |
| ColorOverLifetime | None | alpha; tint additionally when endTint exists |
| SizeOverLifetime | None | scaleX/Y |
| RotationOverLifetime | None | rotation |

Base factories are createShapeSpawn(config,seed=1), createStartValues(config,seed=1), createConstantForce(config), createKinematicMotion({force?:ConstantForceFactory}={}), createColorOverLifetime(config), createSizeOverLifetime(config), and createRotationOverLifetime(config). Each returns a runtime-instance factory; Force returns a provider factory. Kinematic force receives the factory returned by createConstantForce(config), not an acceleration-value DTO. Shape/Start reject explicit undefined seed; Kinematic rejects explicit undefined config. Direct assembly can use createParticleModuleData/resetParticleModuleData.

sampleUnit(seed,birthIndex,channel) deterministically produces [0,1). birthIndex starts at 0 and resets for a new run; indices are nonnegative safe integers. Fixed channels 1/2 are position, 3 direction, 4 speed, 5 scale, and 6 rotation. Enabling/disabling modules does not change other channels, and external slicing does not change samples for the same birth index. sampleUnit mixes seed, the index's high/low 32 bits, and channel, without Math.random. Entity texture randomness reserves channel 7; its semantics are in the entity contract.

## Low-Level Contract

sampleUnit is a named export at its definition, not an SDK root or composition barrel export. Locate the actual import source by that symbol.

new ParticleSystem<T>(options) requires main, a spawn factory, and a renderer factory. Optional inputs are an emission factory, behaviors factory array, observers factory array, and data.create/reset. Factories produce independent per-system runtime instances each time; module IDs are nonempty and unique within a system. Low-level MainConfig requires maxParticles and startLifetime (alias lifetimeSeconds). Budget defaults to capacity; appearance defaults are scaleX/Y=1, rotation=0, alpha=1, tint=0xffffff. Low-level scale only needs to be finite and may be 0 or negative; composition Main startScale must be nonnegative.

ParticleState<T> ageSeconds/lifetimeSeconds are readonly; x/y/vx/vy/rotation/scaleX/scaleY/alpha/tint and data are available to modules. Low-level and high-level position/velocity both use the selected simulation basis; velocity is basis units/second and angles are radians. Base numbers are finite, alpha is [0,1], and tint is 24-bit RGB. data.create synchronously returns T & {readonly then?:never}; reset(data) returns undefined and runs on both first allocation and reuse. The caller ensures data and nested mutable data are not shared across particles or systems, and validates extension data. Runtime checks are not a guarantee of exhaustive detection for every object shape.

| Interface | Fields/callbacks |
| --- | --- |
| BirthContext | timeSeconds, origin{x,y} |
| ParticleUpdateContext | startTimeSeconds/endTimeSeconds/dtSeconds/ageSeconds/normalizedAge |
| ParticleInitializer | id, initWrites, init, optional reset |
| ParticleBehavior | id, phase=motion or appearance, optional init/initWrites, update/updateWrites, reset; at least init or update |
| ParticleEmission | id, plan({startTimeSeconds,endTimeSeconds,dtSeconds,maxBirths}) returning an {offsetSeconds,count} array, reset |
| ParticleRendererFactory | Receives {updateWrites}; returns sync({particles,membershipVersion}) and destroy |

init/update/reset/sync/destroy synchronously return undefined; plan synchronously returns an array. Do not await Promises, reenter system mutation methods, or retain contexts/snapshot arrays between calls. A renderer may use particle references as rendering-cache identity keys, but reads only the current snapshot during sync and does not use old state fields as simulation input. Other hooks do not retain borrowed particles across calls. spawn.initWrites is required. Missing behavior write declarations default to empty arrays; explicit invalid declarations are still rejected, and declarations cannot exist without corresponding hooks. Declare every actual base-field write; age/lifetime are not writable declarations.

Birth initialization runs spawn first, then behaviors in registration order. Continuous motion updates precede appearance; registration order is stable within each phase. Initialization writes are exclusive, and all update phases are checked together for exclusive writes. Writing x at birth and updating x later is allowed. KinematicMotion and LinearMotion cannot both write position, and multiple appearance writers cannot share a field. Base low-level createPointSpawn({offsetX?,offsetY?,velocityX?,velocityY?}={}) defaults all fields to 0; createLinearMotion updates only x/y; createConstantRateEmission({ratePerSecond}) supplies constant emission.

## States, Pool, and Time

Initially stopped with 0 particles and no ticker. Readonly state/particleCount/error/diagnostic are exposed. diagnostic is initially undefined; after failure it records {operation,moduleId?}, preserving the original error identity and stack. Renderer/data hook diagnostics may identify renderer or data.create/data.reset.

| Method | Legal states and effects |
| --- | --- |
| play() | stopped; resets the run clock/modules and enters playing |
| pause() | playing/draining; saves the running state and enters paused |
| resume() | paused; restores the saved state |
| stop() | stopped/playing/draining/paused; stops automatic emission; no pending work immediately becomes stopped; paused with pending work stays paused with draining as its resume target; other states with pending work enter draining |
| reset() | Four normal states; immediately clears active membership, resets clock/modules, and becomes stopped; preserves origin/bounded pool and synchronizes |
| emit(count) | stopped/playing/draining; nonnegative safe integer; nonzero synchronizes immediately; stopped starts a new draining run without disturbing automatic phase |
| setOrigin(x,y) | Four normal states; finite local coordinates, affecting only new births |
| update(dtSeconds) | Four normal states; nonnegative finite seconds; paused/stopped do not advance |
| destroy() | Also includes faulted; releases owned pool/callback/render associations; repeated calls after successful destroyed are no-ops |

State gates precede zero-value checks. Legal update(0)/emit(0) do not call particle modules or synchronize. update(0)/paused/stopped still sample an environment when present to refresh pose; paused.emit(0) remains rejected. draining becomes stopped after the final particle and extension pending work disappear. Invalid public parameters preserve state. Capacity/budget failures, invalid module outputs/returns/plans/execution, or renderer sync failures fault the system and rethrow the original error; already executed internal steps are not rolled back. faulted permits only diagnostics and destroy. Destruction failures are explicit and cannot be claimed as successful destruction.

Plan offsets strictly increase within (0,dt], counts are positive safe integers, and total births remain within budget; illegal plans are not sorted or merged. The system uses compensated accumulation of seconds. Emission/update context dtSeconds is actual endTimeSeconds-startTimeSeconds. Slices follow birth times, with death before birth at the same time. Lifetime checks use relative tolerance for both age and absolute birth time+lifetime endpoints. Terminal age is normalized to fixed lifetime, normalizedAge=1; terminal dt is truncated at the lifetime endpoint, and right-end births receive no zero-dt update. Time equality is abs(a-b)≤8*Number.EPSILON*max(abs(a),abs(b),Number.MIN_VALUE). Constant emission consistently snaps the end boundary in count space. There is no fixed minimum time step. Core owns lifetime, so particles die even without motion behaviors.

Live particles retain relative birth order, and pool capacity is bounded. reset retains the reusable pool; destroy releases associations. Birth/death/reset increment membershipVersion, requiring static birth values to refresh even when counts or references are unchanged. A valid external update synchronizes once at its endpoint; nonzero emit and reset synchronize immediately. Declared fields are checked after hooks; all base fields are checked after birth initialization and before final sync. Callers must still declare their complete write sets.

## Fixed Pixi Adapter

The host must load Pixi's pixi.js/particle-container extension before app.init or the first renderer initialization.

Trails also require pixi.js/mesh registration before first initialization. Loading the SDK Pixi entry beforehand can register it; for lazy loading after initialization, the host must register it in advance. See [Trails](trails.md).

createPixiParticleSystem<T> accepts low-level options without renderer, plus texture, blendMode?, and boundsArea?, returning system/container. PixiParticleRenderer<T> accepts texture/updateWrites and those same rendering options, exposing readonly container. texture is explicitly valid; blendMode is normal or add, defaulting to normal. boundsArea is a finite Rectangle with nonnegative dimensions, cloned at creation. Particle anchor is (0.5,0.5).

One system has one ParticleContainer, fixed Texture, and TextureSource. All five dynamicProperties groups are explicit: x/y→position, rotation→rotation, scaleX/Y→vertex, alpha/tint→color; groups with no writer are false, and fixed-frame uvs=false. tint and alpha are assigned separately; RGB is not written to packed color. Particle associations are persistent and membership order stable. A membershipVersion change refreshes the list and calls container.update; unchanged membership does not recreate objects or unconditionally mark static updates.

The host loads and retains texture/source/parent containers; the system destroys only its own container and associations. reset clears membership and retains the bounded rendering cache. destroy detaches associations without destroying shared resources. The host supplies any required explicit boundsArea and keeps the fixed frame valid. Actual GPU drawing occurs after sync; host draw failures must stop the affected advancement chain and rethrow the original error.

The fixed factory handles one Texture. Multi-frame and JSON entry points follow below; [Runtime Integration](runtime-integration.md) covers assembly semantics.

## Multi-Frame and JSON Entry Points

Pure Core symbols are available through the composition public entry: ParticleTextureReference{asset,frame?}, ParticleGridDimensions (exactly one of numTilesX/columns and exactly one of numTilesY/rows per axis), ParticleTextureSetConfig, ParticleTextureSheetAnimationConfig (equivalent to TextureSheetAnimationConfig/ParticleFrameSelection), ParticleEntityLayerConfig, and ParticleEntityConfig. JSON fields and mutually exclusive structures follow the bundled [Schema](effect.schema.json).

- validateParticleEntityConfig(input:unknown):ParticleEntityConfig returns an independent deeply frozen snapshot. It preserves input field structure without filling defaults or renaming fields. It accepts only pure JSON data, rejecting unknown keys, Symbol, accessors, non-enumerable fields, cycles, and invalid numbers.
- parseParticleEntityConfig(json:string):ParticleEntityConfig strictly parses and validates, rejecting duplicate keys and non-JSON/non-finite numbers; do not replace it with permissive parsing.
- createTextureSheetAnimationFrameSelector(textureSheetAnimation:ParticleFrameSelection,frameCount:number,randomSeed=1) (equivalent export createParticleFrameSelector):(birthIndex:number,ageSeconds:number)=>number. frameCount is a positive safe integer and seed is uint32; birthIndex is a nonnegative safe integer and ageSeconds nonnegative finite seconds. single index defaults to 0; random uses channel 7 and repeats for identical seed/index. sequence fps is positive finite, loop defaults to false, and age*fps must be finite. No ticker or accumulated time.

Public Pixi symbols:

- createGridParticleTextures(texture:Texture,grid:ParticleGridDimensions):readonly Texture[]. Rows/columns are positive safe integers with product≤4096. Equal cells in row-major order; no trim/rotate/spacing/padding, and physical-pixel cell sizes/origin are integers. The caller owns views and releases them with destroy(false); input Texture/Source remain externally owned.
- PixiFrameParticleRenderer<T extends ParticleModuleData>({textures:readonly Texture[],textureSheetAnimation or selection (exactly one required),randomSeed or seed?,updateWrites,blendMode?:'normal'|'add',boundsArea?:Rectangle}), readonly container; sync/destroy synchronously return undefined. Frames are nonempty and share one valid Source. randomSeed (alias seed) defaults to 1, blendMode to normal, and bounds are cloned. Anchor is fixed at 0.5. Position/rotation/color follow updateWrites; vertex additionally accounts for sequence frame geometry differences, and uvs are dynamic only for multi-frame sequence. single/random membership changes refresh static UVs; Particle instances persist, birth order is stable, and tint/alpha are assigned independently.
- createPixiFrameParticleEffect(ParticleEffectConfig & {textures,textureSheetAnimation or selection (exactly one required),blendMode?,boundsArea?}):{system,container}. Applies Main randomSeed, validates finite fps*lifetime, and does not own external frame resources.
- createPixiParticleEntity({config:unknown,resolveTexture:(reference:ParticleTextureReference)=>Texture|Promise<Texture>}):Promise<PixiParticleEntity>. config is an object or strict JSON string; validate before resource resolution, and grid resolver receives only asset. Successfully constructed entities start stopped, without automatic ticker/play. Readonly container, layers{id,system,container}, state, particleCount, and error; play/pause/resume/stop/reset/setOrigin(x,y)/update(dtSeconds)/destroy. layer.system is primarily diagnostic; entity drives the unified lifecycle.

Entity's six states share Core names; legal method states and multi-layer control are in the entity contract. Invalid public parameters/own state throw outside mutation and preserve state. Layer execution failure or preflight finding faulted/destroyed faults the entity, preserving and rethrowing the original error. faulted permits only diagnostics/destroy. Cleanup failures explicitly fault; repeated destroy cannot claim an old failure succeeded. The host stops its own advancement and rethrows GPU draw errors. The entity owns root/layer containers, systems, and grid views, without destroying external Texture/Source or the host parent.

## Names and Equivalent Factories

[Name Semantics](unity-naming.md) describes Unity name correspondence and unit differences. All simultaneous canonical/alias pairs are rejected. Main internally compiles to the lifetimeSeconds layout; state.lifetimeSeconds is not renamed. Entity main/core, Force, and TSA structures follow Schema; pure Core configuration does not accept TSA.

| Canonical factory | Equivalent export |
| --- | --- |
| createEmissionModule | createConstantRateEmission |
| createShapeModule | createShapeSpawn |
| createMainStartValues | createStartValues |
| createForceOverLifetimeModule | createConstantForce |
| createColorOverLifetimeModule | createColorOverLifetime |
| createSizeOverLifetimeModule | createSizeOverLifetime |
| createRotationOverLifetimeModule | createRotationOverLifetime |
| createTextureSheetAnimationFrameSelector | createParticleFrameSelector |

Equivalent factory exports do not change provider IDs, instance isolation, or exclusive field-write rules. createKinematicMotion still accepts a force provider factory. FrameEffect/Renderer consume exactly one of TSA or selection; Renderer randomSeed and seed are also mutually exclusive, defaulting to 1.

Recipe example createCanonicalParticlePreset(kind) returns canonical-field configuration; createParticlePreset(kind) returns the equivalent alias-field layout. kind is sparks/smoke/falling. Both read the same recipe parameters and differ only in field mapping; recipe examples are not automatic runtime configuration or JSON resource resolvers.

normalizeParticleFrameSelection returns the frozen internal mode shape; normalizeParticleGridDimensions returns frozen {columns,rows}. Entity getParticleEntityLayerMain/getParticleEntityLayerTextureSheetAnimation/getParticleEntityLayerEffectConfig consume only validated/parsed configurations. The latter removes TSA to produce pure simulation configuration. ParticleState.lifetimeSeconds is the Core's readonly total lifetime; ageSeconds is elapsed time.

[Space and Gravity](space-gravity.md) fully defines space/gravity creation parameters, basis, sampling, and pose ownership. compileParticleEffectConfig(config,environment?) and CreateParticleEffectOptions.environment accept ParticleEffectEnvironment. fixed/frame/entity space/gravity are runtime parameters, not JSON fields. ParticleVector2, ParticleAffineTransform, ParticleEnvironmentSnapshot, ParticleEnvironment, and its factory define the pure Core environment. Low-level MainConfig also accepts simulationSpace/gravityModifier; ParticleSystemOptions.environment accepts ParticleEnvironmentFactory. BirthContext/ParticleUpdateContext provide optional simulationSpace/gravityModifier/environment snapshots.

[Trails](trails.md) defines lifecycle observation and Trails path contracts. hasPendingWork includes live particles and pending lifecycle extension work; draining stops only when both are empty.

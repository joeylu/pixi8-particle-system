# Trails

Trails generate bounded paths from particle lifecycles. The [JSON Contract](../../skill-geminum-particle/references/effect.schema.json) exclusively owns configuration fields, ranges, and defaults. The [runtime fixture](../../skill-geminum-particle/assets/trails.effect.json) uses world particles and retention after death.

## Sampling and Budgets

Start at the birth point and sample at the end of each Core slice, including the terminal point. Movement below the distance threshold updates only the live head; reaching minVertexDistance commits a path point. maxPointsPerTrail includes the live head and removes oldest points when full. maxTrails counts live particles and trails retained after death; exceeding it explicitly faults rather than discarding births. Movement exceeding breakDistance keeps the old segment until its points expire and starts a new segment at the current point, without connecting the jump gap.

lifetime is a multiplier of the parent particle's total lifetime; their product must be finite and positive. Committed points expire over time. This is not an array shifted by render fps; it does not reconstruct unobserved motion inside hooks or guarantee identical paths for every update partition. width is fixed in trail-basis pixels and does not scale with particle size. Trail tint/alpha are independent of particleAlpha; parent container alpha/tint inheritance still applies.

worldSpace=false follows the Main simulation basis. worldSpace=true transforms local Main sample points from emitter to world and stores them persistently in world. Runtime space binding is required and checked before the resource resolver. The environment is sampled once per external update. See [Space and Gravity](space-gravity.md) for space details.

## Lifecycle

birthId increases within a run; reset/play clear observer paths before restarting the identity sequence, so pool object reuse cannot mix retained paths. stop enters draining until both particles and trails disappear, then stopped; hasPendingWork includes both. paused freezes sampling and decay. update(0) does not sample or decay, although existing space binding may refresh pose. dieWithParticles=true clears a trail when its parent dies; false allows sampled trails to continue decaying. reset/destroy clear all paths.

system.stop({killParticles:true}) ends active particles without advancing their age or resetting observers. Normal onDeath samples the current environment and records the terminal point at the current simulation time; dieWithParticles=false retains this trail until point TTL expiry, while true removes it immediately. Rendering synchronizes immediately. For entities, use entity.stop({killLayerIds:[actualHeadLayerId]}) so other layers stop emission and naturally drain; never copy a placeholder ID without matching the configuration. During pause, termination is immediate but retained trail decay stays frozen until resume into draining. Repeating the call adds no duplicate death samples. This operation does not provide collision detection or direction control.

Generic lifecycle observation supplies only frozen numeric observations and birthId, without lending mutable data. Extensions observe birth, update completion, death before recycling, and each slice advance. They follow synchronous/reentry/error contracts and do not rewrite particles or bypass Core lifetime from observers.

## Material and Rendering

modules.trails and renderer.trail must both be present or both omitted. renderer.trail references a set with exactly one frame: a single explicit frame or 1×1 grid. It is independent of body frame selection/Source. JSON checks only structure and frame count; the resolved Texture must have valid geometry with no trim/rotate.

textureMode is stretch: Texture x runs along the path, mapped by cumulative arc length within each continuous segment. Standard alpha compositing and normal/add apply. The texture is not a repeating tile, and width is not a curve or beam endpoint. Resource errors propagate unchanged; no substitute material is supplied.

Pixi facades use trailRenderer:{texture,blendMode?,tint?,alpha?}, bound to trails. The returned body container remains a ParticleContainer, with an optional trailContainer (ordinary Container/Mesh). Without space, the host attaches both containers to the same parent and basis. With space, the SDK automatically attaches them to world and manages pose: the tail uses identity when worldSpace or Main.world applies, otherwise A. JSON entities manage all attachment, placing trail before body within each layer; layers retain the body container and expose trailContainer.

PixiTrailRenderOptions contains those material parameters; PixiTrailRendererOptions additionally requires trails:ParticleTrails. Public PixiTrailRenderer(options) exposes readonly container, sync():undefined, and destroy():undefined. fixed/frame and low-level PixiParticleSystemOptions accept trailRenderer, which must bind to an observer. Successful destruction is idempotent. Cleanup failures retain and report errors rather than claiming success; body and tail cleanup are each attempted independently.

The host must run `await import('pixi.js/particle-container')` before the first renderer initialization. Loading `PixiTrailRenderer` registers the Mesh pipe through `import 'pixi.js/mesh'`. Load that SDK entry before first initialization, or have the host register Mesh beforehand. Loading after a renderer has initialized cannot add the missing pipe to that existing renderer.

Trail geometry uses shared endpoints and bounded miters, splitting near 180° reversals; arbitrary self-intersecting paths may still overlap.

destroy releases only owned meshes/buffers/containers and generated grid views, never host Texture/Source. Creation failures attempt to release every owned resource, without claiming cleanup success when it fails. Use [Validation](validation.md) to cover actual images, breaks, retention after death, and resource ownership.

## Extension Interfaces

ParticleSystemOptions.observers is readonly (()=>ParticleLifecycleObserver)[], with independent factories per system. ParticleLifecycleObserver has readonly id, optional requiresEnvironment, optional onBirth/onUpdate/onDeath/onAdvance, and required reset/destroy/hasPendingWork. The first three observe postBirth/postUpdate/preRecycleDeath; onAdvance observes Core slice advancement. Callbacks/reset/destroy synchronously return undefined; hasPendingWork synchronously returns boolean. Errors propagate under the Core fault contract.

ParticleObservation=Readonly<Omit<ParticleState,'data'>&{birthId:number}> is a frozen numeric snapshot of age/total lifetime and the nine base fields, without mutable data. Signatures are onBirth(p,ctx:BirthContext), onUpdate(p,ctx:ParticleUpdateContext), onDeath(p,ctx:ParticleDeathContext), and onAdvance(ctx:ParticleAdvanceContext). Death context supplies timeSeconds and optional simulationSpace/gravityModifier/environment; advance supplies startTimeSeconds/endTimeSeconds/dtSeconds. requiresEnvironment is a construction gate; reset/destroy do not reuse birthId.

createTrailsModule(config:TrailsConfig):()=>ParticleTrails returns an observer factory, exported from composition and public runtime entry points. ParticleTrails exposes config:Readonly<Required<TrailsConfig>>, snapshot():readonly ParticleTrailSnapshot[], hasPendingWork():boolean, and reset()/destroy():undefined. snapshot is a cached frozen copy. ParticleTrailSnapshot contains birthId and points; ParticleTrailPoint contains x/y/timeSeconds/breakBefore. snapshot/pending reject calls after destroy; repeated destroy is a no-op. Renderer factory requirements provide readonly observers in addition to updateWrites. Render from Trails snapshots without retaining mutable particle simulation inputs.

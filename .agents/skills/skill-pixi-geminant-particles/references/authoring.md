# Extension Responsibilities

Interfaces and numeric contracts belong only to the [runtime API](runtime-api.md). See [JSON entity semantics](../../skill-geminum-particle/references/effect-contract.md) for JSON fields and [runtime integration](runtime-integration.md) for assembly, composite presentation, and ownership. Discover host runtime entry points by symbol first; extend existing object responsibilities without requiring a global manager or changing the game architecture.

- Initializers set birth position, direction, and other one-time values; declare initWrites completely.
- Init-only behaviors set birth values and save baselines; they do not enter the continuous update chain.
- Emission owns ordered birth requests. Validate the budget before producing the plan; do not truncate or defer requests.
- Providers supply rule values without directly writing particles; each system has an independent instance.
- Motion reads providers and exclusively owns motion fields; appearance calculates its own fields from absolute age and birth baselines.
- Renderer factories fix presentation requirements from updateWrites and consume only the current snapshot. Resource reference resolution belongs to the host resolver; use the entity entry point for JSON validation and layer assembly.

Factories create independent runtime state per system without sharing module counters, providers, or particle data. Callers must keep data and nested mutable objects independent across particles and systems, and validate extension data themselves. The SDK creates/resets ParticleModuleData inside the configuration facade; extensions preserve its direction, index, and birth baselines. Use the SDK data factory when directly assembling basic modules. Combine additional data within host-owned types and creation/reset logic rather than silently modifying shared data.

Void hooks (initializer/behavior init and update, reset, lifecycle notifications, and renderer sync/destroy) synchronously return undefined. Value-producing callbacks such as data.create, sampleLifetime, emission.plan and hasFutureEvents follow their documented [runtime API](runtime-api.md) return contracts. Extension errors are thrown during the current call. Do not reenter the system. Borrowing and presentation identity caches follow the runtime API contract; keep simulation information spanning frames in independent data or module state. reset resets phases to zero. Preserve Core phase and exclusive write-field checks; do not combine force through a second motion writer.

Custom renderers persistently cache Particle objects rather than creating new Sprite objects or clearing and rebuilding objects every frame. Frame selection changes presentation only, without changing age/lifetime or motion fields. Membership changes refresh static birth data according to membershipVersion. Destruction clears only owned containers/caches; the host retains ownership of shared atlases.

Environment providers supply the current affine and world-gravity snapshot without directly writing particles. Shape/Start birth transforms and KinematicMotion gravity composition follow [space and gravity](space-gravity.md), preserving a single motion writer. Do not install another gravity behavior that integrates gravity again. The host owns emitter/world and the gravity baseline; the SDK owns the pose of bound outputs.

Lifecycle extensions use the frozen, read-only observation and birthId described in [Trails](trails.md). Their responsibilities are separate from behaviors that write particle fields; they do not modify mutable data. Do not use pooled object references as identities across births.
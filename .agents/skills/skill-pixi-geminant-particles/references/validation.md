# Runtime Verification

Use [configuration validation](../../skill-geminum-particle/references/validation.md) for JSON structure, cross-field relationships and fatal configuration issues. This reference covers acceptance boundaries after actual integration; see [runtime integration](runtime-integration.md) for wiring and ownership.

## Host Validation

Determine validation commands from the project's existing tools and dependencies. Do not assume SDK or browser-tool locations or automatically install software to complete checks. Cover the following through the runtime/test entry points actually discovered:

- SDK synchronous types and the pure Core dependency boundary; parameters/defaults, write-field conflicts, individual lifetimes (sampled per birth, including pool reuse, normalized age and exact death boundaries), capacity/budgets, pool reuse, and error states.
- The main and modules-lifting mappings when parsing JSON into the SDK, finite emission schedules (zero-time bursts, delayed particleCount=0 states with future events, and actual completion only after particles and retained work drain), preflight of all layers, and pause/resume boundaries for completed layers.
- Asset/frame existence, Texture/source validity, and strictly shared sources within each set; single indices, random selection once per birth/independent channels/reset reproducibility, and sequence first-frame/progression/loop/clamp/pause behavior.
- Static random UV refresh when the same pooled object is reused, dynamic sequence UV and orig/trim vertex changes, birth order and persistent Particle objects, and separate tint/alpha uploads.
- Draw the target effect's actual materials and layer combination on the requested backend, recording image or pixel evidence of birth, progression, pause, draining after stop, reset, and rebirth. Three-layer fire is one example of a composite effect; choose acceptance cases for the current target effect. Explicitly report an unavailable backend as unverified rather than switching backends to substitute for the conclusion.
- Inject an actual render exception and confirm that entity advancement stops and preserves the original error. Construction failures reclaim already-created layers; replacement failures preserve the current entity. destroy attempts each layer best-effort, never falsely reporting success after failure, while shared atlases and host parent containers remain usable.
- Check ownership of textures, systems, containers, callbacks, and auxiliary resources on success and failure paths. Attempt each cleanup independently; a cleanup exception must not skip the remaining cleanup or overwrite the original error.

Passing type/unit checks does not establish actual GPU acceptance; actual graphics do not establish long-term or mobile-device performance. Report the actual version, backend, resources, commands, evidence, and unverified scope without expanding compatibility promises. Performance observations identify layers, configuration, dt, and device.

Check current field structure, ranges, emission windows, indices and budgets through the SDK validator. Do not impose visual preferences as runtime errors.
Space and gravity acceptance covers rejection of missing space/getter/gravity before resource resolution, affine inverse matrices, world birth positions/velocities, local inverse-A gravity, mixed layers, movement/rotation/scale and camera isolation, paused/update0 pose refresh, and preservation of host resources. See [space and gravity](space-gravity.md).

Trails acceptance covers retained trails after death and draining after stop, no sampling during paused/update0, birthId under pool reuse, breaks/point limits/trail-capacity faults, actual UVs/pixels, material trim/rotate, and resource ownership. See [Trails](trails.md).

## Task-Dependent Projectile Acceptance

Apply these checks when the task integrates a moving emitter or hit/cancel lifecycle; use the [projectile host lifecycle contract](../../skill-geminum-projectile/references/host-lifecycle.md) for host responsibilities.

- Set emitter pose before entity.update; for the configured components, verify local heads follow it, world smoke stays at historical birth positions, and retained world-space trails stay in world space.
- At hit/cancel, set the actual end pose before stop({killLayerIds:[realHeadLayerId]}). Verify only the named heads die immediately, smoke and dieWithParticles=false trails drain to stopped, and shared textures/sources and host containers remain usable. Unknown or duplicate kill IDs must be rejected before any mutation.
- While paused, stop with head kill IDs must still remove heads immediately; remaining smoke/trail decay stays frozen until resume, then drains.

Only when integrating a straight two-end adapter, verify length, angle and visible center placement while preserving width, plus zero-length handling with an effective nonzero transform, as specified by the host contract. This is host adaptation, not a JSON/runtime beam API.

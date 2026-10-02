# Runtime Verification

Use [configuration validation](config-validation.md) for JSON structure, cross-field relationships, CLI checks, and negative pure-configuration cases. This reference covers acceptance boundaries after actual integration; see [runtime integration](runtime-integration.md) for wiring and ownership.

## Host Validation

Determine validation commands from the project's existing tools and dependencies. Do not assume SDK or browser-tool locations or automatically install software to complete checks. Cover the following through the runtime/test entry points actually discovered:

- SDK synchronous types and the pure Core dependency boundary; parameters/defaults, write-field conflicts, fixed lifetimes, capacity/budgets, pool reuse, and error states.
- The core-to-main and modules-lifting mappings when parsing JSON into the SDK, continuous/burst controls, preflight of all layers, and pause/resume boundaries for completed layers.
- Asset/frame existence, Texture/source validity, and strictly shared sources within each set; single indices, random selection once per birth/channel 7/reset reproducibility, and sequence first-frame/progression/loop/clamp/pause behavior.
- Static random UV refresh when the same pooled object is reused, dynamic sequence UV and orig/trim vertex changes, birth order and persistent Particle objects, and separate tint/alpha uploads.
- Draw the target effect's actual materials and layer combination on the requested backend, recording image or pixel evidence of birth, progression, pause, draining after stop, reset, and rebirth. Three-layer fire is one example of a composite effect; choose acceptance cases for the current target effect. Explicitly report an unavailable backend as unverified rather than switching backends to substitute for the conclusion.
- Inject an actual render exception and confirm that entity advancement stops and preserves the original error. Construction failures reclaim already-created layers; replacement failures preserve the current entity. destroy attempts each layer best-effort, never falsely reporting success after failure, while shared atlases and host parent containers remain usable.
- Check ownership of textures, systems, containers, callbacks, and auxiliary resources on success and failure paths. Attempt each cleanup independently; a cleanup exception must not skip the remaining cleanup or overwrite the original error.

Passing type/unit checks does not establish actual GPU acceptance; actual graphics do not establish long-term or mobile-device performance. Report the actual version, backend, resources, commands, evidence, and unverified scope without expanding compatibility promises. Performance observations identify layers, configuration, dt, and device.

Naming checks cover canonical names, compatible aliases, and mixed axis names. Reject equal-valued dual aliases, both or neither TSA locations, and simultaneous selectionMode/mode. Validate range, activation, birth intervals, and fps*startLifetime uniformly across aliases without rewriting the input structure.

Space and gravity acceptance covers rejection of missing space/getter/gravity before resource resolution, affine inverse matrices, world birth positions/velocities, local inverse-A gravity, mixed layers, movement/rotation/scale and camera isolation, paused/update0 pose refresh, and preservation of host resources. See [space and gravity](space-gravity.md).

Trails acceptance covers retained trails after death and draining after stop, no sampling during paused/update0, birthId under pool reuse, breaks/point limits/trail-capacity faults, actual UVs/pixels, material trim/rotate, and resource ownership. See [Trails](trails.md).
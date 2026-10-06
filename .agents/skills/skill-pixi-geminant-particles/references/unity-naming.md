# Unity terminology boundaries

Geminant uses lowerCamelCase names for familiar particle concepts, but its JSON is not Unity serialization. [Runtime API](runtime-api.md) owns SDK wiring; the [effect Schema](../../skill-geminum-particle/references/effect.schema.json) owns configuration structure.

startLifetime is seconds; startRotation and rotationOverLifetime.z use radians and radians/second. Unity Inspector degrees cannot be copied numerically. startScale scales Texture.orig rather than specifying Unity world startSize. startTint and startAlpha are separate and multiply texture appearance.

emission describes a time schedule; shapeType point/circle/rectangle uses two-dimensional geometry. directionRadians/spreadRadians are planar radians, not a 3D cone angle. limitVelocityOverLifetime.drag is linear drag in 1/s, not a copied Unity damping constant. KinematicMotion owns combined integration.

textureSheetAnimation.selectionMode chooses single/random/sequence. Grid dimensions describe texture layout; single index is an ordinal, clips preserve explicit order, and fps is frames/second. This differs from Unity's normalized startFrame/timeMode/cycleCount.

simulationSpace is local/world; gravityModifier scales a host-supplied world vector. World appearance is configuration-driven while position/velocity use the emitter affine. No custom-space or scalingMode field is available.

Trails is fixed-width Stretch geometry with bounded observed paths; lifetime multiplies the parent total lifetime. It does not provide the full Unity Trails/Ribbon options. Do not add unimplemented Unity module fields to configuration.
Shape directionMode inward reuses the circle birth radial angle plus π, with nonnegative startSpeed. It launches toward the circle center at birth; it is not a continuous centripetal force or vortex. Point inward reverses its sampled planar direction, and rectangle requires fixed. Spread is applied around the chosen direction.

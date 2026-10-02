# Unity 6.6 Naming and Semantics

Naming follows lowerCamelCase in the Unity 6.6 (6000.6) Scripting API. This JSON is a Geminant contract, not a Unity serialization import format. The Unity Inspector displays rotation in degrees/degrees per second; do not copy those numeric values directly into Geminant's radians/radians per second. The [runtime API](runtime-api.md) owns parameter types, ranges, defaults, and APIs; the [schema](effect.schema.json) owns JSON structure.

| Canonical | Compatible alias | Semantic boundary |
| --- | --- | --- |
| layer.main | layer.core | The same Main assembly configuration |
| main.startLifetime | lifetimeSeconds | Fixed lifetime in seconds; state.lifetimeSeconds remains the read-only total lifetime provided by Core |
| main.startRotation | startRotationRadians | Single value/range, in radians |
| main.randomSeed | seed | uint32; a ParticleSystem property in Unity, organized under main in Geminant |
| emission.rateOverTime | ratePerSecond | Constant particles per second; exactly one is required |
| shape.shapeType | type | point/circle/rectangle; direction/spread/offset/width/height retain their original semantics and are not named arc/angle |
| modules.forceOverLifetime | force | Constant acceleration provider |
| forceOverLifetime.x/y | accelerationX/Y | Container-local pixels/second squared; analytically integrated by KinematicMotion |
| rotationOverLifetime.z | angularSpeedRadians | Radians per second |
| grid.numTilesX/numTilesY | columns/rows | Exactly one name is required per axis; mixing numTilesX+rows is valid |
| modules.textureSheetAnimation | renderer.selection | Exactly one is required per entity layer |
| textureSheetAnimation.selectionMode | mode | Geminant's single/random/sequence frame-selection strategy |

Do not provide both members of an alias pair, even when their values are equal. Defaults apply only when optional fields are omitted; explicit undefined is not omission. validate/parse return an independent, deeply frozen snapshot of the input structure without renaming fields or filling defaults; assembly reads their unified meaning.

selectionMode differs from Unity's Grid/Sprites mode. textureSets defines frame image sources. The single index is an integer index, not Unity's normalized startFrame; sequence loop is not cycleCount. Strategies have no timeMode, cycleCount, frame offset, or custom frame-selection parameters. Pure Core compile does not consume textureSheetAnimation; PixiFrameEffect/Renderer or JSON Entity consumes frame configuration.

startScale/Tint/Alpha retain Geminant semantics: scale scales Texture.orig and is not Unity startSize; tint and alpha are separate and do not directly equal Unity startColor. colorOverLifetime endTint/endAlphaFactor and sizeOverLifetime endScaleFactor are restricted forms, not Unity curves. direction/spread remain in radians. KinematicMotion is the integrator and is not named VelocityOverLifetime.

The corresponding factories are createEmissionModule, createShapeModule, createMainStartValues, createForceOverLifetimeModule, createColorOverLifetimeModule, createSizeOverLifetimeModule, createRotationOverLifetimeModule, and createTextureSheetAnimationFrameSelector. See the runtime API for equivalent factory exports and shared provider IDs; do not install the same field-writing module twice.

Main.simulationSpace uses local/world. Main.gravityModifier is a signed single value rather than a curve; the host injects the gravity baseline as a world vector, and Geminant does not read Physics3D gravity. See [space and gravity](space-gravity.md) for details. There are no custom space, scalingMode, or gravitySource extensions.

Trails uses Geminant's fixed-width, single Stretch material, bounded-path contract. lifetime is a multiplier of the parent's total lifetime, not an equivalent of all Unity Trails options or curves. See [Trails](trails.md) for complete parameter constraints.
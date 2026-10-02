# Configuration validation

Use the package-local [validate_effect.py](../scripts/validate_effect.py) to check the [Schema](effect.schema.json) and JSON entities. Python 3 and jsonschema must already be available. The script uses Draft202012Validator and does not download schemas or install dependencies.

Run from the skill package root:

```text
python scripts/validate_effect.py assets/fire.effect.json
python scripts/validate_effect.py assets/fire-grid.effect.json assets/trails.effect.json assets/space-gravity.effect.json
python scripts/validate_effect.py <effect-json>
```

Pass one or more JSON files; there is no default input. The script also works from any cwd with actual script and input paths. It locates the Schema relative to itself.

| Exit code | Meaning |
| --- | --- |
| 0 | All inputs pass |
| 1 | Input reading, JSON parsing, or contract validation failed |
| 2 | Invalid CLI usage, missing dependency, or Schema loading failed |

The validator strictly rejects duplicate JSON keys and nonfinite numbers. It checks structure, unique IDs, resource references, indices, ranges, activation/emission, capacity/birth budgets, frame-animation and lifetime products, grid products, and trail relationships. Defaults are annotations only and do not modify input. Consult the [Schema](effect.schema.json) for fields and ranges, and [JSON entity semantics](effect-contract.md) for meaning.

## What validation can establish

A pass establishes valid JSON structure and statically checkable cross-field relationships. It cannot establish resource existence, correct atlas frames, evenly divisible physical pixels, valid trim/rotate metadata, shared frame sources, actual rendering, or achievement of the visual goal.

Configuration design may retain logical resource keys while listing asset metadata requiring confirmation. World or nonzero-gravity configurations can pass JSON validation without host space or gravity objects at this stage.

## Pure JSON rejection cases

Select negative cases relevant to the change; runtime code is not required:

- Unknown fields, missing required fields, null, duplicate keys, NaN/Infinity, or overflowing numbers.
- Canonical and alias fields together, textures/grid together, empty sets or layers, or invalid resource references.
- Zero or fractional grid dimensions, excessive products, or out-of-range single indices. Do not apply the grid-count limit to explicit textures.
- Reversed ranges, an overflowing reciprocal for a positive rate, continuous without emission, burst with emission or exceeding capacity/birth budget, or overflowing sequence fps*lifetime.
- Only one of the trails module and renderer.trail, a trail set that is not single-frame, a lifetime product overflowing or underflowing to zero, breakDistance below minVertexDistance, invalid booleans, or unknown tile/curve fields.
- Invalid simulationSpace enums or nonfinite gravityModifier. Local/world and finite positive, zero, or negative multipliers can all be valid configurations.

On failure, correct the identified field or relationship first. Record uncertain resource information explicitly; do not invent frame names or claim completed validation using placeholder resources.

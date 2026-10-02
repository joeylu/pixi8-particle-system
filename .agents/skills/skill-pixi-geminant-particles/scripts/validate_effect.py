#!/usr/bin/env python3
"""Validate particle-effect JSON structure and semantics without loading assets."""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any

try:
    from jsonschema import Draft202012Validator
except ImportError:
    Draft202012Validator = None

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "references" / "effect.schema.json"


def _pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Duplicate JSON key: {key!r}")
        result[key] = value
    return result


def _constant(value: str) -> Any:
    raise ValueError(f"Non-JSON numeric constant: {value}")


def _path(parts: Any) -> str:
    return "$" + "".join(
        f"[{part}]" if isinstance(part, int) else f"[{json.dumps(part, ensure_ascii=False)}]"
        for part in parts
    )


def _finite_errors(value: Any, parts: tuple[Any, ...] = ()) -> list[str]:
    errors: list[str] = []
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        try:
            valid = math.isfinite(float(value))
        except (OverflowError, ValueError):
            valid = False
        if not valid:
            errors.append(f"{_path(parts)}: number must be finite in JavaScript")
    elif isinstance(value, dict):
        for key, child in value.items():
            errors.extend(_finite_errors(child, parts + (key,)))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            errors.extend(_finite_errors(child, parts + (index,)))
    return errors


def parse_json(text: str) -> Any:
    value = json.loads(text, object_pairs_hook=_pairs, parse_constant=_constant)
    errors = _finite_errors(value)
    if errors:
        raise ValueError("; ".join(errors))
    return value


def _check_local_refs(value: Any) -> None:
    if isinstance(value, dict):
        if "$schema" in value or "$id" in value:
            raise ValueError("The effect schema must not contain external schema identifiers")
        if "$ref" in value and not value["$ref"].startswith("#/$defs/"):
            raise ValueError("The effect schema must use same-document #/$defs references")
        for child in value.values():
            _check_local_refs(child)
    elif isinstance(value, list):
        for child in value:
            _check_local_refs(child)


def build_validator() -> Any:
    if Draft202012Validator is None:
        raise RuntimeError("Missing dependency: jsonschema. Supply an environment with jsonschema installed; this script does not install dependencies.")
    schema = parse_json(SCHEMA_PATH.read_text(encoding="utf-8"))
    _check_local_refs(schema)
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)


def alias_value(value: dict[str, Any], canonical: str, legacy: str, default: Any = None) -> Any:
    """Read one mutually exclusive spelling without changing the document."""
    if canonical in value and legacy in value:
        raise ValueError(f"{canonical} and {legacy} cannot both be supplied")
    return value[canonical] if canonical in value else value.get(legacy, default)


def grid_count(grid: dict[str, Any]) -> int:
    return alias_value(grid, "numTilesX", "columns") * alias_value(grid, "numTilesY", "rows")


def validate_document(document: Any, validator: Any) -> list[str]:
    errors = _finite_errors(document)
    if errors:
        return errors
    errors = [f"{_path(error.absolute_path)}: {error.message}" for error in validator.iter_errors(document)]
    if errors:
        return errors

    texture_sets: dict[str, Any] = {}
    for index, texture_set in enumerate(document["textureSets"]):
        if "grid" in texture_set:
            grid = texture_set["grid"]
            product = grid_count(grid)
            if product > 9007199254740991 or product > 4096:
                errors.append(f"{_path(('textureSets', index, 'grid'))}: tile count must be a safe integer <= 4096")
        identifier = texture_set["id"]
        if identifier in texture_sets:
            errors.append(f"{_path(('textureSets', index, 'id'))}: duplicate textureSet id {identifier!r}")
        else:
            texture_sets[identifier] = texture_set
    layer_ids: set[str] = set()
    for index, layer in enumerate(document["layers"]):
        base = ("layers", index)
        identifier = layer["id"]
        if identifier in layer_ids:
            errors.append(f"{_path(base + ('id',))}: duplicate layer id {identifier!r}")
        layer_ids.add(identifier)
        core = alias_value(layer, "main", "core", {})
        emission = layer.get("modules", {}).get("emission")
        if emission is not None:
            rate = float(alias_value(emission, "rateOverTime", "ratePerSecond"))
            if rate > 0 and not math.isfinite(1 / rate):
                errors.append(f"{_path(base + ('modules', 'emission'))}: positive rate must have a finite birth interval")
        for field in ("startSpeed", "startScale", "startRotation"):
            value = alias_value(core, "startRotation", "startRotationRadians") if field == "startRotation" else core.get(field)
            if isinstance(value, dict) and value["min"] > value["max"]:
                errors.append(f"{_path(base + ('core', field))}: min must be <= max")
        activation = layer["activation"]
        if activation["mode"] == "burst":
            count = activation["count"]
            capacity = core.get("maxParticles", 128)
            budget = core.get("maxBirthsPerUpdate", capacity)
            if count > capacity:
                errors.append(f"{_path(base + ('activation', 'count'))}: burst count {count} exceeds maxParticles {capacity}")
            if count > budget:
                errors.append(f"{_path(base + ('activation', 'count'))}: burst count {count} exceeds maxBirthsPerUpdate {budget}")
        renderer = layer["renderer"]
        reference = renderer["textureSet"]
        texture_set = texture_sets.get(reference)
        if texture_set is None:
            errors.append(f"{_path(base + ('renderer', 'textureSet'))}: unknown textureSet {reference!r}")
        modules = layer.get("modules", {})
        if "trails" in modules:
            trails = modules["trails"]
            duration = float(trails.get("lifetime", 0.3)) * float(alias_value(core, "startLifetime", "lifetimeSeconds", 1))
            if not math.isfinite(duration) or duration <= 0:
                errors.append(f"{_path(base + ('modules', 'trails', 'lifetime'))}: lifetime * parent startLifetime must be finite and positive")
            if trails.get("breakDistance", 256) < trails.get("minVertexDistance", 4):
                errors.append(f"{_path(base + ('modules', 'trails', 'breakDistance'))}: breakDistance must be >= minVertexDistance")
            trail_reference = renderer["trail"]["textureSet"]
            trail_set = texture_sets.get(trail_reference)
            if trail_set is None:
                errors.append(f"{_path(base + ('renderer', 'trail', 'textureSet'))}: unknown textureSet {trail_reference!r}")
            elif (len(trail_set["textures"]) if "textures" in trail_set else grid_count(trail_set["grid"])) != 1:
                errors.append(f"{_path(base + ('renderer', 'trail', 'textureSet'))}: trail texture set must contain exactly one frame")
        if "textureSheetAnimation" in modules and "selection" in renderer:
            errors.append(f"{_path(base)}: textureSheetAnimation and renderer.selection are mutually exclusive")
            continue
        selection = modules.get("textureSheetAnimation", renderer.get("selection"))
        mode = alias_value(selection, "selectionMode", "mode")
        if mode == "single" and texture_set is not None:
            selected_index = selection.get("index", 0)
            frame_count = len(texture_set["textures"]) if "textures" in texture_set else grid_count(texture_set["grid"])
            if selected_index >= frame_count:
                errors.append(f"{_path(base + ('renderer', 'selection', 'index'))}: index {selected_index} is outside textureSet {reference!r}")
        if mode == "sequence":
            product = float(selection["fps"]) * float(alias_value(core, "startLifetime", "lifetimeSeconds", 1))
            if not math.isfinite(product):
                errors.append(f"{_path(base + ('renderer', 'selection', 'fps'))}: fps * lifetimeSeconds must be finite")
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="+", type=Path, help="Particle-effect JSON file(s)")
    arguments = parser.parse_args(argv)
    try:
        validator = build_validator()
    except Exception as error:
        print(f"VALIDATOR ERROR: {error}", file=sys.stderr)
        return 2
    failed = False
    for path in arguments.files:
        try:
            document = parse_json(path.read_text(encoding="utf-8"))
            errors = validate_document(document, validator)
        except (OSError, UnicodeError, ValueError, RecursionError) as error:
            errors = [str(error)]
        if errors:
            failed = True
            print(f"FAIL {path}", file=sys.stderr)
            for error in errors:
                print(f"  {error}", file=sys.stderr)
        else:
            print(f"PASS {path}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())

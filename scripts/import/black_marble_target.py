"""Resolve observation-site and reviewed calibration-anchor targets."""

from __future__ import annotations

import json
from pathlib import Path


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def resolve_target(root: Path, identifier: str, kind: str):
    if kind == "site":
        records = load_json(root / "data-config" / "sources" / "observation-sites.json")
        target = next((item for item in records if item["slug"] == identifier), None)
        label = "site slug"
    elif kind == "anchor":
        config = load_json(root / "data-config" / "calibration" / "darkness-anchors.json")
        records = config["anchors"]
        target = next((item for item in records if item["id"] == identifier), None)
        label = "darkness anchor id"
    else:
        raise ValueError(f"Unknown target kind: {kind}")
    if target is None:
        raise SystemExit(f"Unknown {label}: {identifier}")
    return target

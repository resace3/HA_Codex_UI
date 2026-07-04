#!/usr/bin/env python3
import os
import pathlib
import re
import sys

if os.environ.get("GITHUB_ACTIONS") != "true":
    print("This script is intended to run only in GitHub Actions. It did not run locally.")
    sys.exit(2)

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config_pilot" / "config.yaml"
REPOSITORY = ROOT / "repository.yaml"


def fail(message: str) -> None:
    print(f"metadata validation failed: {message}", file=sys.stderr)
    sys.exit(1)


def read(path: pathlib.Path) -> str:
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


repository = read(REPOSITORY)
config = read(CONFIG)

for key in ["name:", "url:", "maintainer:"]:
    if key not in repository:
        fail(f"repository.yaml missing {key}")

required_pairs = {
    "name: Config Pilot": "display name",
    "slug: config_pilot": "slug",
    "version: 0.1.0": "version",
    "ingress: true": "ingress",
    "ingress_port: 8107": "ingress port",
    "panel_title: Config Pilot": "panel title",
    "init: false": "init flag",
}

for needle, label in required_pairs.items():
    if needle not in config:
        fail(f"config.yaml missing {label}")

if not re.search(r"version:\s+\d+\.\d+\.\d+", config):
    fail("version must be semver")

for arch in ["amd64", "aarch64"]:
    if f"  - {arch}" not in config:
        fail(f"missing arch {arch}")

dangerous = [
    "full_access:",
    "docker_api:",
    "host_network:",
    "privileged:",
    "hassio_role: admin",
]

for key in dangerous:
    if key in config:
        fail(f"dangerous key present: {key}")

for required in [
    "config_pilot/Dockerfile",
    "config_pilot/run.sh",
    "config_pilot/apparmor.txt",
    "config_pilot/README.md",
    "config_pilot/DOCS.md",
    "config_pilot/icon.svg",
    "config_pilot/logo.svg",
]:
    if not (ROOT / required).exists():
        fail(f"missing {required}")

if "type: config\n    read_only: true" not in config:
    fail("/config map must be read-only by default")

if "allow_config_write: false" not in config:
    fail("allow_config_write must default false")

if "schema:" not in config:
    fail("schema missing")

print("Config Pilot add-on metadata validated.")

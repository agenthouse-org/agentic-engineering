---
name: ah-update
description: "Switch latest vs exact update tracking, or verify and install a reviewed agenthouse release (bundle or public channel). Use when changing update preference or applying an approved upgrade."
license: MIT
---

# agenthouse update

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

For a supplied bundle, inspect with --check before applying. For the public channel, use --latest and report npm provenance/signature verification plus any GitHub fallback diagnostics. Use --track latest or exact only when the user chose that preference. Preserve the exact activated identity and pins; do not add --allow-breaking unless that change is authorized.

CLI reference:

```text
update --bundle FILE (--sha256 HASH | --public-key FILE) [--check] [--allow-breaking]
update --latest [--check] [--allow-breaking] [--npm-cli PATH]
update --track latest|exact
Verify and activate an approved bundle, resolve the npm-first/GitHub-fallback public channel, or select a moving/exact consumer preference. Every activation records an exact version and digest; CI/frozen evaluation never updates.
```

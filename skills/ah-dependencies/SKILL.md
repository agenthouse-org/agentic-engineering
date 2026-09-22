---
name: ah-dependencies
description: "Show, pin, unpin, or update bundled skills such as frontend-acceptance and web-usability. Use when a specialist skill is missing, integrity fails, or applying a trusted dependency bundle."
license: MIT
---

# agenthouse dependencies

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Choose status, pin, unpin, or update. Default to status if unclear. For updates use a trusted bundle checksum or key, inspect --check first, and respect pins. Do not invent a new version or silently unpin.

CLI reference:

```text
dependencies status
dependencies pin | unpin [--name frontend-acceptance|web-usability-conformity|hooks]
dependencies update --bundle FILE (--sha256 HASH | --public-key FILE) [--check] [--allow-breaking]
Manage bundled upstream skills. Pins bind version and digest; updates preserve upstream ownership.
```

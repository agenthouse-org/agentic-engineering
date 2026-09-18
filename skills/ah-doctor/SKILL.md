---
name: ah-doctor
description: "Diagnose installation, policy snapshot, and required skill integrity problems. Use when enrollment looks broken, skills are missing, or asking why agenthouse is unhealthy."
license: MIT
---

# agenthouse doctor

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Inspect problems and explain their concrete impact. Diagnosis does not authorize unrelated repairs or policy changes.

CLI reference:

```text
doctor
Check installation, policy snapshot, required skill integrity, and housekeeping ignore/tracked-capture rules.
Exit 0: healthy installation; exit 2: problems. This does not certify application quality.
```

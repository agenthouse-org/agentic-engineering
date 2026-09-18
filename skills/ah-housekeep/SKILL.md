---
name: ah-housekeep
description: "Ensure generated and inspection paths stay out of Git and remove untracked screenshot dumps. Use when leftover captures appear, after frontend-acceptance, or at session start."
license: MIT
---

# agenthouse housekeep

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Apply housekeeping rules: ensure generated and inspection paths are gitignored, delete untracked inspection captures, and report tracked leftovers. Do not delete evaluation reports under artifacts/agenthouse/, work records, or application source. In CI or when AH_KEEP_BROWSER_ARTIFACTS is set, skip deletion. --check reports without writing.

CLI reference:

```text
housekeep [--check]
Apply housekeeping rules: add missing ignore paths for generated agenthouse files and inspection captures, then delete untracked inspection dumps. Does not delete evaluation reports, work records, or Git-tracked files. --check reports without changing the repository. Exit 0 passed, 1 tracked leftovers, 4 missing ignore rules.
```

---
name: ah-housekeep
description: "Verify that configured generated output stays out of Git; preserve fixtures, baselines and review evidence. Use when leftover captures appear, after frontend-acceptance, or at session start."
license: MIT
---

Generated from ah-engineering 1.4.0.

# agenthouse housekeep

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Verify effective Git exclusions for configured generated output. Inspect actual test-tool output paths per repository and record outputs separately from fixtures/baselines. Never infer permission to ignore or delete directories from their names. Preserve evidence by default. Only explicitly requested housekeep --clean may remove configured artifacts.cleanup paths; Git errors or indexed files prevent deletion.

CLI reference:

```text
housekeep [--check] [--clean]
Verify configured output paths with Git, including staged/tracked files and ignore negations. --clean removes only explicitly configured artifacts.cleanup paths and preserves indexed files and CI evidence. No directory-name heuristics or automatic deletion. Exit 0 passed, 1 tracked output, 2 inspection error, 4 missing exclusions.
```

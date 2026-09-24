---
name: ah-restore
description: "Restore missing central assets or legacy project projections from this project’s exact recorded version. Use when the pinned runtime or skills are missing after a clone or machine change."
license: MIT
---

Generated from ah-engineering 1.3.0.

# agenthouse restore

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Restore the exact recorded version set and agents. Use an original bundle when the pinned runtime and exact package are unavailable. Preserve consumer state; report conflicts rather than changing pins. Opt existing installations into generated-file ignore rules only when requested.

CLI reference:

```text
restore [--bundle FILE] [--ignore-generated]
Recreate owned assets from the exact active pin and recorded agents. Uses the cached runtime, exact executing package, or original unsigned bundle. --ignore-generated opts an existing installation into owned-file ignore rules. Preserves policy snapshots and refuses edits; recover handles interrupted transactions.
```

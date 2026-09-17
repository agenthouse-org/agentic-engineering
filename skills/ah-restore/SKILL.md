---
name: ah-restore
description: "Recreate owned generated assets from the exact recorded pin and agents. Use when generated skills or projections are missing, or to opt into generated-file ignore rules."
license: MIT
---

# agenthouse restore

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Restore the exact recorded version set and agents. Use an original bundle when the pinned runtime and exact package are unavailable. Preserve consumer state; report conflicts rather than changing pins. Opt existing installations into generated-file ignore rules only when requested.

CLI reference:

```text
restore [--bundle FILE] [--ignore-generated]
Recreate owned assets from the exact active pin and recorded agents. Uses the cached runtime, exact executing package, or original unsigned bundle. --ignore-generated opts an existing installation into owned-file ignore rules. Preserves policy snapshots and refuses edits; recover handles interrupted transactions.
```

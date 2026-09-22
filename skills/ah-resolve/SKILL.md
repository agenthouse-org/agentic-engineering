---
name: ah-resolve
description: "Rebuild or freeze-check the merged policy file at .agenthouse/resolved.json. Use when policy sources changed, verifying a frozen snapshot, or before evaluation that needs current rules."
license: MIT
---

# agenthouse resolve

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use --frozen for a verification request. Refresh only when resolving reviewed configuration changes is intended; do not hide drift by automatically refreshing.

CLI reference:

```text
resolve [--frozen] [--policy-file FILE]
Resolve configured policy sources. --frozen verifies the existing snapshot without refreshing it.
```

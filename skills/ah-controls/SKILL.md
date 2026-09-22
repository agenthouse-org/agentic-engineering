---
name: ah-controls
description: "Show which policy rules map to real checks versus advisory text only. Use when asking what is enforced, how a rule is implemented, or which guidance has no automated control."
license: MIT
---

# agenthouse controls

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Explain the resolved rule-to-mechanism map and identify guidance without enforcement. Verify actual CI and host activation before calling a configured control active.

CLI reference:

```text
controls [--policy-file FILE]
Map resolved rule identifiers to actual runtime mechanisms and configured checks. Unknown rules remain guidance; deployment activation is not inferred.
```

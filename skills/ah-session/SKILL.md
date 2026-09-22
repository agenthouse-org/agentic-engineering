---
name: ah-session
description: "Record active versions, apply configured updates and housekeeping, and report policy drift without silently adopting it. Use at task start or when checking the active agenthouse version and policy snapshot."
license: MIT
---

# agenthouse session

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Explain any applied or deferred approved updates, housekeeping, and the active version set. If policyChange is changed, show the new revision and affected rules/checks, keep the current frozen snapshot, and ask whether this work should adopt it. Run resolve only after the user chooses adoption. Noninteractive work must report the mismatch rather than choose.

CLI reference:

```text
session [--npm-cli PATH]
Check configured approved updates between commands, report policy drift without replacing the frozen snapshot, apply housekeeping rules, and record the active version set.
```

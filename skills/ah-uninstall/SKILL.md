---
name: ah-uninstall
description: "Remove unchanged managed agenthouse files while keeping configuration, work records, and evidence. Use when removing the framework from a repository."
license: MIT
---

# agenthouse uninstall

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use only for an intended removal. Explain retained configuration/evidence and let ownership checks preserve edits. Do not recursively delete the project.

CLI reference:

```text
uninstall
Remove unchanged managed files. Preserve configuration, policies, keys, work records, and evidence.
```

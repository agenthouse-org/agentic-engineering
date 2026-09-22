---
name: ah-help
description: "List installed agenthouse skills and suggest which one fits a goal. Use when asking what agenthouse can do, which ah-* skill to pick, or for the command map."
license: MIT
---

# agenthouse help

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Explain the installed command map and recommend the next command for the user’s goal. This request is read-only; do not enroll or update anything.

CLI reference:

```text
help [COMMAND|agents|cookbook|extended|ah-SKILL]
```

---
name: ah-context
description: "Locate this project’s lifecycle and skills in central storage. Use when loading agenthouse guidance in any coding agent."
license: MIT
---

# agenthouse context

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Read the returned pinned lifecycle and skill files, using the target repository as the working directory. Never substitute a newer global skill for the project pin.

CLI reference:

```text
context
Print this project’s pinned central lifecycle and skill paths. Read those files from any agent; no project skill copies or automatic host discovery are required.
```

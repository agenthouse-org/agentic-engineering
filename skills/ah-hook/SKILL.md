---
name: ah-hook
description: "Use agenthouse hook when the user requests this framework operation. Process only the actual hook event supplied by the host or an explicitly requested fixture."
license: MIT
---

# agenthouse hook

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Process only the actual hook event supplied by the host or an explicitly requested fixture. Host hooks are supplementary controls; keep required checks in CI. Report malformed events as errors.

CLI reference:

```text
hook [--vendor claude|cursor|ci] [--input FILE]
Process a native or normalized JSON event from stdin or FILE with the pinned hooks runtime. Uses frozen project policy; no check installs software.
```

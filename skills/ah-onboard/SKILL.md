---
name: ah-onboard
description: "Use agenthouse onboard when the user requests this framework operation. Guide setup conversationally: infer the target and coding agents from context, ask only for missing choices, and explain policy/autonomy options."
license: MIT
---

# agenthouse onboard

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Guide setup conversationally: infer the target and coding agents from context, ask only for missing choices, and explain policy/autonomy options. Run onboard with explicit --agents or --non-interactive; never launch an interactive terminal wizard from an agent. Then help the user formulate their first real outcome. Existing installations keep their configuration.

CLI reference:

```text
onboard [--root PATH] [--agents claude,codex,cursor] [--policy FILE] [--autonomy supervised|bounded|delegated]
Guided setup in a terminal. Supply --agents (or --non-interactive) for scripts.
Existing installations receive a read-only next-step guide; configuration is preserved.
```

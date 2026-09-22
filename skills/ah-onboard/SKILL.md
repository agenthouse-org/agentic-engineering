---
name: ah-onboard
description: "Walk through coding-agent choice, policy, and autonomy, then enroll this repository. Use when starting with agenthouse or adding it to a project."
license: MIT
---

# agenthouse onboard

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Guide setup conversationally: infer the target and coding agents from context, ask only for missing choices, and explain policy/autonomy options. Run onboard with explicit --agents or --non-interactive and --docs skip; never launch an interactive terminal wizard or open desktop applications from an agent unless the user requests it. Then point out the installed cookbook and agent-command guide and help the user formulate their first real outcome. Existing installations keep their configuration.

CLI reference:

```text
onboard [--root PATH] [--agents claude,codex,cursor] [--policy FILE] [--autonomy supervised|bounded|delegated] [--docs open|show|skip]
        [--branch-pattern PATTERN] [--branch-example EXAMPLE] [--branch-base REF]
Guided setup asks whether to open the Markdown guides in the default app, show them in the terminal, or skip. With Git present it asks for a branch naming pattern (for example {id}-{slug}) when unset. Supply --agents (or --non-interactive) and --docs for scripts.
Existing installations receive the same documentation choice and a read-only next-step guide; configuration is preserved.
```

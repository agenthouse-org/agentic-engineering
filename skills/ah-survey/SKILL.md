---
name: ah-survey
description: "Inspect repository tooling and conservative test-layer evidence without executing discovered commands. Use when exploring an unfamiliar repository or identifying missing, ambiguous, or suspected nominal test layers."
license: MIT
---

# agenthouse survey

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Inspect the actual target repository before proposing commands. Report test-layer evidence, absence, ambiguity, and suspected nominal signals with their limitations. Ask which layer names the organization uses when the portable vocabulary needs local aliases, and record only a consumer-reviewed mapping. The survey does not execute scripts or enroll the project.

CLI reference:

```text
survey [--output FILE]
Inspect Git state, stacks, scripts, agent files, pipelines, backlog locations, and evidence for test layers. Static nominal signals are review prompts. No discovered command is executed.
```

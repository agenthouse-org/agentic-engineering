---
name: ah-survey
description: "Read Git state, scripts, pipelines, and agent files to report which test layers look present, missing, or only nominally named—without running those commands. Use when exploring an unfamiliar repository or deciding what to wire into evaluate."
license: MIT
---

Generated from ah-engineering 1.3.0.

# agenthouse survey

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Inspect the actual target repository before proposing commands. Report test-layer evidence, absence, ambiguity, and suspected nominal signals with their limitations. Ask which layer names the organization uses when the portable vocabulary needs local aliases, and record only a consumer-reviewed mapping. The survey does not execute scripts or enroll the project.

CLI reference:

```text
survey [--output FILE]
Inspect Git state, stacks, scripts, agent files, pipelines, backlog locations, and evidence for test layers. Static nominal signals are review prompts. No discovered command is executed.
```

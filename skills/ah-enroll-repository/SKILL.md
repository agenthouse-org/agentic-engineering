---
name: ah-enroll-repository
description: "Enroll this repository through conversational agenthouse onboarding. Use when setting up agenthouse here by choosing coding agents, policy, and autonomy."
license: MIT
---

# agenthouse enroll-repository

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use the ah-onboard skill. Inspect the target, infer known preferences, gather missing configuration, and call the existing onboarding CLI noninteractively. Preserve consumer configuration and explain the resulting commands.

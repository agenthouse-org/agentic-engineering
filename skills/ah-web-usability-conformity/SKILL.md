---
name: ah-web-usability-conformity
description: "Run an installed upstream web usability conformity assessment."
license: MIT
---

# agenthouse web-usability-conformity

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Locate .agents/skills/web-usability-conformity/SKILL.md from a reviewed agenthouse-skills import and follow its resources. If absent, report the missing optional dependency and explain skill --source with the user’s reviewed source path; do not download it or invent an audit result. Report actual findings, unavailable checks, and evidence. This is separate from the required frontend-acceptance method.

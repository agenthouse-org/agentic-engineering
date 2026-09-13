---
name: ah-draft-user-story
description: "Draft a story or bug with observable acceptance criteria."
license: MIT
---

# agenthouse draft-user-story

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Locate the requested outcome and the team’s work-item source, local or integrated. Distinguish stated requirements from proposed details. Draft outcome, scope, acceptance criteria, dependencies, and open questions; for bugs include reproduction, expected behavior, and observed behavior. For UI changes read the installed frontend-acceptance skill. Present a draft, not a readiness approval. Use work new only when creation is requested; external writes need authorization.

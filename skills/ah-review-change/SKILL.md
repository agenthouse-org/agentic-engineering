---
name: ah-review-change
description: "Review a change against its requirements and evidence."
license: MIT
---

# agenthouse review-change

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Resolve the change and its requirements from local records or configured tools. Read the diff and applicable policy; inspect correctness, scope, risks, test coverage, and acceptance evidence. Run relevant available checks through the configured CLI and inspect UI screenshots through frontend-acceptance when applicable. Distinguish baseline defects and missing evidence. Report actionable findings with locations and impact. Disclose if you authored the change and follow team independence rules. A review report does not approve, merge, or mark work done.

---
name: ah-assess-story-readiness
description: "Assess whether one existing work item is complete enough to implement. Use when asking if a story is ready, blocked, or missing facts."
license: MIT
---

# agenthouse assess-story-readiness

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Run gate --item FILE --phase ready against the actual item and policy; use its findings as the completeness baseline.

Reply as Decide / Ready or Blocked / Missing. Cite each missing fact with suggested wording. Evaluate completeness separately from truth. Disclose authorship.

Decide:
1. Ready to implement? yes / no / blocked-on-X
2. Visual plan needed? If UI or data-model work has no fields.visualPlan, offer wireframe, mermaid, both, or neither — do not invent screens unless they choose it
3. Independent review required?

A readiness assessment is not a stage transition or signature. Expand only if the user asks.

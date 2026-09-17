---
name: ah-validate-scope
description: "Assess whether a set of requirements covers an intended outcome, including gaps, unrelated work, and sequencing. Use when checking if stories or requirement files are enough before implementation."
license: MIT
---

# agenthouse validate-scope

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

This is an agent assessment workflow, not a validate-scope CLI subcommand. Do not run validate-scope or infer its existence from this skill name. Use help to discover commands supported by the pinned runtime. A local work item is optional: use the supplied outcome and authoritative requirements; report missing inputs without creating records unless requested.

Reply as Decide / Coverage / Gaps. Map the stated target to the supplied scope. Identify uncovered outcomes, unrelated work, dependencies, sequencing, and assumptions. A set of individually ready stories can still miss the target.

Decide:
1. Does this set hit the outcome? yes / no / not-enough-input
2. Must-have vs later
3. Visual plan for the overall product shape: mermaid, wireframe, both, or neither

Do not invent commitments or approve scope changes. Keep it short unless the user asks for more.

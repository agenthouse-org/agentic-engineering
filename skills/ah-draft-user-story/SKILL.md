---
name: ah-draft-user-story
description: "Draft a story or bug with observable acceptance criteria, scope, and open questions. Use when writing requirements, turning an idea into a work item, or clarifying a bug."
license: MIT
---

# agenthouse draft-user-story

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Keep the reply short unless the user asks for more.

Decide (only questions that change the work):
1. Outcome and actor
2. In / out of scope
3. Visual plan: wireframe, mermaid, both, or neither — default wireframe for UI, mermaid for data/API, neither for copy/docs/one-line
4. Remaining open choices, each with a recommended option

Then a compact draft: outcome, scope, 3–8 observable criteria, and for bugs reproduction / expected / observed. Distinguish stated requirements from proposed details. For UI work read the installed frontend-acceptance skill. Present a draft, not a readiness approval. Use work new only when creation is requested; external writes need authorization. If they pick a visual plan, follow ah-visual-plan and link fields.visualPlan.

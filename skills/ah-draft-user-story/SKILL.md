---
name: ah-draft-user-story
description: "Draft a story or bug with observable acceptance criteria, scope, and open questions. Use when writing requirements, turning an idea into a work item, or clarifying a bug."
license: MIT
---

Generated from ah-engineering 1.5.1.

# agenthouse draft-user-story

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Keep the reply short unless the user asks for more.

Decide (only questions that change the work):
1. Outcome and actor
2. In / out of scope
3. Too large for one ticket? split / keep / need-input — if split, propose thin slices; never create work or branches until the user says yes
4. Visual plan: wireframe, mermaid, both, or neither — default wireframe for UI, mermaid for data/API, neither for copy/docs/one-line
5. Remaining open choices, each with a recommended option

Then a compact draft: outcome, scope, 3–8 observable criteria, and for bugs reproduction / expected / observed. Distinguish stated requirements from proposed details. More than eight criteria or multiple independent outcomes usually means split; set fields.sizeRisk to oversized on the work record when keeping a draft that is still too large. For UI work read the installed frontend-acceptance skill. Present a draft, not a readiness approval. Use work new only when creation is requested; then offer work branch from a chosen base using git.branchNaming (ask and store the pattern if missing). External writes need authorization. If they pick a visual plan, follow ah-visual-plan and link fields.visualPlan.

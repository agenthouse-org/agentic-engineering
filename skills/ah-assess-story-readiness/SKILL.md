---
name: ah-assess-story-readiness
description: "Assess whether one existing work item is complete enough to implement. Use when asking if a story is ready, blocked, or missing facts."
license: MIT
---

Generated from ah-engineering 1.3.0.

# agenthouse assess-story-readiness

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Run gate --item FILE --phase ready against the actual item and policy; use its findings as the completeness baseline, including ticketSize when present.

Reply as Decide / Ready or Blocked / Missing. Cite each missing fact with suggested wording. Evaluate completeness separately from truth. Disclose authorship.

Decide:
1. Ready to implement? yes / no / blocked-on-X
2. If ticketSize is pending: split into new work items (ask before creating), or keep with an explicit fields.sizeOverride reason after user consent — do not invent the override
3. If creating a split item: offer a related Git branch (work branch) from the current or chosen base; configure git.branchNaming first if missing
4. Visual plan needed? If UI or data-model work has no fields.visualPlan, offer wireframe, mermaid, both, or neither — do not invent screens unless they choose it
5. Independent review required?

Recommend follow-up skills by kind: feature → ah-visual-plan then ah-spec; bug → ah-spec then ah-check-commit; tech-assessment or investigation → ah-assess-tech-feasibility; spike → ah-assess-tech-feasibility then ah-spec for an authorized PoC. At most three recommendations. A readiness assessment is not a stage transition or signature. Expand only if the user asks.

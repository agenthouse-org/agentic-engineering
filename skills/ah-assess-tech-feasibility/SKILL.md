---
name: ah-assess-tech-feasibility
description: "Assess a proposed technical change, blast radius, encapsulation, rollout options, migration and consumer impact. Use when asking about feasibility or an architecture decision before implementation."
license: MIT
---

Generated from ah-engineering 1.4.0.

# agenthouse assess-tech-feasibility

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

This is an assessment workflow, not an evaluator or approval. Read docs/technical-feasibility.md from the pinned runtime for the executable inventory and summary contract.

Use one work item from ah-work or ah-backlog with a change hypothesis in fields.outcome, plus any named downstream consumers. Resolve an exact Git commit. Inspect both bundled stacks through committed files, never assume a Node-only architecture. Define literal selectors, run assessment to capture a deterministic file list with reasons and candidate occurrences, and classify every occurrence as boundary, direct or excluded with location and reason. Distinguish lexical evidence from semantic analysis; preserve the selectors, inventory digest and comparable counts. Include affected routes, jobs, migrations, config and tests, not just classes. Record extra files and inaccessible consumers explicitly; do not imply completeness from a search.

Compare at least three rollout scenarios: big bang, parallel operation with dual write, and strangler with adapter. Use the same 1–5 favorability scale for effort, risk, reversibility, prerequisites and operational impact. Rank and explain each, including inapplicable options; never silently choose a winner. Sketch ordered migration steps with consistency invariants and abort points. For each named consumer state changes and what remains unchanged.

Write a repository ADR-style assessment (context, options, decision proposal, consequences), current and target Mermaid diagrams via ah-visual-plan, and the adjacent JSON summary. Link the work item and artifacts using the documented hashes. Run assessment --summary to validate structural completeness, not technical success. Follow-up stories may link fields.technicalAssessment and fields.assessmentCommit for ready-gate completeness. Open questions remain open; proposal is not approval. Do not run project checks in ordinary assessment mode.

Only when PoC mode is requested: create the branch through ah-work, write tests for every touched behavior/line, record red then green with ah-spec using the same configured command and inspect the assertion failures. Record uncovered lines and unavailable runs as incomplete. Check each proposed commit through ah-check-commit. Preserve the PoC as assessment evidence, not delivery or approval. ah-evaluate owns execution outcomes; ah-sign and ah-gate retain approval boundaries.

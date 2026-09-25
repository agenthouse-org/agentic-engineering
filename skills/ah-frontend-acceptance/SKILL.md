---
name: ah-frontend-acceptance
description: "Compare UI work to the story, bug, wireframe, or reference image using real screenshots and the pinned frontend-acceptance method. Use when checking visual design, screens, or frontend acceptance."
license: MIT
---

Generated from ah-engineering 1.6.0.

# agenthouse frontend-acceptance

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Run dependencies status, then run context and read its frontend-acceptance SKILL.md and follow its supporting resources. Derive evidence from the reference image, wireframe, story, or bug. Do not substitute regression equality for concept conformance. If the upstream dependency is missing or modified, report the problem rather than inventing an alternative method.

The upstream evidence-record template is a written report, not permission to commit screenshot dumps. Inspection captures are ephemeral: write them only under .agenthouse/evidence/<work-id>/. Never write galleries to tests/output, tests/screenshots, screenshots/, or a newly invented dump folder. After inspecting, run node .agenthouse/run.mjs housekeep instead of inventing a screenshot directory or deleting files ad hoc. Housekeep verifies the configured output paths with Git and preserves evidence. Cleanup requires explicit artifacts.cleanup paths and housekeep --clean; it never infers disposable data from names. Durable Git coverage is reviewed Playwright snapshots and tests. Record criterion findings, hashes, and evaluation report paths on the work item. CI archives the actual report folder printed by evaluate; central installations default to .agenthouse/local/reports/.

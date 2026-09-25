---
name: ah-check-commit
description: "Check the behavior affected by a commit or change range against its intended outcome. Use when verifying a fix, looking for regressions, or inspecting what a commit changed."
license: MIT
---

Generated from ah-engineering 1.5.1.

# agenthouse check-commit

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Run inspect for the requested ref/base, then compare the changed behavior to its intended outcome. Inspect the repository’s actual tooling, select relevant checks, and execute those supported in the environment. For a bugfix seek a regression test that fails before the fix and passes after it, using an isolated checkout if needed; preserve the user’s working tree. Distinguish inherited failures and unrun checks. Use the configured CLI evaluation when applicable and report evidence without committing, pushing, or approving. Lead with pass / fail / incomplete and the checks that matter; do not narrate the whole diff unless asked.

---
name: ah-check-commit
description: "Check the behavior affected by a commit or change range."
license: MIT
---

# agenthouse check-commit

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Run inspect for the requested ref/base, then compare the changed behavior to its intended outcome. Inspect the repository’s actual tooling, select relevant checks, and execute those supported in the environment. For a bugfix seek a regression test that fails before the fix and passes after it, using an isolated checkout if needed; preserve the user’s working tree. Distinguish inherited failures and unrun checks. Use the configured CLI evaluation when applicable and report evidence without committing, pushing, or approving.

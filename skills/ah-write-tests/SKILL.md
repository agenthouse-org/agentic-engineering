---
name: ah-write-tests
description: "Prepare to author failing tests from an accepted test plan after a green baseline, then mark criteria written and hand off to ah-spec red for TDD. Use when turning a test plan into repository tests without implementing product code."
license: MIT
---

Generated from ah-engineering 1.10.0.

# agenthouse write-tests

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Require an accepted test plan and a green baseline of the existing suite before authoring. Run write-tests prepare; if baseline is missing, run the suite, record baseline.status passed on the plan, then prepare again. Write only new failing tests for planned items using repository conventions from survey/module (node-typescript or php-laravel). For interaction/end-to-end use Playwright or the repo e2e runner and agenthouse-criterion annotations when applicable; pair visual concept criteria with frontend-acceptance rather than inventing a second pipeline.

Do not modify or delete existing tests without an explicit decisions entry. A compilation or environment failure is not a valid red. After writing TDD tests, run write-tests mark-written for those criteria, then spec --phase red before implementation. Do not implement product behavior in this skill.

CLI reference:

```text
write-tests prepare --item FILE [--plan FILE] [--evaluator ID]
write-tests mark-written --item FILE --criteria ID[,ID] [--plan FILE]
Require a green baseline, list planned tests to author, then mark written items. For method tdd hand off to spec --phase red before implementation. Does not invent implementation code.
```

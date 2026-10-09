---
name: ah-test-plan
description: "Propose and record which tests cover each acceptance criterion (level, method, file). Use when planning TDD or multi-level tests before writing them, including frontend interaction criteria."
license: MIT
---

Generated from ah-engineering 1.12.0.

# agenthouse test-plan

Work from the target repository root. Read its AGENTS.md and applicable policy. Before planning or making a change, load applicable engineering guidelines and assess the approach against them. Follow mandatory rules, explain relevant deviations, and run applicable automated checks during verification. Ask only when guidance conflicts, a material decision is missing, or an exception needs authorization; reuse current context and existing authorization. Consult the pinned docs/engineering-guidelines.md for discovery and assessment details. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Act as test-manager guidance when that role is loaded. Read the work item criteria and the organization testing standard (module standards or policy). Propose per-criterion tests: level (unit, component, integration, functional-api, end-to-end, interaction, regression, contract), method (tdd, characterization, verify-after), file path, and optional case id. Flag untestable criteria with a reason. Do not collapse UI criteria into unit tests without an explicit work-record decision.

Write the plan with test-plan write (or edit the JSON and run test-plan check). Link fields.testPlan on the work item. Prefer ownerRole test-manager. Default method follows the org standard; when unsure ask. Do not write test code in this command.

CLI reference:

```text
test-plan check (--item FILE | --plan FILE) [--output FILE]
test-plan write --item FILE --items JSON [--output PATH] [--standard-ref REF] [--owner-role test-manager] [--default-method tdd] [--baseline JSON] [--decisions JSON]
Validate or write a criterion-to-test plan into the work record. Levels include interaction. Methods: tdd, characterization, verify-after. Exit 0 passed, 1 failed, 4 incomplete.
```

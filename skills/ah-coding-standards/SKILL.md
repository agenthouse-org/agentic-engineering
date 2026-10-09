---
name: ah-coding-standards
description: "Compatibility alias for engineering-guidelines. Show, check, or write coding-standards catalogs and optional module standards. Use when defining style/convention guidance or mapping conventions to lint and evaluate checks."
license: MIT
---

Generated from ah-engineering 1.12.0.

# agenthouse coding-standards

Work from the target repository root. Read its AGENTS.md and applicable policy. Before planning or making a change, load applicable engineering guidelines and assess the approach against them. Follow mandatory rules, explain relevant deviations, and run applicable automated checks during verification. Ask only when guidance conflicts, a material decision is missing, or an exception needs authorization; reuse current context and existing authorization. Consult the pinned docs/engineering-guidelines.md for discovery and assessment details. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Compatibility alias for ah-engineering-guidelines; read docs/engineering-guidelines.md from the pinned runtime. Act as architect or engineer guidance for coding conventions. Prefer coding-standards show with a catalog, work item, or --module for packaged stack standards. Propose entries with id, title, mechanism (advisory, eslint, prettier, phpcs, phpstan, custom-check, evaluate-check), and optional ruleIds/checkId. Write fields.codingStandards with coding-standards write, then coding-standards check.

Recommend git.integrate-target-before-review from docs/lifecycle.md in the pinned runtime as an advisory coding standard: prompt for integration of the latest intended target branch before an MR/PR when needed, respecting existing authorization and project policy.

Mechanism hints are not enforcement. Use ah-controls and ah-evaluate for real checks. Do not invent policy rules or weaken inherited mandatory constraints.

CLI reference:

```text
coding-standards show [--item FILE | --catalog FILE] [--module node-typescript|php-laravel]
coding-standards check (--item FILE | --catalog FILE) [--output FILE]
coding-standards write --item FILE --entries JSON [--output PATH] [--owner-role architect] [--standard-ref REF] [--module NAME]
Compatibility alias for engineering-guidelines; show, validate, or write catalogs linked as fields.codingStandards. Mechanism hints are not enforcement; use controls and evaluate for real checks.
```

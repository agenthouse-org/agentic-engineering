---
name: ah-engineering-guidelines
description: "Manage and consult engineering guidelines for architecture, testing, security, Git workflows, delivery, and coding conventions. Use when managing guidelines or assessing an approach against applicable guidance before acting."
license: MIT
---

Generated from ah-engineering 1.11.0.

# agenthouse engineering-guidelines

Work from the target repository root. Read its AGENTS.md and applicable policy. Before planning or making a change, load applicable engineering guidelines and assess the approach against them. Follow mandatory rules, explain relevant deviations, and run applicable automated checks during verification. Ask only when guidance conflicts, a material decision is missing, or an exception needs authorization; reuse current context and existing authorization. Consult the pinned docs/engineering-guidelines.md for discovery and assessment details. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Manage engineering guidelines covering architecture, testing, security, Git workflows, delivery, and coding conventions. Read docs/engineering-guidelines.md from the pinned runtime. Use engineering-guidelines show/check/write; the existing coding-standards catalog format and fields.codingStandards link remain compatible. Load referenced documents and applicable policy, assess the proposed approach against relevant rule IDs, and report conflicts or missing guidance. Catalog check validates structure only; use controls for check mappings and evaluate for configured checks. Do not invent compliance evidence or approval.

CLI reference:

```text
engineering-guidelines show [--item FILE | --catalog FILE] [--module node-typescript|php-laravel]
engineering-guidelines check (--item FILE | --catalog FILE) [--output FILE]
engineering-guidelines write --item FILE --entries JSON [--output PATH] [--owner-role architect] [--standard-ref REF] [--module NAME]
Manage engineering guidance for architecture, testing, security, Git workflows, delivery, and coding conventions. check validates catalog structure and references, not compliance. Uses the existing coding-standards-catalog format and fields.codingStandards link; coding-standards remains a compatibility alias. See docs/engineering-guidelines.md.
```

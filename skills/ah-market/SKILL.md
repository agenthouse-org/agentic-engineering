---
name: ah-market
description: "List, start, or check market-validation records (ICP segments, evidence, buyer signals, fit assessment) stored as Markdown in the repository. Use when starting an opportunity folder or validating that those files are complete before a go decision."
license: MIT
---

Generated from ah-engineering 1.12.2.

# agenthouse market

Work from the target repository root. Read its AGENTS.md and applicable policy. Before planning or making a change, load applicable engineering guidelines and assess the approach against them. Follow mandatory rules, explain relevant deviations, and run applicable automated checks during verification. Ask only when guidance conflicts, a material decision is missing, or an exception needs authorization; reuse current context and existing authorization. Consult the pinned docs/engineering-guidelines.md for discovery and assessment details. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use market list to see existing opportunities, market new to start an opportunity folder from empty templates, and market check after every edit. Fill the files through ah-define-opportunity, ah-record-market-evidence, ah-capture-buyer-signal, and ah-assess-market-fit. Report failed and incomplete findings with their file and line, and treat dated-condition and personal-data warnings as review prompts. A passing check means the record is complete and consistent, not that the market exists or that investment is approved. Never fill in the decision fields in fit-assessment.md; a person records the go decision.

CLI reference:

```text
market list
market new --id OPPORTUNITY_ID [--title TITLE]
market check --id OPPORTUNITY_ID [--output FILE]
List, start, or validate market-validation records: opportunity.md (ICP segments and pre-stated conditions), evidence.md, buyer-signals.md and fit-assessment.md under .agenthouse/market/OPPORTUNITY_ID/ (override with market.path in .agenthouse/config.json). New writes empty templates and never overwrites. Check validates frontmatter, required sections, references, and that proceed or a product-market-fit claim cites a met success condition with evidence; dated conditions after their evidence and possible personal data are warnings. Exit 0 passed, 1 failed, 4 incomplete. It does not judge market truth or record the human go decision.
```

---
name: ah-define-opportunity
description: "Describe an opportunity and its ideal customer profile: segments, buyer and user, job and pain, value hypothesis, channels, and pre-stated success and stop conditions. Use when starting market validation, defining an ICP, or before collecting customer evidence."
license: MIT
---

Generated from ah-engineering 1.12.2.

# agenthouse define-opportunity

Work from the target repository root. Read its AGENTS.md and applicable policy. Before planning or making a change, load applicable engineering guidelines and assess the approach against them. Follow mandatory rules, explain relevant deviations, and run applicable automated checks during verification. Ask only when guidance conflicts, a material decision is missing, or an exception needs authorization; reuse current context and existing authorization. Consult the pinned docs/engineering-guidelines.md for discovery and assessment details. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

This is a market-validation workflow, not a CLI subcommand. It records an opportunity; it does not validate it. Use market list to find existing opportunities and market new --id ID to create templates when none exist; never overwrite existing files.

Fill opportunity.md under the configured market path (default .agenthouse/market/ID/). Give every ICP segment a stable id and all required fields: description, firmographics, buyer, user, decisionMaker, job, pain, valueHypothesis, willingnessToPay, channels. Set basis to evidence only when the user supplied a source; otherwise assumption or unresolved. In the body, tag each statement as evidence, assumption, or unresolved. Alternatives and switching cost, trigger events, and qualifiers and disqualifiers are optional sections.

Ask for success and stop conditions before any results are known and record each with statedAt set to the day it was stated. Conditions are optional here, but without them ah-assess-market-fit can only recommend investigate. Never invent segment facts, budgets, or conditions; ask or mark them unresolved.

Reply as Decide / Opportunity / Open. Decide:
1. Which segments to pursue first
2. Success and stop conditions, or whether to state them later
3. Which evidence to collect next (route to ah-record-market-evidence)

Run market check --id ID and report its findings. Do not create work items or tracker records, and do not approve investment.

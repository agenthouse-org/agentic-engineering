---
name: ah-capture-buyer-signal
description: "Capture a buyer conversation as a single-account signal: goals, objections, and unmet needs, kept separate from market evidence. Use when sales or customer-success staff relay prospect feedback for market validation."
license: MIT
---

Generated from ah-engineering 1.12.2.

# agenthouse capture-buyer-signal

Work from the target repository root. Read its AGENTS.md and applicable policy. Before planning or making a change, load applicable engineering guidelines and assess the approach against them. Follow mandatory rules, explain relevant deviations, and run applicable automated checks during verification. Ask only when guidance conflicts, a material decision is missing, or an exception needs authorization; reuse current context and existing authorization. Consult the pinned docs/engineering-guidelines.md for discovery and assessment details. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

This is a market-validation workflow, not a CLI subcommand. Append signals to buyer-signals.md for an existing opportunity. Each signal needs id, segment, date, account (pseudonymous), scope single-account, goals, objections, and unmetNeeds.

A signal is one account's statement, not market evidence. Do not count signals as validation or claim representativeness. Promote a signal into evidence.md only when the user explicitly asks; then use ah-record-market-evidence with kind buyer-signal, promotedFrom, sample, and limitation.

Represent product capabilities accurately and never promise unshipped capabilities or unauthorized terms. Store accounts and contacts only as pseudonymous ids and follow the organization's data policy.

Reply as Decide / Signal / Follow-up. Decide: promote to evidence now, keep as a signal, or ask a follow-up question. Run market check --id ID and report findings and warnings.

---
name: ah-record-market-evidence
description: "Record interviews, surveys, experiments, analytics, desk research, support feedback, and commercial signals as market evidence with sample and limitations. Use when adding customer or market research results to a market-validation record."
license: MIT
---

Generated from ah-engineering 1.12.2.

# agenthouse record-market-evidence

Work from the target repository root. Read its AGENTS.md and applicable policy. Before planning or making a change, load applicable engineering guidelines and assess the approach against them. Follow mandatory rules, explain relevant deviations, and run applicable automated checks during verification. Ask only when guidance conflicts, a material decision is missing, or an exception needs authorization; reuse current context and existing authorization. Consult the pinned docs/engineering-guidelines.md for discovery and assessment details. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

This is a market-validation workflow, not a CLI subcommand. Append entries to evidence.md for an existing opportunity; create the folder with market new only when the user asks.

Each entry needs id, kind (interview, survey, experiment, analytics, desk, support, commercial, buyer-signal), segment, date, source, sample, context, observation, interpretation, and limitation. Keep observation (what was seen or said) separate from interpretation (what the team thinks it means). State what the sample cannot support. Never upgrade an assumption from opportunity.md into a finding, and never fabricate quotes, counts, or dates.

Store people and accounts only as pseudonymous ids with segment attributes. When names, emails, phone numbers, or company identifiers appear, stop, point to the organization's data policy, and record pseudonymous ids instead. A buyer signal enters evidence only through explicit promotion: kind buyer-signal with promotedFrom set to the signal id, plus sample and limitation.

Reply as Decide / Evidence / Gaps. Run market check --id ID and report findings and warnings. Do not assess fit here; route to ah-assess-market-fit when conditions and evidence exist.

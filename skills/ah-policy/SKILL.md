---
name: ah-policy
description: "Track signed organization policy origins, report drift and permission, or adopt reviewed revisions. Use when maintaining organization policy across repositories."
license: MIT
---

Generated from ah-engineering 1.10.0.

# agenthouse policy

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use policy status/check to distinguish integrity, freshness and permission. Read docs/organization-policy.md. Adoption requires the reviewed candidate digest; report semantic changes and approval invalidation before adopting. Never treat unknown freshness as current. Trust configuration must come from the governing authority; do not authorize your own key.

CLI reference:

```text
policy bundle --file POLICY --repository ID --path SOURCE_PATH --sequence N --expires-at ISO_DATE [--permitted FILE] --output FILE
policy track --origin FILE
policy status [--roots FILE] [--output FILE]
policy check [--required] [--roots FILE] [--output FILE]
policy adopt --file POLICY_PATH --check
policy adopt --file POLICY_PATH --digest REVIEWED_DIGEST
Track a signed organization channel, report integrity/freshness/permission, or explicitly adopt a reviewed candidate. Local files, absolute mounted files and home: paths work offline. See docs/organization-policy.md. Required check exits 1 blocked, 4 unknown/untracked, 0 permitted. Discovery never adopts policy.
```

---
name: ah-roles
description: "Discover and load role guidance, or adopt and review consumer-owned role baselines. Use when asking the agent to work from a role such as product manager, engineer, support, market research, or sales."
license: MIT
---

Generated from ah-engineering 1.5.1.

# agenthouse roles

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

When asked to act as a role, read its active consumer copy with roles use and apply its purpose, responsibilities, and boundaries to this task. State the role context, but do not claim a human identity or authority. Follow governing policy if it conflicts. Role behavior is scoped to this task unless the user asks otherwise. For role adaptations use the owned global JSON; review upstream changes and conflicts before explicit merge. Never treat role decision rights as approvals.

CLI reference:

```text
roles list
roles show --id ROLE_ID
roles use --id ROLE_ID
roles adopt [--id ROLE_ID] [--repository PATH]
roles check [--id ROLE_ID] [--repository PATH]
roles merge --id ROLE_ID [--repository PATH]
roles ignore --id ROLE_ID [--repository PATH]
Discover generic roles, load one for this task, or explicitly adopt and review baseline changes. Consumer copies live in AGENTHOUSE_GLOBAL_REPO or ~/.agenthouse/global. Adoption never overwrites an existing file. Updates are reviewed separately and merged only on explicit request; conflicts leave local files unchanged. Role decision rights do not approve governance actions.
```

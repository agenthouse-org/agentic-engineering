---
name: ah-onboard
description: "Choose shared or private repository integration, coding agents, artifact locations, policy, and autonomy, then enroll this repository. Use when starting with agenthouse or adding it to a project."
license: MIT
---

Generated from ah-engineering 1.4.0.

# agenthouse onboard

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Guide setup conversationally: infer the target and coding agents from context, ask only for missing choices, and explain policy/autonomy options. Require the user’s shared/private integration choice before enrollment: skills are central in both modes, shared mode commits small project state and instruction bridges, and private mode leaves existing instructions untouched and needs explicit context loading. Inspect actual test outputs separately from fixtures/baselines. Run onboard with explicit --integration shared|private, --agents or --non-interactive, and --docs skip; never launch an interactive terminal wizard or open desktop applications from an agent unless the user requests it. Then point out the installed cookbook and agent-command guide and help the user formulate their first real outcome. Existing installations keep their configuration.

CLI reference:

```text
onboard [--integration shared|private] [--artifact-paths DIR,DIR] [--root PATH] [--agents claude,codex,cursor] [--policy FILE] [--autonomy supervised|bounded|delegated] [--docs open|show|skip]
        [--branch-pattern PATTERN] [--branch-example EXAMPLE] [--branch-base REF]
Guided setup asks whether to open the Markdown guides in the default app, show them in the terminal, or skip. With Git present it asks for a branch naming pattern (for example {id}-{slug}) when unset. For scripts, explicitly choose --integration shared|private, --agents (or --non-interactive), and --docs. Skills and runtime are central; private mode leaves existing agent instructions untouched.
Existing installations receive the same documentation choice and a read-only next-step guide; configuration is preserved.
```

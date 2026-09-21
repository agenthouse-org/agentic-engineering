# Agent commands

Version 0.1.9 installs 41 generated agent-facing commands plus the lifecycle skill. Every CLI command has an `ah-` skill; grouped CLI operations retain their subcommands (for example, `ah-dependencies update` and `ah-work show`). Agents select arguments from the conversation and call the same CLI implementation.

## Invoke them

| Agent | Entry point | Installed location |
| --- | --- | --- |
| Claude Code | `/ah-help`, `/ah-onboard`, `/ah-review-change` | `.claude/commands/*.md` routing to the shared skill |
| Codex | Select `ah-help` from the skill picker, or request `$ah-help` | `.agents/skills/*/SKILL.md` |
| Cursor | `/ah-help` or attach the named skill | Shared `.agents/skills/*/SKILL.md` |
| OpenCode | `/ah-help` | `.opencode/commands/*.md` routing to the shared skill |
| Windsurf | `/ah-help` workflow | `.windsurf/workflows/*.md` routing to the shared skill |
| OpenClaw | Select/invoke the `ah-help` skill; slash exposure depends on channel configuration | Shared `.agents/skills/*/SKILL.md` |

Natural-language requests also work when the host has loaded the skills: “Use agenthouse onboarding to guide me through this project.” Namespaced names avoid replacing a host's built-in `/help` or `/review`. These are project commands, not marketplace plugin namespaces such as `/agenthouse:help`.

Reload the host or start a fresh session after first enrollment if the command is not shown. Open the enrolled repository as the agent workspace. Native discovery, slash UI, permissions, and execution capabilities depend on the host/version and workspace trust; generated files and CLI execution are tested here, not full native-host certification.

## Complete command map

| Agent skill | CLI operation |
| --- | --- |
| `ah-help` | `help [COMMAND|agents|cookbook|extended|ah-SKILL]` |
| `ah-onboard` | `onboard` with conversational choices and noninteractive CLI arguments |
| `ah-demo` | `demo` in a new/empty directory |
| `ah-init` | `init` |
| `ah-work` | `work new`, `show`, `advance`, `branch` |
| `ah-visual-plan` | `visual-plan check` |
| `ah-evaluate` | `evaluate` |
| `ah-doctor` | `doctor` |
| `ah-resolve` | `resolve` |
| `ah-session` | `session` |
| `ah-housekeep` | `housekeep` |
| `ah-dependencies` | `dependencies status`, `pin`, `unpin`, `update` |
| `ah-update` | `update` |
| `ah-bundle` | `bundle` |
| `ah-npm-provenance` | `npm-provenance status`, `apply` |
| `ah-rollback` | `rollback` |
| `ah-restore` | `restore` |
| `ah-recover` | `recover` |
| `ah-uninstall` | `uninstall` |
| `ah-skill` | `skill` |
| `ah-module` | `module` |
| `ah-keygen` | `keygen` |
| `ah-sign` | `sign` within authorized governance scope |

The framework includes these engineering workflows:

- `ah-enroll-repository`: conversational enrollment through onboarding.
- `ah-draft-user-story`: outcomes, criteria, proposed details, and open questions. Offers a visual plan (wireframe, mermaid, both, neither) as a scoping option.
- `ah-assess-story-readiness`: an evidence-based readiness assessment.
- `ah-validate-scope`: agent assessment of coverage across multiple requirements. There is no `validate-scope` CLI subcommand. A local work item is optional; use supplied authoritative outcomes and requirements.
- `ah-check-commit`: checks relevant to a commit and regression evidence.
- `ah-review-change`: requirement-based review and findings.
- `ah-visual-plan`: local wireframes and mermaid architecture diagrams, then `visual-plan check`.
- `ah-web-usability-conformity`: routes to the pinned upstream usability method and its explicitly provisioned audit runtime.
- `ah-frontend-acceptance`: routes to the pinned upstream specialist skill.
- `ah-npm-provenance`: explains npm provenance, asks whether to add it, and inspects or writes local publish files. It does not publish or configure npmjs.com.

Scoping and review skills stay decision-first: a short Decide list, then Ready/Blocked or Findings. They expand only when the user asks.

These workflows combine agent judgment with the survey, inspect, gate and review commands. Team governance determines the applicable approvals and reviewer independence. Reviews and drafted stories do not automatically approve or transition work.

## Before enrollment

Project command files appear after `onboard` or `init`. A globally installed CLI alone cannot register commands in every agent's workspace. To bootstrap through an agent, ask it to read this package's `skills/ah-onboard/SKILL.md` and use an already available CLI or this checkout's `bin/ah-engineering.js`. The skill conducts the conversation and invokes setup with explicit flags. Marketplace/global skill distribution remains separate.

## Maintenance

`src/agent-commands.js` defines routing, picker descriptions, and workflow guidance; `src/help.js` supplies CLI reference text. Skill descriptions must say what the command does and when to use it; do not derive them from the first sentence of agent instructions. Run `npm run build:agent-skills` after changing them. Generated skills ship in `skills/`; release checks reject stale generated content. Enrollment creates `.agenthouse/agent-commands.md` as the project catalog and the selected native aliases. Updates and removal use existing managed-file ownership checks and reject local edits.

The frontend specialist implementation remains upstream in agenthouse-skills. Its wrapper reads the installed verified dependency; it does not duplicate the method. Agent skills grant no additional tool permissions. Private-key use, policy changes, external publication, and other sensitive mutations still require the user's applicable authorization.

## Host format references

- [Claude custom commands and skills](https://code.claude.com/docs/en/skills)
- [Codex local skill discovery](https://learn.chatgpt.com/docs/build-skills)
- [Cursor shared project skills](https://cursor.com/help/customization/skills)
- [OpenCode command files](https://opencode.ai/docs/commands/)
- [Windsurf workflow files](https://docs.windsurf.com/windsurf/cascade/workflows)
- [OpenClaw project skills](https://docs.openclaw.ai/tools/skills)

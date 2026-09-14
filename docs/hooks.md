# Local engineering hooks

The framework consumes a content-pinned export of `@agenthouse-org/hooks` engineering contract version 1. Implementation and vendor translation stay in agenthouse-hooks. `scripts/bundle-hooks.mjs` copies the module and license with hashes into offline distributions. This export records a package version and content hashes, not a published registry release or Git commit. Framework updates and rollback carry it atomically.

`hook-config` prints Claude settings for SessionStart, PreToolUse/Bash and PostToolUse/Edit|Write. Use `hook-config --install` to merge entries without duplicating existing handlers; `--remove` removes only owned unchanged entries. Framework uninstall also removes these owned entries. Edited entries produce a conflict, preserving changes. Commands assume the enrolled repository is the host working directory. Preserve existing hooks and permissions. Native activation may require host trust/review; user-level settings are not changed automatically.

`hook --vendor claude|cursor|ci` reads JSON from stdin; `--input FILE` supports fixtures and CI. Normalized events use `event: "session"`, `"before-command"` with `command`, or `"after-edit"` with `file`. Session events describe stacks and engineering entry points. Other events require enrollment and a frozen policy.

Configure `hooks.blockNoVerify`, `hooks.protectedBranches` and `hooks.checks`. An inherited mandatory `hooks` rule can protect the definition. Command checks flag recognized Git verification bypasses and force pushes that may affect protected branches. This conservative matcher is not a shell sandbox: aliases and arbitrary programs require platform permissions and server-side branch rules. Successful Claude checks abstain from granting permission.

Touched-file checks select extensions and invoke an executable with an argument array. `{file}` becomes the relative path, optional `available` skips absent tools, and `timeoutSeconds` bounds execution. Stack modules include examples. Nothing installs or auto-fixes tools. Symlink and out-of-root edit targets are rejected. Whole-project checks remain in CI.

Claude, Cursor and CI payload translation are fixture-tested. Native activation is not certified for every host/version; other agents use the CLI through skills. Malformed events return errors, not passing checks.

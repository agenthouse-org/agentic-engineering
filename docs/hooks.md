# Local engineering hooks

The framework consumes a content-pinned export of `@agenthouse-org/hooks` engineering contract version 1. Implementation and vendor translation stay in agenthouse-hooks. `scripts/bundle-hooks.mjs` copies the module and license with hashes into offline distributions. This export records a package version and content hashes, not a published registry release or Git commit. Framework updates and rollback carry it atomically.

`hook-config` prints Claude settings for SessionStart, PreToolUse/Bash and PostToolUse/Edit|Write. Use `hook-config --install` to merge entries without duplicating existing handlers; `--remove` removes only owned unchanged entries. Framework uninstall also removes these owned entries. Edited entries produce a conflict, preserving changes. Commands assume the enrolled repository is the host working directory. Preserve existing hooks and permissions. Native activation may require host trust/review; user-level settings are not changed automatically.

`hook --vendor claude|cursor|ci` reads JSON from stdin; `--input FILE` supports fixtures and CI. Normalized events use `event: "session"`, `"before-command"` with `command`, or `"after-edit"` with `file`. Session events describe stacks and engineering entry points. Other events require enrollment and a frozen policy.

Configure `hooks.blockNoVerify`, `hooks.protectedBranches` and `hooks.checks`. An inherited mandatory `hooks` rule can protect the definition. Command checks flag recognized Git verification bypasses and force pushes that may affect protected branches. This conservative matcher is not a shell sandbox: aliases and arbitrary programs require platform permissions and server-side branch rules. Successful Claude checks abstain from granting permission.

Touched-file checks select extensions and invoke an executable with an argument array. `{file}` becomes the relative path, optional `available` skips absent tools, and `timeoutSeconds` bounds execution. Stack modules include examples. Nothing installs or auto-fixes tools. Symlink edit targets inside the repository are rejected. Out-of-repository edits are ignored because touched-file checks apply only to repository files. Whole-project checks remain in CI.

## Troubleshooting dynamic shell expansion

Older runtimes report `Dynamic shell expansion requires separate review` as a hard denial. The current runtime returns `review-required` for executable command substitutions (`$(...)` and backticks) and `${...}` parameter expansions outside single quotes, including inside double quotes. It does not determine whether a substitution only reads files. Claude receives `permissionDecision: "ask"`; Cursor shell hooks receive `permission: "ask"`. The host owns the approval flow; noninteractive execution can remain blocked when nobody can answer. Normalized CI returns exit 3 with the pending review result, never a passing check. Recognized Git policy violations take precedence over review requests. The matcher is not a full shell parser and does not certify expanded commands. The quoted-heredoc exception applies to literal heredoc bodies, not executable substitutions.

For example, `f=$(grep -rl 'class ExampleCompiler' app); grep -n 'mapping' $f` requires review because of `$(...)`. To avoid this review, use two tool calls from the intended working directory:

```sh
rg -l 'class ExampleCompiler' app
```

Read the returned paths, then search each actual path explicitly (replace the example below with a returned path):

```sh
rg -n 'input|Input|mapping|Mapping|process\.references|derived|authored' -- 'app/path/ExampleCompiler.php' | head -80
```

This also avoids unquoted variable word splitting when filenames contain spaces. Agents should prefer their file-search tools or separate searches with literal paths for this workflow. Quoting the variable alone does not remove the command substitution. The matcher has no dynamic-expansion allow setting; `hooks.blockNoVerify` controls a different restriction. Changes to matcher behavior belong in agenthouse-hooks and must be integrated as a verified, content-pinned dependency update.

Claude, Cursor and CI payload translation are fixture-tested. Native activation is not certified for every host/version; other agents use the CLI through skills. Malformed events return errors, not passing checks.

Restoring a framework version without the engineering hook runtime removes owned hook registrations in the same transaction. Modified hooks or a pin on the hook export block that change until reconciled.

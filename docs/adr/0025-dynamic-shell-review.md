# ADR-0025: Dynamic shell review belongs to the host

Status: accepted for this implementation, following the owner's request to fix the repeated hook denial.

## Decision

The engineering matcher represents unsupported dynamic shell analysis as `review-required`, rather than treating dynamic syntax itself as a policy violation. Recognized Git restrictions still produce `denied` before the review fallback. Missing or invalid command input remains denied.

Claude PreToolUse maps pending review to `ask`. Cursor shell hooks map it to `ask`. The normalized CI adapter returns exit 3 and the structured review result; unresolved review never passes a required technical gate. A host without an interactive reviewer may block execution. An allowed matcher result continues to abstain from granting Claude permission.

The hook does not execute substitutions, certify their safety, or provide a complete shell parser. Approval remains with the host and applicable authority. Users and agents can avoid unnecessary dynamic analysis by using file-search tools or separate commands with literal paths.

## Ownership and verification

The implementation lives in agenthouse-hooks and is consumed through its content-pinned export. Regression tests cover the reported search, each vendor translation, non-passing CI review, policy denial precedence, malformed commands, and quoted heredoc literals. Native host UI behavior is documented by the vendors but is not certified by these fixture tests.

Host contracts: [Claude PreToolUse decision control](https://code.claude.com/docs/en/hooks#pretooluse-decision-control) and [Cursor shell hooks](https://cursor.com/docs/hooks).

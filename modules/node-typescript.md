# Node.js and TypeScript engineering

Select the checks in `node-typescript.json` after running `survey` and inspecting the repository's package scripts and configuration. A monorepo may need workspace-specific commands. Do not replace its test runner with a suggested command simply because a template exists.

## Contracts and boundaries

Validate untrusted input at HTTP, message, file and process boundaries. Static types do not validate runtime data. Keep public request/response contracts explicit, represent absence deliberately, and preserve error causes without leaking secrets. Use the project's strict compiler settings; suppressions require a specific explanation and review.

Keep domain logic independent of transport and persistence where that improves testing. Handle rejected promises and cancellation, close resources, and put timeouts around external calls. Define retry eligibility and idempotency before retrying writes. Avoid blocking the event loop with large synchronous work in request paths.

## Testing and changes

Test externally observable behavior, permission boundaries, validation, error paths, and concurrency where relevant. For a bug, capture the failing assertion before the fix with `spec`; declare the test files so green evidence cannot silently use modified assertions. Type checking is not behavioral testing. Run the actual workspace test runner with representative data.

For frontend work use the pinned frontend-acceptance method. Exercise loading, empty, error, focus, keyboard and responsive states as applicable. Keep screenshot baseline changes separate from evidence that the design meets its criteria.

## Dependencies and delivery

Commit lockfiles, use reproducible installation in CI, and review dependency changes including install scripts. Keep credentials outside source and reports. Record configuration changes, backward compatibility and recovery steps before release. Instrument consequential behavior with useful, redacted diagnostics.

The touched-file ESLint check is fast feedback. Whole-project type checks and tests still belong in evaluation and CI because a local edit can affect other files.

# PHP and Laravel engineering

Use `survey` to discover Composer scripts, framework version and analyzer configuration before selecting checks from `php-laravel.json`. Tests, Pint and PHPStan are suggestions for repositories that already use those tools. Do not install or reconfigure them implicitly.

## Application boundaries

Validate requests and authorize operations separately. Enforce tenancy and object-level permissions in both reads and writes; an authenticated user is not automatically authorized for a resource. Limit mass assignment deliberately, escape output in the appropriate context, and keep secrets and sensitive personal data out of logs.

Keep business invariants testable outside controllers. Use explicit transaction boundaries for related writes and avoid holding database transactions across remote calls. Design jobs for retries, deduplication and failure recovery. Verify serialization and authorization assumptions for queued work.

## Data and performance

Make migration rollout and recovery plans explicit. Prefer additive changes that allow old and new application versions to coexist during deployment. Identify destructive transformations, large-table locks, backfills and irreversible data loss before release; a down migration is not proof of recoverability.

Inspect query counts and pagination for changed collection endpoints. Avoid accidental N+1 queries and unbounded result loading. Preserve cache invalidation and consistency behavior when changing persistence.

## Evidence and delivery

Test business behavior, validation, authorization, tenancy, database effects and job failure paths using the repository's established runner. Capture a relevant regression before fixing a bug. Keep analyzer suppressions narrow, explained and reviewable. Formatting success is not correctness evidence.

For Blade, Livewire or other UI changes, follow frontend-acceptance and retain actual browser evidence. The touched-file formatter check is feedback only; full tests and analysis remain in CI. Record deployment sequencing, worker restarts, configuration changes, monitoring and recovery instructions where applicable.

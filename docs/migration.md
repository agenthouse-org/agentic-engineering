# Enterprise migration and pilot plan

Status: agreed migration direction; migration has not been executed.

## Maintain one framework

The existing enterprise engineering repository becomes a consumer-owned organization policy package. The reusable lifecycle and tooling move to agenthouse. Company decisions, private infrastructure mappings, internal evidence, and approval ownership stay in the enterprise repository.

No second independently maintained framework is required. Both repositories continue to exist with distinct responsibilities. Generic improvements are contributed to agenthouse; organizational policy changes are made only in the organization's package.

## Migration sequence

1. Inventory the enterprise repository at a recorded revision, including local modifications, deployed plugin names, active hooks, links, and consumers.
2. Classify each item as reusable framework behavior, specialist skill, hook runtime, stack module, organization policy, project configuration, or historical evidence.
3. Build the generic implementation against the public contracts, replacing company-specific examples with original generic examples.
4. Publish or privately mirror an identified framework release with the required modules and skills. Release readiness is defined by the delivery plan, not the presence of design documents.
5. Create the private organization policy package with foundational ADRs, governance ownership, delegation rules, selected autonomy defaults, and integration mappings.
6. Produce a migration preview for one pilot repository: managed-file changes, preserved settings, policy resolution, command mappings, and rollback route.
7. Install in an isolated pilot checkout, initially observe assessments without asserting new enforcement, and compare results against expected organizational decisions.
8. Activate the chosen checks through the organization's normal governance process, verify the end-to-end lifecycle, and then roll out in cohorts.

Temporary compatibility aliases may map old commands to the shared implementation. They must not install a second set of active hooks or carry duplicated policy bodies. Record an alias deprecation period and update consumer documentation when aliases are retired.

## Two pilots

| Pilot | Purpose | Required proof |
| --- | --- | --- |
| Existing enterprise repository | Validate private policy distribution and real governance | Foundational decision inheritance, delegated exception request, existing tracker/document integration, private distribution, preserved customizations, controlled rollout |
| Independent single-developer repository | Validate the low-friction default experience | One enrollment, local work tracking, Git authority, a simple autonomy profile, minimal required questions, update and removal recovery |

The user owns the enterprise repository as CTO. The actual live repository location and independent pilot selection still need to be identified before modifying those consumers. `input/` is a reference snapshot and must not be mistaken for the live consumer repository.

The single-developer pilot must complete a small change through outcome definition, implementation, verification, release, and learning without installing an enterprise platform. The enterprise pilot must also demonstrate a request that remains pending until an authorized governance decision is recorded.

For UI work, both pilots use frontend acceptance via the existing frontend-acceptance skill and the shared evidence contract. Across the pilots, include an image-reference task, a story-only task, and a UI bug report. The enterprise pilot also integrates an existing organization-owned process through the framework CLI in CI/CD, including an intentional failing run with preserved reports and screenshot evidence.

## Source material and release hygiene

Leave `input/` as local reference material. Exclude it from Git and all release/package/site manifests. A Git ignore rule alone does not protect a manually assembled archive, so release tests must inspect actual artifacts.

Do not carry internal company names, domains, product references, measurements, URLs, or private historical ADRs into generic documentation. Preserve required third-party attribution when distributing third-party content; replacement of branding is not a reason to remove a license notice.

Before public release, validate every distributable and generated documentation output, including source maps and fixtures, for accidental inclusion of local reference material.

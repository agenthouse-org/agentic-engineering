# Adoption and migration

Organizations maintain policies and foundational ADRs in their own repositories. Applications consume a pinned agenthouse framework, selected modules and those policies. Generic engineering behavior has one upstream implementation; private decisions and integrations remain consumer-owned.

1. Record the target revision and local modifications. Inventory instructions, commands, hooks, checks, policies, tracker mappings and documentation links with `survey` and a substantive review.
2. Validate the capabilities the application depends on in an isolated checkout with representative passing and failing cases.
3. Install an identified release with `onboard`. Preserve configuration, add approved policy sources, and review the resolved snapshot.
4. Import work with `backlog`, retaining external identity. Imported status never grants approval.
5. Select actual evaluators, ready/done rules and optional shorter lifecycle paths. Configure visual evidence for UI work and activate each supported hook once.
6. Exercise a complete change, a failed check, a pending decision, a dependency update and rollback. Retain evidence and verify CI exit codes.
7. Replace duplicated command bodies with thin aliases where needed and define their retirement date.
8. Roll out through the organization's normal approval process after the pilot succeeds.

Keep organization policy and application remotes. Framework updates arrive through an approved artifact, mirror or marketplace; policy changes follow their own governance process. An individual pilot needs no enterprise services. An enterprise pilot also validates inherited policy, delegated approval, existing tooling and local customizations.

For UI work include image-backed, story-only and bug-report criteria. An unchanged screenshot can still depict the wrong outcome. A pipeline must retain evidence when evaluation fails.

Adoption readiness is specific to the consumer. Host versions, private infrastructure and platform credentials need validation in that environment; a generic package cannot certify them in advance.

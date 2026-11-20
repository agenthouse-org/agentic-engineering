# ADR-0026: Organisation standard discovery

Status: accepted product direction. Extends ADR-0022.

An adopted policy can name standard documents with applicability and topics. Repository facts and rules operate within organisation authority. Organisation guidance takes precedence over bundled guidance within its declared scope and topics; bundled guidance fills uncovered areas. Missing binding guidance remains a reported gap. Policy references are resolved and attributed; document contents are not pinned or fetched by context or hooks. Existing projects with no rule retain their existing behavior. Discovery is advisory and cannot establish compliance or approval.

The existing work-item coding-standards catalog and its single local standardRef remain compatible. It does not express organisation-wide document lists, URLs, scopes, and topics; the policy rule supplies those discovery requirements without migrating work-item records. Managed repository instruction blocks are unchanged.

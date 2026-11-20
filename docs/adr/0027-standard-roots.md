# ADR-0027: Machine-local standard roots

Status: accepted product direction. Extends ADR-0026.

A standard document may name a portable root identifier and a relative path. Each consumer machine maps that identifier to an absolute local directory in ignored repository-local configuration. Resolution uses the local file when present, otherwise the policy URL and a missing-local indicator. The mapping is not part of policy resolution or its digest, and files are not fetched or content-pinned. Path traversal and symlinks in the root or descendant path are rejected. Entries without a root retain their previous behavior. Discovery is advisory and does not establish compliance or approval.

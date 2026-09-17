# npm package provenance

Use this when a repository publishes a **public** package to the npm registry and you want consumers to verify where that tarball was built. It is optional. It is not policy-rule provenance, evidence hashes, or a claim that the package is safe.

## What it is

npm provenance is a signed attestation published with the package. It points at the public source repository and the cloud CI job that produced the artifact. The registry also records a publish attestation for the authorized publisher. Together they let `npm audit signatures` check attestations already in a lockfile; they do not replace review of the source.

The supported build environments are **GitHub-hosted runners** and **GitLab.com shared runners**. Self-hosted runners, private repositories, and CircleCI trusted publishing do not generate these attestations.

## Trusted publishing (default)

Configure a trusted publisher on npmjs.com for the exact GitHub org/user, repository, and workflow **filename** (for example `publish-npm.yml`), or the GitLab namespace, project, and CI file path. The publish job needs permission to mint an OIDC token (`id-token: write` on GitHub, `id_tokens` on GitLab). Then `npm publish` from that job needs no long-lived npm token. npm attaches provenance automatically for a public package from a public repository.

Use npm CLI 11.5.1 or newer and Node.js 22.14 or newer in that job. After the first successful trusted publish, restrict token-based publishing on the package settings if your policy allows it.

This repository's own [release workflow](releasing.md) already uses trusted publishing. A packaging dry-run cannot prove OIDC authorization.

## Token publishing (fallback)

If trusted publishing is unavailable, a cloud CI job can still publish with `--provenance` (or `publishConfig.provenance` / `NPM_CONFIG_PROVENANCE=true`), `id-token: write`, and an `NPM_TOKEN` stored only in the CI secret store. Prefer migrating off that token.

## Commands

```text
node .agenthouse/run.mjs npm-provenance status
node .agenthouse/run.mjs npm-provenance apply --provider github
```

`status` inspects `package.json`, git origin, and GitHub Actions / GitLab CI files. Exit 0 means ready or not applicable; 1 failed; 4 incomplete. It does not read npmjs.com.

`apply` writes `.github/workflows/publish-npm.yml` or a new `.gitlab-ci.yml` when that target does not exist. It can add a missing `repository` field from `git origin`. It refuses to overwrite an existing workflow and returns the edits or snippet to merge. `--publish token` selects the token template. `--access restricted` is allowed, but provenance still requires a public package and public repository.

Neither action runs `npm publish` or writes credentials.

## Agent skill

`ah-npm-provenance` asks whether to add provenance, explains the above, runs `status`, and calls `apply` only after a yes. Use it when you are about to publish to npm. Creating an agenthouse bundle is a different operation (`ah-bundle`) and does not publish to the registry.

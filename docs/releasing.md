# Publishing a release

The `Publish to npm` workflow runs when a GitHub Release is published. It checks the release tag and package identity, runs the Windows, macOS, Linux and browser checks, and tests the packed archive before publishing it to npm.

1. Update the version in `package.json`, the root lockfile, and both plugin manifests. Keep the usability runtime lockfile's local framework entry aligned. Run `npm run check` and the tests.
2. Commit and push the release changes.
3. Create and publish a GitHub Release with a matching tag, such as `v0.1.9` for version `0.1.9`.
4. Check the **Publish to npm** workflow. A published GitHub Release alone does not mean the npm publish succeeded.

Stable versions publish to `latest`. Prereleases must have a version such as `0.2.0-beta.1` and be marked as prereleases on GitHub; they publish to `next`. Draft releases do not publish. npm versions are immutable; do not reuse `0.1.4`, which was already published manually.

Manual **Run workflow** runs all verification and a publishing dry run without publishing. This validates the workflow and packaging, but cannot prove npm's OIDC authorization. The first new release verifies that final integration. The tested archive is retained as a workflow artifact.

## npm trust setup

The npm package's trusted publisher must authorize GitHub organization `agenthouse-org`, repository `agentic-engineering`, and workflow filename `publish.yml`, with direct publishing allowed. No GitHub environment name is configured. No npm token secret is required. Restrict who can change workflows and publish releases through the repository's access controls.

See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/). npm automatically includes provenance with trusted publishing. The GitHub repository and npm scope do not need matching names.

Consumer packages can inspect or add the same local setup with `npm-provenance status` and `npm-provenance apply`. That command does not publish and cannot prove the npmjs.com trusted-publisher row is configured. See [npm provenance](npm-provenance.md).

## Consumer updates

Update the machine-wide CLI with `npm install --global @agenthouse/engineering@latest --ignore-scripts`. Enrolled projects retain their own runtime; CLI installation does not change it. Use verified framework bundles with `ah-engineering update` to update existing projects. Configured local bundle channels can apply approved updates between sessions; automatic npm discovery for project runtimes is not implemented.

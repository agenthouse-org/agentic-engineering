import {assert,VERSION} from './io.js';

export const topics={
  onboard:'onboard [--root PATH] [--agents claude,codex,cursor] [--policy FILE] [--autonomy supervised|bounded|delegated]\nGuided setup in a terminal. Supply --agents (or --non-interactive) for scripts.\nExisting installations receive a read-only next-step guide; configuration is preserved.',
  demo:'demo --root NEW_EMPTY_DIRECTORY\nRun an isolated example: a failing acceptance check, a fix, then a passing check.\nPrints the HTML report path. The demonstration does not validate your application.',
  init:'init [--agents claude,codex,cursor,windsurf,opencode,openclaw] [--policy FILE]\n     [--project NAME] [--autonomy supervised|bounded|delegated] [--scope project|user]\nInstall the runtime, lifecycle skill, and required frontend-acceptance dependency.\nDefault autonomy: supervised. User scope creates a separate defaults workspace.',
  work:'work new --id ID --title "Outcome" [--kind feature|bug|incident|change|investigation]\nwork show --id ID\nwork advance --id ID --to STAGE [--decision REPOSITORY_RELATIVE_FILE] [--policy-file FILE]\nEdit fields in .agenthouse/work/ID.json. Stages require evidence and applicable approvals.',
  evaluate:'evaluate [--profile pull-request] [--ci] [--frozen] [--subject BUILD_ID]\n         [--base-url URL] [--output PATH] [--policy-file FILE]\nRun configured checks and write JSON, JUnit, and HTML evidence reports.\nExit codes: 0 passed; 1 failed; 2 error; 3 approval pending; 4 incomplete.\n--ci implies --frozen and never updates dependencies. BUILD_ID must identify the tested build.',
  doctor:'doctor\nCheck installation, policy snapshot, and required skill integrity.\nExit 0: healthy installation; exit 2: problems. This does not certify application quality.',
  resolve:'resolve [--frozen] [--policy-file FILE]\nResolve configured policy sources. --frozen verifies the existing snapshot without refreshing it.',
  session:'session\nCheck configured approved updates between commands and record the active version set.',
  dependencies:'dependencies status\ndependencies pin | unpin\ndependencies update --bundle FILE (--sha256 HASH | --public-key FILE) [--check] [--allow-breaking]\nManage required frontend-acceptance. Pins bind version and digest; updates preserve upstream ownership.',
  update:'update --bundle FILE (--sha256 HASH | --public-key FILE) [--check] [--allow-breaking]\nVerify and activate an approved framework bundle, respecting project pins.',
  bundle:'bundle --output FILE [--key PRIVATE_KEY]\nPackage this framework and required skill for offline distribution. Optionally sign with Ed25519.',
  rollback:'rollback\nRestore the previous complete runtime and dependency set. Conflicting dependency pins must be removed first.',
  recover:'recover\nRecover an interrupted installation transaction without overwriting subsequent user edits.',
  uninstall:'uninstall\nRemove unchanged managed files. Preserve configuration, policies, keys, work records, and evidence.',
  skill:'skill --source DIRECTORY [--name ID] [--sha256 HASH]\nImport another reviewed specialist skill unchanged. Required frontend-acceptance is managed by dependencies.',
  module:'module --name node-typescript|php-laravel [--output FILE]\nPrint or save check templates. Review and adapt them before adding to project configuration.',
  keygen:'keygen --output PRIVATE_KEY_FILE\nCreate an Ed25519 key pair; refuses existing files. Keep the private key private.',
  sign:'sign --input FILE --key PRIVATE_KEY --output FILE [--delegation FILE]\nSign a reviewed governance decision or data bundle. Signing must be authorized by the key owner.'
};
export function help(topic) {
  if(topic){assert(topics[topic],`Unknown help topic: ${topic}`);return `agenthouse engineering ${VERSION}\n\n${topics[topic]}\n\nAll commands accept --root PATH. Use help for the command map.`;}
  return `agenthouse engineering ${VERSION}

Turn a story or bug into a reviewable change with explicit criteria, checks,
visual evidence, and governance decisions. Use your preferred coding agent.

Start here
  onboard       Set up a project and discover the next steps
  demo          Try a failing check, fix, and passing report in an empty directory
  help COMMAND  Show options and examples (also COMMAND --help)

Daily work
  work          Create, inspect, and advance lifecycle records
  evaluate      Run your checks locally or in CI
  doctor        Diagnose installation and dependency problems
  resolve       Refresh or verify the policy snapshot
  session       Apply approved updates between commands

Installation and maintenance
  init, dependencies, update, bundle, rollback, recover, uninstall
  skill         Import an additional specialist skill
  module        Discover stack-specific check templates
  keygen, sign  Create keys and sign authorized decisions

Agents: see .agenthouse/agent-commands.md for ah-prefixed skills.
npm installs one executable: ah-engineering. These are its subcommands.
Enrollment also creates node .agenthouse/run.mjs for the project's pinned runtime.
Use --root PATH to target a repository. No paid account is required.

Try: ah-engineering demo --root ./ah-demo
Then: ah-engineering onboard --root /path/to/your/project`;
}

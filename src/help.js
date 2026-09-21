import fs from 'node:fs';
import path from 'node:path';
import {assert,PACKAGE,VERSION} from './io.js';

export const topics={
  controls:'controls [--policy-file FILE]\nMap resolved rule identifiers to actual runtime mechanisms and configured checks. Unknown rules remain guidance; deployment activation is not inferred.',
  hook:'hook [--vendor claude|cursor|ci] [--input FILE]\nProcess a native or normalized JSON event from stdin or FILE with the pinned hooks runtime. Uses frozen project policy; no check installs software.',
  'hook-config':'hook-config [--vendor claude] [--install | --remove]\nPrint settings, or install/remove owned hook entries while preserving other settings. Activate once per repository after reviewing host requirements. Run from the enrolled repository root.',
  usability:'usability setup [--npm-cli PATH] [--offline]\nusability run (--url URL | --fixture FILE) [--output NEW_REPORT_PATH]\nSetup provisions locked optional tooling and Chromium. Offline setup uses the npm cache and a separately provided browser. Run collects upstream evidence without installing anything; it does not certify conformity.',
  survey:'survey [--output FILE]\nInspect Git state, stacks, scripts, agent files, pipelines and backlog locations. No discovered command is executed.',
  'visual-plan':'visual-plan check (--item FILE | --plan FILE) [--output FILE]\nValidate a local visual-plan record, hashed wireframe HTML fragments, and mermaid diagrams. Exit 0 passed, 1 failed, 4 incomplete. Does not render, host, or publish a review UI.',
  'npm-provenance':'npm-provenance status [--output FILE]\nnpm-provenance apply [--provider github|gitlab] [--workflow FILE] [--publish trusted|token] [--access public|restricted]\nInspect local npm publish files for provenance, or write a new GitHub Actions / GitLab job when the target file is missing. Does not publish, store tokens, or change npmjs.com. Exit 0 ready or inapplicable, 1 failed, 4 incomplete.',
  inspect:'inspect [--ref HEAD|BASE..HEAD] [--base BRANCH] [--output FILE]\nAnalyze committed changes, candidate tests, added suppressions and residue. --base compares from the merge base.',
  review:'review --item FILE --evidence REPORT_JSON[,REPORT_JSON] [--baseline REPORT_JSON] [--ref HEAD|BASE..HEAD] [--base BRANCH] [--output FILE]\nMap criterion IDs to checks for the exact commit and frozen policy. Technical coverage does not grant review approval. Exit 0 passed, 1 failed, 4 incomplete.',
  gate:'gate --item FILE --phase ready|done [--decision FILE] [--policy-file FILE] [--output FILE]\nEvaluate configured lifecycle criteria, evidence and independent signed approval. Exit 0 passed, 1 failed, 3 pending, 4 incomplete.',
  spec:'spec --item FILE --phase red|green --evaluator ID [--output FILE]\nCapture an expected test failure (exit 1), then success (exit 0) with the same configured command and criteria. Review the failure cause; an exit code alone is not proof of a valid test.',
  backlog:'backlog --source MARKDOWN_OR_JSON --id ID [--title TITLE] [--provider ID] [--external-id ID] [--output FILE]\nImport one local record or exported platform item, preserving content and external identity. Existing items are never overwritten.',
  onboard:'onboard [--root PATH] [--agents claude,codex,cursor] [--policy FILE] [--autonomy supervised|bounded|delegated] [--docs open|show|skip]\n        [--branch-pattern PATTERN] [--branch-example EXAMPLE] [--branch-base REF]\nGuided setup asks whether to open the Markdown guides in the default app, show them in the terminal, or skip. With Git present it asks for a branch naming pattern (for example {id}-{slug}) when unset. Supply --agents (or --non-interactive) and --docs for scripts.\nExisting installations receive the same documentation choice and a read-only next-step guide; configuration is preserved.',
  demo:'demo --root NEW_EMPTY_DIRECTORY\nRun an isolated example: a failing acceptance check, a fix, then a passing check.\nPrints the HTML report path. The demonstration does not validate your application.',
  init:'init [--agents claude,codex,cursor,windsurf,opencode,openclaw] [--policy FILE]\n     [--project NAME] [--autonomy supervised|bounded|delegated] [--scope project|user]\nInstall the runtime, lifecycle skill, and required frontend-acceptance dependency.\nDefault autonomy: supervised. User scope creates a separate defaults workspace.',
  work:'work new --id ID --title "Outcome" [--kind feature|bug|incident|change|investigation|documentation] [--path NAME] [--parent ID]\nwork show --id ID\nwork advance --id ID --to STAGE [--decision REPOSITORY_RELATIVE_FILE] [--gate-decision FILE] [--policy-file FILE]\nwork branch --id ID [--from REF] [--parent ID]\nEdit fields in .agenthouse/work/ID.json. Stages require evidence and applicable approvals.\nwork branch requires git.branchNaming.pattern, a clean tree, creates and checks out the branch, and does not push.',
  evaluate:'evaluate [--profile pull-request] [--ci] [--frozen] [--subject BUILD_ID]\n         [--base-url URL] [--output PATH] [--policy-file FILE]\nRun configured checks and write JSON, JUnit, and HTML evidence reports.\nExit codes: 0 passed; 1 failed; 2 error; 3 approval pending; 4 incomplete.\n--ci implies --frozen and never updates dependencies. BUILD_ID must identify the tested build.',
  doctor:'doctor\nCheck installation, policy snapshot, required skill integrity, and housekeeping ignore/tracked-capture/dump-path rules.\nWarns when Git is present without git.branchNaming.pattern. Exit 0: healthy installation; exit 2: problems. This does not certify application quality.',
  resolve:'resolve [--frozen] [--policy-file FILE]\nResolve configured policy sources. --frozen verifies the existing snapshot without refreshing it.',
  session:'session\nCheck configured approved updates between commands, apply housekeeping rules, and record the active version set.',
  dependencies:'dependencies status\ndependencies pin | unpin [--name frontend-acceptance|web-usability-conformity|hooks]\ndependencies update --bundle FILE (--sha256 HASH | --public-key FILE) [--check] [--allow-breaking]\nManage bundled upstream skills. Pins bind version and digest; updates preserve upstream ownership.',
  update:'update --bundle FILE (--sha256 HASH | --public-key FILE) [--check] [--allow-breaking]\nVerify and activate an approved framework bundle, respecting project pins.',
  bundle:'bundle --output FILE [--key PRIVATE_KEY]\nPackage this framework and required skill for offline distribution. Optionally sign with Ed25519.',
  rollback:'rollback\nRestore the previous complete runtime and dependency set. Conflicting dependency pins must be removed first.',
  restore:'restore [--bundle FILE] [--ignore-generated]\nRecreate owned assets from the exact active pin and recorded agents. Uses the cached runtime, exact executing package, or original unsigned bundle. --ignore-generated opts an existing installation into owned-file ignore rules. Preserves policy snapshots and refuses edits; recover handles interrupted transactions.',
  housekeep:'housekeep [--check]\nApply housekeeping rules: add missing ignore paths for generated agenthouse files and inspection captures, then delete untracked inspection dumps including tests/output, invented screenshot galleries, and repository-root tmp-* drafts. Does not delete evaluation reports, work records, or Git-tracked files. --check reports without changing the repository. Exit 0 passed, 1 tracked leftovers, 4 missing ignore rules or leftover dumps.',
  recover:'recover\nRecover an interrupted installation transaction without overwriting subsequent user edits.',
  uninstall:'uninstall\nRemove unchanged managed files. Preserve configuration, policies, keys, work records, and evidence.',
  skill:'skill --source DIRECTORY [--name ID] [--sha256 HASH]\nImport another reviewed specialist skill unchanged. Required frontend-acceptance is managed by dependencies.',
  module:'module --name node-typescript|php-laravel [--output FILE]\nPrint or save check templates. Review and adapt them before adding to project configuration.',
  keygen:'keygen --output PRIVATE_KEY_FILE\nCreate an Ed25519 key pair; refuses existing files. Keep the private key private.',
  sign:'sign --input FILE --key PRIVATE_KEY --output FILE [--delegation FILE]\nSign a reviewed governance decision or data bundle. Signing must be authorized by the key owner.'
};

const guideFiles={
  agents:'agent-commands.md',
  cookbook:'cookbook.md',
  extended:'cookbook.md'
};
const guide=topic=>fs.readFileSync(path.join(PACKAGE,'docs',guideFiles[topic]),'utf8').trim();
const skillNames=()=>fs.readdirSync(path.join(PACKAGE,'skills'),{withFileTypes:true})
  .filter(entry=>entry.isDirectory() && entry.name.startsWith('ah-'))
  .map(entry=>entry.name).sort();
function skillHelp(name) {
  const file=path.join(PACKAGE,'skills',name,'SKILL.md'),body=fs.readFileSync(file,'utf8');
  const description=body.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1] || 'No description available.';
  return `agenthouse engineering ${VERSION}

${name} is a coding-agent skill, not a CLI subcommand.

${description}

Invoke it after opening the enrolled repository in your coding agent:
  Codex:        $${name}
  Claude Code:  /${name}
  Cursor:       /${name} or attach the named skill
  OpenCode:     /${name}
  Windsurf:     /${name} workflow

Full installed instructions: .agents/skills/${name}/SKILL.md
Host setup and reload guidance: ah-engineering help agents`;
}
function suggestedSkill(topic,names) {
  const needle=topic.replace(/^ah-/,'');
  const matches=names.filter(name=>name.replace(/^ah-/,'').split('-').includes(needle));
  return matches.length===1?matches[0]:null;
}
export function help(topic) {
  if(topic) {
    if(guideFiles[topic])return guide(topic);
    if(topics[topic])return `agenthouse engineering ${VERSION}\n\n${topics[topic]}\n\nAll commands accept --root PATH. Use help for the command map.`;
    const names=skillNames(),name=topic.startsWith('ah-')?topic:`ah-${topic}`;
    if(names.includes(name))return skillHelp(name);
    const suggestion=suggestedSkill(topic,names);
    assert(!suggestion,`Unknown help topic: ${topic}. Did you mean coding-agent skill ${suggestion}? Run "ah-engineering help ${suggestion}" or invoke "$${suggestion}" in Codex.`);
    assert(false,`Unknown help topic: ${topic}. Run "ah-engineering help" for CLI commands, "ah-engineering help agents" for coding-agent skills, or "ah-engineering help cookbook" for examples.`);
  }
  return `agenthouse engineering ${VERSION}

Turn a story or bug into a reviewable change with explicit criteria, checks,
visual evidence, and governance decisions. Use your preferred coding agent.

Start here
  onboard       Set up a project and discover the next steps
  demo          Try a failing check, fix, and passing report in an empty directory
  help COMMAND  Show options and examples (also COMMAND --help)
  help agents   Explain coding-agent installation and invocation
  help cookbook Longer setup and workflow recipes (alias: help extended)

Daily work
  survey        Discover repository conventions and available tooling
  visual-plan   Check local wireframes and mermaid architecture diagrams
  inspect       Analyze a commit or change range
  review        Map requirements to build and policy evidence
  gate, spec    Evaluate readiness/completion and capture red/green tests
  backlog       Import markdown or exported work items
  controls      Explain rule mechanisms and guidance
  usability     Provision and run the upstream browser audit
  hook, hook-config  Run and configure local engineering hooks
  work          Create, inspect, and advance lifecycle records
  evaluate      Run your checks locally or in CI
  doctor        Diagnose installation and dependency problems
  resolve       Refresh or verify the policy snapshot
  session       Apply approved updates and housekeeping between commands
  housekeep     Apply ignore rules and remove untracked inspection captures

Installation and maintenance
  init, dependencies, update, bundle, rollback, restore, recover, uninstall
  skill         Import an additional specialist skill
  module        Discover stack-specific check templates
  keygen, sign  Create keys and sign authorized decisions
  npm-provenance  Inspect or add npm publish provenance; does not publish

Agent skills: use help ah-SKILL, help agents, or .agenthouse/agent-commands.md.
npm installs one executable: ah-engineering. These are its subcommands.
Enrollment also creates node .agenthouse/run.mjs for the project's pinned runtime.
Use --root PATH to target a repository. No paid account is required.

Try: ah-engineering demo --root ./ah-demo
Then: ah-engineering onboard --root /path/to/your/project`;
}

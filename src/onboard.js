import fs from 'node:fs';
import path from 'node:path';
import {createInterface} from 'node:readline/promises';
import {spawnSync} from 'node:child_process';
import {assert,inside,read,write} from './io.js';
import {install,AGENTS,installationStatus} from './install.js';
import {dependencyStatus} from './dependencies.js';
import {resolve} from './policy.js';
import {evaluate} from './evaluate.js';

const DOC_CHOICES=['open','show','skip'];

export function documentationFiles(root) {
  const active=read(inside(root,'.agenthouse/active.json'));
  const files=[
    inside(root,`.agenthouse/${active.runtime}/docs/cookbook.md`),
    inside(root,'.agenthouse/agent-commands.md')
  ];
  for(const file of files)assert(fs.existsSync(file),`Documentation missing: ${file}`);
  return files;
}
export function showDocumentation(root) {
  return documentationFiles(root).map(file=>`===== ${file} =====\n\n${fs.readFileSync(file,'utf8').trim()}`).join('\n\n');
}
export function openDocumentation(root,{platform=process.platform,run=spawnSync}={}) {
  const files=documentationFiles(root),command=platform==='win32'?'rundll32.exe':platform==='darwin'?'open':'xdg-open';
  for(const file of files) {
    const args=platform==='win32'?['url.dll,FileProtocolHandler',file]:[file];
    const result=run(command,args,{encoding:'utf8',timeout:10000,windowsHide:true});
    assert(!result.error && result.status===0,`Could not open ${file}: ${result.error?.message || result.stderr || `exit ${result.status}`}`);
  }
  return `Opened in the default Markdown application:\n${files.map(file=>`  ${file}`).join('\n')}`;
}
export function documentation(root,choice,options={}) {
  assert(DOC_CHOICES.includes(choice),`Documentation choice must be ${DOC_CHOICES.join(', ')}`);
  if(choice==='open')return openDocumentation(root,options);
  if(choice==='show')return showDocumentation(root);
  return '';
}

export function nextSteps(root) {
  installationStatus(root);
  const config=resolve(root,{frozen:true}).config;
  const installation=read(inside(root,'.agenthouse/installation.json'));
  dependencyStatus(root);
  return `Project ready: ${root}

Installed: project launcher, lifecycle skill, frontend-acceptance, and agent instructions.
Registered coding agents: ${installation.agents.length?installation.agents.join(', '):'generic instructions only'}.
Autonomy: ${config.autonomy || 'supervised'}; policy sources: ${config.policySources.join(', ')}.

Open this enrolled repository as the coding-agent workspace, then reload the host or start a fresh session.
  node .agenthouse/run.mjs help agents
  node .agenthouse/run.mjs help cookbook

From this directory:
  node .agenthouse/run.mjs work new --id first-change --title "Describe your outcome"
  node .agenthouse/run.mjs work show --id first-change

Ask your coding agent:
  "Read AGENTS.md and follow the agenthouse lifecycle for first-change.
   Help me define the outcome and acceptance criteria, then implement and verify it.
   For UI work, use the installed frontend-acceptance skill and inspect screenshots."

Record the real outcome and evidence in .agenthouse/work/first-change.json.
Inspect .agenthouse/config.json: replace starter checks with this project's checks.
  node .agenthouse/run.mjs module --name node-typescript
  node .agenthouse/run.mjs module --name php-laravel
After reviewing configuration changes:
  node .agenthouse/run.mjs resolve
  node .agenthouse/run.mjs evaluate --profile pull-request --ci

An incomplete starter is expected to fail readiness; it is not an application test.
Supervised transitions need an authorized signed decision (help work / help sign).
Agent commands: read .agenthouse/agent-commands.md; invoke ah-help or ah-review-change through your host skill/command picker.
To change agents on an existing installation, rerun init with the complete list, for example --agents codex,cursor.
Explore: help evaluate, help dependencies, doctor, or demo in a NEW empty directory.
Native agent loading/hooks still require host-specific verification.`;
}
export async function onboard(root,options={}) {
  if(options.docs!==undefined)assert(DOC_CHOICES.includes(options.docs),`Documentation choice must be ${DOC_CHOICES.join(', ')}`);
  const installed=fs.existsSync(inside(root,'.agenthouse/installation.json'));
  const interactive=!options.nonInteractive && process.stdin.isTTY && process.stdout.isTTY;
  let agents=options.agents,policy=options.policy,autonomy=options.autonomy;
  if(!installed && !agents && !options.nonInteractive)assert(interactive,'For scripted setup use onboard --agents codex (choose your agents), or --non-interactive. Run help onboard for options.');
  const needsPrompt=interactive && ((!installed && !agents) || options.docs===undefined);
  const prompt=needsPrompt?createInterface({input:process.stdin,output:process.stdout}):null;
  try {
    if(!installed && !agents && !options.nonInteractive) {
      console.log(`Set up agenthouse in ${root}\nInstalls a project runtime, skills and advisory agent instructions.\nExisting project configuration and unrelated files are preserved.`);
      agents=(await prompt.question(`Coding agents, comma separated (${Object.keys(AGENTS).join(', ')}; Enter for codex): `)).trim() || 'codex';
      if(!policy)policy=(await prompt.question('Organization policy JSON path (Enter for a local solo policy): ')).trim() || undefined;
      if(!policy && !autonomy)autonomy=(await prompt.question('Autonomy: supervised, bounded, delegated (Enter for supervised): ')).trim() || 'supervised';
    }
    if(!installed)install(root,{agents:(agents || 'codex').split(',').map(a=>a.trim()),policy,autonomy,project:options.project});
    let choice=options.docs;
    if(choice===undefined && prompt)choice=(await prompt.question('Documentation: open in the default Markdown app, show in this terminal, or skip? (open/show/skip; Enter for open): ')).trim() || 'open';
    choice=choice || 'skip';
    const guide=documentation(root,choice,options.documentationOptions);
    return `${nextSteps(root)}${guide?`\n\n${guide}`:''}`;
  }finally{
    prompt?.close();
  }
}
export async function demo(root) {
  assert(!fs.existsSync(root) || fs.readdirSync(root).length===0,'Demo requires a new or empty directory; use --root ./ah-demo');
  install(root,{agents:[],autonomy:'bounded'});
  write(inside(root,'story.md'),'Demonstration: greet a visitor by name. Acceptance: greet("Ada") returns "Hello, Ada!". This fixture does not validate your application.\n');
  write(inside(root,'greet.mjs'),'export const greet = name => `Hello!`;\n');
  write(inside(root,'acceptance.mjs'),'import assert from "node:assert/strict";\nimport {greet} from "./greet.mjs";\nassert.equal(greet("Ada"), "Hello, Ada!");\n');
  const config=read(inside(root,'.agenthouse/config.json'));
  config.evaluators=[{id:'greeting',kind:'command',executable:process.execPath,args:['acceptance.mjs'],result:'exit-code'}];
  config.profiles={'pull-request':{checks:[{evaluator:'greeting',required:true}]}};
  write(inside(root,'.agenthouse/config.json'),config);resolve(root);
  const failed=await evaluate(root,{frozen:true,subject:'demo-before-fix'});
  assert(failed.exitCode===1,'Demo expected a failing acceptance check');
  write(inside(root,'greet.mjs'),'export const greet = name => `Hello, ${name}!`;\n');
  const passed=await evaluate(root,{frozen:true,subject:'demo-after-fix'});
  assert(passed.exitCode===0,'Demo expected the corrected acceptance check to pass');
  return `Demo complete in ${root}\n1. Read story.md for the intended behavior.\n2. The initial implementation failed its acceptance check (exit 1).\n3. The corrected implementation passed (exit 0).\n\nBefore: ${path.join(failed.folder,'report.html')}\nAfter: ${path.join(passed.folder,'report.html')}\n\nEach report folder includes result.json and junit.xml.\nTry changing greet.mjs and rerun:\n  node .agenthouse/run.mjs evaluate --ci --subject demo-your-change\n\nThis is a CLI acceptance example. It makes no visual or governance approval claim.\nFor your real project, run onboard; for browser evidence see docs/visual-acceptance.md.`;
}

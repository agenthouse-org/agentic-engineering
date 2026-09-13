import fs from 'node:fs';
import path from 'node:path';
import {createInterface} from 'node:readline/promises';
import {assert,inside,read,write} from './io.js';
import {install,AGENTS} from './install.js';
import {dependencyStatus} from './dependencies.js';
import {resolve} from './policy.js';
import {evaluate} from './evaluate.js';

export function nextSteps(root) {
  const config=resolve(root,{frozen:true}).config;
  dependencyStatus(root);
  return `Project ready: ${root}

Installed: project launcher, lifecycle skill, frontend-acceptance, and agent instructions.
Autonomy: ${config.autonomy || 'supervised'}; policy sources: ${config.policySources.join(', ')}.

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
Explore: help evaluate, help dependencies, doctor, or demo in a NEW empty directory.
Native agent loading/hooks still require host-specific verification.`;
}
export async function onboard(root,options={}) {
  if(fs.existsSync(inside(root,'.agenthouse/installation.json')))return nextSteps(root);
  let agents=options.agents,policy=options.policy,autonomy=options.autonomy;
  if(!agents && !options.nonInteractive) {
    assert(process.stdin.isTTY && process.stdout.isTTY,'For scripted setup use onboard --agents codex (choose your agents), or --non-interactive. Run help onboard for options.');
    const prompt=createInterface({input:process.stdin,output:process.stdout});
    try {
      console.log(`Set up agenthouse in ${root}\nInstalls a project runtime, skills and advisory agent instructions.\nExisting project configuration and unrelated files are preserved.`);
      agents=(await prompt.question(`Coding agents, comma separated (${Object.keys(AGENTS).join(', ')}; Enter for codex): `)).trim() || 'codex';
      if(!policy)policy=(await prompt.question('Organization policy JSON path (Enter for a local solo policy): ')).trim() || undefined;
      if(!policy && !autonomy)autonomy=(await prompt.question('Autonomy: supervised, bounded, delegated (Enter for supervised): ')).trim() || 'supervised';
    }finally{prompt.close();}
  }
  install(root,{agents:(agents || 'codex').split(',').map(a=>a.trim()),policy,autonomy,project:options.project});
  return nextSteps(root);
}
export async function demo(root) {
  assert(!fs.existsSync(root) || fs.readdirSync(root).length===0,'Demo requires a new or empty directory; use --root ./agenthouse-demo');
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

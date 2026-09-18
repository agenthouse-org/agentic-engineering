import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {install,uninstall,payload} from '../src/install.js';
import {topics} from '../src/help.js';
import {agentSkills} from '../src/agent-commands.js';
import {PACKAGE,read,write} from '../src/io.js';
import {BROWSER_EPHEMERA,removeLocalFrontendEphemera} from '../src/housekeep.js';
const temp=t=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah-commands-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;};
test('all CLI topics and engineering workflow roles have installed agent entry points',t=>{
  const root=temp(t);install(root,{agents:['claude','codex','cursor','opencode','windsurf','openclaw']});
  for(const command of ['help',...Object.keys(topics),'review-change','draft-user-story','assess-story-readiness','validate-scope','check-commit','enroll-repository','frontend-acceptance']) {
    const name=`ah-${command}`,canonical=path.join(root,'.agents/skills',name,'SKILL.md');assert.ok(fs.existsSync(canonical));
    for(const folder of ['.claude/commands','.opencode/commands','.windsurf/workflows']) {
      const body=fs.readFileSync(path.join(root,folder,`${name}.md`),'utf8');
      const target=body.match(/\.agents\/skills\/[a-z-]+\/SKILL\.md/)[0];assert.ok(fs.existsSync(path.join(root,target)));
    }
  }
  const result=spawnSync(process.execPath,[path.join(root,'.agenthouse/run.mjs'),'help','dependencies'],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
});
test('native aliases preserve unrelated commands and reject modifications',t=>{
  const root=temp(t);write(path.join(root,'.claude/commands/my-command.md'),'user command');install(root,{agents:['claude']});
  const alias=path.join(root,'.claude/commands/ah-help.md'),before=fs.readFileSync(alias,'utf8');install(root,{agents:['claude']});assert.equal(fs.readFileSync(alias,'utf8'),before);
  fs.appendFileSync(alias,'user edit');assert.throws(()=>install(root),/modified/i);assert.throws(()=>uninstall(root),/modified/i);
  write(alias,before);uninstall(root);assert.equal(fs.readFileSync(path.join(root,'.claude/commands/my-command.md'),'utf8'),'user command');assert.equal(fs.existsSync(alias),false);
});
test('existing unowned native alias is not overwritten',t=>{
  const root=temp(t),file=path.join(root,'.opencode/commands/ah-help.md');write(file,'user owned');
  assert.throws(()=>install(root,{agents:['opencode']}),/Existing/);assert.equal(fs.readFileSync(file,'utf8'),'user owned');
});
test('agent skill descriptions tell a person what the skill does and when to use it',()=>{
  for(const command of ['help',...Object.keys(topics)])assert.ok(agentSkills()[`ah-${command}`]);
  for(const [name,content] of Object.entries(agentSkills())) {
    const description=JSON.parse(content.match(/^description:\s*(.+)$/m)[1]);
    assert.equal(typeof description,'string');
    assert.ok(description.length>0 && description.length<=1024,name);
    assert.doesNotMatch(description,/when the user requests this framework operation/);
    assert.doesNotMatch(description,/^Use --/);
    assert.match(description,/Use when |Use at /,`${name} needs a when-to-use clause`);
    assert.doesNotMatch(description,/\bI can\b|\bYou can use this\b/);
  }
});
test('frontend-acceptance treats inspection screenshots as ephemeral, not Git evidence',()=>{
  const skill=agentSkills()['ah-frontend-acceptance'];
  assert.match(skill,/not permission to commit screenshot dumps/);
  assert.match(skill,/housekeep/);
  assert.match(fs.readFileSync(path.join(PACKAGE,'skills/ah-lifecycle/SKILL.md'),'utf8'),/housekeep/);
});
test('enrollment ignores frontend inspection captures',t=>{
  const root=temp(t);install(root,{agents:[]});
  const ignore=fs.readFileSync(path.join(root,'.gitignore'),'utf8');
  assert.match(ignore,/\.agenthouse\/evidence\//);
  assert.match(ignore,/\.agenthouse\/browser-assessment\.json/);
  assert.match(ignore,/artifacts\/agenthouse\//);
});
test('local frontend ephemera are removed except when CI keeps them',t=>{
  const root=temp(t);
  for(const rel of BROWSER_EPHEMERA) {
    const target=path.join(root,rel);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    if(rel.endsWith('.json'))fs.writeFileSync(target,'{}');
    else {fs.mkdirSync(path.join(target,'shots'),{recursive:true});fs.writeFileSync(path.join(target,'shots','actual.png'),'x');}
  }
  assert.equal(removeLocalFrontendEphemera(root,{CI:'true'}),false);
  assert.ok(fs.existsSync(path.join(root,'work/browser-results/shots/actual.png')));
  assert.equal(removeLocalFrontendEphemera(root,{AH_KEEP_BROWSER_ARTIFACTS:'1'}),false);
  assert.equal(removeLocalFrontendEphemera(root,{}),true);
  assert.equal(fs.existsSync(path.join(root,'work/browser-results')),false);
  assert.equal(fs.existsSync(path.join(root,'work/browser-baselines')),false);
  assert.equal(fs.existsSync(path.join(root,'work/browser-assessment.json')),false);
  assert.equal(fs.existsSync(path.join(root,'.agenthouse/evidence')),false);
});
test('rollback projection removes only owned command assets no longer bundled',t=>{
  const root=temp(t);install(root,{agents:['claude','windsurf','opencode']});const data=payload();
  for(const name of Object.keys(agentSkills()))delete data.files[`skills/${name}/SKILL.md`];
  install(root,{payload:data});assert.equal(fs.existsSync(path.join(root,'.claude/commands/ah-help.md')),false);
  assert.ok(fs.existsSync(path.join(root,'.agents/skills/ah-lifecycle/SKILL.md')));
  assert.ok(read(path.join(root,'.agenthouse/installation.json')).files['.agenthouse/agent-commands.md']);
});

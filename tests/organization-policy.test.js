import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generateKeyPairSync} from 'node:crypto';
import {read,write,hash} from '../src/io.js';
import {install} from '../src/install.js';
import {resolve,signed} from '../src/policy.js';
import {trackPolicy,policyStatus,adoptPolicy} from '../src/policy-channel.js';
import {updateDependency} from '../src/dependency-update.js';
import {dependencyStatus} from '../src/dependencies.js';
import {session} from '../src/update.js';
import {evaluate} from '../src/evaluate.js';
import {spawnSync} from 'node:child_process';
import {skillDirectory} from '../src/storage.js';
import {organizationSkillBundle,restoreOrganizationSkills} from '../src/organization-skills.js';
import {policyChannel} from '../src/policy-channel.js';

function fixture(t) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ah-organization-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const pair=generateKeyPairSync('ed25519'),publicKey=pair.publicKey.export({type:'spki',format:'pem'});
  const policy={schemaVersion:1,id:'org',revision:'1',rules:[{id:'style',mode:'default',value:'a'}]};
  const file=path.join(dir,'policy.json');write(file,policy);
  const roots=['app-a','app-b'].map(n=>{const root=path.join(dir,n);install(root,{storage:'project',agents:[],policy:file});return root;});
  const channel=path.join(dir,'channel.json');
  function publish(next=policy,sequence=1,extra={}) {
    const data={schemaVersion:1,kind:'policy-channel',repository:'https://example.org/policy.git',path:'policy/organization.json',sequence,issuedAt:'2026-01-01T00:00:00Z',expiresAt:'2099-01-01T00:00:00Z',policy:next,digest:hash(next),permitted:[{digest:hash(policy)},{digest:hash(next)}],...extra};
    write(channel,signed(data,pair.privateKey));return data;
  }
  publish();
  const origin=path.join(dir,'origin.json');write(origin,{file:'.agenthouse/organization.json',repository:'https://example.org/policy.git',path:'policy/organization.json',channel,publicKey});
  return {dir,roots,policy,pair,publicKey,channel,origin,publish};
}
test('two consumers see drift; discovery never adopts; explicit digest adoption preserves the other consumer',t=>{
  const f=fixture(t);for(const root of f.roots)trackPolicy(root,f.origin);
  const before=f.roots.map(root=>read(path.join(root,'.agenthouse/resolved.json')));
  const next={...f.policy,revision:'2',rules:[{id:'style',mode:'default',value:'b'}]};f.publish(next,2);
  for(const [i,root] of f.roots.entries()) {
    const state=policyStatus(root,{record:true,required:true});assert.equal(state.sources[0].freshness,'behind');assert.equal(state.exitCode,0);
    assert.deepEqual(read(path.join(root,'.agenthouse/resolved.json')),before[i]);resolve(root,{frozen:true});
  }
  const options={file:'.agenthouse/organization.json'};
  const preview=adoptPolicy(f.roots[0],{...options,check:true});assert.equal(preview.changes.rules[0].id,'style');
  assert.throws(()=>adoptPolicy(f.roots[0],{...options,digest:'wrong'}),/reviewed/);
  adoptPolicy(f.roots[0],{...options,digest:preview.digest});resolve(f.roots[0],{frozen:true});
  assert.equal(policyStatus(f.roots[0]).sources[0].freshness,'current');assert.equal(policyStatus(f.roots[1]).sources[0].freshness,'behind');
});
test('unknown, untracked, withdrawn and replayed metadata never pass a required policy check',t=>{
  const f=fixture(t),root=f.roots[0];assert.equal(policyStatus(root,{required:true}).exitCode,4);
  trackPolicy(root,f.origin);f.publish(f.policy,2,{permitted:[]});assert.equal(policyStatus(root,{record:true,required:true}).exitCode,1);
  f.publish(f.policy,1);assert.match(policyStatus(root).sources[0].reason,/replay/);
  f.publish(f.policy,2);assert.match(policyStatus(root).sources[0].reason,/reused/);
  f.publish(f.policy,3,{expiresAt:'2000-01-01T00:00:00Z'});assert.equal(policyStatus(root,{required:true}).exitCode,4);
  fs.unlinkSync(f.channel);assert.equal(policyStatus(root).sources[0].freshness,'unknown');assert.ok(policyStatus(root).sources[0].lastSuccessfulObservation);
});
test('tampering and policy conflicts cannot partially adopt or overwrite local changes',t=>{
  const f=fixture(t),root=f.roots[0];trackPolicy(root,f.origin);
  const next={...f.policy,revision:'2',rules:[{id:'style',mode:'mandatory',value:'b'}]};f.publish(next,2);
  const config=read(path.join(root,'.agenthouse/config.json'));config.overrides={style:'a'};write(path.join(root,'.agenthouse/config.json'),config);resolve(root);
  const before=read(path.join(root,'.agenthouse/resolved.json'));
  assert.throws(()=>adoptPolicy(root,{file:'.agenthouse/organization.json',digest:hash(next)}),/mandatory/);
  assert.deepEqual(read(path.join(root,'.agenthouse/resolved.json')),before);assert.deepEqual(read(path.join(root,'.agenthouse/organization.json')),f.policy);
  write(path.join(root,'.agenthouse/organization.json'),{...f.policy,revision:'local'});
  assert.throws(()=>resolve(root),/modified/);assert.throws(()=>adoptPolicy(root,{file:'.agenthouse/organization.json',digest:hash(next)}),/modified/);
  const envelope=read(f.channel);envelope.payload.policy.revision='tampered';write(f.channel,envelope);
  assert.equal(policyStatus(root,{required:true}).exitCode,4);
});
function skill(f,version='1.0.0',id='org-conventions') {
  const files={'SKILL.md':Buffer.from(`---\nname: ${id}\nversion: ${version}\nlicense: Proprietary\n---\nOrganization conventions ${version}\n`).toString('base64')};
  const data={schemaVersion:1,kind:'skill',id,version,source:{repository:'https://example.org/skills.git',commit:'a'.repeat(40),path:'skills/conventions'},license:'Proprietary',files,digest:hash(Object.fromEntries(Object.entries(files).map(([p,b])=>[p,hash(Buffer.from(b,'base64'))])))};
  const bundle=path.join(f.dir,'skill.json');write(bundle,{publisher:'org',...signed(data,f.pair.privateKey)});return {bundle,data};
}
function trust(f,root) {write(path.join(root,'.agenthouse/trusted-sources.json'),{schemaVersion:1,sources:[{id:'org',repository:'https://example.org/skills.git',publicKey:f.publicKey,skills:{'org-conventions':'skills/conventions'},licenses:['Proprietary']}]});}
test('organization skill signed updates, session channels, integrity and publisher scope',t=>{
  const f=fixture(t),root=f.roots[0];trust(f,root);let s=skill(f);
  updateDependency(root,s);dependencyStatus(root);
  s=skill(f,'1.1.0');write(path.join(root,'.agenthouse/dependency-policy.json'),{channels:[{bundle:s.bundle,automatic:true}]});
  assert.equal(session(root).organizationUpdates[0].version,'1.1.0');dependencyStatus(root);
  const trusted=read(path.join(root,'.agenthouse/trusted-sources.json'));trusted.sources[0].revoked=true;write(path.join(root,'.agenthouse/trusted-sources.json'),trusted);
  assert.throws(()=>dependencyStatus(root),/revoked/);
  trust(f,root);s=skill(f,'1.2.0','frontend-acceptance');assert.throws(()=>updateDependency(root,s),/replace/);
  s=skill(f,'1.2.0','unauthorized');assert.throws(()=>updateDependency(root,s),/scope/);
});
test('skill pins, breaking versions, downgrades, invalid signatures and local edits fail closed',t=>{
  const f=fixture(t),root=f.roots[0];trust(f,root);updateDependency(root,skill(f));
  assert.throws(()=>updateDependency(root,skill(f,'2.0.0')),/Breaking/);
  assert.throws(()=>updateDependency(root,{...skill(f,'0.9.0'),allowBreaking:true}),/downgrade/);
  let s=skill(f,'1.1.0');const envelope=read(s.bundle);envelope.signature='invalid';write(s.bundle,envelope);assert.throws(()=>updateDependency(root,s),/signature/);
  s=skill(f,'1.1.0');fs.appendFileSync(path.join(root,'.agents/skills/org-conventions/SKILL.md'),'local');assert.throws(()=>updateDependency(root,s),/modified/);
});
test('required evaluator and installed CLI preserve unknown/blocked outcomes',async t=>{
  const f=fixture(t),root=f.roots[0];trackPolicy(root,f.origin);
  const config=read(path.join(root,'.agenthouse/config.json'));config.evaluators=[{id:'org-policy',kind:'policy-channel'}];config.profiles={'pull-request':{checks:[{evaluator:'org-policy'}]}};
  write(path.join(root,'.agenthouse/config.json'),config);resolve(root);
  assert.equal((await evaluate(root,{frozen:true,subject:'build'})).exitCode,0);
  f.publish(f.policy,2,{permitted:[]});assert.equal((await evaluate(root,{frozen:true,subject:'build'})).exitCode,1);
  fs.unlinkSync(f.channel);assert.equal((await evaluate(root,{frozen:true,subject:'build'})).exitCode,4);
  const cli=spawnSync(process.execPath,[path.join(root,'.agenthouse/run.mjs'),'policy','check','--required','--root',root],{encoding:'utf8',windowsHide:true});
  assert.equal(cli.status,4,cli.stderr);assert.equal(JSON.parse(cli.stdout).sources[0].freshness,'unknown');
  const paths=path.join(f.dir,'roots.json');write(paths,[root,path.join(f.dir,'missing')]);
  const fleet=spawnSync(process.execPath,[path.join(root,'.agenthouse/run.mjs'),'policy','status','--roots',paths],{encoding:'utf8',windowsHide:true});assert.equal(fleet.status,4);assert.equal(JSON.parse(fleet.stdout).projects.length,2);
});
test('central channels and skills use immutable storage and survive framework reinstall',t=>{
  const f=fixture(t),prior=process.env.AGENTHOUSE_HOME;process.env.AGENTHOUSE_HOME=path.join(f.dir,'central');
  t.after(()=>{if(prior===undefined)delete process.env.AGENTHOUSE_HOME;else process.env.AGENTHOUSE_HOME=prior;});
  const root=path.join(f.dir,'central-app');install(root,{storage:'machine',integration:'shared',agents:[],policy:path.join(f.dir,'policy.json')});
  write(path.join(process.env.AGENTHOUSE_HOME,'channels/policy.json'),read(f.channel));
  const descriptor=read(f.origin);descriptor.channel='home:channels/policy.json';write(f.origin,descriptor);trackPolicy(root,f.origin);
  trust(f,root);const first=skill(f);updateDependency(root,first);const previous=skillDirectory(root,'org-conventions');
  updateDependency(root,skill(f,'1.1.0'));assert.notEqual(skillDirectory(root,'org-conventions'),previous);assert.ok(fs.existsSync(previous));
  dependencyStatus(root);install(root,{agents:[]});dependencyStatus(root);resolve(root,{frozen:true});
});
test('configured skill pins allow explicit next digest and reject other candidates; extra files survive rejected updates',t=>{
  const f=fixture(t),root=f.roots[0];trust(f,root);const first=skill(f);updateDependency(root,first);
  let trustFile=read(path.join(root,'.agenthouse/trusted-sources.json'));trustFile.sources[0].pins={'org-conventions':first.data.digest};write(path.join(root,'.agenthouse/trusted-sources.json'),trustFile);
  const next=skill(f,'1.1.0');assert.throws(()=>updateDependency(root,next),/pinned/);
  trustFile.sources[0].pins['org-conventions']=next.data.digest;write(path.join(root,'.agenthouse/trusted-sources.json'),trustFile);
  updateDependency(root,next);dependencyStatus(root);
  write(path.join(root,'.agents/skills/org-conventions/user.md'),'preserve');
  trust(f,root);assert.throws(()=>updateDependency(root,skill(f,'1.2.0')),/inventory/);assert.equal(fs.readFileSync(path.join(root,'.agents/skills/org-conventions/user.md'),'utf8'),'preserve');
});
test('publisher helpers produce usable signed artifacts and missing skill files restore offline',t=>{
  const f=fixture(t),root=f.roots[0];trust(f,root);
  const source=path.join(f.dir,'source');write(path.join(source,'SKILL.md'),'---\nname: org-conventions\nversion: 1.0.0\nlicense: Proprietary\n---\nReviewed conventions\n');
  const key=path.join(f.dir,'key');write(key,f.pair.privateKey.export({type:'pkcs8',format:'pem'}));
  const envelope=organizationSkillBundle({source,repository:'https://example.org/skills.git',revision:'b'.repeat(40),sourcePath:'skills/conventions',publisher:'org',key});
  const bundle=path.join(f.dir,'built.json');write(bundle,envelope);updateDependency(root,{bundle});
  const file=path.join(root,'.agents/skills/org-conventions/SKILL.md');fs.unlinkSync(file);restoreOrganizationSkills(root);dependencyStatus(root);
  fs.appendFileSync(file,'local');assert.throws(()=>restoreOrganizationSkills(root),/modified/);
  const payload=policyChannel({file:path.join(f.dir,'policy.json'),repository:'https://example.org/policy.git',sourcePath:'policy/organization.json',sequence:1,expiresAt:'2099-01-01T00:00:00Z'});
  write(f.channel,signed(payload,f.pair.privateKey));trackPolicy(root,f.origin);assert.equal(policyStatus(root,{required:true}).exitCode,0);
});
test('wrong signature, wrong source and corrupt local JSON remain explicit unknown results',t=>{
  const f=fixture(t),root=f.roots[0];trackPolicy(root,f.origin);
  const envelope=read(f.channel);envelope.payload.policy.revision='forged';write(f.channel,envelope);
  assert.match(policyStatus(root).sources[0].reason,/signature/);
  f.publish(f.policy,2,{repository:'https://wrong.example/policy.git'});assert.match(policyStatus(root).sources[0].reason,/source mismatch/);
  write(path.join(root,'.agenthouse/organization.json'),'{broken');assert.equal(policyStatus(root,{required:true}).exitCode,4);
});

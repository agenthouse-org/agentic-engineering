import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generateKeyPairSync} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {read,write,hash,PACKAGE,inside} from '../src/io.js';
import {install,uninstall,payload,recover} from '../src/install.js';
import {resolve,approval,signed} from '../src/policy.js';
import {evaluate} from '../src/evaluate.js';
import {newItem,advance,STAGES} from '../src/lifecycle.js';
import {update,rollback} from '../src/update.js';
import {visual} from '../src/visual.js';
import {importSkill} from '../src/skills.js';

function temp(t) {const root=fs.mkdtempSync(path.join(os.tmpdir(),'agenthouse test '));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
function setup(t,agents=[]) {const root=temp(t);install(root,{agents,project:'pilot',autonomy:'bounded'});return root;}
function config(root,edit) {const file=path.join(root,'.agenthouse/config.json'),data=read(file);edit(data);write(file,data);resolve(root);return data;}
function commands(root,code,options={}) {
  write(path.join(root,'check.mjs'),code);
  return config(root,c=>{c.evaluators=[{id:'check',kind:'command',executable:'node',args:['check.mjs'],result:'exit-code',...options}];c.profiles={'pull-request':{checks:[{evaluator:'check',required:true}]}};});
}
const run=root=>evaluate(root,{frozen:true,subject:'build-123'});

test('enrollment preserves existing instructions and idempotently installs all six adapters',t=>{
  const root=temp(t);write(path.join(root,'AGENTS.md'),'Existing project instruction.\n');
  const agents=['claude','codex','opencode','cursor','windsurf','openclaw'];
  install(root,{agents,project:'pilot'});const first=fs.readFileSync(path.join(root,'AGENTS.md'),'utf8');
  install(root,{agents});assert.equal(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'),first);
  assert.match(first,/Existing project instruction/);
  for(const file of ['CLAUDE.md','.cursor/rules/agenthouse.mdc','.windsurf/rules/agenthouse.md','.agents/skills/ah-lifecycle/SKILL.md'])assert.ok(fs.existsSync(path.join(root,file)));
  const cli=spawnSync(process.execPath,[path.join(root,'.agenthouse/run.mjs'),'doctor','--root',root],{encoding:'utf8'});assert.equal(cli.status,0,cli.stderr);
});
test('uninstall preserves unrelated content and all consumer configuration',t=>{
  const root=setup(t);fs.appendFileSync(path.join(root,'AGENTS.md'),'\nUser addition.');
  uninstall(root);assert.match(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'),/User addition/);assert.ok(fs.existsSync(path.join(root,'.agenthouse/config.json')));
});
test('modified managed content blocks update and uninstall',t=>{
  const root=setup(t);fs.appendFileSync(path.join(root,'.agenthouse/lifecycle.md'),'local edit');
  assert.throws(()=>install(root),/modified/i);assert.throws(()=>uninstall(root),/modified/i);
});
test('unowned existing adapter is never overwritten',t=>{
  const root=temp(t);write(path.join(root,'.cursor/rules/agenthouse.mdc'),'User rule');
  assert.throws(()=>install(root,{agents:['cursor']}),/Existing/);assert.equal(fs.readFileSync(path.join(root,'.cursor/rules/agenthouse.mdc'),'utf8'),'User rule');
});
test('path traversal is rejected',t=>{const root=temp(t);for(const p of ['../outside','a/../../outside','C:/outside','a:stream'])assert.throws(()=>inside(root,p));});
test('frozen resolution detects changed configuration and tampered snapshot',t=>{
  const root=setup(t);const file=path.join(root,'.agenthouse/config.json');let data=read(file);data.project='different';write(file,data);
  assert.throws(()=>resolve(root,{frozen:true}),/stale/);resolve(root);const lock=path.join(root,'.agenthouse/resolved.json');data=read(lock);data.digest='bad';write(lock,data);assert.throws(()=>resolve(root,{frozen:true}),/stale/);
});
test('mandatory policy cannot be weakened; defaults can be overridden',t=>{
  const root=setup(t),p=path.join(root,'.agenthouse/policy.json'),policy=read(p);
  policy.rules=[{id:'limit',mode:'mandatory',value:3},{id:'style',mode:'default',value:'a'}];write(p,policy);
  config(root,c=>c.overrides={style:'b'});assert.equal(resolve(root).snapshot.rules.find(r=>r.id==='style').value,'b');
  const file=path.join(root,'.agenthouse/config.json'),c=read(file);c.overrides.limit=4;write(file,c);assert.throws(()=>resolve(root),/mandatory/);
});
test('trusted external policy prevents replacement of a mandatory evaluator',t=>{
  const root=setup(t);commands(root,'process.exit(0)');const evaluator=read(path.join(root,'.agenthouse/config.json')).evaluators[0];
  const policy=path.join(temp(t),'central.json');write(policy,{schemaVersion:1,id:'central',revision:'1',rules:[{id:'evaluator.check',mode:'mandatory',value:{...evaluator,args:['different.mjs']}}]});
  assert.throws(()=>resolve(root,{policyFile:policy}),/Mandatory evaluator/);
});
test('mandatory autonomy cannot be bypassed by project config',t=>{
  const root=setup(t),p=path.join(root,'.agenthouse/policy.json'),policy=read(p);policy.rules=[{id:'autonomy',mode:'mandatory',value:'supervised'}];write(p,policy);assert.throws(()=>resolve(root),/mandatory autonomy/);
});
test('organization-required check cannot be omitted',async t=>{
  const root=setup(t);commands(root,'process.exit(0)');const p=path.join(root,'.agenthouse/policy.json'),policy=read(p);policy.requiredChecks=['security'];write(p,policy);resolve(root);
  assert.equal((await run(root)).exitCode,4);
});
for(const [name,script,expected,options] of [
  ['pass','console.log("ok")',0,{}],['failure','process.exit(1)',1,{}],['unmapped','process.exit(7)',2,{}],
  ['invalid JSON','console.log("not json")',2,{result:'json'}],['timeout','setInterval(()=>{},1000)',2,{timeoutSeconds:0.1}],
  ['missing executable','',2,{executable:'agenthouse-nonexistent-command'}],
  ['pending',`console.log(JSON.stringify({schemaVersion:1,status:'pending',reason:'Approval pending'}))`,3,{result:'json'}]
])test(`CLI evaluator ${name} returns ${expected}`,async t=>{const root=setup(t);commands(root,script,options);const result=await run(root);assert.equal(result.exitCode,expected,JSON.stringify(result));assert.ok(fs.existsSync(path.join(result.folder,'report.html')));assert.ok(fs.existsSync(path.join(result.folder,'junit.xml')));});
test('advisory failure stays visible without failing the gate',async t=>{
  const root=setup(t);commands(root,'process.exit(1)');config(root,c=>c.profiles['pull-request'].checks[0].required=false);const result=await run(root);assert.equal(result.exitCode,0);assert.equal(result.checks[0].status,'failed');
});
test('malformed structured output cannot pass',async t=>{const root=setup(t);commands(root,'console.log(JSON.stringify({schemaVersion:1,status:"passed"}))',{result:'json'});assert.equal((await run(root)).exitCode,2);});
test('missing evidence and stale assessment never pass',async t=>{
  const root=setup(t);config(root,c=>{c.evaluators=[{id:'assessment',kind:'evidence',file:'assessment.json'}];c.profiles={'pull-request':{checks:[{evaluator:'assessment'}]}};});
  assert.equal((await run(root)).exitCode,4);write(path.join(root,'assessment.json'),{schemaVersion:1,status:'passed',reason:'Old result',subject:'old',policyDigest:'old'});assert.equal((await run(root)).exitCode,4);
});
test('not-applicable requires configured applicability permission',async t=>{const root=setup(t);commands(root,`console.log(JSON.stringify({schemaVersion:1,status:'not-applicable',reason:'No UI change'}))`,{result:'json'});assert.equal((await run(root)).exitCode,4);config(root,c=>c.profiles['pull-request'].checks[0].allowNotApplicable=true);assert.equal((await run(root)).exitCode,0);});
test('signed central and delegated approvals enforce scope and expiry',t=>{
  const root=setup(t),p=path.join(root,'.agenthouse/policy.json'),policy=read(p),pair=generateKeyPairSync('ed25519');policy.authorities.delegate=pair.publicKey.export({type:'spki',format:'pem'});write(p,policy);
  const {snapshot}=resolve(root),now=Date.now(),owner=fs.readFileSync(path.join(root,'.agenthouse/local/owner.key'),'utf8');
  const base={schemaVersion:1,kind:'decision',issuer:'project-owner',scope:'pilot',action:'release',subject:'build',policyDigest:snapshot.digest,issuedAt:new Date(now-1000).toISOString(),expiresAt:new Date(now+100000).toISOString(),verdict:'allowed'};
  const target={scope:'pilot',action:'release',subject:'build'};assert.equal(approval(signed(base,owner),snapshot,target),'allowed');
  assert.throws(()=>approval(signed({...base,scope:'wrong'},owner),snapshot,target),/scope/);
  assert.throws(()=>approval(signed({...base,expiresAt:new Date(now-10).toISOString()},owner),snapshot,target),/expired/);
  const env=signed({...base,issuer:'delegate'},pair.privateKey);assert.throws(()=>approval(env,snapshot,target));
  env.delegation=signed({kind:'delegation',issuer:'project-owner',delegate:'delegate',scope:'pilot',actions:['release'],policyDigest:snapshot.digest,issuedAt:base.issuedAt,expiresAt:base.expiresAt},owner);
  assert.equal(approval(env,snapshot,target),'allowed');env.payload.verdict='denied';assert.throws(()=>approval(env,snapshot,target),/signature/);
});
test('lifecycle records require real fields and signed high-impact transitions',t=>{
  const root=setup(t);newItem(root,'change','Pilot change');assert.throws(()=>advance(root,'change','define'),/Missing/);
  const file=path.join(root,'.agenthouse/work/change.json'),item=read(file);item.fields.outcome='A user can complete checkout';write(file,item);
  assert.equal(advance(root,'change','define').stage,'define');assert.throws(()=>advance(root,'change','release'),/follow/);
});
test('offline bundle verifies checksum, rejects tampering, updates and rolls back',t=>{
  const root=setup(t),data=payload(),originalVersion=data.version,nextVersion=data.version.split('.').map((v,i)=>i===2?String(Number(v)+1):v).join('.');data.version=nextVersion;const pkg=JSON.parse(Buffer.from(data.files['package.json'],'base64'));pkg.version=data.version;data.files['package.json']=Buffer.from(JSON.stringify(pkg)).toString('base64');
  const bundle=path.join(temp(t),'update.json');write(bundle,data);const digest=hash(fs.readFileSync(bundle));
  assert.throws(()=>update(root,{bundle,sha256:'bad'}),/trusted/);assert.equal(update(root,{bundle,sha256:digest}).version,nextVersion);assert.equal(rollback(root).version,originalVersion);
  data.files['src/../../outside']=Buffer.from('bad').toString('base64');write(bundle,data);assert.throws(()=>update(root,{bundle,sha256:hash(fs.readFileSync(bundle))}),/Unsafe/);
});
test('transaction recovery restores interrupted managed files',t=>{
  const root=setup(t);write(path.join(root,'managed.txt'),'after');write(path.join(root,'.agenthouse/transaction.json'),[{path:'managed.txt',before:Buffer.from('before').toString('base64'),after:Buffer.from('after').toString('base64')}]);assert.equal(recover(root),true);assert.equal(fs.readFileSync(path.join(root,'managed.txt'),'utf8'),'before');
});
test('skill import preserves upstream package identity and detects conflicts',t=>{
  const root=setup(t),source=temp(t);write(path.join(source,'SKILL.md'),'---\nname: example-skill\nversion: 1.0.0\n---\nMethod');const imported=importSkill(root,source);assert.equal(imported.id,'example-skill');write(path.join(root,'.agents/skills/example-skill/SKILL.md'),'edit');assert.throws(()=>importSkill(root,source),/conflict/);
});
test('visual concept remains incomplete until inspected even if regression passes',t=>{
  const root=setup(t),contract={schemaVersion:1,id:'design',source:{kind:'story',reference:'story.md',revision:'1'},criteria:[{id:'concept',expectation:'Action prominent',method:'concept'}]};
  write(path.join(root,'contract.json'),contract);write(path.join(root,'actual.png'),Buffer.from([137,80,78,71]));
  const context={subject:'build',policyDigest:'policy'},data={schemaVersion:1,...context,contractDigest:hash(contract),environment:{browser:'test'},criteria:[{id:'concept',status:'passed',reason:'Compared hierarchy',evidence:[{path:'actual.png',sha256:hash(fs.readFileSync(path.join(root,'actual.png')))}]}]};
  write(path.join(root,'assessment.json'),data);const e={contract:'contract.json',assessment:'assessment.json'};assert.equal(visual(root,e,context).status,'incomplete');
  data.criteria[0].reviewer='reviewer';data.criteria[0].inspected=true;data.criteria[0].status='failed';write(path.join(root,'assessment.json'),data);assert.equal(visual(root,e,context).status,'failed');
  data.subject='stale';write(path.join(root,'assessment.json'),data);assert.equal(visual(root,e,context).status,'incomplete');
});

test('signed update, pinning and breaking-version checks enforce declared trust',t=>{
  const root=setup(t),pair=generateKeyPairSync('ed25519'),dir=temp(t),data=payload();
  data.version='0.2.0';const pkg=JSON.parse(Buffer.from(data.files['package.json'],'base64'));pkg.version=data.version;data.files['package.json']=Buffer.from(JSON.stringify(pkg)).toString('base64');
  const file=path.join(dir,'signed.json'),key=path.join(dir,'release.pub');write(file,signed(data,pair.privateKey));write(key,pair.publicKey.export({type:'spki',format:'pem'}));
  assert.throws(()=>update(root,{bundle:file,publicKey:key}),/Breaking/);
  write(path.join(root,'.agenthouse/update.json'),{pin:'0.1.3'});assert.throws(()=>update(root,{bundle:file,publicKey:key,allowBreaking:true}),/pinned/);
  write(path.join(root,'.agenthouse/update.json'),{pin:'0.2.0'});assert.equal(update(root,{bundle:file,publicKey:key,allowBreaking:true}).version,'0.2.0');
  const cli=spawnSync(process.execPath,[path.join(root,'.agenthouse/run.mjs'),'doctor','--root',root],{encoding:'utf8'});assert.equal(cli.status,0,cli.stdout+cli.stderr);
  const tampered=read(file);tampered.payload.files['README.md']=Buffer.from('changed').toString('base64');write(file,tampered);assert.throws(()=>update(root,{bundle:file,publicKey:key,allowBreaking:true}),/signature/);
});
test('unhealthy new runtime never activates or changes the snapshot',t=>{
  const root=setup(t),data=payload(),dir=temp(t);const before=read(path.join(root,'.agenthouse/active.json')),snapshot=read(path.join(root,'.agenthouse/resolved.json'));
  data.version='0.1.9';const pkg=JSON.parse(Buffer.from(data.files['package.json'],'base64'));pkg.version=data.version;data.files['package.json']=Buffer.from(JSON.stringify(pkg)).toString('base64');data.files['bin/ah-engineering.js']=Buffer.from('this is invalid javascript {{{').toString('base64');
  const file=path.join(dir,'bad.json');write(file,data);assert.throws(()=>update(root,{bundle:file,sha256:hash(fs.readFileSync(file))}),/health/);assert.deepEqual(read(path.join(root,'.agenthouse/active.json')),before);assert.deepEqual(read(path.join(root,'.agenthouse/resolved.json')),snapshot);
});
test('all lifecycle stages can be traversed with complete evidence and valid authority',t=>{
  const root=setup(t);newItem(root,'complete','Complete lifecycle');const file=path.join(root,'.agenthouse/work/complete.json');
  for(const to of STAGES.slice(1)) {
    const item=read(file);item.fields=Object.fromEntries(['outcome','scope','acceptance','decisions','verification','changes','evidence','acceptanceEvidence','releasePlan','rollbackPlan','serviceObjectives','runbook','learning','retirement'].map(f=>[f,'Recorded pilot evidence']));write(file,item);
    const {snapshot}=resolve(root,{frozen:true}),owner=fs.readFileSync(path.join(root,'.agenthouse/local/owner.key'),'utf8');
    const decision=signed({schemaVersion:1,kind:'decision',issuer:'project-owner',scope:'pilot',action:`transition:${to}`,subject:hash(item),policyDigest:snapshot.digest,issuedAt:new Date(Date.now()-1000).toISOString(),expiresAt:new Date(Date.now()+60000).toISOString(),verdict:'allowed'},owner);
    write(path.join(root,'approval.json'),decision);advance(root,'complete',to,'approval.json');
  }
  assert.equal(read(file).stage,'retire');assert.equal(read(file).history.length,STAGES.length-1);
});
test('invalid organization policy rolls enrollment back without replacing user files',t=>{
  const root=temp(t),policy=path.join(temp(t),'expired.json');write(path.join(root,'AGENTS.md'),'Existing instructions');
  write(policy,{schemaVersion:1,id:'expired',revision:'1',expiresAt:'2000-01-01T00:00:00Z',rules:[]});
  assert.throws(()=>install(root,{agents:[],policy}),/expired/);
  assert.equal(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'),'Existing instructions');assert.equal(fs.existsSync(path.join(root,'.agenthouse/active.json')),false);assert.equal(fs.existsSync(path.join(root,'.agenthouse/config.json')),false);
});
test('an existing owner key is preserved on a conflicting first enrollment',t=>{
  const root=temp(t);write(path.join(root,'.agenthouse/local/owner.key'),'Existing private key');
  assert.throws(()=>install(root,{agents:[]}),/Existing initial configuration/);assert.equal(fs.readFileSync(path.join(root,'.agenthouse/local/owner.key'),'utf8'),'Existing private key');assert.equal(fs.existsSync(path.join(root,'.agenthouse/active.json')),false);
});

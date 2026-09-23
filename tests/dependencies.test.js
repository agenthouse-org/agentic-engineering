import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generateKeyPairSync} from 'node:crypto';
import {read,write,hash,PACKAGE} from '../src/io.js';
import {install as installActual,payload} from '../src/install.js';
import {dependencyStatus,DEPENDENCY_FILE} from '../src/dependencies.js';
import {updateDependency,pinDependency} from '../src/dependency-update.js';
import {rollback,session} from '../src/update.js';
import {signed} from '../src/policy.js';
import {evaluate} from '../src/evaluate.js';
const temp=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ah-dependencies-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const setup=t=>{const root=temp(t);install(root,{agents:[]});return root;};
// Synthetic releases exercise updater behavior; these versions are not published upstream.
function release(t,version='0.2.1',change=d=>d) {
  let data=read(path.join(PACKAGE,DEPENDENCY_FILE));
  data.files['SKILL.md']=Buffer.from(Buffer.from(data.files['SKILL.md'],'base64').toString().replace('version: 0.2.0',`version: ${version}`)).toString('base64');
  data.version=version;data.source.commit='a'.repeat(40);data=change(data);
  data.digest=hash(Object.fromEntries(Object.entries(data.files).map(([f,b])=>[f,hash(Buffer.from(b,'base64'))])));
  const bundle=path.join(temp(t),'skill.json');write(bundle,data);
  return {bundle,sha256:hash(fs.readFileSync(bundle))};
}
test('fresh enrollment installs exact upstream dependency offline',t=>{
  const root=setup(t),lock=dependencyStatus(root).dependencies['frontend-acceptance'];
  assert.equal(lock.version,'0.2.0');assert.equal(lock.source.commit,'664d8dc4216847a9fcc9442385af1137e4615fde');
  const source=read(path.join(PACKAGE,DEPENDENCY_FILE));
  for(const [file,b] of Object.entries(source.files))assert.deepEqual(fs.readFileSync(path.join(root,'.agents/skills/frontend-acceptance',file)),Buffer.from(b,'base64'));
});
test('dependency update activates new files and rollback restores exact version set',t=>{
  const root=setup(t),before=read(path.join(root,'.agenthouse/active.json')),options=release(t,'0.2.1',d=>{delete d.files['examples/smoke-test.md'];d.files['new.md']=Buffer.from('new resource').toString('base64');return d;});
  assert.equal(updateDependency(root,{...options,check:true}).available,'0.2.1');assert.deepEqual(read(path.join(root,'.agenthouse/active.json')),before);
  updateDependency(root,options);assert.equal(dependencyStatus(root).dependencies['frontend-acceptance'].version,'0.2.1');
  assert.equal(fs.existsSync(path.join(root,'.agents/skills/frontend-acceptance/examples/smoke-test.md')),false);
  rollback(root);assert.deepEqual(read(path.join(root,'.agenthouse/active.json')),before);assert.equal(dependencyStatus(root).dependencies['frontend-acceptance'].version,'0.2.0');
  assert.equal(fs.existsSync(path.join(root,'.agents/skills/frontend-acceptance/new.md')),false);
});
test('pins block dependency and framework-bundled dependency changes',t=>{
  const root=setup(t),options=release(t);pinDependency(root);
  assert.throws(()=>updateDependency(root,options),/pinned/);
  const data=payload();data.files[DEPENDENCY_FILE]=fs.readFileSync(options.bundle).toString('base64');assert.throws(()=>install(root,{payload:data}),/pinned/);
  pinDependency(root,true);updateDependency(root,options);assert.equal(dependencyStatus(root).dependencies['frontend-acceptance'].version,'0.2.1');
});
test('tampering and local edits never activate a dependency update',t=>{
  const root=setup(t),options=release(t),before=read(path.join(root,'.agenthouse/active.json'));
  assert.throws(()=>updateDependency(root,{...options,sha256:'bad'}),/trusted/);
  fs.appendFileSync(path.join(root,'.agents/skills/frontend-acceptance/SKILL.md'),'local edit');
  assert.throws(()=>updateDependency(root,options),/modified/);assert.deepEqual(read(path.join(root,'.agenthouse/active.json')),before);
});
test('missing and extra dependency files fail evaluation closed',async t=>{
  const root=setup(t);write(path.join(root,'.agents/skills/frontend-acceptance/extra.md'),'extra');
  assert.throws(()=>dependencyStatus(root),/inventory/);
  const result=await evaluate(root,{frozen:true,subject:'test'});assert.equal(result.exitCode,2);
  assert.match(result.checks[0].reason,/inventory/);
});
test('signed dependency updates verify issuer key and breaking versions',t=>{
  const root=setup(t),options=release(t,'0.3.0'),pair=generateKeyPairSync('ed25519'),key=path.join(temp(t),'pub');
  write(key,pair.publicKey.export({type:'spki',format:'pem'}));write(options.bundle,signed(read(options.bundle),pair.privateKey));
  assert.throws(()=>updateDependency(root,{bundle:options.bundle,publicKey:key}),/Breaking/);
  updateDependency(root,{bundle:options.bundle,publicKey:key,allowBreaking:true});assert.equal(dependencyStatus(root).dependencies['frontend-acceptance'].version,'0.3.0');
});
test('session applies approved compatible dependency update and respects pins',t=>{
  const root=setup(t),options=release(t);write(path.join(root,'approved.json'),read(options.bundle));
  write(path.join(root,'.agenthouse/dependency-policy.json'),{automatic:true,bundle:'approved.json',sha256:options.sha256});
  pinDependency(root);assert.equal(session(root).dependencyUpdate.status,'deferred');
  pinDependency(root,true);const result=session(root);assert.equal(result.dependencies.dependencies['frontend-acceptance'].version,'0.2.1');
});
test('reused versions and invalid content digest are rejected',t=>{
  const root=setup(t),options=release(t,'0.2.0');assert.throws(()=>updateDependency(root,options),/reused/);
  const data=read(options.bundle);data.digest='bad';write(options.bundle,data);
  assert.throws(()=>updateDependency(root,{bundle:options.bundle,sha256:hash(fs.readFileSync(options.bundle))}),/digest/);
});

function install(root,options={}) {return installActual(root,{storage:'project',...options});}

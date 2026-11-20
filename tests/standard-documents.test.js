import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {install,projectContext} from '../src/install.js';
import {resolve} from '../src/policy.js';
import {hook} from '../src/hooks.js';
import {evaluate} from '../src/evaluate.js';
import {read,write} from '../src/io.js';

function setup(t,docs) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah-standards-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  let policy;
  if(docs){policy=path.join(root,'source.json');write(policy,{schemaVersion:1,id:'org',revision:'r1',rules:[{id:'standard-documents',mode:'mandatory',value:docs}]});}
  install(root,{storage:'project',agents:[],...(policy?{policy}:{})});
  write(path.join(root,'package.json'),{name:'example'});
  write(path.join(root,'event.json'),{event:'session'});
  return root;
}
const docs=[
 {id:'app',title:'Application',url:'https://example.org/app',path:'docs/app.md',appliesTo:{globs:['src/**/*.ts']},topics:['coding']},
 {id:'test',title:'Tests',url:'https://example.org/test',path:'docs/missing.md',appliesTo:{globs:['tests/**/*.ts']},topics:['testing']}
];
test('policy documents appear in context and hook with frozen provenance and missing local fallback',async t=>{
 const root=setup(t,docs);write(path.join(root,'docs/app.md'),'standard');
 const result=projectContext(root).standardDocuments;
 assert.equal(result[0].reference,'docs/app.md');assert.equal(result[1].reference,docs[1].url);assert.equal(result[1].localMissing,true);
 assert.equal(result[0].provenance.source,'org');assert.equal(result[0].provenance.revision,'r1');assert.deepEqual(result[0].appliesTo,docs[0].appliesTo);
 const hookResult=await hook(root,{input:'event.json'});const message=JSON.parse(hookResult.stdout).message;
 assert.match(message,/Application: docs\/app.md/);assert.match(message,/Tests: https:\/\/example.org\/test/);assert.match(message,/local file missing/);assert.match(message,/module --name node-typescript/);assert.match(message,/take precedence/);
 assert.doesNotThrow(()=>resolve(root,{frozen:true}));
 const evaluation=await evaluate(root,{frozen:true,subject:'test-subject'});assert.ok(evaluation);
 const policy=read(path.join(root,'.agenthouse/organization.json'));policy.revision='r2';write(path.join(root,'.agenthouse/organization.json'),policy);
 assert.throws(()=>projectContext(root),/stale/);await assert.rejects(hook(root,{input:'event.json'}),/stale/);
});
test('legacy hook behavior and whole-stack replacement',async t=>{
 const root=setup(t);assert.equal(projectContext(root).standardDocuments,undefined);
 let message=JSON.parse((await hook(root,{input:'event.json'})).stdout).message;assert.match(message,/module --name node-typescript/);assert.doesNotMatch(message,/take precedence/);
 const covered=setup(t,[{id:'all-node',title:'Node',url:'https://example.org/node',appliesTo:{stacks:['node-typescript']},topics:['all']}]);
 message=JSON.parse((await hook(covered,{input:'event.json'})).stdout).message;assert.match(message,/Node: https/);assert.doesNotMatch(message,/module --name node-typescript/);
});
test('rejects malformed and conflicting mandatory document rules',t=>{
 const root=setup(t,docs);const policyFile=path.join(root,'.agenthouse/organization.json');const policy=read(policyFile);
 policy.rules[0].value.push(docs[0]);write(policyFile,policy);assert.throws(()=>resolve(root),/Duplicate/);
 policy.rules[0].value=[{...docs[0],path:'../escape'}];write(policyFile,policy);assert.throws(()=>resolve(root),/Unsafe/);
 policy.rules[0].value=docs;write(policyFile,policy);const configFile=path.join(root,'.agenthouse/config.json'),config=read(configFile);config.overrides={'standard-documents':[]};write(configFile,config);assert.throws(()=>resolve(root),/mandatory/);
});

test('named machine roots resolve outside the repository without changing the policy digest',async t=>{
 const doc={...docs[0],root:'guidance',path:'standards/app.md'};
 const root=setup(t,[doc]);
 const machineA=fs.mkdtempSync(path.join(os.tmpdir(),'ah-guidance-a-')),machineB=fs.mkdtempSync(path.join(os.tmpdir(),'ah-guidance-b-'));
 t.after(()=>{fs.rmSync(machineA,{recursive:true,force:true});fs.rmSync(machineB,{recursive:true,force:true});});
 const roots=path.join(root,'.agenthouse/local/standard-roots.json');
 write(path.join(machineA,'standards/app.md'),'standard A');write(path.join(machineB,'standards/app.md'),'standard B');
 const before=resolve(root,{frozen:true}).snapshot.digest;
 write(roots,{schemaVersion:1,roots:{guidance:machineA}});
 let result=projectContext(root).standardDocuments[0];assert.equal(result.reference,path.join(machineA,'standards/app.md'));assert.equal(result.localMissing,false);
 assert.match(JSON.parse((await hook(root,{input:'event.json'})).stdout).message,/Application: .*standards/);
 write(roots,{schemaVersion:1,roots:{guidance:machineB}});
 result=projectContext(root).standardDocuments[0];assert.equal(result.reference,path.join(machineB,'standards/app.md'));assert.equal(resolve(root,{frozen:true}).snapshot.digest,before);
 fs.unlinkSync(path.join(machineB,'standards/app.md'));result=projectContext(root).standardDocuments[0];assert.equal(result.reference,doc.url);assert.equal(result.localMissing,true);
 assert.match(JSON.parse((await hook(root,{input:'event.json'})).stdout).message,/local file missing/);
 write(roots,{schemaVersion:1,roots:{}});assert.equal(projectContext(root).standardDocuments[0].localMissing,true);
 const policyFile=path.join(root,'.agenthouse/organization.json'),policy=read(policyFile);policy.rules[0].value[0].path='../escape';write(policyFile,policy);assert.throws(()=>resolve(root),/Unsafe/);
 policy.rules[0].value[0].path='C:\\\\secret';write(policyFile,policy);assert.throws(()=>resolve(root),/Unsafe/);
});

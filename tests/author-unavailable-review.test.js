import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {install} from '../src/install.js';
import {read,write} from '../src/io.js';
import {resolve,AUTHOR_UNAVAILABLE_DURING_REVIEW_DECISION} from '../src/policy.js';
import {gate} from '../src/gates.js';
import {session} from '../src/update.js';

function setup(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah-author-unavailable-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  install(root,{storage:'project',agents:[]});
  return root;
}
function item(root) {
  write(path.join(root,'item.json'),{id:'item',kind:'feature',fields:{},criteria:[]});
  const config=read(path.join(root,'.agenthouse/config.json'));
  config.lifecycle={ready:{fields:[],approval:false}};
  write(path.join(root,'.agenthouse/config.json'),config);
}
function policy(root,entry) {
  write(path.join(root,'.agenthouse/policy.json'),{schemaVersion:1,id:'local',revision:'1',authorUnavailableDuringReview:entry,rules:[]});
  const config=read(path.join(root,'.agenthouse/config.json'));
  config.policySources=['.agenthouse/policy.json'];
  write(path.join(root,'.agenthouse/config.json'),config);
}

test('missing unavailable-author policy is surfaced by resolve, session, and gate',{concurrency:false},t=>{
  const root=setup(t);item(root);const snapshot=resolve(root).snapshot;
  assert.equal(snapshot.openDecisions[0].id,AUTHOR_UNAVAILABLE_DURING_REVIEW_DECISION);
  assert.equal(snapshot.openDecisions[0].recordAt,'policy.authorUnavailableDuringReview');
  assert.equal(session(root).openDecisions[0].id,AUTHOR_UNAVAILABLE_DURING_REVIEW_DECISION);
  const result=gate(root,{item:'item.json'});
  assert.equal(result.status,'incomplete','the normal empty-work-item finding remains separate from the governance notice');
  assert.equal(result.openDecisions[0].id,AUTHOR_UNAVAILABLE_DURING_REVIEW_DECISION);
});

test('recorded unavailable-author policy suppresses the notice and preserves its SOP',{concurrency:false},t=>{
  const root=setup(t);item(root);const entry={
    appliesWhen:{unreachableWorkingDays:3,declaredAbsence:true,urgencyClasses:['urgent']},
    sop:{id:'role-swap',reference:'docs/author-unavailable-during-review.md#role-swap'},
    triggeredBy:['project-owner','team-lead'],
    mrTraceability:{required:['date','previous author','new author','new reviewer','reason','authorizer']}
  };
  policy(root,entry);const snapshot=resolve(root).snapshot;
  assert.deepEqual(snapshot.authorUnavailableDuringReview,entry);
  assert.deepEqual(snapshot.openDecisions,[]);
  assert.deepEqual(session(root).openDecisions,[]);
  assert.deepEqual(gate(root,{item:'item.json'}).openDecisions,[]);
});

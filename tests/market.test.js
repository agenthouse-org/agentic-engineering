import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PACKAGE,read,write} from '../src/io.js';
import {parseFrontmatter,parseYamlSubset} from '../src/frontmatter.js';
import {checkMarket,listMarket,newMarket,marketPath} from '../src/market.js';
import {install} from '../src/install.js';
import {resolve} from '../src/policy.js';
import {evaluate} from '../src/evaluate.js';

const FIXTURE=path.join(PACKAGE,'tests/fixtures/market/example-opportunity');
const cli=path.join(PACKAGE,'bin/ah-engineering.js');
function temp(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah-market-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
function withFixture(t,base='.agenthouse/market') {
  const root=temp(t),folder=path.join(root,base,'example-opportunity');
  fs.mkdirSync(folder,{recursive:true});
  for(const name of fs.readdirSync(FIXTURE))fs.copyFileSync(path.join(FIXTURE,name),path.join(folder,name));
  return {root,folder};
}
function edit(folder,name,change){const file=path.join(folder,name);fs.writeFileSync(file,change(fs.readFileSync(file,'utf8')));}
function run(root,...args){return spawnSync(process.execPath,[cli,'market',...args,'--root',root],{encoding:'utf8'});}

test('frontmatter subset parses scalars, inline lists, lists of flat maps, and one flat map',()=>{
  const {data,body,bodyStartLine}=parseFrontmatter('---\nschemaVersion: 1\ntitle: "A: b"\nflag: true\ntags: [a, "b, c"]\nitems:\n  - id: x\n    refs: [r1, r2]\n  - id: y\n    note: it\'s fine # comment\nnames:\n- one\n- two\ndecision:\n  decidedBy: ""\n---\n# Body\n');
  assert.deepEqual(data,{schemaVersion:1,title:'A: b',flag:true,tags:['a','b, c'],items:[{id:'x',refs:['r1','r2']},{id:'y',note:'it\'s fine'}],names:['one','two'],decision:{decidedBy:''}});
  assert.equal(body,'# Body\n');
  assert.equal(bodyStartLine,17);
});

test('frontmatter subset rejects unsupported YAML with line numbers',()=>{
  const cases=[
    ['a:\n  b:\n    c: 1',/line 3: nested structures/],
    ['a: &anchor 1',/line 2: anchors and aliases/],
    ['a: *anchor',/line 2: anchors and aliases/],
    ['a: |\n  text',/line 2: multiline scalars/],
    ['a: >\n  text',/line 2: multiline scalars/],
    ['a: {b: 1}',/line 2: flow maps/],
    ['a: !tag x',/line 2: tags/],
    ['a:\n  - x\n  - k: v',/line 4: a list cannot mix/],
    ['a:\n  - k: v\n    - nested',/line 4: nested lists/],
    ['a: [x, [y]]',/line 2: nested collections/],
    ['a: 1\na: 2',/line 3: duplicate key a/],
    ['a:\n\t- x',/line 3: tabs/],
    ['a:',/line 2: expected a value/],
    ['  a: 1',/line 2: unexpected indentation/]
  ];
  for(const [source,pattern] of cases)assert.throws(()=>parseYamlSubset(source,2),pattern,source);
  assert.throws(()=>parseFrontmatter('# no frontmatter\n'),/line 1/);
});

test('market new writes templates that check as incomplete and never overwrites',t=>{
  const root=temp(t);
  const created=newMarket(root,{id:'idea',title:'An idea'});
  assert.equal(created.status,'created');
  assert.deepEqual(created.files,['opportunity.md','evidence.md','buyer-signals.md','fit-assessment.md'].map(name=>`.agenthouse/market/idea/${name}`));
  assert.equal(created.check.status,'incomplete');
  assert.equal(created.check.exitCode,4);
  assert.ok(created.check.findings.every(f=>f.status==='incomplete'));
  const file=path.join(root,'.agenthouse/market/idea/opportunity.md');
  fs.appendFileSync(file,'\nUser edit\n');
  const before=fs.readFileSync(file,'utf8');
  assert.throws(()=>newMarket(root,{id:'idea'}),/already exist.*opportunity\.md.*Nothing was written/);
  assert.equal(fs.readFileSync(file,'utf8'),before);
  const cliResult=run(root,'new','--id','idea');
  assert.notEqual(cliResult.status,0);
  assert.equal(fs.readFileSync(file,'utf8'),before);
  assert.deepEqual(listMarket(root).opportunities.map(o=>[o.id,o.recommendation,o.decision]),[['idea','pending','pending']]);
});

test('the example opportunity passes and leaves the human decision pending',t=>{
  const {root}=withFixture(t);
  const result=checkMarket(root,{id:'example-opportunity'});
  assert.equal(result.status,'passed',JSON.stringify(result.findings));
  assert.deepEqual(result.warnings,[]);
  assert.equal(result.decision.status,'pending');
  assert.match(result.decision.note,/belongs to a person/);
  assert.match(result.limitation,/does not judge market truth/);
});

test('market check exits 0 passed, 1 failed, and 4 incomplete from the CLI',t=>{
  const {root,folder}=withFixture(t);
  assert.equal(run(root,'check','--id','example-opportunity').status,0);
  assert.equal(run(root,'check','--id','not-started').status,4);
  edit(folder,'fit-assessment.md',text=>text.replace('recommendation: investigate','recommendation: go'));
  const failed=run(root,'check','--id','example-opportunity','--output','report.json');
  assert.equal(failed.status,1);
  assert.equal(read(path.join(root,'report.json')).status,'failed');
});

test('missing sections are incomplete and broken references fail',t=>{
  const {root,folder}=withFixture(t);
  edit(folder,'opportunity.md',text=>text.replace('## Problem','## Background'));
  let result=checkMarket(root,{id:'example-opportunity'});
  assert.equal(result.status,'incomplete');
  assert.ok(result.findings.some(f=>f.reason==='Missing section "## Problem"'));
  edit(folder,'opportunity.md',text=>text.replace('## Background','## Problem'));
  edit(folder,'fit-assessment.md',text=>text.replace('evidence: [ev-01]\n  - condition: stop-problem','evidence: [ev-99]\n  - condition: stop-problem'));
  edit(folder,'evidence.md',text=>text.replace('promotedFrom: sig-01','promotedFrom: sig-404'));
  result=checkMarket(root,{id:'example-opportunity'});
  assert.equal(result.status,'failed');
  assert.ok(result.findings.some(f=>/cites unknown evidence ev-99/.test(f.reason)));
  assert.ok(result.findings.some(f=>/unknown buyer signal sig-404/.test(f.reason)));
});

test('invalid recommendations and unknown segments fail',t=>{
  const {root,folder}=withFixture(t);
  edit(folder,'evidence.md',text=>text.replace('segment: seg-small-clinics','segment: seg-unknown'));
  let result=checkMarket(root,{id:'example-opportunity'});
  assert.ok(result.findings.some(f=>/unknown segment seg-unknown/.test(f.reason)));
  edit(folder,'fit-assessment.md',text=>text.replace('claimLevel: problem-exists','claimLevel: market-leader'));
  result=checkMarket(root,{id:'example-opportunity'});
  assert.equal(result.status,'failed');
  assert.ok(result.findings.some(f=>f.file==='fit-assessment.md' && /market-fit-assessment/.test(f.reason)));
});

test('proceed and product-market-fit claims need a met success condition with evidence',t=>{
  const {root,folder}=withFixture(t);
  edit(folder,'fit-assessment.md',text=>text.replace('recommendation: investigate','recommendation: proceed').replace('met: true','met: false'));
  let result=checkMarket(root,{id:'example-opportunity'});
  assert.equal(result.status,'failed');
  assert.ok(result.findings.some(f=>/proceed recommendation needs at least one met success condition/.test(f.reason)));
  edit(folder,'fit-assessment.md',text=>text.replace('recommendation: proceed','recommendation: investigate').replace('claimLevel: problem-exists','claimLevel: product-market-fit'));
  result=checkMarket(root,{id:'example-opportunity'});
  assert.ok(result.findings.some(f=>/product-market-fit claim needs/.test(f.reason)));
  edit(folder,'fit-assessment.md',text=>text.replace(/conditionResults:[\s\S]*?decision:/,'conditionResults: []\ndecision:'));
  edit(folder,'opportunity.md',text=>text.replace(/conditions:[\s\S]*?---/,'conditions: []\n---'));
  result=checkMarket(root,{id:'example-opportunity'});
  assert.ok(result.findings.some(f=>/No pre-stated conditions exist/.test(f.reason)));
});

test('late conditions and possible personal data are warnings that do not fail the check',t=>{
  const {root,folder}=withFixture(t);
  edit(folder,'opportunity.md',text=>text.replaceAll('statedAt: 2026-09-01','statedAt: 2026-09-12'));
  edit(folder,'evidence.md',text=>text.replace('## Limitations','Contact: nurse.one@example.org or +49 170 1234567\n\n## Limitations'));
  const result=checkMarket(root,{id:'example-opportunity'});
  assert.equal(result.status,'passed',JSON.stringify(result.findings));
  assert.equal(result.exitCode,0);
  assert.ok(result.warnings.some(w=>/stated on 2026-09-12, after evidence ev-01 dated 2026-09-10/.test(w.reason)));
  assert.ok(result.warnings.some(w=>w.file==='evidence.md' && /email address/.test(w.reason)));
  assert.ok(result.warnings.some(w=>w.file==='evidence.md' && /phone number/.test(w.reason)));
  assert.equal(result.warnings.filter(w=>/phone/.test(w.reason)).length,1,'calendar dates are not phone numbers');
});

test('partially recorded decisions warn and complete decisions are reported but not verified',t=>{
  const {root,folder}=withFixture(t);
  edit(folder,'fit-assessment.md',text=>text.replace('decidedBy: ""','decidedBy: "Product lead"'));
  let result=checkMarket(root,{id:'example-opportunity'});
  assert.equal(result.decision.status,'partial');
  assert.ok(result.warnings.some(w=>/partially filled/.test(w.reason)));
  edit(folder,'fit-assessment.md',text=>text.replace('date: ""','date: "2026-09-21"').replace('reference: ""','reference: "Review notes 12"'));
  result=checkMarket(root,{id:'example-opportunity'});
  assert.equal(result.decision.status,'recorded');
  assert.equal(result.status,'passed');
});

test('market.path relocates records and cannot escape the repository',t=>{
  const {root}=withFixture(t,'docs/market');
  write(path.join(root,'.agenthouse/config.json'),{schemaVersion:1,project:'demo',evaluators:[],profiles:{},market:{path:'docs/market'}});
  assert.equal(marketPath(root).relative,'docs/market');
  assert.equal(checkMarket(root,{id:'example-opportunity'}).status,'passed');
  assert.deepEqual(listMarket(root).opportunities.map(o=>o.id),['example-opportunity']);
  for(const escape of ['../outside','/tmp/market']) {
    write(path.join(root,'.agenthouse/config.json'),{schemaVersion:1,project:'demo',evaluators:[],profiles:{},market:{path:escape}});
    assert.throws(()=>listMarket(root),/Unsafe path|relative path/);
  }
  assert.throws(()=>checkMarket(root,{id:'../escape'}),/Invalid identifier/);
});

test('a market evaluator never turns a failed or missing record into a passed gate',async t=>{
  const {root,folder}=withFixture(t);
  spawnSync('git',['init',root],{windowsHide:true});
  install(root,{storage:'project',agents:[],project:'pilot',autonomy:'bounded'});
  assert.ok(!read(path.join(root,'.agenthouse/config.json')).evaluators.some(e=>e.kind==='market'),'market evaluators are never added by default');
  const configure=opportunity=>{
    const file=path.join(root,'.agenthouse/config.json'),config=read(file);
    config.evaluators=[{id:'market-fit',kind:'market',opportunity}];
    config.profiles['pull-request']={checks:[{evaluator:'market-fit',required:true}]};
    write(file,config);resolve(root);
  };
  configure('example-opportunity');
  let result=await evaluate(root,{frozen:true,subject:'build-1'});
  assert.equal(result.checks.find(c=>c.id==='market-fit').status,'passed');
  edit(folder,'fit-assessment.md',text=>text.replace('recommendation: investigate','recommendation: proceed').replace('met: true','met: false'));
  result=await evaluate(root,{frozen:true,subject:'build-1'});
  assert.equal(result.checks.find(c=>c.id==='market-fit').status,'failed');
  assert.notEqual(result.status,'satisfied');
  configure('not-started');
  result=await evaluate(root,{frozen:true,subject:'build-1'});
  assert.equal(result.checks.find(c=>c.id==='market-fit').status,'incomplete');
  assert.equal(result.exitCode,4);
  const file=path.join(root,'.agenthouse/config.json'),config=read(file);
  config.evaluators=[{id:'market-fit',kind:'market'}];write(file,config);
  assert.throws(()=>resolve(root),/Market evaluator requires opportunity/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {install as installActual} from '../src/install.js';
import {read,write,hash} from '../src/io.js';
import {visual} from '../src/visual.js';
import {gate} from '../src/gates.js';
import {checkVisualPlan,lintMermaid,lintWireframe} from '../src/visual-plan.js';
import {resolve} from '../src/policy.js';

function temp(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah-visual-plan-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
function setup(t){const root=temp(t);install(root,{agents:[],project:'example',autonomy:'bounded'});return root;}

test('mermaid lint accepts erDiagram and rejects unknown types',()=>{
  assert.equal(lintMermaid('erDiagram\n  A ||--o{ B : r\n')[0].status,'passed');
  assert.equal(lintMermaid('not a diagram')[0].status,'incomplete');
  assert.equal(lintMermaid('pizzaDiagram\n  slice')[0].status,'failed');
  assert.equal(lintMermaid('erDiagram\n')[0].status,'incomplete');
});
test('wireframe lint requires a semantic fragment',()=>{
  assert.equal(lintWireframe('<h1>Cart</h1><button>Pay</button>')[0].status,'passed');
  assert.equal(lintWireframe('<html><body>Cart</body></html>')[0].status,'failed');
  assert.equal(lintWireframe('<div>placeholder</div>')[0].status,'incomplete');
});
test('visual-plan check validates hashed surfaces and diagrams',t=>{
  const root=setup(t);
  write(path.join(root,'empty.html'),'<h1>Cart</h1><button>Checkout</button>\n');
  write(path.join(root,'orders.mmd'),'erDiagram\n  CUSTOMER ||--o{ ORDER : places\n');
  const plan={schemaVersion:1,id:'cart',fidelity:'wireframe',
    surfaces:[{id:'empty',kind:'wireframe',surface:'browser',path:'empty.html',sha256:hash(fs.readFileSync(path.join(root,'empty.html')))}],
    diagrams:[{id:'orders',kind:'erDiagram',path:'orders.mmd'}],
    decisions:[{id:'guest',question:'Allow guest checkout?',options:['Yes','No'],recommended:'Yes',status:'open'}]};
  write(path.join(root,'plan.json'),plan);
  assert.equal(checkVisualPlan(root,{plan:'plan.json'}).status,'passed');
  plan.surfaces[0].sha256='0'.repeat(64);write(path.join(root,'plan.json'),plan);
  assert.equal(checkVisualPlan(root,{plan:'plan.json'}).status,'failed');
});
test('ready gate reports a linked visual plan that fails check',t=>{
  const root=setup(t);
  const record={id:'sample',author:'author',criteria:[{id:'behavior',expectation:'Observable outcome'}],
    fields:{outcome:'o',scope:'s',acceptance:'a',verification:'v',dependencies:'d',risks:'r',visualPlan:'plan.json'}};
  write(path.join(root,'item.json'),record);
  const config=read(path.join(root,'.agenthouse/config.json'));config.lifecycle={ready:{approval:false}};write(path.join(root,'.agenthouse/config.json'),config);
  resolve(root);
  write(path.join(root,'plan.json'),{schemaVersion:1,id:'cart',fidelity:'wireframe'});
  assert.equal(gate(root,{item:'item.json'}).status,'incomplete');
  write(path.join(root,'empty.html'),'<label>Email<input/></label><button>Continue</button>\n');
  write(path.join(root,'plan.json'),{schemaVersion:1,id:'cart',fidelity:'wireframe',surfaces:[{id:'sign-in',kind:'wireframe',path:'empty.html'}]});
  assert.equal(gate(root,{item:'item.json'}).status,'passed');
});
test('wireframe acceptance contracts require hashed references',t=>{
  const root=setup(t),html='<h1>Pay</h1><button>Confirm</button>\n';
  write(path.join(root,'frame.html'),html);
  const contract={schemaVersion:1,id:'pay',source:{kind:'wireframe',reference:'frame.html',revision:'1',fidelity:'wireframe'},
    references:[{path:'frame.html',sha256:hash(Buffer.from(html))}],criteria:[{id:'concept',expectation:'Confirm is the primary action',method:'concept'}]};
  write(path.join(root,'contract.json'),contract);write(path.join(root,'actual.png'),Buffer.from([137,80,78,71]));
  const context={subject:'build',policyDigest:'policy'};
  const data={schemaVersion:1,...context,contractDigest:hash(contract),environment:{browser:'test'},
    criteria:[{id:'concept',status:'passed',reason:'Hierarchy matches the wireframe',reviewer:'reviewer',inspected:true,evidence:[{path:'actual.png',sha256:hash(fs.readFileSync(path.join(root,'actual.png')))}]}]};
  write(path.join(root,'assessment.json'),data);
  assert.equal(visual(root,{contract:'contract.json',assessment:'assessment.json'},context).status,'passed');
  delete contract.references;write(path.join(root,'contract.json'),contract);
  assert.throws(()=>visual(root,{contract:'contract.json',assessment:'assessment.json'},context),/hashed reference/);
});
test('visual-plan CLI check writes structured results',t=>{
  const root=setup(t);
  write(path.join(root,'empty.html'),'<h1>Cart</h1><button>Checkout</button>\n');
  write(path.join(root,'plan.json'),{schemaVersion:1,id:'cart',fidelity:'wireframe',surfaces:[{id:'empty',kind:'wireframe',path:'empty.html'}]});
  const result=spawnSync(process.execPath,[path.join(root,'.agenthouse/run.mjs'),'visual-plan','check','--plan','plan.json','--root',root],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.equal(JSON.parse(result.stdout).status,'passed');
});
test('shipped example visual plan checks cleanly from the package',()=>{
  const result=checkVisualPlan(process.cwd(),{plan:'templates/visual-plan/example-plan.json'});
  assert.equal(result.status,'passed',JSON.stringify(result.findings));
});

function install(root,options={}) {return installActual(root,{storage:'project',...options});}

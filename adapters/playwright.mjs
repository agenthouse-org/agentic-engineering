import fs from 'node:fs';
import path from 'node:path';
import {read,write,hash,inside,validated,assert} from '../src/io.js';

// Playwright reporter: no Playwright runtime dependency in the framework core.
export default class AcceptanceReporter {
  constructor(options={}) {this.options=options;this.results=new Map();}
  onBegin(config) {
    this.root=path.resolve(this.options.root || process.cwd());
    this.contract=validated('acceptance',read(inside(this.root,this.options.contract)));
    this.environment={platform:process.platform,node:process.version,projects:config.projects.map(p=>({name:p.name,use:{browserName:p.use.browserName,viewport:p.use.viewport,locale:p.use.locale,timezoneId:p.use.timezoneId}}))};
  }
  onTestEnd(test,result) {
    const id=test.annotations.find(a=>a.type==='agenthouse-criterion')?.description;
    if(!id)return;
    const criterion=this.contract.criteria.find(c=>c.id===id);assert(criterion,`Unknown acceptance criterion ${id}`);
    assert(criterion.method!=='concept','A browser test cannot manufacture concept-review approval');
    const evidence=result.attachments.filter(a=>a.path).map(a=>{
      const relative=path.relative(this.root,a.path).replaceAll('\\','/');
      const file=inside(this.root,relative);return {path:relative,sha256:hash(fs.readFileSync(file)),label:a.name};
    });
    const prior=this.results.get(id);
    const status=result.status==='passed' && result.retry===0 && !prior ? 'passed' : 'failed';
    this.results.set(id,{id,status,reason:status==='passed'?'Browser assertions passed':`Browser status ${result.status}; retry ${result.retry}; duplicate ${!!prior}`,
      viewport:test.annotations.find(a=>a.type==='agenthouse-viewport')?.description,
      state:test.annotations.find(a=>a.type==='agenthouse-state')?.description,evidence});
  }
  onEnd(result) {
    assert(process.env.AH_SUBJECT && process.env.AH_POLICY_DIGEST,'Playwright evaluation requires AH_SUBJECT and AH_POLICY_DIGEST');
    const assessment={schemaVersion:1,subject:process.env.AH_SUBJECT,policyDigest:process.env.AH_POLICY_DIGEST,contractDigest:hash(this.contract),environment:this.environment,
      runnerStatus:result.status,criteria:[...this.results.values()]};
    write(inside(this.root,this.options.output || 'artifacts/agenthouse/browser-assessment.json'),assessment);
  }
}

export async function capture(page,testInfo,name='actual') {
  const file=testInfo.outputPath(`${name}.png`);
  await page.screenshot({path:file,fullPage:true,animations:'disabled'});
  await testInfo.attach(name,{path:file,contentType:'image/png'});
  return file;
}

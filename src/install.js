import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {generateKeyPairSync} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {assert,read,write,create,hash,inside,walk,exclusive,PACKAGE,VERSION,canonical,validated,safeId} from './io.js';
import {resolve} from './policy.js';

export const AGENTS={claude:'CLAUDE.md',codex:'AGENTS.md',opencode:'AGENTS.md',cursor:'.cursor/rules/agenthouse.mdc',windsurf:'.windsurf/rules/agenthouse.md',openclaw:'AGENTS.md'};
const START='<!-- agenthouse:start -->',END='<!-- agenthouse:end -->';
const block=body=>`${START}\n${body.trim()}\n${END}`;
export function detect(root) {
  return Object.keys(AGENTS).filter(a=>fs.existsSync(path.join(root,'.'+(a==='claude'?'claude':a))) || fs.existsSync(path.join(os.homedir(),'.'+a)) || fs.existsSync(path.join(root,AGENTS[a])));
}
export function payload(source=PACKAGE) {
  const metadata=read(path.join(source,'package.json'));
  const files={};
  for(const name of ['bin','src','schemas','skills','modules','templates','adapters','docs']) {
    if(fs.existsSync(path.join(source,name)))for(const file of walk(path.join(source,name)))files[`${name}/${file}`]=fs.readFileSync(path.join(source,name,file)).toString('base64');
  }
  for(const file of ['package.json','README.md','LICENSE']) files[file]=fs.readFileSync(path.join(source,file)).toString('base64');
  return {schemaVersion:1,version:metadata.version,files};
}
export function verifyPayload(data) {
  assert(data.schemaVersion===1 && /^\d+\.\d+\.\d+$/.test(data.version) && data.files && typeof data.files==='object','Invalid bundle');
  assert(Object.keys(data.files).length<5000,'Bundle file limit exceeded');
  let total=0;
  for(const [name,content] of Object.entries(data.files)) {
    assert(/^(bin|src|schemas|skills|modules|templates|adapters|docs)\//.test(name) || ['package.json','README.md','LICENSE'].includes(name),`Disallowed bundle path: ${name}`);
    inside(os.tmpdir(),name);
    assert(typeof content==='string' && Buffer.from(content,'base64').toString('base64')===content,'Invalid bundle encoding');
    total+=Buffer.byteLength(content,'base64');assert(total<50*1024*1024,'Bundle size limit exceeded');
  }
  assert(data.files['bin/ah-engineering.js'] && data.files['src/cli.js'],'Bundle missing runtime');
  assert(JSON.parse(Buffer.from(data.files['package.json'],'base64')).version===data.version,'Bundle version mismatch');
  return data;
}
function journalPath(root){return inside(root,'.agenthouse/transaction.json');}
export function recover(root) {
  const file=journalPath(root);if(!fs.existsSync(file))return false;
  const journal=read(file);
  for(const entry of [...journal].reverse()) {
    const dest=inside(root,entry.path),current=fs.existsSync(dest)?fs.readFileSync(dest).toString('base64'):null;
    assert(current===entry.after || current===entry.before,`Recovery conflict: ${entry.path}`);
    if(entry.before===null) { if(fs.existsSync(dest))fs.unlinkSync(dest); }
    else write(dest,Buffer.from(entry.before,'base64'));
  }
  fs.unlinkSync(file);return true;
}
function transact(root,changes,finish) {
  assert(!fs.existsSync(journalPath(root)),'Interrupted transaction found; run recover');
  const journal=changes.map(c=>({path:c.path,before:fs.existsSync(inside(root,c.path))?fs.readFileSync(inside(root,c.path)).toString('base64'):null,after:c.content===null?null:Buffer.from(c.content).toString('base64')}));
  write(journalPath(root),journal);
  try {
    for(const c of changes) {const file=inside(root,c.path);if(c.content===null){if(fs.existsSync(file))fs.unlinkSync(file);}else write(file,c.content);}
    if(finish) {
      const extra=finish();
      for(const c of extra)journal.push({path:c.path,before:fs.existsSync(inside(root,c.path))?fs.readFileSync(inside(root,c.path)).toString('base64'):null,after:Buffer.from(c.content).toString('base64')});
      write(journalPath(root),journal);
      for(const c of extra)write(inside(root,c.path),c.content);
    }
    fs.unlinkSync(journalPath(root));
  }catch(error){recover(root);throw error;}
}
function managed(root,desired,state) {
  const changes=[],ownership={};
  for(const [relative,entry] of Object.entries(desired)) {
    const file=inside(root,relative),existing=fs.existsSync(file)?fs.readFileSync(file,'utf8'):null,prior=state.files?.[relative];
    let content=entry.content;
    if(entry.block) {
      const current=existing?.match(/<!-- agenthouse:start -->[\s\S]*?<!-- agenthouse:end -->/g) || [];
      assert(current.length<=1,`Duplicate managed block: ${relative}`);
      if(current.length) assert(prior?.block && hash(current[0])===prior.digest,`Modified/unowned managed block: ${relative}`);
      else assert(!prior,`Managed block removed: ${relative}`);
      const b=block(content);
      content=current.length?existing.replace(current[0],b):`${existing || ''}${existing?'\n\n':''}${b}\n`;
      ownership[relative]={block:true,digest:hash(b),created:prior?.created ?? existing===null};
    }else {
      if(existing!==null)assert(prior && hash(existing)===prior.digest,`Existing or modified file: ${relative}`);
      ownership[relative]={block:false,digest:hash(content)};
    }
    changes.push({path:relative,content});
  }
  return {changes,ownership};
}
export function install(root,options={}) {
  assert(!options.autonomy || ['supervised','bounded','delegated'].includes(options.autonomy),'Invalid autonomy profile');
  const project=options.project || path.basename(root).replace(/[^a-zA-Z0-9_.-]/g,'-').replace(/^[^a-zA-Z0-9]+/,'') || 'project';safeId(project);
  if(options.policy)validated('policy',read(path.resolve(options.policy)));
  fs.mkdirSync(root,{recursive:true});
  return exclusive(root,()=>{
    const stateFile=inside(root,'.agenthouse/installation.json'),state=fs.existsSync(stateFile)?read(stateFile):{files:{}};
    const data=verifyPayload(options.payload || payload());
    if(fs.existsSync(inside(root,'.agenthouse/config.json')))resolve(root,{frameworkVersion:data.version,persist:false});
    const agents=options.agents || state.agents || detect(root);
    for(const a of agents)assert(Object.hasOwn(AGENTS,a),`Unsupported agent ${a}`);
    const digest=hash(data),runtime=`.agenthouse/runtime/${data.version}-${digest.slice(0,12)}`;
    // Version directories are immutable. Their identity is verified on repeat install.
    for(const [rel,b64] of Object.entries(data.files)) {
      const file=inside(root,`${runtime}/${rel}`),bytes=Buffer.from(b64,'base64');
      if(fs.existsSync(file))assert(hash(fs.readFileSync(file))===hash(bytes),`Runtime modified: ${rel}`);
      else create(file,bytes);
    }
    const health=spawnSync(process.execPath,[inside(root,`${runtime}/bin/ah-engineering.js`),'--help'],{encoding:'utf8',timeout:10000,windowsHide:true});
    assert(health.status===0,`New runtime failed health check: ${health.stderr || health.error?.message}`);
    const guidance='## agenthouse engineering\nAt task start run `node .agenthouse/run.mjs session` and read `.agenthouse/resolved.json` plus `.agenthouse/lifecycle.md`. Use the lifecycle record and its acceptance criteria; never invent approval or evidence. For UI changes use frontend acceptance and inspect real screenshots. Use `node .agenthouse/run.mjs evaluate --profile pull-request --frozen` for the configured checks. These instructions are advisory; CI and signed decisions supply boundary controls.';
    const desired={
      '.agenthouse/run.mjs':{content:`import fs from 'node:fs';\nimport {fileURLToPath} from 'node:url';\nconst active=JSON.parse(fs.readFileSync(new URL('./active.json',import.meta.url),'utf8'));\nconst target=new URL('./'+active.runtime+'/bin/ah-engineering.js',import.meta.url);\nawait import(target.href);\n`},
      '.agenthouse/lifecycle.md':{content:Buffer.from(data.files['docs/lifecycle.md'],'base64').toString('utf8')},
      'AGENTS.md':{block:true,content:guidance},
      '.gitignore':{block:true,content:'.agenthouse/local/\n.agenthouse/runtime/\n.agenthouse/transaction.json\n.agenthouse/mutation.lock\n.agenthouse/sessions/\nartifacts/agenthouse/'}
    };
    for(const a of agents)if(AGENTS[a]!=='AGENTS.md')desired[AGENTS[a]]={block:!AGENTS[a].endsWith('.mdc') && a!=='windsurf',content:a==='cursor'?`---\ndescription: agenthouse engineering lifecycle\nalwaysApply: true\n---\n${guidance}\n`:a==='windsurf'?`---\ntrigger: always_on\n---\n${guidance}\n`:guidance};
    for(const [file,b64] of Object.entries(data.files))if(file.startsWith('skills/'))desired[`.agents/${file}`]={content:Buffer.from(b64,'base64').toString('utf8')};
    // Keep previously selected adapters on upgrade rather than orphaning their owned files.
    for(const old of Object.keys(state.files))assert(desired[old],`Cannot drop installed adapter implicitly: ${old}; uninstall first`);
    const {changes,ownership}=managed(root,desired,state);
    const active={runtime:runtime.replace('.agenthouse/',''),version:data.version,digest};
    if(state.digest!==digest && fs.existsSync(inside(root,'.agenthouse/active.json')))changes.push({path:'.agenthouse/previous.json',content:JSON.stringify({state,active:read(inside(root,'.agenthouse/active.json'))})});
    changes.push({path:'.agenthouse/active.json',content:JSON.stringify(active)}, {path:'.agenthouse/installation.json',content:JSON.stringify({version:data.version,agents,files:ownership,digest})});
    if(!fs.existsSync(inside(root,'.agenthouse/config.json'))) {
      const policySources=[];
      function initial(relative,value) {
        assert(!fs.existsSync(inside(root,relative)),`Existing initial configuration: ${relative}`);
        changes.push({path:relative,content:typeof value==='string'?value:JSON.stringify(value,null,2)+'\n'});
      }
      if(options.policy) {
        const policy=read(path.resolve(options.policy));initial('.agenthouse/organization.json',policy);policySources.push('.agenthouse/organization.json');
      }else {
        const {privateKey,publicKey}=generateKeyPairSync('ed25519');
        initial('.agenthouse/local/owner.key',privateKey.export({type:'pkcs8',format:'pem'}));
        initial('.agenthouse/policy.json',{schemaVersion:1,id:'project-policy',revision:'1',owner:'project-owner',authorities:{'project-owner':publicKey.export({type:'spki',format:'pem'})},rules:[]});
        policySources.push('.agenthouse/policy.json');
      }
      initial('.agenthouse/config.json',{schemaVersion:1,project,...(options.policy?{}:{autonomy:options.autonomy || 'supervised',documentationAuthority:'git'}),policySources,
        evaluators:[{id:'readiness',kind:'work-item',file:'.agenthouse/work/first-change.json',stage:'plan'}],profiles:{'pull-request':{checks:[{evaluator:'readiness',required:true}]}}});
    }
    transact(root,changes,()=>[{path:'.agenthouse/resolved.json',content:JSON.stringify(resolve(root,{frameworkVersion:data.version,persist:false}).snapshot,null,2)+'\n'}]);
    return {version:data.version,agents,root,advisoryAdapters:true};
  });
}
export function uninstall(root) {
  return exclusive(root,()=>{
    const file=inside(root,'.agenthouse/installation.json'),state=read(file),changes=[];
    for(const [rel,entry] of Object.entries(state.files)) {
      const dest=inside(root,rel);assert(fs.existsSync(dest),`Missing managed file: ${rel}`);
      const current=fs.readFileSync(dest,'utf8');
      if(entry.block) {
        const found=current.match(/<!-- agenthouse:start -->[\s\S]*?<!-- agenthouse:end -->/g);
        assert(found?.length===1 && hash(found[0])===entry.digest,`Modified managed block: ${rel}`);
        const remaining=current.replace(found[0],'');
        changes.push({path:rel,content:entry.created && !remaining.trim()?null:remaining});
      }else {assert(hash(current)===entry.digest,`Modified managed file: ${rel}`);changes.push({path:rel,content:null});}
    }
    changes.push({path:'.agenthouse/installation.json',content:null},{path:'.agenthouse/active.json',content:null});
    transact(root,changes);return {removed:true,preserved:'configuration, policies, keys, evidence, work records and cached runtime'};
  });
}

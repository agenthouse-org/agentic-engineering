import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {assert,inside,hash,read} from './io.js';
import {resolve} from './policy.js';

export const TEST_LAYERS=['unit','component','integration','functional-api','end-to-end','regression','contract'];
const TEST_FILE=/(^|\/)(tests?|spec|__tests__|e2e|cypress|playwright)\/|\.(test|spec)\.|Test\.php$/i;
const BUILTIN_LAYER_PATTERNS=[
  ['contract',/(^|[\/:_.-])(contract|pact|schema)([\/:_.-]|$)/i],
  ['end-to-end',/(^|[\/:_.-])(e2e|end[-_. ]?to[-_. ]?end|playwright|cypress)([\/:_.-]|$)/i],
  ['functional-api',/(^|[\/:_.-])(functional|feature|api|http|route)([\/:_.-]|$)/i],
  ['component',/(^|[\/:_.-])component([\/:_.-]|$)/i],
  ['integration',/(^|[\/:_.-])integration([\/:_.-]|$)/i],
  ['regression',/(^|[\/:_.-])(regression|snapshot|golden)([\/:_.-]|$)/i],
  ['unit',/(^|[\/:_.-])unit([\/:_.-]|$)/i]
];

export function git(root,args,{optional=false,binary=false}={}) {
  const r=spawnSync('git',args,{cwd:root,encoding:binary?undefined:'utf8',windowsHide:true,timeout:15000,maxBuffer:8*1024*1024,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});
  if(optional && r.status!==0)return null;
  assert(r.status===0,`Git inspection failed: ${r.error?.message || r.stderr || args[0]}`);
  return binary?r.stdout:r.stdout.trim();
}
function json(root,file,issues) {
  const p=inside(root,file);if(!fs.existsSync(p))return null;
  try{return read(p);}catch(e){issues.push({file,reason:e.message});return null;}
}
function testingPreferences(root,issues) {
  const config=json(root,'.agenthouse/config.json',issues);
  const testing=config?.testing || {};
  const selected=testing.layers || TEST_LAYERS;
  return {layers:selected,aliases:testing.aliases || {}};
}
function classifyLayer(value,aliases={}) {
  const normalized=value.replaceAll('\\','/');
  for(const [alias,layer] of Object.entries(aliases))if(new RegExp(`(^|[\\/:_.-])${alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([\\/:_.-]|$)`,'i').test(normalized))return layer;
  for(const [layer,pattern] of BUILTIN_LAYER_PATTERNS)if(pattern.test(normalized))return layer;
  return null;
}
export const classifyTestLayer=(value,aliases={})=>classifyLayer(value,aliases);
function nominalSignals(root,file) {
  const full=inside(root,file);
  if(!fs.existsSync(full) || fs.statSync(full).size>1024*1024)return [];
  let text;
  try{text=fs.readFileSync(full,'utf8');}catch{return [];}
  const meaningful=text.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*(?:\/\/|#).*$/gm,'').trim();
  const signals=[];
  if(!meaningful)signals.push('empty-or-comments-only');
  if(/\b(?:describe|it|test)\.skip\s*\(|markTestSkipped\s*\(|@skip\b/i.test(text) && !/\b(?:describe|it|test)\s*\(/.test(text.replace(/\b(?:describe|it|test)\.skip\s*\(/g,'')))signals.push('skipped-only');
  const hasAssertion=/\b(?:assert(?:\.|\s*\()|expect\s*\(|should\b|assert[A-Z]\w*\s*\(|self::assert|\$this->assert)/.test(text);
  const looksLikeTest=/\b(?:describe|it|test)\s*\(|function\s+test\w*\s*\(|#\[Test\]/.test(text);
  if(looksLikeTest && !hasAssertion)signals.push('no-apparent-assertion');
  if(/(?:process\.exit\s*\(\s*0\s*\)|exit\s*\(\s*0\s*\)|console\.log\s*\(\s*['"](?:ok|pass|passed|success)['"]\s*\))/i.test(text) && !hasAssertion)signals.push('unconditional-success-signal');
  return [...new Set(signals)];
}
export function testLayerAnalysis(root,{files,tools,issues=[]}={}) {
  const tracked=files || [];
  const preferences=testingPreferences(root,issues),selected=[...new Set(preferences.layers)];
  const evidence=Object.fromEntries(selected.map(layer=>[layer,[]])),unclassified=[];
  const testFiles=tracked.filter(file=>TEST_FILE.test(file));
  for(const file of testFiles) {
    const layer=classifyLayer(file,preferences.aliases) || 'unit';
    const item={kind:'file',path:file,nominalSignals:nominalSignals(root,file)};
    if(evidence[layer])evidence[layer].push(item);else unclassified.push({...item,suggestedLayer:layer});
  }
  for(const tool of tools || []) {
    if(!/(^|:|-|_)(test|spec|e2e|contract|integration|unit|regression|functional|component)(:|-|_|$)/i.test(tool.name) && !/\b(?:jest|vitest|mocha|phpunit|playwright|cypress|pest|ava|tap|node\s+--test)\b/i.test(tool.command))continue;
    const layer=classifyLayer(`${tool.name}/${tool.command}`,preferences.aliases);
    const item={kind:'script',manager:tool.manager,name:tool.name,command:tool.command};
    if(layer && evidence[layer])evidence[layer].push(item);else unclassified.push(item);
  }
  for(const file of tracked.filter(value=>/(^|\/)(?:phpunit\.xml(?:\.dist)?|jest\.config\.|vitest\.config\.|playwright\.config\.|cypress\.config\.|pact[^/]*\.(?:json|[cm]?[jt]s))/.test(value))) {
    const layer=classifyLayer(file,preferences.aliases) || (/phpunit|jest|vitest/i.test(file)?'unit':null),item={kind:'config',path:file};
    if(layer && evidence[layer])evidence[layer].push(item);else unclassified.push(item);
  }
  for(const file of tracked.filter(value=>value==='.gitlab-ci.yml'||value.startsWith('.github/workflows/'))) {
    const full=inside(root,file);if(!fs.existsSync(full) || fs.statSync(full).size>1024*1024)continue;
    const text=fs.readFileSync(full,'utf8');if(!/\b(test|spec|e2e|playwright|cypress|phpunit|pact)\b/i.test(text))continue;
    const layer=classifyLayer(text,preferences.aliases),item={kind:'pipeline',path:file};
    if(layer && evidence[layer])evidence[layer].push(item);else unclassified.push(item);
  }
  const layers=selected.map(layer=>{
    const items=evidence[layer],signals=items.flatMap(item=>(item.nominalSignals || []).map(signal=>({path:item.path,signal})));
    const fileItems=items.filter(item=>item.kind==='file');
    let status=items.length?'present':'absent';
    if(fileItems.length && fileItems.every(item=>item.nominalSignals?.length))status='suspected-nominal';
    else if(!fileItems.length && items.length)status='ambiguous';
    return {layer,status,evidence:items,signals,reason:status==='absent'?'No matching committed file, script, configuration, or pipeline signal was found':status==='suspected-nominal'?'Every matching test file has a conservative nominal signal; inspect before drawing conclusions':status==='ambiguous'?'A script signal exists without matching committed test files':'Repository evidence exists; execution and behavioral value were not assessed'};
  });
  return {vocabulary:TEST_LAYERS,selectedLayers:selected,aliases:preferences.aliases,layers,unclassified,
    limitations:['Static repository signals do not prove that tests execute, assert meaningful behavior, or cover risk.','Suspected nominal coverage is a review prompt, not a failed test or governance decision.','No discovered command was executed.']};
}
export function survey(root) {
  const problems=[],pkg=json(root,'package.json',problems),composer=json(root,'composer.json',problems);
  const tracked=git(root,['ls-files','-z'],{optional:true}),files=tracked===null?[]:tracked.split('\0').filter(Boolean);
  const exists=f=>fs.existsSync(inside(root,f));
  const tools=[];
  for(const [manager,data] of [['npm',pkg],['composer',composer]])for(const [name,command] of Object.entries(data?.scripts || {}))tools.push({manager,name,command});
  const deps={...pkg?.dependencies,...pkg?.devDependencies};
  const testLayers=testLayerAnalysis(root,{files,tools,issues:problems});
  return {schemaVersion:1,root,git:tracked!==null,head:git(root,['rev-parse','--verify','HEAD'],{optional:true}),branch:git(root,['branch','--show-current'],{optional:true}),
    defaultBranch:git(root,['symbolic-ref','--short','refs/remotes/origin/HEAD'],{optional:true}),
    dirty:git(root,['status','--porcelain=v1'],{optional:true}),trackedFiles:files.length,
    stacks:[...(pkg?['node']:[]),...(deps.typescript?['typescript']:[]),...(composer?['php']:[]),...(composer?.require?.['laravel/framework']?['laravel']:[])],
    tools,configs:['phpunit.xml','phpunit.xml.dist','phpstan.neon','phpstan.neon.dist','pint.json','eslint.config.js','eslint.config.mjs','playwright.config.ts','playwright.config.js','playwright.config.mjs'].filter(exists),
    agents:['AGENTS.md','CLAUDE.md','.claude/settings.json','.claude/settings.local.json','.cursor/rules','.opencode','.windsurf'].filter(exists),
    pipelines:files.filter(f=>f==='.gitlab-ci.yml'||f.startsWith('.github/workflows/')),
    workSources:['.agenthouse/work','backlog'].filter(exists),testLayers,problems};
}
function revision(root,ref) {assert(typeof ref==='string' && ref && !ref.startsWith('-'),'Invalid Git revision');return git(root,['rev-parse','--verify','--end-of-options',`${ref}^{commit}`]);}
export function inspectChange(root,{ref='HEAD',base}={}) {
  let head,from;
  if(ref.includes('..')){assert(!base && !ref.includes('...'),'Use BASE..HEAD or --base, not both');const parts=ref.split('..');assert(parts.length===2 && parts.every(Boolean),'Invalid change range');from=revision(root,parts[0]);head=revision(root,parts[1]);}
  else {head=revision(root,ref);if(base)from=git(root,['merge-base',revision(root,base),head]);else {const parents=git(root,['rev-list','--parents','-n','1',head]).split(' ');from=parents[1] || null;}}
  const diffArgs=from?['diff','--no-ext-diff','--no-textconv',from,head]:['diff-tree','--root','--no-commit-id','-r',head];
  const changed=git(root,[...diffArgs,'--name-status','-z','--no-renames']).split('\0').filter(Boolean),files=[];
  for(let i=0;i<changed.length;i+=2)files.push({status:changed[i],path:changed[i+1]});
  const patch=git(root,[...diffArgs,'--unified=0','--no-color','--no-renames']);
  const findings=[];let file='',line=0;
  for(const text of patch.split('\n')) {
    if(text.startsWith('+++ b/'))file=text.slice(6);
    const h=text.match(/^@@ .* \+(\d+)/);if(h){line=Number(h[1]);continue;}
    if(text.startsWith('+')&&!text.startsWith('+++')) {
      const body=text.slice(1);
      if(/eslint-disable|@ts-ignore|@ts-expect-error|phpstan-ignore|\.skip\(|markTestSkipped|--no-verify/.test(body))findings.push({kind:'suppression',file,line,reason:'Added suppression or bypass requires review'});
      if(/\b(TODO|FIXME|XXX)\b|console\.log\(|var_dump\(|\bdd\(/.test(body))findings.push({kind:'residue',file,line,reason:'Added diagnostic or unfinished-work marker requires review'});
      line++;
    }else if(text.startsWith(' '))line++;
  }
  const tree=git(root,['ls-tree','-r','--name-only','-z',head]).split('\0').filter(Boolean);
  const tests=tree.filter(f=>TEST_FILE.test(f));
  const sources=files.filter(f=>!tests.includes(f.path)&&/\.(php|[cm]?[jt]sx?|vue|css|scss)$/.test(f.path));
  const candidates=sources.map(f=>({source:f.path,tests:tests.filter(t=>path.basename(t).toLowerCase().includes(path.basename(f.path,path.extname(f.path)).toLowerCase())).slice(0,30)}));
  return {schemaVersion:1,head,base:from,comparison:from?'commits':'root-commit',files,findings,candidateTests:candidates,
    classification:sources.length?'behavior':tests.length&&files.every(f=>tests.includes(f.path))?'tests-only':'non-code',
    frontend:files.some(f=>/\.(jsx|tsx|vue|css|scss|html)$|(^|\/)(views|components)\//.test(f.path)),
    limitations:['Candidate tests are filename heuristics, not coverage proof.','This report inspects committed revisions; working-tree changes are reported separately.'],
    survey:survey(root)};
}
export function evidenceReview(root,{ref='HEAD',base,item,evidence=[],baseline}={}) {
  const change=inspectChange(root,{ref,base}),records=[],{snapshot}=resolve(root,{frozen:true});
  for(const file of evidence) {
    const bytes=fs.readFileSync(inside(root,file)),data=JSON.parse(bytes);
    records.push({file,sha256:hash(bytes),subject:data.subject,status:data.status,exitCode:data.exitCode,stale:data.subject!==change.head || data.policyDigest!==snapshot.digest,checks:data.checks || []});
  }
  const work=item?read(inside(root,item)):null;
  const criteria=work?.criteria || [];
  const coverage=criteria.map(c=>({id:c.id,expectation:c.expectation,checks:records.filter(r=>!r.stale).flatMap(r=>r.checks.filter(x=>x.id===c.id || x.criteria?.includes(c.id)))}));
  let baselineComparison=null;
  if(baseline) {
    const prior=read(inside(root,baseline));
    assert(prior.subject===change.base && prior.policyDigest===snapshot.digest,'Baseline evidence must match the comparison base and current policy');
    baselineComparison=records.flatMap(r=>r.checks.map(check=>{
      const previous=prior.checks?.find(c=>c.id===check.id);
      return {id:check.id,before:previous?.status || 'unmeasured',after:check.status,classification:!previous?'new-check':previous.status===check.status?'unchanged':check.status==='passed'?'improved':'changed'};
    }));
  }
  return {...change,workItem:work?{id:work.id,source:item}:null,evidence:records,coverage,baselineComparison,
    status:!work || !criteria.length || !records.length || records.some(r=>r.stale)||coverage.some(c=>!c.checks.length)?'incomplete':records.every(r=>r.status==='satisfied' && r.exitCode===0)&&coverage.every(c=>c.checks.every(x=>x.status==='passed'))?'passed':'failed',
    reviewRequired:true,meaning:'Evidence completeness and technical outcomes only; not review approval'};
}

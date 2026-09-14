import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {assert,inside,hash,read} from './io.js';
import {resolve} from './policy.js';

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
export function survey(root) {
  const problems=[],pkg=json(root,'package.json',problems),composer=json(root,'composer.json',problems);
  const tracked=git(root,['ls-files','-z'],{optional:true}),files=tracked===null?[]:tracked.split('\0').filter(Boolean);
  const exists=f=>fs.existsSync(inside(root,f));
  const tools=[];
  for(const [manager,data] of [['npm',pkg],['composer',composer]])for(const [name,command] of Object.entries(data?.scripts || {}))tools.push({manager,name,command});
  const deps={...pkg?.dependencies,...pkg?.devDependencies};
  return {schemaVersion:1,root,git:tracked!==null,head:git(root,['rev-parse','--verify','HEAD'],{optional:true}),branch:git(root,['branch','--show-current'],{optional:true}),
    defaultBranch:git(root,['symbolic-ref','--short','refs/remotes/origin/HEAD'],{optional:true}),
    dirty:git(root,['status','--porcelain=v1'],{optional:true}),trackedFiles:files.length,
    stacks:[...(pkg?['node']:[]),...(deps.typescript?['typescript']:[]),...(composer?['php']:[]),...(composer?.require?.['laravel/framework']?['laravel']:[])],
    tools,configs:['phpunit.xml','phpunit.xml.dist','phpstan.neon','phpstan.neon.dist','pint.json','eslint.config.js','eslint.config.mjs','playwright.config.ts','playwright.config.js','playwright.config.mjs'].filter(exists),
    agents:['AGENTS.md','CLAUDE.md','.claude/settings.json','.claude/settings.local.json','.cursor/rules','.opencode','.windsurf'].filter(exists),
    pipelines:files.filter(f=>f==='.gitlab-ci.yml'||f.startsWith('.github/workflows/')),
    workSources:['.agenthouse/work','backlog'].filter(exists),problems};
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
  const tests=tree.filter(f=>/(^|\/)(tests?|spec|__tests__|e2e)\/|\.(test|spec)\.|Test\.php$/.test(f));
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

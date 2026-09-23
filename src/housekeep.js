import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {assert,inside,read} from './io.js';

export const CANONICAL_CAPTURE='.agenthouse/evidence';
export const IGNORED_PATHS=['.agenthouse/local/','.agenthouse/runtime/','.agenthouse/transaction.json','.agenthouse/mutation.lock','.agenthouse/sessions/','.agenthouse/evidence/','.agenthouse/browser-assessment.json','artifacts/agenthouse/'];
export const SCRATCH_PATHS=[CANONICAL_CAPTURE,'.agenthouse/browser-assessment.json'];
export const BROWSER_EPHEMERA=SCRATCH_PATHS;
export const DUMP_ROOTS=[];
const posix=value=>value.replaceAll('\\','/');
const under=(file,dir)=>file===dir || file.startsWith(dir+'/');
function git(root,args,input) {
  const result=spawnSync('git',['--literal-pathspecs','-C',root,...args],{input,encoding:'utf8',windowsHide:true,timeout:15000,maxBuffer:32*1024*1024});
  assert(!result.error && result.status===0,'Git artifact inspection failed: '+(result.error?.message || result.stderr));
  return result.stdout;
}
function ignoredPaths(root,probes) {
  if(!probes.length)return new Set();
  const result=spawnSync('git',['-C',root,'check-ignore','--no-index','--stdin','-z'],{input:probes.join('\0')+'\0',encoding:'utf8',windowsHide:true,timeout:15000,maxBuffer:32*1024*1024});
  assert(!result.error && [0,1].includes(result.status),'Git ignore inspection failed');
  return new Set(result.stdout.split('\0').filter(Boolean).map(posix));
}
function paths(values,root) {
  assert(Array.isArray(values),'Artifact paths must be an array');
  return [...new Set(values.map(value=>{
    assert(typeof value==='string' && !/[!*?\[\]\r\n\0]/.test(value),'Artifact paths must be literal relative paths');
    const rel=posix(value).replace(/\/$/,'');inside(root,rel);
    assert(!rel.split('/').some(part=>!part || part==='.' || part==='.git'),'Invalid artifact path');
    assert(!['.agenthouse','.agents','.claude','.cursor','.windsurf','.opencode'].includes(rel),'Artifact path is too broad');
    assert(!rel.startsWith('.agenthouse/') || under(rel,'.agenthouse/local/reports') || under(rel,'.agenthouse/local/scratch') || under(rel,CANONICAL_CAPTURE) || rel==='.agenthouse/browser-assessment.json','Artifact path overlaps framework state');
    return rel;
  }))];
}
export function artifactPolicy(root) {
  const file=root && inside(root,'.agenthouse/config.json');
  const configured=file && fs.existsSync(file)?read(file).artifacts || {}:{};
  const state=root && inside(root,'.agenthouse/installation.json');
  const privateMode=state && fs.existsSync(state) && read(state).integration==='private';
  const outputs=paths([CANONICAL_CAPTURE,'.agenthouse/local/reports','.agenthouse/browser-assessment.json',...(!privateMode?['artifacts/agenthouse']:[]),...(configured.outputs || [])],root || process.cwd());
  const baselines=paths(configured.baselines || [],root || process.cwd()),cleanup=paths(configured.cleanup || [],root || process.cwd());
  for(const baseline of baselines)assert(!outputs.some(output=>under(baseline,output) || under(output,baseline)),'Baseline overlaps generated output: '+baseline);
  for(const dir of cleanup)assert(outputs.some(output=>under(dir,output)),'Cleanup path must be explicitly classified as generated output');
  return {outputs,baselines,cleanup};
}
const escapeIgnore=value=>value.replace(/[\[\]!*?\\ #]/g,char=>'\\'+char);
export const gitignoreBody=(root,extra=[])=>[...new Set([...IGNORED_PATHS.map(p=>'/'+p),...[...artifactPolicy(root).outputs,...paths(extra,root || process.cwd())].map(p=>'/'+escapeIgnore(p)+(p.endsWith('.json')?'':'/'))])].join('\n');
export function keepFrontendEphemera(env=process.env) {return Boolean(env.CI || env.AH_KEEP_BROWSER_ARTIFACTS);}
export function artifactSurvey(root) {
  // Candidates are prompts for classification, never permission to ignore or delete.
  const candidates=['test-results','playwright-report','coverage','tests/output','tests/screenshots','tests/evidence','tests/captures'].filter(rel=>fs.existsSync(inside(root,rel)));
  return {candidates,action:'Classify generated output in artifacts.outputs and intentional fixtures/baselines in artifacts.baselines. No candidate is ignored or deleted automatically.'};
}
export function housekeep(root,{check=false,clean=false,env=process.env}={}) {
  assert(fs.existsSync(inside(root,'.agenthouse/installation.json')),'Enroll this repository first');
  const policy=artifactPolicy(root),removed=[],missing=[],tracked=[],errors=[],ignoredBaselines=[];
  try {
    git(root,['rev-parse','--is-inside-work-tree']);
    const indexed=git(root,['ls-files','-z','--',...policy.outputs]).split('\0').filter(Boolean).map(posix);
    tracked.push(...indexed.filter(file=>policy.outputs.some(dir=>under(file,dir))));
    const untracked=git(root,['ls-files','--others','-z','--',...policy.outputs,...policy.baselines]).split('\0').filter(Boolean).map(posix);
    const probes=[...policy.outputs.map(dir=>dir.endsWith('.json')?dir:dir+'/.agenthouse-ignore-probe'),...untracked.filter(file=>policy.outputs.some(dir=>under(file,dir)))];
    const ignored=ignoredPaths(root,probes);
    missing.push(...probes.filter(probe=>!ignored.has(probe)));
    const baselineProbes=[...policy.baselines.map(dir=>dir+'/.agenthouse-baseline-probe.png'),...untracked.filter(file=>policy.baselines.some(dir=>under(file,dir)))];
    ignoredBaselines.push(...ignoredPaths(root,baselineProbes));
    if(clean && !check && !keepFrontendEphemera(env))for(const rel of policy.cleanup) {
      if(indexed.some(file=>under(file,rel)))continue;
      const target=inside(root,rel);
      if(fs.existsSync(target)){fs.rmSync(target,{recursive:true,force:true});removed.push(rel);}
    }
  }catch(error){errors.push(error.message);}
  const status=errors.length?'error':tracked.length?'failed':missing.length || ignoredBaselines.length?'incomplete':'passed';
  return {schemaVersion:1,ruleId:'AH-ARTIFACT-001',status,check,kept:keepFrontendEphemera(env),canonical:CANONICAL_CAPTURE,
    missingIgnore:[...new Set(missing)],ignoredBaselines,tracked,errors,removed,addedIgnore:[],dumps:[],stray:[],notes:[],scratch:policy.cleanup,ignore:policy.outputs,
    reason:errors.length?errors.join('; '):tracked.length?'Generated output is staged or tracked; remove it from the index explicitly.':missing.length?'Generated output is not effectively ignored; review this repository’s ignore configuration.':ignoredBaselines.length?'Configured source baselines are ignored; review this repository’s ignore configuration.':'Generated output is excluded from Git; evidence is retained unless explicit cleanup was requested.',
    exitCode:{passed:0,failed:1,error:2,incomplete:4}[status]};
}
export function assertOutput(root,output) {
  const relative=posix(path.relative(root,path.resolve(root,output)));
  assert(relative && !relative.startsWith('../') && !path.isAbsolute(relative),'Use a configured repository-relative artifact output');
  const policy=artifactPolicy(root);
  assert(policy.outputs.some(dir=>under(relative,dir)),'Output is not classified as generated artifacts: '+relative);
  inside(root,relative);
  const result=housekeep(root,{check:true});
  assert(result.status==='passed',result.reason);
  return path.resolve(root,output);
}
export function removeLocalFrontendEphemera() {
  // Automatic session/evaluation cleanup must never infer ownership from filenames.
  return false;
}

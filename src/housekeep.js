import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {assert,inside,write} from './io.js';

export const CANONICAL_CAPTURE='.agenthouse/evidence';
export const DUMP_ROOTS=['tests/output','tests/evidence','tests/screenshots','tests/captures','test-results','playwright-report'];
export const IGNORED_PATHS=['.agenthouse/local/','.agenthouse/runtime/','.agenthouse/transaction.json','.agenthouse/mutation.lock','.agenthouse/sessions/','.agenthouse/evidence/','.agenthouse/browser-assessment.json','artifacts/agenthouse/','tests/output/','tests/evidence/','tests/screenshots/','tests/captures/','test-results/','playwright-report/','/tmp/','/tmp-*'];
export const gitignoreBody=()=>IGNORED_PATHS.join('\n');
export const SCRATCH_PATHS=[CANONICAL_CAPTURE,'.agenthouse/browser-assessment.json','work/browser-results','work/browser-baselines','work/browser-assessment.json','artifacts/agenthouse/playwright',...DUMP_ROOTS];
export const BROWSER_EPHEMERA=SCRATCH_PATHS;
const IMAGE=/\.(png|jpe?g|webp|gif)$/i;
const DUMP_SEGMENT=/^(output|evidence|screenshots|captures|shots)$/i;
const VIEWPORT=/-(?:light|dark|1440|1280|1024|768|390|375|360|320)(?:[-.]|$)/i;
const KEEP=/^artifacts\/agenthouse(?:\/|$)/;
const ROOT_SCRATCH=/^tmp([-_].+)?$/;

export function keepFrontendEphemera(env=process.env) {
  return Boolean(env.CI || env.AH_KEEP_BROWSER_ARTIFACTS);
}

function posix(rel){return rel.replaceAll('\\','/');}
function dirOf(rel){const i=rel.lastIndexOf('/');return i<=0?'.':rel.slice(0,i);}
function ignoreLines(content) {
  return new Set(content.split(/\r?\n/).map(line=>line.trim()).filter(line=>line && !line.startsWith('#') && !line.startsWith('<!--')));
}
function covered(lines,rule) {
  const trimmed=rule.replace(/\/$/,'');
  return [rule,'/'+rule,trimmed,'/'+trimmed].some(variant=>lines.has(variant));
}
function missingIgnore(root) {
  const file=inside(root,'.gitignore');
  const existing=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
  return {file,existing,missing:IGNORED_PATHS.filter(rule=>!covered(ignoreLines(existing),rule))};
}
function gitLines(root,args) {
  const r=spawnSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,timeout:15000});
  if(r.status!==0)return [];
  return r.stdout.split('\0').filter(Boolean).map(posix);
}
function gitRepo(root) {
  return spawnSync('git',['-C',root,'rev-parse','--is-inside-work-tree'],{encoding:'utf8',windowsHide:true,timeout:15000}).status===0;
}
function trackedFiles(root,paths=SCRATCH_PATHS) {
  if(!gitRepo(root))return [];
  return gitLines(root,['ls-files','-z','--',...paths]);
}
function untrackedFiles(root) {
  if(!gitRepo(root))return [];
  return gitLines(root,['ls-files','-o','-z','--exclude-standard']);
}
function trackedUnder(tracked,rel) {
  const file=posix(rel).replace(/\/$/,'');
  return tracked.filter(entry=>entry===file || entry.startsWith(file+'/'));
}
function knownDump(dir) {
  if(DUMP_ROOTS.some(root=>dir===root || dir.startsWith(root+'/')))return true;
  const parts=dir.split('/');
  return parts[0]==='tests' && parts.slice(1).some(part=>DUMP_SEGMENT.test(part));
}
function discoveredGalleries(root,untracked) {
  const images=untracked.filter(file=>IMAGE.test(file) && !KEEP.test(file));
  const groups=new Map();
  for(const file of images) {
    const dir=dirOf(file);
    if(dir==='.')continue;
    if(!groups.has(dir))groups.set(dir,[]);
    groups.get(dir).push(file);
  }
  const dirs=[];
  for(const [dir,files] of groups) {
    if(trackedFiles(root,[dir]).length)continue;
    const children=untracked.filter(file=>file===dir || file.startsWith(dir+'/'));
    if(!children.length || children.some(file=>!IMAGE.test(file)))continue;
    const viewport=files.filter(file=>VIEWPORT.test(file)).length>=2 && files.length>=3;
    if(knownDump(dir) || viewport)dirs.push(dir);
  }
  return dirs;
}
function isRootScratch(rel) {
  const file=posix(rel);
  return !file.includes('/') && ROOT_SCRATCH.test(file);
}
function discoveredRootScratch(root) {
  let names=[];
  try {names=fs.readdirSync(root);}catch {return [];}
  return names.filter(name=>{
    if(!isRootScratch(name))return false;
    if(trackedFiles(root,[name]).length)return false;
    return fs.existsSync(inside(root,name));
  });
}
function scratchTargets(root) {
  return [...new Set([...SCRATCH_PATHS,...discoveredGalleries(root,untrackedFiles(root)),...discoveredRootScratch(root)])];
}
function removeScratch(root,tracked,env) {
  const skipBrowser=keepFrontendEphemera(env);
  const removed=[];
  for(const rel of scratchTargets(root)) {
    if(trackedUnder(tracked,rel).length)continue;
    if(skipBrowser && !isRootScratch(rel))continue;
    const target=inside(root,rel);
    if(!fs.existsSync(target))continue;
    fs.rmSync(target,{recursive:true,force:true});
    removed.push(rel);
  }
  return removed;
}

export function removeLocalFrontendEphemera(root,env=process.env) {
  if(keepFrontendEphemera(env))return false;
  removeScratch(root,trackedFiles(root),env);
  return true;
}

export function housekeep(root,{check=false,env=process.env}={}) {
  assert(fs.existsSync(inside(root,'.agenthouse/installation.json')),'Enroll this repository first');
  const ignore=missingIgnore(root);
  const tracked=trackedFiles(root);
  const dumps=DUMP_ROOTS.filter(rel=>fs.existsSync(inside(root,rel)) && !trackedUnder(tracked,rel).length);
  const stray=discoveredGalleries(root,untrackedFiles(root));
  const notes=discoveredRootScratch(root);
  let added=[];
  if(!check && ignore.missing.length) {
    const prefix=ignore.existing && !ignore.existing.endsWith('\n')?'\n':'';
    write(ignore.file,`${ignore.existing}${prefix}${ignore.missing.join('\n')}\n`);
    added=ignore.missing;
  }
  const removed=check?[]:removeScratch(root,tracked,env);
  const missing=check?ignore.missing:[];
  const leak=check && ((!keepFrontendEphemera(env) && (dumps.length || stray.length)) || notes.length);
  const status=tracked.length?'failed':missing.length || leak?'incomplete':'passed';
  return {
    schemaVersion:1,
    status,
    check,
    kept:keepFrontendEphemera(env),
    canonical:CANONICAL_CAPTURE,
    missingIgnore:missing,
    addedIgnore:added,
    removed,
    tracked,
    dumps:check?dumps:[],
    stray:check?stray:[],
    notes:check?notes:[],
    scratch:SCRATCH_PATHS,
    ignore:IGNORED_PATHS,
    reason:tracked.length?'Tracked inspection captures must be untracked by the project; housekeep does not delete Git-tracked files.':missing.length?'Missing housekeeping ignore rules.':leak?'Leftover agent working files are present outside canonical ignored paths.':added.length||removed.length?'Applied housekeeping rules.':'Housekeeping rules are in place.',
    exitCode:{passed:0,failed:1,incomplete:4}[status]
  };
}

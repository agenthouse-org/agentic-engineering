import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {assert,inside,write} from './io.js';

export const IGNORED_PATHS=['.agenthouse/local/','.agenthouse/runtime/','.agenthouse/transaction.json','.agenthouse/mutation.lock','.agenthouse/sessions/','.agenthouse/evidence/','.agenthouse/browser-assessment.json','artifacts/agenthouse/'];
export const gitignoreBody=()=>IGNORED_PATHS.join('\n');
export const SCRATCH_PATHS=['.agenthouse/evidence','.agenthouse/browser-assessment.json','work/browser-results','work/browser-baselines','work/browser-assessment.json','artifacts/agenthouse/playwright'];
export const BROWSER_EPHEMERA=SCRATCH_PATHS;

export function keepFrontendEphemera(env=process.env) {
  return Boolean(env.CI || env.AH_KEEP_BROWSER_ARTIFACTS);
}

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
function trackedFiles(root) {
  const git=spawnSync('git',['-C',root,'rev-parse','--is-inside-work-tree'],{encoding:'utf8',windowsHide:true,timeout:15000});
  if(git.status!==0)return [];
  const listed=spawnSync('git',['-C',root,'ls-files','-z','--',...SCRATCH_PATHS],{encoding:'utf8',windowsHide:true,timeout:15000});
  if(listed.status!==0)return [];
  return listed.stdout.split('\0').filter(Boolean).map(file=>file.replaceAll('\\','/'));
}
function trackedUnder(tracked,rel) {
  const file=rel.replaceAll('\\','/').replace(/\/$/,'');
  return tracked.filter(entry=>entry===file || entry.startsWith(file+'/'));
}
function removeScratch(root,tracked,env) {
  if(keepFrontendEphemera(env))return [];
  const removed=[];
  for(const rel of SCRATCH_PATHS) {
    if(trackedUnder(tracked,rel).length)continue;
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
  let added=[];
  if(!check && ignore.missing.length) {
    const prefix=ignore.existing && !ignore.existing.endsWith('\n')?'\n':'';
    write(ignore.file,`${ignore.existing}${prefix}${ignore.missing.join('\n')}\n`);
    added=ignore.missing;
  }
  const removed=check?[]:removeScratch(root,tracked,env);
  const missing=check?ignore.missing:[];
  const status=tracked.length?'failed':missing.length?'incomplete':'passed';
  return {
    schemaVersion:1,
    status,
    check,
    kept:keepFrontendEphemera(env),
    missingIgnore:missing,
    addedIgnore:added,
    removed,
    tracked,
    scratch:SCRATCH_PATHS,
    ignore:IGNORED_PATHS,
    reason:tracked.length?'Tracked inspection captures must be untracked by the project; housekeep does not delete Git-tracked files.':missing.length?'Missing housekeeping ignore rules.':added.length||removed.length?'Applied housekeeping rules.':'Housekeeping rules are in place.',
    exitCode:{passed:0,failed:1,incomplete:4}[status]
  };
}

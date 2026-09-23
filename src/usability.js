import {skillDirectory,machineHome} from './storage.js';
import fs from 'node:fs';
import path from 'node:path';
import {assert,inside,read,write,hash,PACKAGE} from './io.js';
import {dependencyStatus} from './dependencies.js';
import {assertOutput} from './housekeep.js';
import {run} from './process.js';

export function usabilityRuntime(root) {
  const skill=dependencyStatus(root).dependencies['web-usability-conformity'];
  assert(skill,'Usability dependency is not installed');
  const pkg=fs.readFileSync(path.join(PACKAGE,'dependencies/usability-runtime/package.json'));
  const lock=fs.readFileSync(path.join(PACKAGE,'dependencies/usability-runtime/package-lock.json'));
  const digest=hash({skill:skill.digest,package:hash(pkg),lock:hash(lock)});
  const central=read(inside(root,'.agenthouse/active.json')).storage==='machine';
  return {skill,pkg,lock,digest,directory:central?inside(machineHome(),`tools/usability-${digest}`):inside(root,`.agenthouse/local/tools/usability-${digest.slice(0,16)}`)};
}
export async function setupUsability(root,{npmCli,offline=false}={}) {
  const runtime=usabilityRuntime(root),{directory,skill,pkg,lock}=runtime;
  // Explicit setup owns network access; evaluations never invoke a package manager.
  const npm=npmCli || process.env.npm_execpath || path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
  assert(fs.existsSync(npm),'Supply --npm-cli PATH_TO_NPM_CLI_JS');
  for(const file of Object.keys(skill.files))write(inside(directory,file),fs.readFileSync(inside(skillDirectory(root,skill.id),file)));
  write(path.join(directory,'package.json'),pkg);write(path.join(directory,'package-lock.json'),lock);
  const install=await run(process.execPath,[npm,'ci','--ignore-scripts','--no-audit','--no-fund',...(offline?['--offline']:[])],{cwd:directory,timeoutSeconds:300});
  assert(!install.error && install.code===0,`Usability provisioning failed: ${install.error || install.stderr}`);
  if(!offline) {
    const browser=await run(process.execPath,[path.join(directory,'node_modules/playwright/cli.js'),'install','chromium'],{cwd:directory,timeoutSeconds:300});
    assert(!browser.error && browser.code===0,`Browser provisioning failed: ${browser.error || browser.stderr}`);
  }
  // Offline users provide the pinned browser through PLAYWRIGHT_BROWSERS_PATH or its cache.
  write(path.join(directory,'ready.json'),{digest:runtime.digest});
  return {status:'provisioned',directory,digest:runtime.digest,offline};
}
export async function auditUsability(root,{url,fixture,output}={}) {
  assert(Boolean(url)!==Boolean(fixture),'Provide --url or --fixture');
  if(url)assert(['http:','https:'].includes(new URL(url).protocol),'Use an HTTP(S) URL');
  const {directory,digest,skill,pkg,lock}=usabilityRuntime(root);
  assert(read(path.join(directory,'ready.json')).digest===digest,'Run usability setup for this version first');
  assert(hash(fs.readFileSync(path.join(directory,'package.json')))===hash(pkg) && hash(fs.readFileSync(path.join(directory,'package-lock.json')))===hash(lock),'Tool dependency definition changed');
  for(const [file,expected] of Object.entries(skill.files))if(file!=='package.json')assert(hash(fs.readFileSync(inside(directory,file)))===expected,'Usability tool source changed');
  const central=read(inside(root,'.agenthouse/active.json')).storage==='machine';
  output ||= central?'.agenthouse/local/reports/usability/report.json':'artifacts/agenthouse/usability/report.json';
  const target=central?assertOutput(root,output):inside(root,output);assert(!fs.existsSync(target),'Choose a new report path to preserve earlier evidence');
  const result=await run(process.execPath,[path.join(directory,'scripts/audit.mjs'),...(url?['--url',url]:['--fixture',path.isAbsolute(fixture)?fixture:inside(root,fixture)]),'--out',target,'--screenshots'],{cwd:root,timeoutSeconds:180});
  assert(!result.error && [0,2].includes(result.code) && fs.existsSync(target),`Usability audit failed: ${result.error || result.stderr}`);
  const report=read(target);
  return {schemaVersion:1,status:result.code===2?'failed':'evidence-collected',exitCode:result.code===2?1:0,report:output,sha256:hash(fs.readFileSync(target)),runtimeDigest:digest,summary:report.summary,reviewRequired:true};
}

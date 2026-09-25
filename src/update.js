import {runtimeDirectory} from './storage.js';
import {updateDependency} from './dependency-update.js';
import {dependencyStatus,hookLock,bundledDependencies,checkDependencyPin,checkPresentPins} from './dependencies.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {assert,read,write,inside,hash,VERSION,canonical,validated,exclusive} from './io.js';
import {housekeep} from './housekeep.js';
import {install,payload,verifyPayload,installationStatus} from './install.js';
import {verifyEnvelope} from './policy.js';
import {resolve} from './policy.js';
import {roleProcessCheck} from './roles-processes.js';

const PUBLIC_PACKAGE='@agenthouse/engineering',PUBLIC_REPOSITORY='agenthouse-org/agentic-engineering';
const parts=value=>{const match=String(value).match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);assert(match,`Invalid release version: ${value}`);return {numbers:match.slice(1,4).map(Number),prerelease:match[4] || null};};
function compare(a,b){
  const x=parts(a),y=parts(b);for(let i=0;i<3;i++)if(x.numbers[i]!==y.numbers[i])return x.numbers[i]-y.numbers[i];
  if(x.prerelease===y.prerelease)return 0;if(!x.prerelease)return 1;if(!y.prerelease)return -1;
  const xa=x.prerelease.split('.'),ya=y.prerelease.split('.');
  for(let i=0;i<Math.max(xa.length,ya.length);i++) {
    if(xa[i]===undefined)return -1;if(ya[i]===undefined)return 1;if(xa[i]===ya[i])continue;
    const xn=/^\d+$/.test(xa[i]),yn=/^\d+$/.test(ya[i]);if(xn&&yn)return Number(xa[i])-Number(ya[i]);if(xn!==yn)return xn?-1:1;return xa[i].localeCompare(ya[i]);
  }
  return 0;
}
function releaseMetadata(data){return JSON.parse(Buffer.from(data.files['package.json'],'base64')).agenthouse?.release || null;}
export function declaredCompatibility(data,current,{allowBreaking=false,allowLegacy=false}={}) {
  const metadata=releaseMetadata(data),candidate=data.version;
  if(candidate===current)return {compatible:true,declared:!!metadata};
  assert(compare(candidate,current)>0,'Use rollback for framework downgrades');
  const currentParts=parts(current),candidateParts=parts(candidate);
  const legacyCompatible=allowLegacy && !metadata && currentParts.numbers[0]===candidateParts.numbers[0] && (currentParts.numbers[0]!==0 || currentParts.numbers[1]===candidateParts.numbers[1]);
  const compatible=(metadata?.schemaVersion===1 && typeof metadata.compatibleFrom==='string' && compare(current,metadata.compatibleFrom)>=0) || legacyCompatible;
  assert(compatible || allowBreaking,'Breaking update requires --allow-breaking because the release does not declare compatibility with the installed runtime');
  return {compatible,declared:!!metadata,metadata};
}
function applyPayload(root,data,options={}) {
  verifyPayload(data);
  const installed=read(inside(root,'.agenthouse/installation.json'));
  const compatibility=declaredCompatibility(data,installed.version,{allowBreaking:options.allowBreaking,allowLegacy:options.allowLegacy});
  const digest=hash(data);
  if(data.version===installed.version) {
    assert(digest===installed.digest,'Published version was reused with different content');
    return {version:installed.version,status:'current',compatible:true,digest,source:options.source,verification:options.verification};
  }
  for(const dependency of bundledDependencies(data))checkDependencyPin(root,dependency.lock);
  const hooks=hookLock(data);if(hooks)checkDependencyPin(root,hooks);
  checkPresentPins(root,[...bundledDependencies(data).map(d=>d.lock.id),...(hooks?[hooks.id]:[])]);
  const policyFile=inside(root,'.agenthouse/update.json');
  const policy=fs.existsSync(policyFile)?read(policyFile):{};
  if(policy.pin)assert(policy.pin===data.version,`Version pinned to ${policy.pin}`);
  if(options.check)return {current:installed.version,available:data.version,compatible:compatibility.compatible,digest,source:options.source,verification:options.verification};
  const config=inside(root,'.agenthouse/config.json'),before=fs.readFileSync(config);
  const result=install(root,{payload:data});
  assert(hash(fs.readFileSync(config))===hash(before),'Update changed project configuration');
  return {...result,status:'updated',source:options.source,verification:options.verification};
}

export function update(root,options) {
  const file=path.resolve(options.bundle);
  const raw=fs.readFileSync(file),bundle=JSON.parse(raw);
  let data;
  if(options.publicKey) data=verifyEnvelope(bundle,fs.readFileSync(path.resolve(options.publicKey),'utf8'));
  else {assert(options.sha256 && hash(raw)===options.sha256,'Supply a trusted SHA-256 or public key for bundle verification');data=bundle;}
  return applyPayload(root,data,{...options,allowLegacy:true,source:'bundle',verification:options.publicKey?'ed25519-signature':'trusted-sha256'});
}
function run(command,args,options={}) {
  const result=spawnSync(command,args,{cwd:options.cwd,encoding:'utf8',timeout:options.timeout || 120000,windowsHide:true,maxBuffer:16*1024*1024});
  assert(!result.error && result.status===0,`${options.label || command} failed: ${result.error?.message || result.stderr || `exit ${result.status}`}`);
  return result.stdout;
}
export function discoverNpmRelease({npmCli,channel='latest'}={}) {
  const npm=npmCli || process.env.npm_execpath || path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
  assert(fs.existsSync(npm),'Supply --npm-cli PATH_TO_NPM_CLI_JS');
  const npmRun=(args,options={})=>run(process.execPath,[npm,...args],options);
  const metadata=JSON.parse(npmRun(['view',PUBLIC_PACKAGE,`dist-tags.${channel}`,'--json'],{label:'npm release discovery'}));
  assert(typeof metadata==='string' && metadata,'npm channel did not return a version');
  if(channel==='latest')assert(!parts(metadata).prerelease,'npm latest resolved to a prerelease');
  const versionMetadata=JSON.parse(npmRun(['view',`${PUBLIC_PACKAGE}@${metadata}`,'--json'],{label:'npm release metadata'}));
  assert(versionMetadata.name===PUBLIC_PACKAGE && versionMetadata.version===metadata,'npm returned an unexpected package identity');
  assert(versionMetadata.dist?.integrity && versionMetadata.dist?.signatures?.length && versionMetadata.dist?.attestations?.provenance,'npm release lacks integrity, registry signatures, or provenance');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'agenthouse-update-'));
  try {
    write(path.join(temp,'package.json'),{name:'agenthouse-update-verification',version:'1.0.0',private:true});
    npmRun(['install','--ignore-scripts','--no-audit','--no-fund','--save-exact',`${PUBLIC_PACKAGE}@${metadata}`],{cwd:temp,label:'npm verified download'});
    const audit=JSON.parse(npmRun(['audit','signatures','--json'],{cwd:temp,label:'npm signature and provenance verification'}));
    assert(!(audit.invalid || []).length && !(audit.missing || []).length,'npm signature or provenance verification reported invalid or missing attestations');
    const installed=path.join(temp,'node_modules','@agenthouse','engineering');
    assert(fs.existsSync(installed),'npm package was not installed for verification');
    return {source:'npm',data:payload(installed),verification:{package:PUBLIC_PACKAGE,version:metadata,integrity:versionMetadata.dist.integrity,registrySignatures:versionMetadata.dist.signatures.length,provenance:versionMetadata.dist.attestations.provenance.predicateType,audit}};
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
export function discoverGitHubRelease({channel='latest'}={}) {
  assert(channel==='latest','GitHub fallback currently supports the stable latest channel only');
  const release=JSON.parse(run('gh',['api',`repos/${PUBLIC_REPOSITORY}/releases/latest`],{label:'GitHub release discovery'}));
  assert(!release.draft && !release.prerelease,'GitHub latest release is not a stable published release');
  const asset=(release.assets || []).find(item=>item.name?.endsWith('.bundle.json'));
  assert(asset,'GitHub release has no framework bundle asset');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'agenthouse-github-update-'));
  try {
    run('gh',['release','download',release.tag_name,'--repo',PUBLIC_REPOSITORY,'--pattern',asset.name,'--dir',temp],{label:'GitHub release download'});
    const file=path.join(temp,asset.name);
    run('gh',['attestation','verify',file,'--repo',PUBLIC_REPOSITORY],{label:'GitHub artifact attestation verification'});
    const data=read(file);verifyPayload(data);
    return {source:'github',data,verification:{release:release.tag_name,asset:asset.name,digest:asset.digest || hash(fs.readFileSync(file)),attestation:'verified'}};
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
export function updateFromChannel(root,options={}) {
  const policyFile=inside(root,'.agenthouse/update.json'),policy=fs.existsSync(policyFile)?validated('update-policy',read(policyFile)):{schemaVersion:1,track:'latest',sources:['npm','github']};
  assert(policy.track!=='exact','Project update preference is exact');
  const sources=policy.sources || ['npm','github'],discoverers=options.discoverers || {npm:()=>discoverNpmRelease({npmCli:options.npmCli,channel:policy.channel || 'latest'}),github:()=>discoverGitHubRelease({channel:policy.channel || 'latest'})};
  const attempts=[];
  for(const source of sources) {
    try {
      assert(typeof discoverers[source]==='function',`Unsupported update source: ${source}`);
      const candidate=discoverers[source]();
      return {...applyPayload(root,candidate.data,{check:options.check,allowBreaking:options.allowBreaking,source:candidate.source || source,verification:candidate.verification}),attempts};
    }catch(error){attempts.push({source,status:'unavailable',reason:error.message});}
  }
  throw new Error(`No verified update candidate: ${attempts.map(item=>`${item.source}: ${item.reason}`).join('; ')}`);
}
export function configureUpdateTracking(root,track) {
  assert(['latest','exact'].includes(track),'Update tracking must be latest or exact');
  return exclusive(root,()=>{
    const file=inside(root,'.agenthouse/update.json'),existing=fs.existsSync(file)?read(file):{},installed=read(inside(root,'.agenthouse/installation.json'));
    const next={...existing,schemaVersion:1,track,automatic:track==='latest'};
    if(track==='exact')next.pin=installed.version;else delete next.pin;
    next.sources ||= ['npm','github'];next.channel ||= 'latest';
    validated('update-policy',next);write(file,next);return next;
  });
}
export function rollback(root) {
  const previous=read(inside(root,'.agenthouse/previous.json'));
  const source=runtimeDirectory(root,previous.active);
  // Restoring via installation validates ownership and preserves custom files.
  const files={};
  const enumerate=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);assert(!entry.isSymbolicLink(),'Symlink in cached runtime');
    if(entry.isDirectory())enumerate(file);else files[path.relative(source,file).replaceAll('\\','/')]=fs.readFileSync(file).toString('base64');
  }};
  enumerate(source);
  const data={schemaVersion:1,version:previous.active.version,files};
  assert(hash(data)===previous.active.digest,'Previous runtime has been modified');
  return install(root,{payload:data});
}
export function session(root,options={}) {
  installationStatus(root);
  const file=inside(root,'.agenthouse/update.json');
  let updateResult={status:'not-configured'};
  if(fs.existsSync(file)) {
    const settings=read(file);
    validated('update-policy',settings);
    if(settings.automatic && settings.track==='latest') {
      try {updateResult=updateFromChannel(root,{npmCli:options.npmCli});}
      catch(error) {updateResult={status:'deferred',reason:error.message};}
    } else if(settings.automatic && settings.bundle) {
      try {updateResult=update(root,{bundle:inside(root,settings.bundle),publicKey:settings.publicKey?inside(root,settings.publicKey):undefined,sha256:settings.sha256});}
      catch(error) {updateResult={status:'deferred',reason:error.message};}
    }
  }
  let dependencyUpdate={status:'not-configured'};
  const policy=inside(root,'.agenthouse/dependency-policy.json');
  if(fs.existsSync(policy)) {
    const settings=read(policy);
    if(settings.automatic && settings.bundle) {
      try {dependencyUpdate=updateDependency(root,{bundle:inside(root,settings.bundle),sha256:settings.sha256,publicKey:settings.publicKey?inside(root,settings.publicKey):undefined});}
      catch(error){dependencyUpdate={status:'deferred',reason:error.message};}
    }
  }
  const dependencies=dependencyStatus(root);
  const recorded=read(inside(root,'.agenthouse/resolved.json')),available=resolve(root,{persist:false}).snapshot;
  const policyChange=canonical(recorded)===canonical(available)?{status:'current',digest:recorded.digest}:{status:'changed',currentDigest:recorded.digest,availableDigest:available.digest,
    changedRules:[...new Set([...(recorded.rules || []).map(item=>item.id),...(available.rules || []).map(item=>item.id)])].filter(id=>canonical((recorded.rules || []).find(item=>item.id===id))!==canonical((available.rules || []).find(item=>item.id===id))),
    requiredChecks:{current:recorded.requiredChecks || [],available:available.requiredChecks || []},action:'Review the changed policy. Keep this task on the frozen snapshot or run resolve to adopt the new revision explicitly.'};
  const id=new Date().toISOString().replaceAll(':','-');
  const active=read(inside(root,'.agenthouse/active.json'));
  // A subsequent launcher invocation selects a newly activated runtime. The
  // current process never loads newly downloaded code midway through a task.
  const housekeeping=housekeep(root,{env:options.env});
  const baselineUpdates={};
  if(updateResult.status==='updated') {
    for(const kind of ['roles','processes'])baselineUpdates[kind]={status:'refresh-required',reason:'A newer runtime was activated during this session. Start a new pinned CLI invocation to inspect its role/process baselines.',evaluatedVersion:VERSION,activeVersion:updateResult.version};
  } else for(const kind of ['roles','processes'])try{
    const review=roleProcessCheck(kind);
    baselineUpdates[kind]={summary:review.summary,evaluatedVersion:VERSION,results:review.results.map(({id,status,baselineVersion,availableVersion,ignored,baselineChanges,conflicts})=>({id,status,baselineVersion,availableVersion,ignored,baselineChanges,conflictFields:(conflicts||[]).map(conflict=>conflict.field)}))};
  }catch(error){baselineUpdates[kind]={status:'error',reason:error.message};}
  const result={id,active,executingVersion:VERSION,update:updateResult,dependencyUpdate,dependencies,baselineUpdates,policyChange,housekeeping};
  write(inside(root,`.agenthouse/sessions/${id}.json`),result);
  return result;
}

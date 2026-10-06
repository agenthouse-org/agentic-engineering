import fs from 'node:fs';
import path from 'node:path';
import {assert,read,write,hash,inside,canonical,validated,exclusive} from './io.js';
import {machineHome} from './storage.js';
import {resolve,verifyEnvelope} from './policy.js';
import {transact} from './install.js';

const originsFile='.agenthouse/policy-origins.json';
const observationFile='.agenthouse/local/policy-observations.json';
const json=value=>JSON.stringify(value,null,2)+'\n';
export function policyChannel({file,repository,sourcePath,sequence,expiresAt,permitted}={}) {
  const policy=validated('policy',read(path.resolve(file))),digest=hash(policy);
  const data={schemaVersion:1,kind:'policy-channel',repository,path:sourcePath,sequence:Number(sequence),issuedAt:new Date().toISOString(),expiresAt,policy,digest,permitted:permitted?read(path.resolve(permitted)):[{digest}]};
  validated('policy-channel',data);
  assert(Date.parse(expiresAt)>Date.now(),'Channel expiry must be in the future');
  return data;
}
export function channelPath(root,location) {
  assert(typeof location==='string' && location.length,'Missing channel location');
  return location.startsWith('home:')?inside(machineHome(),location.slice(5)):path.isAbsolute(location)?location:inside(root,location);
}
export function policyOrigins(root) {
  const file=inside(root,originsFile);
  if(!fs.existsSync(file))return [];
  const data=validated('policy-origins',read(file));
  assert(new Set(data.sources.map(s=>s.file)).size===data.sources.length,'Duplicate policy origin');
  return data.sources;
}
export function originPins(root,files) {
  return policyOrigins(root).map(origin=>{
    assert(files.includes(origin.file),'Tracked policy missing from policySources');
    assert(hash(read(inside(root,origin.file)))===origin.digest,`Tracked policy modified: ${origin.file}; use policy adopt`);
    return origin;
  });
}
function verifiedChannel(root,origin,observations) {
  const channel=validated('policy-channel',verifyEnvelope(read(channelPath(root,origin.channel)),origin.publicKey));
  assert(channel.repository===origin.repository && channel.path===origin.path,'Policy channel source mismatch');
  assert(Date.parse(channel.issuedAt)<=Date.now() && Date.parse(channel.expiresAt)>Date.now(),'Policy channel expired or not yet valid');
  assert(hash(channel.policy)===channel.digest,'Policy channel digest mismatch');
  validated('policy',channel.policy);
  assert(channel.policy.id===read(inside(root,origin.file)).id,'Policy channel identity mismatch');
  const previous=observations[origin.file];
  if(previous && previous.source===hash({repository:origin.repository,path:origin.path,publicKey:origin.publicKey})) {
    assert(channel.sequence>=previous.sequence,'Policy channel replay');
    if(channel.sequence===previous.sequence)assert(hash(channel)===previous.channelDigest,'Policy channel sequence reused');
  }
  return channel;
}
function difference(current,next) {
  const a=new Map(current.rules.map(r=>[r.id,r])),b=new Map(next.rules.map(r=>[r.id,r]));
  return {rules:[...new Set([...a.keys(),...b.keys()])].filter(id=>canonical(a.get(id))!==canonical(b.get(id))).map(id=>({id,before:a.get(id)||null,after:b.get(id)||null})),
    requiredChecks:{before:current.requiredChecks||[],after:next.requiredChecks||[]},
    authorityChanged:canonical({owner:current.owner,authorities:current.authorities})!==canonical({owner:next.owner,authorities:next.authorities})};
}
export function policyStatus(root,{record=false,required=false}={}) {
  const origins=policyOrigins(root),file=inside(root,observationFile),observations=fs.existsSync(file)?read(file):{};
  const config=read(inside(root,'.agenthouse/config.json'));
  const results=origins.map(origin=>{
    const base={file:origin.file,repository:origin.repository,path:origin.path,adopted:{revision:origin.revision,digest:origin.digest}};
    try {
      assert((config.policySources||[]).includes(origin.file),'Tracked policy missing from policySources');
      const current=read(inside(root,origin.file));
      assert(hash(current)===origin.digest,'Tracked policy modified');
      assert(!current.expiresAt || Date.parse(current.expiresAt)>Date.now(),'Adopted policy expired');
      const channel=verifiedChannel(root,origin,observations);
      const permission=channel.permitted.find(p=>p.digest===origin.digest);
      const permitted=!!permission && (!permission.until || Date.parse(permission.until)>Date.now());
      const result={...base,integrity:'consistent',freshness:origin.digest===channel.digest?'current':'behind',compliance:permitted?'permitted':'blocked',
        recommended:{revision:channel.policy.revision,digest:channel.digest},permittedUntil:permission?.until||null,sequence:channel.sequence,
        checkedAt:new Date().toISOString(),metadataExpiresAt:channel.expiresAt,changes:difference(current,channel.policy)};
      observations[origin.file]={source:hash({repository:origin.repository,path:origin.path,publicKey:origin.publicKey}),sequence:channel.sequence,channelDigest:hash(channel),checkedAt:result.checkedAt};
      return result;
    }catch(error) {
      let integrity='changed';try{if(hash(read(inside(root,origin.file)))===origin.digest)integrity='consistent';}catch{}
      return {...base,integrity,freshness:'unknown',compliance:'unknown',reason:error.message,lastSuccessfulObservation:observations[origin.file]||null};
    }
  });
  for(const file of config.policySources||[])if(!origins.some(o=>o.file===file))results.push({file,freshness:'untracked',compliance:'unknown',reason:'Local policy snapshot; no upstream origin configured'});
  if(record && origins.length)write(inside(root,observationFile),observations);
  return {schemaVersion:1,project:config.project,sources:results,exitCode:required?(results.some(r=>r.compliance==='blocked')?1:!results.length || results.some(r=>r.compliance==='unknown')?4:0):0};
}
export function trackPolicy(root,descriptor) {
  return exclusive(root,()=>{
    const origin=read(path.resolve(descriptor)),config=read(inside(root,'.agenthouse/config.json'));
    assert((config.policySources||[]).includes(origin.file),'Origin file must be an existing policySources entry');
    const current=validated('policy',read(inside(root,origin.file)));
    const entry={...origin,revision:current.revision,digest:hash(current)};
    const sources=policyOrigins(root);assert(!sources.some(s=>s.file===entry.file),'Policy already tracked; edit trust configuration explicitly');
    sources.push(entry);validated('policy-origins',{schemaVersion:1,sources});
    verifiedChannel(root,entry,{});
    transact(root,[{path:originsFile,content:json({schemaVersion:1,sources})}],()=>[{path:'.agenthouse/resolved.json',content:json(resolve(root,{persist:false}).snapshot)}]);
    return policyStatus(root,{record:true});
  });
}
export function adoptPolicy(root,{file,digest,check=false}={}) {
  return exclusive(root,()=>{
    const sources=policyOrigins(root),origin=sources.find(s=>s.file===file);assert(origin,'Unknown tracked policy');
    const observations=fs.existsSync(inside(root,observationFile))?read(inside(root,observationFile)):{};
    const current=read(inside(root,file));assert(hash(current)===origin.digest,'Tracked policy modified; preserve and reconcile local changes before adoption');
    const channel=verifiedChannel(root,origin,observations);
    assert(channel.permitted.some(p=>p.digest===channel.digest && (!p.until || Date.parse(p.until)>Date.now())),'Recommended policy is not permitted');
    const preview={file,current:origin.revision,available:channel.policy.revision,digest:channel.digest,changes:difference(current,channel.policy),approvalImpact:'Policy snapshot changes invalidate decisions bound to the previous digest'};
    if(check)return preview;
    assert(digest===channel.digest,'Supply the reviewed --digest from policy adopt --check');
    origin.revision=channel.policy.revision;origin.digest=channel.digest;
    transact(root,[{path:file,content:json(channel.policy)},{path:originsFile,content:json({schemaVersion:1,sources})}],()=>[{path:'.agenthouse/resolved.json',content:json(resolve(root,{persist:false}).snapshot)}]);
    return {...preview,status:'adopted',policyStatus:policyStatus(root,{record:true})};
  });
}

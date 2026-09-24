import fs from 'node:fs';
import {assert,read,inside,hash} from './io.js';
import {git} from './inspect.js';
import {resolve} from './policy.js';

// Literal searches over Git blobs: independent of checkout, language and host tools.
// These are candidate occurrences. Semantic call-site classification is human/agent evidence.
export function assessmentInventory(root,{item,selectors,ref='HEAD',policyFile}={}) {
  resolve(root,{frozen:true,policyFile});
  const work=read(inside(root,item)),selection=read(inside(root,selectors));
  assert(work.id && work.fields?.outcome,'Assessment requires a work item and change hypothesis in fields.outcome');
  assert(typeof ref==='string' && !ref.startsWith('-'),'Invalid revision');
  const commit=git(root,['rev-parse','--verify','--end-of-options',`${ref}^{commit}`]);
  assert(Array.isArray(selection) && selection.length,'Provide literal selectors');
  assert(selection.every(s=>typeof s.text==='string' && s.text.length && !s.text.includes('\n') && typeof s.category==='string' && s.category && typeof s.reason==='string' && s.reason),'Each selector needs text, category and reason');
  const tree=git(root,['ls-tree','-r','-z',commit]).split('\0').filter(Boolean),files=[],locations=[];
  for(const entry of tree.sort()) {
    const [,mode,oid,file]=entry.match(/^(\d+) blob ([a-f0-9]+)\t([\s\S]+)$/) || [];
    if(!file || !['100644','100755'].includes(mode))continue;
    const content=git(root,['cat-file','blob',oid],{binary:true}).toString('utf8');
    if(content.includes('\0'))continue;
    const reasons=new Set();
    for(const [index,line] of content.split('\n').entries())for(const selector of selection) {
      let from=0,at;
      while((at=line.indexOf(selector.text,from))!==-1) {
        locations.push({file,line:index+1,column:at+1,category:selector.category,text:selector.text});
        reasons.add(selector.reason);from=at+selector.text.length;
      }
    }
    if(reasons.size)files.push({path:file,blob:oid,reason:[...reasons].sort().join('; ')});
  }
  const counts=Object.fromEntries([...new Set(selection.map(s=>s.category))].sort().map(c=>[c,locations.filter(l=>l.category===c).length]));
  return {schemaVersion:1,kind:'feasibility-inventory',workItem:work.id,commit,selectors:selection,selectorDigest:hash(selection),files,locations,counts,
    limitations:['Literal occurrences include declarations, comments and strings; classify actual call sites separately.','Dynamic calls and downstream repositories need explicit investigation; this is not a complete semantic dependency graph.']};
}

export function validateAssessment(root,file,{policyFile}={}) {
  const data=read(inside(root,file));
  assert(data.schemaVersion===1 && data.kind==='technical-feasibility','Unsupported feasibility summary');
  assert(typeof data.commit==='string' && /^[a-f0-9]{40,64}$/.test(data.commit),'Assessment requires an exact commit');
  const work=read(inside(root,data.workItem));
  assert(hash(work.criteria)===data.criteriaDigest,'Assessment criteria changed');
  assert(hash(work.fields?.outcome)===data.hypothesisDigest,'Assessment hypothesis changed');
  assert(data.policyDigest===resolve(root,{frozen:true,policyFile}).snapshot.digest,'Assessment policy changed');
  assert(data.artifacts && Object.keys(data.artifacts).length>=3,'Link document and current/target Mermaid artifacts');
  for(const [artifact,digest] of Object.entries(data.artifacts))assert(hash(fs.readFileSync(inside(root,artifact)))===digest,`Assessment artifact changed: ${artifact}`);
  assert(Object.keys(data.artifacts).some(p=>p.endsWith('.md')) && Object.keys(data.artifacts).filter(p=>p.endsWith('.mmd')).length>=2,'Require Markdown and two Mermaid artifacts');
  const inventory=assessmentInventory(root,{item:data.workItem,selectors:data.selectors,ref:data.commit,policyFile});
  assert(hash(inventory)===data.inventoryDigest,'Assessment inventory changed');
  assert(Array.isArray(data.callSites),'Record classified call sites');
  const locations=new Set();
  for(const site of data.callSites) {
    assert(['boundary','direct','excluded'].includes(site.category) && site.reason?.trim(),'Classify each occurrence with a reason');
    const key=JSON.stringify([site.file,site.line,site.column,site.text]);
    assert(!locations.has(key),'Duplicate classified occurrence');locations.add(key);
    assert(inventory.locations.some(l=>l.file===site.file && l.line===site.line && l.column===site.column && l.text===site.text),'Call site outside inventory');
  }
  assert(new Set(inventory.locations.map(l=>JSON.stringify([l.file,l.line,l.column,l.text]))).size===locations.size,'Classify every inventory occurrence');
  assert(Array.isArray(data.scenarios) && data.scenarios.length>=3,'Compare at least three scenarios');
  const criteria=['effort','risk','reversibility','prerequisites','operationalImpact'];
  assert(data.scale==='1=least favorable;5=most favorable','Use the shared five-point favorability scale');
  const ranks=new Set();
  for(const scenario of data.scenarios) {
    assert(scenario.name?.trim() && scenario.explanation?.trim(),'Explain scenario and ranking');
    assert(Number.isInteger(scenario.rank) && scenario.rank>0 && scenario.rank<=data.scenarios.length && !ranks.has(scenario.rank),'Distinct scenario ranks required');ranks.add(scenario.rank);
    for(const criterion of criteria)assert(Number.isInteger(scenario[criterion]) && scenario[criterion]>=1 && scenario[criterion]<=5,`Rate ${criterion} on the common scale`);
  }
  assert(Array.isArray(data.migration) && data.migration.length && data.migration.every(s=>s.action?.trim() && s.consistentWhen?.trim() && s.abort?.trim()),'Migration steps require action, consistency and abort points');
  assert(Array.isArray(data.consumers) && data.consumers.every(c=>c.name?.trim() && c.changes?.trim() && c.unchanged?.trim()),'Record consumer changes and invariants');
  assert(Array.isArray(data.openQuestions),'Record unresolved questions');
  assert(data.proposal?.trim(),'Explain decision proposal');
  return {kind:data.kind,commit:data.commit,workItem:work.id,openQuestions:data.openQuestions,counts:Object.fromEntries(['boundary','direct','excluded'].map(c=>[c,data.callSites.filter(s=>s.category===c).length])),meaning:'Assessment completeness only; no technical pass or approval'};
}

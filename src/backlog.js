import fs from 'node:fs';
import path from 'node:path';
import {assert,inside,read,write,hash,safeId,exclusive} from './io.js';

// Imports never interpret embedded instructions or infer approval from status text.
export function importBacklog(root,{source,id,title,provider='local',externalId,proposeCriteria=false}={}) {
  safeId(id);safeId(provider);
  const file=inside(root,source),bytes=fs.readFileSync(file);
  assert(bytes.length<2*1024*1024,'Backlog input exceeds 2 MB');
  const text=bytes.toString('utf8').replace(/^\uFEFF/,'');
  let record;
  if(path.extname(source).toLowerCase()==='.json') {
    const data=JSON.parse(text);
    assert(data && !Array.isArray(data) && typeof data==='object','Expected one work item');
    record={title:title || data.title,kind:data.kind || 'feature',fields:data.fields || {},criteria:data.criteria || [],original:data};
    externalId=externalId || data.externalId || data.id;
  } else {
    record={title:title || text.match(/^#\s+(.+)$/m)?.[1],kind:'feature',fields:{outcome:'',description:text},criteria:[]};
  }
  if(proposeCriteria) {
    assert(path.extname(source).toLowerCase()!=='.json','Prose extraction expects a text or Markdown snapshot');
    record.criteria=text.split(/\r?\n/).filter(line=>/^\s*(?:[-*+] |\d+[.)] )/.test(line)).map((line,i)=>({id:`AC-${i+1}`,expectation:line.replace(/^\s*(?:[-*+] |\d+[.)] )/,''),...(/to be decided|\bTBD\b|\bopen\b/i.test(line)?{state:'open'}:{})}));
    record.fields.criteriaConfirmationRequired=true;
  }
  assert(typeof record.title==='string' && record.title.trim(),'Provide a work item title');
  assert(['feature','bug','incident','change','investigation','documentation'].includes(record.kind),'Invalid work item kind');
  assert(Array.isArray(record.criteria) && record.criteria.every(c=>typeof c.id==='string' && typeof c.expectation==='string'),'Invalid criteria');
  assert(record.fields && !Array.isArray(record.fields) && typeof record.fields==='object','Invalid fields');
  const imported={schemaVersion:1,id,title:record.title,kind:record.kind,stage:'discover',revision:1,fields:record.fields,criteria:record.criteria,evidence:[],history:[],
    external:{provider,id:externalId===undefined?id:String(externalId)},import:{source,digest:hash(bytes)},...(record.original?{original:record.original}:{})};
  return exclusive(root,()=>{
    const target=inside(root,`.agenthouse/work/${id}.json`);
    if(fs.existsSync(target)) {
      const current=read(target);
      assert(hash(current)===hash(imported),'Work item already exists; reconcile updates explicitly');
      return {status:'unchanged',item:current};
    }
    write(target,imported);return {status:'imported',item:imported};
  });
}

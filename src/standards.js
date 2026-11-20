import fs from 'node:fs';
import {assert, inside, safeId} from './io.js';

export function validateStandards(root, value) {
  assert(Array.isArray(value) && value.length, 'standard-documents must be a nonempty array');
  const seen=new Set();
  for(const d of value) {
    assert(d && typeof d==='object' && !Array.isArray(d), 'Invalid standard document');
    assert(Object.keys(d).every(k=>['id','title','url','path','appliesTo','topics'].includes(k)), 'Unknown standard document field');
    safeId(d.id); assert(!seen.has(d.id), `Duplicate standard document: ${d.id}`); seen.add(d.id);
    assert(typeof d.title==='string' && d.title.trim(), 'Standard title required');
    let url; try { url=new URL(d.url); } catch { throw new Error('Invalid standard URL'); }
    assert(['http:','https:'].includes(url.protocol) && !url.username && !url.password, 'Standard URL must be HTTP(S) without credentials');
    if(d.path!==undefined) inside(root,d.path);
    assert(d.appliesTo && typeof d.appliesTo==='object' && !Array.isArray(d.appliesTo), 'Standard applicability required');
    assert(Object.keys(d.appliesTo).every(k=>['all','stacks','globs'].includes(k)), 'Unknown applicability field');
    assert(d.appliesTo.all===true || d.appliesTo.stacks?.length || d.appliesTo.globs?.length, 'Empty standard applicability');
    if(d.appliesTo.all!==undefined) assert(d.appliesTo.all===true && !d.appliesTo.stacks && !d.appliesTo.globs, 'all cannot be combined with selectors');
    for(const key of ['stacks','globs']) if(d.appliesTo[key]!==undefined) {
      assert(Array.isArray(d.appliesTo[key]) && d.appliesTo[key].length && d.appliesTo[key].every(s=>typeof s==='string' && s.trim()), `Invalid ${key}`);
      assert(new Set(d.appliesTo[key]).size===d.appliesTo[key].length, `Duplicate ${key}`);
    }
    for(const glob of d.appliesTo.globs || []) assert(!glob.startsWith('/') && !glob.includes('\\') && !glob.split('/').includes('..') && !glob.includes(':'), 'Unsafe standard glob');
    assert(Array.isArray(d.topics) && d.topics.length && d.topics.every(s=>typeof s==='string' && /^[a-z][a-z0-9-]*$/.test(s)), 'Invalid standard topics');
    assert(new Set(d.topics).size===d.topics.length && (!d.topics.includes('all') || d.topics.length===1), 'Invalid all topics');
  }
}
export function standardDocuments(root,snapshot) {
  const rule=snapshot.rules.find(r=>r.id==='standard-documents');
  if(!rule)return null;
  validateStandards(root,rule.value);
  return rule.value.map(d=>{ const exists=d.path && fs.existsSync(inside(root,d.path)) && fs.statSync(inside(root,d.path)).isFile(); return {...d,reference:exists?d.path:d.url,localMissing:!!d.path && !exists,mode:rule.mode,provenance:snapshot.provenance[rule.id]}; });
}

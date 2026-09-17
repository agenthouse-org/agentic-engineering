import fs from 'node:fs';
import {assert, read, hash, inside, validated} from './io.js';

export const MERMAID_KINDS=new Set(['erDiagram','classDiagram','sequenceDiagram','stateDiagram','stateDiagram-v2','flowchart','C4Context','C4Container','C4Component']);
const MARKUP=/<(button|input|label|form|nav|h[1-3]|a|table|select|textarea)\b/i;
const FORBIDDEN=/<(html|head|body|script)\b/i;

function firstToken(source) {
  return String(source||'').replace(/^\uFEFF/,'').replace(/%%[^\n]*/g,'').trim().split(/\s+/,1)[0] || '';
}
export function mermaidKind(source) {
  const first=firstToken(source);
  if(first==='flowchart' || first.startsWith('flowchart-'))return 'flowchart';
  return MERMAID_KINDS.has(first)?first:null;
}
function looksLikeMermaid(source) {
  const first=firstToken(source);
  return Boolean(mermaidKind(source) || /Diagram(-v2)?$/.test(first) || first.startsWith('C4'));
}
export function extractMermaid(source) {
  const text=String(source||'');
  const fences=[...text.matchAll(/```mermaid[^\n]*\n([\s\S]*?)```/g)].map(m=>m[1]);
  if(fences.length)return fences;
  return looksLikeMermaid(text)?[text]:[];
}
export function lintMermaid(source,{kind}={}) {
  const findings=[];
  const diagrams=extractMermaid(source);
  if(!diagrams.length)return [{id:'mermaid',status:'incomplete',reason:'No mermaid diagram found'}];
  diagrams.forEach((diagram,index)=>{
    const id=diagrams.length===1?'mermaid':`mermaid-${index+1}`;
    const body=diagram.replace(/%%[^\n]*/g,'').trim();
    const actual=mermaidKind(body);
    if(!actual) {findings.push({id,status:'failed',reason:'Unknown mermaid diagram type'});return;}
    if(kind && actual!==kind && !(kind==='stateDiagram' && actual==='stateDiagram-v2')) {
      findings.push({id,status:'failed',reason:`Expected ${kind}, found ${actual}`});
      return;
    }
    const lines=body.split(/\n/).map(l=>l.trim()).filter(Boolean);
    if(lines.length<2)findings.push({id,status:'incomplete',reason:`${actual} diagram has no relationships or members`});
    else if(actual==='erDiagram' && !/(\|\|--|\}\|--|\}\|o--|\}\|--o|\|\|o--|o\{|\}o)/.test(body) && !/\{\s*\w+/.test(body))
      findings.push({id,status:'incomplete',reason:'erDiagram needs an entity body or a relationship'});
    else findings.push({id,status:'passed',reason:`${actual} diagram present`,kind:actual});
  });
  return findings;
}
export function lintWireframe(html) {
  const text=String(html||'').trim();
  if(!text)return [{id:'wireframe',status:'incomplete',reason:'Empty wireframe'}];
  if(FORBIDDEN.test(text))return [{id:'wireframe',status:'failed',reason:'Wireframe must be an HTML fragment without html, head, body, or script tags'}];
  if(!MARKUP.test(text))return [{id:'wireframe',status:'incomplete',reason:'Wireframe needs semantic controls or headings'}];
  return [{id:'wireframe',status:'passed',reason:'Semantic HTML fragment'}];
}
function checkFile(root,entry,lint) {
  const findings=[];
  const file=inside(root,entry.path);
  if(!fs.existsSync(file) || !fs.statSync(file).isFile())return [{id:entry.id,status:'incomplete',reason:`Missing ${entry.path}`}];
  const bytes=fs.readFileSync(file);
  if(entry.sha256 && hash(bytes)!==entry.sha256)findings.push({id:entry.id,status:'failed',reason:`Digest mismatch: ${entry.path}`});
  findings.push(...lint(bytes.toString('utf8')).map(f=>({...f,id:f.id===entry.kind || f.id==='wireframe' || f.id==='mermaid'?entry.id:`${entry.id}:${f.id}`})));
  return findings;
}
export function checkVisualPlan(root,{item,plan}={}) {
  let planPath=plan;
  if(item) {
    const record=read(inside(root,item));
    planPath=typeof record.fields?.visualPlan==='string'?record.fields.visualPlan.trim():'';
    assert(planPath,'Work item has no visualPlan path');
  }
  assert(planPath,'Provide --plan FILE or a work item with fields.visualPlan');
  const data=validated('visual-plan',read(inside(root,planPath)));
  const surfaces=data.surfaces || [],diagrams=data.diagrams || [];
  const findings=[];
  if(!surfaces.length && !diagrams.length)findings.push({id:'content',status:'incomplete',reason:'Plan has no wireframes or diagrams'});
  const ids=[...surfaces,...diagrams,...(data.decisions || [])].map(e=>e.id);
  if(new Set(ids).size!==ids.length)findings.push({id:'ids',status:'failed',reason:'Duplicate visual-plan identifiers'});
  for(const surface of surfaces)findings.push(...checkFile(root,surface,lintWireframe));
  for(const diagram of diagrams)findings.push(...checkFile(root,diagram,source=>lintMermaid(source,{kind:diagram.kind})));
  for(const decision of data.decisions || []) {
    if(decision.status==='decided' && !String(decision.choice || '').trim())findings.push({id:decision.id,status:'incomplete',reason:'Decided question has no choice'});
    if(decision.recommended && !decision.options.includes(decision.recommended))findings.push({id:decision.id,status:'failed',reason:'Recommended option is not listed'});
    if(decision.choice && !decision.options.includes(decision.choice))findings.push({id:decision.id,status:'failed',reason:'Choice is not listed'});
  }
  const status=findings.some(f=>f.status==='failed')?'failed':findings.some(f=>f.status==='incomplete')?'incomplete':'passed';
  return {schemaVersion:1,status,reason:`Visual plan: ${status}`,plan:planPath,fidelity:data.fidelity,findings,exitCode:{passed:0,failed:1,incomplete:4}[status]};
}

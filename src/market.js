import fs from 'node:fs';
import path from 'node:path';
import {assert, read, create, inside, exclusive, validated, safeId} from './io.js';
import {parseFrontmatter} from './frontmatter.js';

export const DEFAULT_MARKET_PATH='.agenthouse/market';
const FILES=[
  {key:'opportunity',file:'opportunity.md',schema:'market-opportunity',sections:['Problem','Assumptions','Unresolved questions'],required:true},
  {key:'evidence',file:'evidence.md',schema:'market-evidence',sections:['Summary','Limitations'],required:true},
  {key:'signals',file:'buyer-signals.md',schema:'market-buyer-signals',sections:['Summary'],required:false},
  {key:'fit',file:'fit-assessment.md',schema:'market-fit-assessment',sections:['Decide','Recommendation','Missing'],required:true}
];
const EMAIL=/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE=/(?:\+|\b)\d[\d\s().-]{7,}\d\b/g;

export function marketPath(root) {
  const file=inside(root,'.agenthouse/config.json');
  const configured=fs.existsSync(file)?validated('config',read(file)).market?.path:undefined;
  const relative=(configured || DEFAULT_MARKET_PATH).replace(/\\/g,'/').replace(/\/+$/,'');
  return {relative,absolute:inside(root,relative)};
}
function opportunityFolder(root,id) {
  safeId(id);
  const base=marketPath(root);
  return {relative:`${base.relative}/${id}`,absolute:inside(root,`${base.relative}/${id}`)};
}

function sections(body,bodyStartLine) {
  const found=new Map();let current=null;
  body.split(/\r?\n/).forEach((text,index)=>{
    const heading=text.match(/^##\s+(.+?)\s*#*\s*$/);
    if(heading){current=heading[1].replace(/\(optional\)/i,'').trim().toLowerCase();if(!found.has(current))found.set(current,{line:bodyStartLine+index,text:''});return;}
    if(current)found.get(current).text+=text+'\n';
  });
  return found;
}
const meaningful=text=>text.replace(/<!--[\s\S]*?-->/g,'').trim().length>0;
const validDate=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

function personalData(text,file) {
  const warnings=[];
  text.split(/\r?\n/).forEach((line,index)=>{
    for(const match of line.match(EMAIL) || [])warnings.push({file,line:index+1,reason:`Possible email address (${match}); store pseudonymous participant or account ids and follow the organization's data policy`});
    for(const match of line.match(PHONE) || []) {
      if(match.replace(/\D/g,'').length>=9)warnings.push({file,line:index+1,reason:'Possible phone number; store pseudonymous participant or account ids and follow the organization\'s data policy'});
    }
  });
  return warnings;
}

function loadFile(folder,spec,findings,warnings) {
  const absolute=path.join(folder,spec.file);
  if(!fs.existsSync(absolute)) {
    if(spec.required)findings.push({file:spec.file,status:'incomplete',reason:`Missing ${spec.file}`});
    return null;
  }
  const text=fs.readFileSync(absolute,'utf8');
  warnings.push(...personalData(text,spec.file));
  let parsed;
  try {parsed=parseFrontmatter(text);}catch(error){findings.push({file:spec.file,status:'failed',reason:error.message});return null;}
  try {validated(spec.schema,parsed.data);}catch(error){findings.push({file:spec.file,status:'failed',reason:`Frontmatter does not match ${spec.schema}: ${error.message}`});return null;}
  const found=sections(parsed.body,parsed.bodyStartLine);
  for(const name of spec.sections) {
    const section=found.get(name.toLowerCase());
    if(!section)findings.push({file:spec.file,status:'incomplete',reason:`Missing section "## ${name}"`});
    else if(!meaningful(section.text))findings.push({file:spec.file,line:section.line,status:'incomplete',reason:`Section "## ${name}" is empty`});
  }
  return parsed.data;
}

function uniqueIds(items,label,file,findings) {
  const seen=new Set();
  for(const item of items) {
    if(seen.has(item.id))findings.push({file,id:item.id,status:'failed',reason:`Duplicate ${label} id ${item.id}`});
    seen.add(item.id);
  }
  return seen;
}
function dates(items,field,file,findings) {
  for(const item of items)if(item[field]!==undefined && !validDate(item[field]))findings.push({file,id:item.id,status:'failed',reason:`Invalid calendar date ${item[field]} in ${field}`});
}

function decisionStatus(fit) {
  if(!fit)return {status:'missing'};
  const values=['decidedBy','date','reference'].map(key=>String(fit.decision[key]).trim());
  const status=values.every(Boolean)?'recorded':values.some(Boolean)?'partial':'pending';
  return {status,decidedBy:fit.decision.decidedBy || null,date:fit.decision.date || null,reference:fit.decision.reference || null,
    note:'The go decision belongs to a person. This check does not record, verify, or approve it.'};
}

export function checkMarket(root,{id}={}) {
  assert(id,'--id required');
  const folder=opportunityFolder(root,id),findings=[],warnings=[];
  const docs={};
  if(!fs.existsSync(folder.absolute))findings.push({file:'.',status:'incomplete',reason:`No market opportunity at ${folder.relative}; run market new --id ${id}`});
  else for(const spec of FILES)docs[spec.key]=loadFile(folder.absolute,spec,findings,warnings);
  const {opportunity,evidence,signals,fit}=docs;
  const segments=opportunity?uniqueIds(opportunity.segments,'segment','opportunity.md',findings):new Set();
  const conditions=new Map((opportunity?.conditions || []).map(c=>[c.id,c]));
  const entries=new Map((evidence?.entries || []).map(e=>[e.id,e]));
  const signalIds=signals?uniqueIds(signals.signals,'signal','buyer-signals.md',findings):new Set();
  if(opportunity) {
    if(opportunity.id!==id)findings.push({file:'opportunity.md',status:'failed',reason:`Opportunity id ${opportunity.id} does not match folder ${id}`});
    if(!opportunity.segments.length)findings.push({file:'opportunity.md',status:'incomplete',reason:'No ICP segments defined'});
    uniqueIds(opportunity.conditions || [],'condition','opportunity.md',findings);
    dates(opportunity.conditions || [],'statedAt','opportunity.md',findings);
    for(const c of opportunity.conditions || [])if(c.segment && !segments.has(c.segment))findings.push({file:'opportunity.md',id:c.id,status:'failed',reason:`Condition ${c.id} refers to unknown segment ${c.segment}`});
  }
  for(const [key,file] of [['evidence','evidence.md'],['signals','buyer-signals.md'],['fit','fit-assessment.md']])
    if(docs[key] && docs[key].opportunity!==id)findings.push({file,status:'failed',reason:`opportunity ${docs[key].opportunity} does not match folder ${id}`});
  if(evidence) {
    uniqueIds(evidence.entries,'evidence','evidence.md',findings);
    dates(evidence.entries,'date','evidence.md',findings);
    if(!evidence.entries.length)findings.push({file:'evidence.md',status:'incomplete',reason:'No evidence entries recorded'});
    for(const e of evidence.entries) {
      if(opportunity && !segments.has(e.segment))findings.push({file:'evidence.md',id:e.id,status:'failed',reason:`Evidence ${e.id} refers to unknown segment ${e.segment}`});
      if(e.kind==='buyer-signal' && !e.promotedFrom)findings.push({file:'evidence.md',id:e.id,status:'failed',reason:`Evidence ${e.id} is a buyer signal but has no promotedFrom signal id`});
      if(e.promotedFrom && !signalIds.has(e.promotedFrom))findings.push({file:'evidence.md',id:e.id,status:'failed',reason:`Evidence ${e.id} is promoted from unknown buyer signal ${e.promotedFrom}`});
    }
  }
  if(signals) {
    dates(signals.signals,'date','buyer-signals.md',findings);
    for(const s of signals.signals)if(opportunity && !segments.has(s.segment))findings.push({file:'buyer-signals.md',id:s.id,status:'failed',reason:`Signal ${s.id} refers to unknown segment ${s.segment}`});
  }
  if(fit) {
    if(fit.assessedAt!==undefined && !validDate(fit.assessedAt))findings.push({file:'fit-assessment.md',status:'failed',reason:`Invalid calendar date ${fit.assessedAt} in assessedAt`});
    if(fit.recommendation==='pending' || fit.claimLevel==='none')findings.push({file:'fit-assessment.md',status:'incomplete',reason:'Fit assessment has no recommendation and claim level yet'});
    for(const segment of fit.segments)if(opportunity && !segments.has(segment))findings.push({file:'fit-assessment.md',status:'failed',reason:`Assessment refers to unknown segment ${segment}`});
    const seen=new Set();
    for(const result of fit.conditionResults) {
      if(seen.has(result.condition))findings.push({file:'fit-assessment.md',id:result.condition,status:'failed',reason:`Condition ${result.condition} is assessed more than once`});
      seen.add(result.condition);
      const condition=conditions.get(result.condition);
      if(!condition){findings.push({file:'fit-assessment.md',id:result.condition,status:'failed',reason:`Assessment refers to unknown condition ${result.condition}`});continue;}
      for(const ref of result.evidence) {
        const entry=entries.get(ref);
        if(!entry){findings.push({file:'fit-assessment.md',id:result.condition,status:'failed',reason:`Condition ${result.condition} cites unknown evidence ${ref}`});continue;}
        if(validDate(condition.statedAt) && validDate(entry.date) && condition.statedAt>entry.date)
          warnings.push({file:'fit-assessment.md',id:result.condition,reason:`Condition ${condition.id} was stated on ${condition.statedAt}, after evidence ${entry.id} dated ${entry.date}; confirm it was stated before results were known (Git history is the audit trail)`});
      }
      if(result.met && condition.kind==='stop' && fit.recommendation==='proceed')
        warnings.push({file:'fit-assessment.md',id:condition.id,reason:`Stop condition ${condition.id} is met but the recommendation is proceed`});
    }
    if(fit.recommendation==='proceed' || fit.claimLevel==='product-market-fit') {
      const supported=fit.conditionResults.some(r=>r.met && conditions.get(r.condition)?.kind==='success' && r.evidence.length>0 && r.evidence.every(ref=>entries.has(ref)));
      if(!supported)findings.push({file:'fit-assessment.md',status:'failed',reason:conditions.size
        ?`A ${fit.recommendation==='proceed'?'proceed recommendation':'product-market-fit claim'} needs at least one met success condition with linked evidence`
        :'No pre-stated conditions exist; state success and stop conditions in opportunity.md and recommend investigate until they are met'});
    }
  }
  const decision=decisionStatus(fit);
  if(decision.status==='partial')warnings.push({file:'fit-assessment.md',reason:'Decision fields are partially filled; a person records decidedBy, date, and reference together'});
  const status=findings.some(f=>f.status==='failed')?'failed':findings.some(f=>f.status==='incomplete')?'incomplete':'passed';
  return {schemaVersion:1,opportunity:id,path:folder.relative,status,recommendation:fit?.recommendation || null,claimLevel:fit?.claimLevel || null,decision,findings,warnings,
    limitation:'Checks structure, references, and pre-stated conditions only. It does not judge market truth or approve investment.',
    exitCode:{passed:0,failed:1,incomplete:4}[status]};
}

export function listMarket(root) {
  const base=marketPath(root);
  if(!fs.existsSync(base.absolute))return {schemaVersion:1,path:base.relative,opportunities:[],note:`No market folder at ${base.relative}. Run market new --id ID to start one.`};
  const opportunities=fs.readdirSync(base.absolute,{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>entry.name).sort()
    .filter(name=>fs.existsSync(path.join(base.absolute,name,'opportunity.md'))).map(name=>{
      try {
        const opportunity=parseFrontmatter(fs.readFileSync(path.join(base.absolute,name,'opportunity.md'),'utf8')).data;
        const fitFile=path.join(base.absolute,name,'fit-assessment.md');
        const fit=fs.existsSync(fitFile)?parseFrontmatter(fs.readFileSync(fitFile,'utf8')).data:null;
        return {id:name,title:opportunity.title || null,segments:Array.isArray(opportunity.segments)?opportunity.segments.length:0,
          recommendation:fit?.recommendation || null,claimLevel:fit?.claimLevel || null,decision:fit?.decision && typeof fit.decision==='object'?decisionStatus({decision:{decidedBy:'',date:'',reference:'',...fit.decision}}).status:'missing'};
      }catch(error){return {id:name,status:'unreadable',reason:error.message};}
    });
  return {schemaVersion:1,path:base.relative,opportunities};
}

function templates(id,title) {
  const quoted=JSON.stringify(title);
  return {
    'opportunity.md':`---
schemaVersion: 1
kind: market-opportunity
id: ${id}
title: ${quoted}
segments: []
# segments:
#   - id: seg-1
#     description: Who is in this segment
#     firmographics: Company size, industry, region, role
#     buyer: Who pays
#     user: Who uses it
#     decisionMaker: Who decides
#     job: The progress they are trying to make
#     pain: What hurts today
#     valueHypothesis: Why this would be better
#     willingnessToPay: Expected budget or price signal
#     channels: [How to reach them]
#     basis: assumption
conditions: []
# conditions:
#   - id: success-1
#     kind: success
#     segment: seg-1
#     statement: Pre-stated result that would justify proceeding
#     statedAt: YYYY-MM-DD
---

# ${title}

<!-- Tag each statement as evidence, assumption, or unresolved. Store people and accounts only as pseudonymous ids. -->

## Problem

<!-- Who has the problem, what happens today, and why it matters. -->

## Assumptions

<!-- Statements not yet backed by evidence. -->

## Unresolved questions

<!-- What must be learned before a recommendation. -->

## Alternatives and switching cost (optional)

## Trigger events (optional)

## Qualifiers and disqualifiers (optional)
`,
    'evidence.md':`---
schemaVersion: 1
kind: market-evidence
opportunity: ${id}
entries: []
# entries:
#   - id: ev-1
#     kind: interview
#     segment: seg-1
#     date: YYYY-MM-DD
#     source: Interview with participant P-01
#     sample: 1 participant
#     context: Where and how it was collected
#     observation: What was seen or said
#     interpretation: What the team thinks it means
#     limitation: What this sample cannot support
---

# Evidence: ${title}

<!-- Keep observation separate from interpretation. Promote buyer signals here only explicitly, with promotedFrom. -->

## Summary

<!-- What the evidence shows so far, by segment. -->

## Limitations

<!-- Sample size, bias, and what remains unknown. -->
`,
    'buyer-signals.md':`---
schemaVersion: 1
kind: market-buyer-signals
opportunity: ${id}
signals: []
# signals:
#   - id: sig-1
#     segment: seg-1
#     date: YYYY-MM-DD
#     account: ACCT-01
#     scope: single-account
#     goals: What the buyer wants to achieve
#     objections: What holds them back
#     unmetNeeds: What they need that is missing
---

# Buyer signals: ${title}

<!-- Single-account statements. They are not market evidence until explicitly promoted into evidence.md. -->

## Summary

<!-- Patterns worth investigating, without claiming representativeness. -->
`,
    'fit-assessment.md':`---
schemaVersion: 1
kind: market-fit-assessment
opportunity: ${id}
claimLevel: none
recommendation: pending
segments: []
conditionResults: []
# conditionResults:
#   - condition: success-1
#     met: false
#     evidence: [ev-1]
decision:
  decidedBy: ""
  date: ""
  reference: ""
---

# Fit assessment: ${title}

<!-- claimLevel: problem-exists, segment-fits, or product-market-fit. recommendation: proceed, revise, investigate, or stop. A person fills in decision. -->

## Decide

<!-- Recommendation, claim level, and the condition results that support them. -->

## Recommendation

<!-- Why, in a few sentences. -->

## Missing

<!-- Evidence or conditions still needed. -->
`
  };
}

export function newMarket(root,{id,title}={}) {
  assert(id,'--id required');
  const folder=opportunityFolder(root,id),files=templates(id,title || id);
  const conflicts=Object.keys(files).filter(name=>fs.existsSync(path.join(folder.absolute,name)));
  assert(!conflicts.length,`Market files already exist in ${folder.relative}: ${conflicts.join(', ')}. Nothing was written; edit the existing files instead.`);
  return exclusive(root,()=>{
    for(const [name,content] of Object.entries(files))create(path.join(folder.absolute,name),content);
    return {schemaVersion:1,status:'created',opportunity:id,path:folder.relative,files:Object.keys(files).map(name=>`${folder.relative}/${name}`),check:checkMarket(root,{id})};
  });
}

export function evaluateMarket(root,evaluator) {
  const result=checkMarket(root,{id:evaluator.opportunity});
  return {status:result.status,reason:`Market validation record ${result.path}: ${result.status}. Structure and references only; the go decision is ${result.decision.status}.`,findings:[...result.findings,...result.warnings.map(w=>({...w,status:'warning'}))]};
}

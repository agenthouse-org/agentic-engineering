import fs from 'node:fs';
import path from 'node:path';
import {assert, read, write, inside, PACKAGE, hash} from './io.js';
import {git} from './inspect.js';

const GITHUB_EVAL='.github/workflows/agenthouse-evaluate.yml';
const GITLAB_CI='.gitlab-ci.yml';
const JOB_CATALOG=[
  {id:'pull-request',profile:'pull-request',required:true,description:'Unit, integration, and contract checks for merge gates'},
  {id:'frontend',profile:'frontend',required:false,description:'Browser/interaction and frontend-acceptance checks'},
  {id:'release',profile:'release',required:false,description:'Release readiness profile'},
  {id:'post-deploy',profile:'post-deploy',required:false,description:'Optional post-deploy smoke'}
];

function origin(root) {
  return git(root,['remote','get-url','origin'],{optional:true}) || null;
}
function detectProvider(root,remote) {
  const github=fs.existsSync(path.join(root,'.github','workflows'));
  const gitlab=fs.existsSync(path.join(root,GITLAB_CI));
  if(remote?.includes('github.com') && !remote.includes('gitlab'))return 'github';
  if(/(^|\.)gitlab/.test(remote || ''))return 'gitlab';
  if(github && !gitlab)return 'github';
  if(gitlab && !github)return 'gitlab';
  return null;
}
function listGithubWorkflows(root) {
  const folder=path.join(root,'.github','workflows');
  if(!fs.existsSync(folder) || !fs.statSync(folder).isDirectory())return [];
  return fs.readdirSync(folder,{withFileTypes:true})
    .filter(entry=>entry.isFile() && /\.ya?ml$/i.test(entry.name))
    .map(entry=>`.github/workflows/${entry.name}`);
}
function text(root,relative) {
  const file=inside(root,relative);
  if(!fs.existsSync(file) || !fs.statSync(file).isFile())return null;
  return fs.readFileSync(file,'utf8');
}
function configProfiles(root) {
  const file=inside(root,'.agenthouse/config.json');
  if(!fs.existsSync(file))return [];
  try {
    const config=read(file);
    return Object.keys(config.profiles || {});
  } catch {
    return [];
  }
}
function template(name) {
  return fs.readFileSync(path.join(PACKAGE,'templates','ci',name),'utf8');
}
function selectedJobs(options={}) {
  const requested=options.jobs?String(options.jobs).split(',').map(s=>s.trim()).filter(Boolean):null;
  return JOB_CATALOG.filter(job=>{
    if(requested)return requested.includes(job.id);
    return job.required || job.id==='frontend';
  });
}
function renderMarkedTemplate(body,jobs) {
  const enabled=new Set(jobs.map(j=>j.id));
  const parts=body.split(/(?=^\s*#\s*ah-job:\s*\S+\s*$)/m);
  const kept=[];
  for(const part of parts) {
    const mark=part.match(/^\s*#\s*ah-job:\s*(\S+)\s*$/m);
    if(!mark) {kept.push(part);continue;}
    if(enabled.has(mark[1]))kept.push(part.replace(/^\s*#\s*ah-job:\s*\S+\s*\n/m,''));
  }
  return kept.join('').replace(/\n{3,}/g,'\n\n');
}
function renderGithub(jobs){return renderMarkedTemplate(template('github-multi.yml'),jobs);}
function renderGitlab(jobs){return renderMarkedTemplate(template('gitlab-multi.yml'),jobs);}

function publishFindings(provider,body,relative) {
  const findings=[];
  if(!body) {
    findings.push({id:`${relative}:missing`,status:'incomplete',reason:`Missing ${relative}`});
    return findings;
  }
  if(provider==='github') {
    if(!/upload-artifact@/.test(body))findings.push({id:`${relative}:artifacts`,status:'incomplete',reason:'GitHub job should upload evaluation artifacts with if: always()'});
    else findings.push({id:`${relative}:artifacts`,status:'passed',reason:'Artifact upload present'});
    if(/dorny\/test-reporter|EnricoMi\/publish-unit-test-result-action/.test(body))
      findings.push({id:`${relative}:third-party-reporter`,status:'passed',reason:'Optional third-party reporter present; confirm supply-chain review'});
  } else if(provider==='gitlab') {
    if(!/artifacts:\s*[\s\S]*reports:\s*[\s\S]*junit:/.test(body))
      findings.push({id:`${relative}:junit`,status:'incomplete',reason:'GitLab job should declare artifacts:reports:junit with a file glob'});
    else findings.push({id:`${relative}:junit`,status:'passed',reason:'JUnit report ingest declared'});
    if(!/when:\s*always/.test(body))
      findings.push({id:`${relative}:when`,status:'incomplete',reason:'Publish artifacts with when: always so failed runs retain evidence'});
    else findings.push({id:`${relative}:when`,status:'passed',reason:'Artifacts retained on failure'});
  }
  if(/continue-on-error:\s*true/.test(body) && /evaluate/.test(body))
    findings.push({id:`${relative}:mask`,status:'failed',reason:'Do not continue-on-error around evaluate; publishers must not mask gate status'});
  return findings;
}
function summarize(findings) {
  if(findings.some(f=>f.status==='failed'))return 'failed';
  if(findings.some(f=>f.status==='incomplete'))return 'incomplete';
  return 'ready';
}
function exitCode(status){return {ready:0,inapplicable:0,incomplete:4,failed:1}[status];}

export function pipelineJobs() {
  return {schemaVersion:1,jobs:JOB_CATALOG};
}

export function statusPipeline(root,options={}) {
  const remote=origin(root);
  const provider=options.provider || detectProvider(root,remote);
  const profiles=configProfiles(root);
  const findings=[];
  const workflows=provider==='github'?listGithubWorkflows(root):(provider==='gitlab'?[GITLAB_CI].filter(f=>fs.existsSync(inside(root,f))):[]);
  if(!provider) {
    findings.push({id:'provider',status:'incomplete',reason:'Could not detect GitHub Actions or GitLab CI; pass --provider'});
  } else {
    findings.push({id:'provider',status:'passed',reason:`Detected or selected ${provider}`});
  }
  for(const profile of ['pull-request','frontend','release']) {
    if(profiles.includes(profile))findings.push({id:`profile:${profile}`,status:'passed',reason:`Config defines profile ${profile}`});
    else if(profile==='pull-request')findings.push({id:`profile:${profile}`,status:'incomplete',reason:'Configure profiles.pull-request before a merge-gate job'});
  }
  const target=provider==='github'?GITHUB_EVAL:provider==='gitlab'?GITLAB_CI:null;
  if(target) {
    const body=text(root,target);
    if(!body && !workflows.some(w=>/agenthouse|evaluate/i.test(w)))
      findings.push({id:'workflow',status:'incomplete',reason:`No agenthouse evaluate workflow at ${target}; run pipeline create or plan`});
    findings.push(...publishFindings(provider,body || workflows.map(w=>text(root,w)).filter(Boolean).join('\n'),target));
  }
  const status=summarize(findings);
  return {
    schemaVersion:1,
    status,
    exitCode:exitCode(status),
    provider,
    remote,
    profiles,
    workflows,
    jobs:JOB_CATALOG,
    findings,
    nextSteps:status==='ready'?[]:['Review findings','Run pipeline plan then pipeline apply after review','Configure evaluate profiles via module/survey first']
  };
}

export function planPipeline(root,options={}) {
  const provider=options.provider || detectProvider(root,origin(root)) || 'github';
  assert(['github','gitlab'].includes(provider),'Choose --provider github or gitlab');
  const jobs=selectedJobs(options);
  const content=provider==='github'?renderGithub(jobs):renderGitlab(jobs);
  const target=options.workflow || (provider==='github'?GITHUB_EVAL:GITLAB_CI);
  const existing=text(root,target);
  const handoff={
    schemaVersion:1,
    kind:'pipeline-plan',
    provider,
    target,
    jobs:jobs.map(j=>j.id),
    baseDigest:existing?hash(existing):null,
    contentDigest:hash(content),
    content
  };
  const output=options.output || `.agenthouse/local/pipeline-plan-${provider}.json`;
  fs.mkdirSync(path.dirname(inside(root,output)),{recursive:true});
  write(inside(root,output),handoff);
  return {
    schemaVersion:1,
    status:existing?'review':'create',
    provider,
    target,
    jobs:jobs.map(j=>j.id),
    plan:output.replaceAll('\\','/'),
    wouldOverwrite:Boolean(existing),
    publishNotes:provider==='github'
      ?['upload-artifact with if: always()','JUnit is retained as a file; native GitHub test UI needs an opt-in reviewed reporter']
      :['artifacts:reports:junit with a file glob','artifacts:when: always'],
    exitCode:0
  };
}

export function createPipeline(root,options={}) {
  const provider=options.provider || detectProvider(root,origin(root)) || 'github';
  assert(['github','gitlab'].includes(provider),'Choose --provider github or gitlab');
  const jobs=selectedJobs(options);
  const target=options.workflow || (provider==='github'?GITHUB_EVAL:GITLAB_CI);
  const file=inside(root,target);
  if(fs.existsSync(file)) {
    return {
      schemaVersion:1,
      status:'incomplete',
      reason:`${target} already exists; use pipeline plan and apply after review`,
      target,
      written:[],
      exitCode:4
    };
  }
  const content=provider==='github'?renderGithub(jobs):renderGitlab(jobs);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,content);
  return {
    schemaVersion:1,
    status:'created',
    provider,
    target,
    jobs:jobs.map(j=>j.id),
    written:[target],
    exitCode:0
  };
}

export function applyPipeline(root,{plan}={}) {
  assert(plan,'--plan required');
  const handoff=read(inside(root,plan));
  assert(handoff.kind==='pipeline-plan' && handoff.content && handoff.target,'Invalid pipeline plan');
  const target=handoff.target;
  const file=inside(root,target);
  const existing=fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;
  if(existing && handoff.baseDigest && hash(existing)!==handoff.baseDigest) {
    return {
      schemaVersion:1,
      status:'incomplete',
      reason:`${target} changed since the plan was created; re-run pipeline plan`,
      target,
      written:[],
      exitCode:4
    };
  }
  if(existing && !handoff.baseDigest) {
    return {
      schemaVersion:1,
      status:'incomplete',
      reason:`${target} already exists; refuse to overwrite without a matching baseDigest plan`,
      target,
      written:[],
      exitCode:4
    };
  }
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,handoff.content);
  return {schemaVersion:1,status:'applied',target,provider:handoff.provider,jobs:handoff.jobs,written:[target],exitCode:0};
}

export function publishPipeline(root,options={}) {
  const status=statusPipeline(root,options);
  const publish=status.findings.filter(f=>/artifacts|junit|when|mask|third-party/.test(f.id));
  const ready=publish.every(f=>f.status==='passed') && !status.findings.some(f=>f.status==='failed');
  return {
    schemaVersion:1,
    status:ready?'ready':status.status,
    exitCode:ready?0:status.exitCode,
    provider:status.provider,
    findings:publish.length?publish:status.findings,
    rules:[
      'evaluate generates junit.xml, result.json, and report.html',
      'pipeline jobs must publish those artifacts; publication must not rewrite failed or incomplete gates to pass',
      'GitLab: artifacts:reports:junit with a file glob and when: always',
      'GitHub: upload-artifact including junit; native parsed views are opt-in after supply-chain review'
    ],
    nextSteps:ready?[]:['Fix publish findings via pipeline plan/apply','Do not add continue-on-error around evaluate']
  };
}

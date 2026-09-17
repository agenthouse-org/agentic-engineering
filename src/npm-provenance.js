import fs from 'node:fs';
import path from 'node:path';
import {assert,read,write,create,inside,PACKAGE} from './io.js';
import {git} from './inspect.js';

const GITHUB_WORKFLOW='.github/workflows/publish-npm.yml';
const GITLAB_CI='.gitlab-ci.yml';
function pkg(root) {
  const file=inside(root,'package.json');
  if(!fs.existsSync(file) || !fs.statSync(file).isFile())return null;
  return read(file);
}
function origin(root) {
  return git(root,['remote','get-url','origin'],{optional:true}) || null;
}
export function normalizeRepository(url) {
  if(!url || typeof url!=='string')return null;
  let value=url.trim().replace(/^git\+/,'').replace(/^ssh:\/\//,'');
  value=value.replace(/^git@([^:]+):/,'https://$1/');
  return value.replace(/\.git$/i,'').replace(/\/+$/,'') || null;
}
function packageRepository(data) {
  const value=data?.repository;
  if(typeof value==='string')return value;
  if(value && typeof value==='object' && typeof value.url==='string')return value.url;
  return null;
}
export function publishRepositoryUrl(remote) {
  const https=normalizeRepository(remote);
  return https?`git+${https}.git`:null;
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
function hasNpmPublish(body){return /\bnpm(?:\.cmd)?\s+(?:publish|stage\s+publish)\b/.test(body);}
function hasIdToken(body){return /id-token:\s*write\b/i.test(body) || /\bid_tokens\s*:/.test(body);}
function hasProvenanceFlag(body){return /--provenance\b/.test(body) || /NPM_CONFIG_PROVENANCE\s*=\s*true\b/.test(body) || /^\s*provenance\s*=\s*true\b/m.test(body);}
function hasNpmToken(body){return /secrets\.NPM_TOKEN|\bNODE_AUTH_TOKEN\b|\/:_authToken/.test(body);}
function hasSelfHosted(body){return /\bself-hosted\b/.test(body);}
function hasCloudRunner(body){return /runs-on:\s*(?:\[?\s*)?(ubuntu|macos|windows)-(latest|\d+)/.test(body) || /image:\s*['"]?node:/.test(body);}
function detectProvider(root,remote,files) {
  const github=files.some(file=>file.startsWith('.github/workflows/'));
  const gitlab=files.includes(GITLAB_CI);
  if(remote?.includes('github.com') && !remote.includes('gitlab'))return 'github';
  if(/(^|\.)gitlab/.test(remote || ''))return 'gitlab';
  if(github && !gitlab)return 'github';
  if(gitlab && !github)return 'gitlab';
  return null;
}
function template(name,access) {
  const body=fs.readFileSync(path.join(PACKAGE,'templates','npm-provenance',name),'utf8');
  return access==='restricted'?body.replaceAll('--access public','--access restricted'):body;
}
function workflowTarget(provider,workflow) {
  if(workflow)return workflow.replaceAll('\\','/');
  return provider==='gitlab'?GITLAB_CI:GITHUB_WORKFLOW;
}
function inspectWorkflow(relative,body,method,configProvenance) {
  const findings=[];
  if(!hasNpmPublish(body))return {publishes:false,findings};
  findings.push({id:`${relative}:publish`,status:'passed',reason:`${relative} runs npm publish`});
  if(hasSelfHosted(body) && !hasCloudRunner(body))
    findings.push({id:`${relative}:runner`,status:'failed',reason:`${relative} uses a self-hosted runner; provenance needs GitHub-hosted or GitLab.com shared runners`});
  else if(!hasCloudRunner(body))
    findings.push({id:`${relative}:runner`,status:'incomplete',reason:`${relative} has no cloud-hosted runner`});
  else findings.push({id:`${relative}:runner`,status:'passed',reason:`${relative} uses a cloud-hosted runner`});
  if(!hasIdToken(body))
    findings.push({id:`${relative}:oidc`,status:'incomplete',reason:`${relative} is missing id-token: write or GitLab id_tokens`});
  else findings.push({id:`${relative}:oidc`,status:'passed',reason:`${relative} can mint an OIDC token`});
  if(method==='token' || hasNpmToken(body)) {
    if(!(hasProvenanceFlag(body) || configProvenance===true))
      findings.push({id:`${relative}:flag`,status:'incomplete',reason:`${relative} publishes with a token and has no provenance flag`});
    else findings.push({id:`${relative}:flag`,status:'passed',reason:`${relative} requests provenance on publish`});
  }
  return {publishes:true,findings};
}
function summarize(findings) {
  if(findings.some(item=>item.status==='failed'))return 'failed';
  if(findings.some(item=>item.status==='incomplete'))return 'incomplete';
  return 'ready';
}
function exitCode(status){return {ready:0,inapplicable:0,incomplete:4,failed:1}[status];}
function nextSteps({status,provider,method,target,packageName,hasPublishJob,tokenPresent}) {
  const steps=[];
  if(status==='inapplicable')return steps;
  if(!hasPublishJob)steps.push(`Add a cloud CI publish job (npm-provenance apply --provider ${provider || 'github'}).`);
  if(method==='trusted') {
    steps.push('On npmjs.com, add a trusted publisher for this package: GitHub org/user, repository, and workflow filename only (for example publish-npm.yml), or the GitLab namespace, project, and CI file path.');
    steps.push('Allow npm publish (or npm stage publish) on that trusted publisher. npm does not check the settings until a real publish.');
    if(packageName)steps.push(`Trusted publisher package: ${packageName}.`);
    if(target)steps.push(`Workflow filename to enter on npmjs.com: ${path.posix.basename(target)}.`);
    steps.push('Use npm CLI 11.5.1 or newer and Node.js 22.14 or newer in the publish job. Provenance is attached automatically for a public package from a public repository; do not add --provenance or an npm publish token.');
    if(tokenPresent)steps.push('After the first trusted publish succeeds, restrict token publishing on npmjs.com and remove unused automation tokens.');
  }else {
    steps.push('Token publishing still needs id-token: write, a cloud-hosted runner, and --provenance (or publishConfig.provenance). Prefer trusted publishing so provenance is automatic and no long-lived publish token is stored.');
    steps.push('Use npm CLI 9.5.0 or newer. Store NPM_TOKEN only in the CI secret store; never commit it.');
  }
  steps.push('This command does not publish, create npm tokens, or change npmjs.com. A dry-run cannot prove OIDC authorization.');
  return steps;
}
export function statusNpmProvenance(root,options={}) {
  const data=pkg(root),findings=[],remote=origin(root);
  const method=options.publish==='token'?'token':'trusted';
  if(!data) {
    findings.push({id:'package',status:'inapplicable',reason:'No package.json; npm provenance applies to an npm package'});
    const status='inapplicable';
    return {schemaVersion:1,status,exitCode:exitCode(status),method,package:null,remote,provider:null,workflows:[],findings,written:[],requiredEdits:[],nextSteps:[],
      limitations:['Local inspection only; npmjs.com trusted-publisher settings are not read.','Provenance is not a safety proof for package contents.']};
  }
  const name=typeof data.name==='string'?data.name:null;
  const privatePkg=data.private===true;
  const repository=packageRepository(data);
  const configProvenance=data.publishConfig && typeof data.publishConfig==='object'?data.publishConfig.provenance:undefined;
  if(!name)findings.push({id:'package',status:'incomplete',reason:'package.json has no name'});
  else if(privatePkg)findings.push({id:'package',status:'inapplicable',reason:`${name} is private; provenance is for a public package from a public repository`});
  else findings.push({id:'package',status:'passed',reason:`Public npm package ${name}`});
  const normalizedPackage=normalizeRepository(repository),normalizedRemote=normalizeRepository(remote);
  if(!repository)findings.push({id:'repository',status:'incomplete',reason:'package.json has no repository URL; it must match the public source that publishes, case-sensitive'});
  else if(normalizedRemote && normalizedPackage!==normalizedRemote)
    findings.push({id:'repository',status:'failed',reason:`package.json repository ${repository} does not match git origin ${remote}`});
  else findings.push({id:'repository',status:'passed',reason:'package.json repository matches the publish source'});
  if(configProvenance===false)
    findings.push({id:'publishConfig',status:'failed',reason:'publishConfig.provenance is false, which disables provenance'});
  else if(configProvenance===true)
    findings.push({id:'publishConfig',status:'passed',reason:'publishConfig.provenance is true'});
  const files=[...listGithubWorkflows(root),...(text(root,GITLAB_CI)!==null?[GITLAB_CI]:[])];
  if(fs.existsSync(path.join(root,'.circleci','config.yml')))
    findings.push({id:'circleci',status:'incomplete',reason:'CircleCI trusted publishing does not generate provenance attestations; use GitHub Actions or GitLab.com CI for provenance'});
  const provider=options.provider || detectProvider(root,remote,files);
  let hasPublishJob=false,tokenPresent=false;
  for(const file of files) {
    const body=text(root,file);if(body===null)continue;
    const inspected=inspectWorkflow(file,body,method,configProvenance===true);
    if(inspected.publishes)hasPublishJob=true;
    if(hasNpmToken(body))tokenPresent=true;
    findings.push(...inspected.findings);
  }
  if(!privatePkg && name && !hasPublishJob)
    findings.push({id:'workflow',status:'incomplete',reason:'No GitHub Actions or GitLab CI job runs npm publish'});
  const resolved=privatePkg?'inapplicable':summarize(findings);
  const target=hasPublishJob?files.find(file=>hasNpmPublish(text(root,file) || '')):workflowTarget(provider || 'github',options.workflow);
  return {
    schemaVersion:1,status:resolved,exitCode:exitCode(resolved),method,provider:provider || null,
    package:{name,private:privatePkg,repository:repository || null,provenance:configProvenance===undefined?null:configProvenance},
    remote,workflows:files,target,findings,written:[],requiredEdits:[],
    nextSteps:nextSteps({status:resolved,provider,method,target,packageName:name,hasPublishJob,tokenPresent}),
    limitations:['Local files only; this does not read npmjs.com, publish, or verify Sigstore.','Provenance links a public package to its public source and build job; it does not mean the contents are safe.','Self-hosted runners, private repositories, and CircleCI publishes do not receive npm provenance.']
  };
}
function requiredWorkflowEdits(relative,body,method) {
  const edits=[];
  if(!hasCloudRunner(body) || hasSelfHosted(body) && !hasCloudRunner(body))
    edits.push({path:relative,need:'Use a GitHub-hosted or GitLab.com shared runner for the publish job'});
  if(!hasIdToken(body))
    edits.push({path:relative,need:relative.startsWith('.github/')?'Add permissions.id-token: write on the publish job':'Add id_tokens.NPM_ID_TOKEN (aud npm:registry.npmjs.org) and id_tokens.SIGSTORE_ID_TOKEN (aud sigstore)'});
  if(method==='token' && !hasProvenanceFlag(body))
    edits.push({path:relative,need:'Add --provenance to npm publish, or set NPM_CONFIG_PROVENANCE=true'});
  return edits;
}
export function applyNpmProvenance(root,options={}) {
  const data=pkg(root);
  assert(data,'No package.json; npm provenance applies to an npm package');
  assert(data.private!==true,'package.json is private; provenance applies to a public package from a public repository');
  const method=options.publish==='token'?'token':options.publish==='trusted' || !options.publish?'trusted':null;
  assert(method,'--publish must be trusted or token');
  const access=options.access || 'public';
  assert(['public','restricted'].includes(access),'--access must be public or restricted');
  const remote=origin(root);
  const files=[...listGithubWorkflows(root),...(text(root,GITLAB_CI)!==null?[GITLAB_CI]:[])];
  const provider=options.provider || detectProvider(root,remote,files);
  assert(provider,'Specify --provider github or gitlab');
  assert(['github','gitlab'].includes(provider),'--provider must be github or gitlab');
  const target=workflowTarget(provider,options.workflow);
  assert(target==='.gitlab-ci.yml' || target.startsWith('.github/workflows/') && /\.ya?ml$/i.test(target),`Refusing workflow path ${target}`);
  const written=[],requiredEdits=[],packageUpdates=[];
  if(!packageRepository(data)) {
    const url=publishRepositoryUrl(remote);
    assert(url,'package.json has no repository and git origin is unavailable');
    data.repository={type:'git',url};
    packageUpdates.push('repository');
  }
  if(method==='token') {
    data.publishConfig && assert(typeof data.publishConfig==='object' && !Array.isArray(data.publishConfig),'Invalid publishConfig');
    data.publishConfig={...(data.publishConfig || {})};
    assert(data.publishConfig.provenance!==false,'publishConfig.provenance is false');
    if(data.publishConfig.provenance!==true){data.publishConfig.provenance=true;packageUpdates.push('publishConfig.provenance');}
  }
  if(packageUpdates.length)write(inside(root,'package.json'),data);
  const existing=text(root,target);
  const templateName=provider==='gitlab'?method==='token'?'gitlab-token.yml':'gitlab.yml':method==='token'?'github-token.yml':'github.yml';
  const body=template(templateName,access);
  const publishFiles=files.filter(file=>hasNpmPublish(text(root,file) || ''));
  if(existing===null && publishFiles.length && !options.workflow) {
    for(const file of publishFiles)requiredEdits.push(...requiredWorkflowEdits(file,text(root,file),method).map(edit=>({...edit,snippet:body})));
  }else if(existing===null) {
    create(inside(root,target),body);
    written.push(target);
  }else if(existing!==body) {
    if(!hasNpmPublish(existing))requiredEdits.push({path:target,need:'File exists without npm publish and was not overwritten',snippet:body});
    else requiredEdits.push(...requiredWorkflowEdits(target,existing,method).map(edit=>({...edit,snippet:body})));
  }
  const result=statusNpmProvenance(root,{...options,provider,publish:method,workflow:target});
  if(requiredEdits.length && result.status==='ready')result.status='incomplete';
  if(requiredEdits.length && result.exitCode===0)result.exitCode=4;
  return {...result,method,access,written,requiredEdits,packageUpdates,
    nextSteps:requiredEdits.length
      ?[`Review required edits in ${requiredEdits.map(item=>item.path).join(', ')} without overwriting unrelated CI.`, ...result.nextSteps]
      :result.nextSteps};
}

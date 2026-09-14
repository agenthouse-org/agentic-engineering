'use strict';

// Versioned engineering-event contract. No project policy is embedded here.
const path = require('node:path');
const fs = require('node:fs');

function normalize(vendor, raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('Invalid hook payload');
  const name = raw.hook_event_name || raw.event || raw.eventName;
  const events = {SessionStart:'session',PreToolUse:'before-command',PostToolUse:'after-edit',beforeShellExecution:'before-command',afterFileEdit:'after-edit'};
  const event = events[name] || name;
  if (!['session','before-command','after-edit'].includes(event)) throw Error('Unsupported hook event');
  return {vendor,event,tool:raw.tool_name || raw.toolName,command:raw.tool_input?.command || raw.command,
    file:raw.tool_input?.file_path || raw.tool_input?.path || raw.file_path || raw.path || raw.file,cwd:raw.cwd};
}
function tokens(command) {
  if (typeof command !== 'string') throw Error('Missing command');
  // Shell expansion cannot be interpreted safely by a policy matcher.
  if (/`|\$\(|\$\{|\r|\n/.test(command)) throw Error('Dynamic shell expansion requires separate review');
  const parts=command.match(/"(?:\\.|[^"\\])*"|'[^']*'|&&|\|\||[;|&]|[^\s;|&]+/g) || [];
  return parts.map(t=>t.replace(/^(['"])(.*)\1$/,'$2'));
}
function guard(command, policy, branch) {
  let words;
  try {words=tokens(command);} catch(e) {return {status:'denied',reason:e.message};}
  const protectedBranches=policy.protectedBranches || [];
  for(let i=0;i<words.length;i++) {
    if (!/(^|[\\/])git(?:\.exe)?$/i.test(words[i]))continue;
    const end=words.findIndex((t,j)=>j>i && [';','&&','||','|','&'].includes(t)),segment=words.slice(i+1,end<0?undefined:end);
    if(policy.blockNoVerify!==false && (segment.includes('--no-verify') || (segment.includes('commit')&&segment.includes('-n'))))return {status:'denied',reason:'Repository verification bypass is disabled'};
    if(segment.includes('push')) {
      const push=segment.slice(segment.indexOf('push')+1);
      const force=push.some(t=>/^--force(?:=|-with-lease|-if-includes|$)/.test(t)||/^-[A-Za-z]*f/.test(t)||t.startsWith('+'));
      if(force && protectedBranches.length) {
        const refs=push.filter(t=>!t.startsWith('-'));
        const target=refs.length>1?refs.slice(1).map(t=>t.replace(/^\+/,'').split(':').at(-1).replace(/^refs\/heads\//,'')):[branch];
        if(segment.includes('-C') || segment.includes('--git-dir') || push.includes('--all') || push.includes('--mirror') || target.some(t=>!t || t==='HEAD' || t.includes('*') || protectedBranches.includes(t)))return {status:'denied',reason:'Force push may rewrite a protected branch'};
      }
    }
  }
  return {status:'allowed',reason:'No configured command restriction matched'};
}
async function handle(event, policy, context) {
  if(event.event==='session')return {status:'allowed',message:context.enrolled?`agenthouse active. Stacks: ${(context.stacks || []).join(', ') || 'unspecified'}. Read .agenthouse/agent-commands.md. Standards: ${(context.standards || []).join('; ') || 'use project policy'}.`:'Use ah-onboard to configure this repository before relying on engineering gates.'};
  if(event.event==='before-command') {
    if(!event.command && event.tool && !/bash|shell|exec/i.test(event.tool))return {status:'allowed'};
    return guard(event.command,policy,context.branch);
  }
  if(!event.file)return {status:'allowed'};
  const root=path.resolve(context.root),file=path.resolve(root,event.file),relative=path.relative(root,file);
  if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Edited path outside repository');
  let current=root;
  for(const part of relative.split(path.sep)){current=path.join(current,part);if(fs.existsSync(current)&&fs.lstatSync(current).isSymbolicLink())throw Error('Symlink edit target is unsupported');}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())return {status:'allowed'};
  if(relative.split(path.sep).some(p=>['.git','node_modules','vendor'].includes(p)))return {status:'allowed'};
  const checks=[];
  for(const check of policy.checks || []) {
    if(!Array.isArray(check.extensions)||!check.extensions.includes(path.extname(file)))continue;
    if(check.available && !fs.existsSync(path.resolve(root,check.available)))continue;
    if(typeof check.executable!=='string'||!Array.isArray(check.args))throw Error('Invalid touched-file check');
    const result=await context.run(check.executable,check.args.map(a=>a==='{file}'?relative:a),{cwd:root,timeoutSeconds:check.timeoutSeconds || 45});
    checks.push({id:check.id,status:result.error?'error':result.code===0?'passed':'failed',...result});
  }
  return {status:checks.some(c=>c.status!=='passed')?'failed':'allowed',checks};
}
function render(vendor,event,result) {
  const message=result.message || result.reason || result.checks?.filter(c=>c.status!=='passed').map(c=>`${c.id}: ${c.error || c.stderr || c.stdout}`).join('\n') || '';
  if(vendor==='claude') {
    if(event==='before-command' && result.status==='allowed')return {exitCode:0,stdout:'{}'};
    if(event==='before-command')return {exitCode:0,stdout:JSON.stringify({hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:result.status==='allowed'?'allow':'deny',permissionDecisionReason:message}})};
    if(event==='after-edit'&&result.status!=='allowed')return {exitCode:2,stderr:message};
    return {exitCode:0,stdout:message};
  }
  if(vendor==='ci')return {exitCode:result.status==='allowed'?0:result.status==='error'?2:1,stdout:JSON.stringify(result)};
  if(vendor==='cursor')return {exitCode:0,stdout:JSON.stringify({continue:result.status==='allowed',permission:result.status==='allowed'?'allow':'deny',user_message:message,agent_message:message})};
  throw Error('Unsupported engineering hook vendor');
}
module.exports={contractVersion:1,normalize,guard,handle,render};

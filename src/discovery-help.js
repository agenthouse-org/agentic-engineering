import fs from 'node:fs';
import path from 'node:path';
import {PACKAGE,read} from './io.js';

function baselineFiles(kind) {
  const dir=path.join(PACKAGE,'baselines',kind);
  return fs.readdirSync(dir).filter(name=>name.endsWith('.json')).sort()
    .map(name=>({id:name.slice(0,-5),value:read(path.join(dir,name))}));
}

function skillLabel(id) {
  return id.startsWith('ah-')?id:`ah-${id}`;
}

function commandFromSkill(id) {
  return id.startsWith('ah-')?id.slice(3):id;
}

function bullets(items) {
  return (items||[]).map(item=>`- ${item}`).join('\n') || '- _(none)_';
}

export function roleMarkdown(id) {
  const file=path.join(PACKAGE,'baselines','roles',`${id}.json`);
  if(!fs.existsSync(file))return null;
  const role=read(file);
  return `# ${role.title}

**Id:** \`${role.id}\`

${role.summary}

## Purpose

${role.purpose}

## Responsibilities

${bullets(role.responsibilities)}

## Boundaries

${bullets(role.boundaries)}

## Decision rights

${bullets(role.decisionRights)}

## Processes

${bullets((role.processes||[]).map(p=>`\`${p}\``))}

## Skills

${bullets((role.skills||[]).map(s=>`\`${skillLabel(s.id)}\``))}

## Methods

${(role.methods||[]).length?role.methods.map(m=>`- **${m.name}** — ${m.use} (${m.reference})`).join('\n'):'- _(none)_'}

Role guidance is advisory. Decision rights do not grant credentials or governance approval.

\`\`\`text
ah-engineering roles use --id ${role.id}
\`\`\`
`;
}

export function processMarkdown(id) {
  const file=path.join(PACKAGE,'baselines','processes',`${id}.json`);
  if(!fs.existsSync(file))return null;
  const proc=read(file);
  const stages=(proc.stages||[]).map(stage=>`### ${stage.id}\n\n${stage.purpose}\n\nOutputs:\n${bullets(stage.outputs)}`).join('\n\n');
  return `# ${proc.title}

**Id:** \`${proc.id}\`

${proc.summary}

${proc.entryConditions?.length?`## Entry conditions\n\n${bullets(proc.entryConditions)}\n`:''}${proc.steps?.length?`## Steps\n\n${bullets(proc.steps)}\n`:''}${proc.outputs?.length?`## Outputs\n\n${bullets(proc.outputs)}\n`:''}## Roles

${bullets((proc.roles||[]).map(r=>`\`${r}\``))}

## Skills

${bullets((proc.skills||[]).map(s=>`\`${skillLabel(s)}\``))}

${stages?`## Stages\n\n${stages}\n`:''}${proc.subprocesses?.length?`## Subprocesses\n\n${bullets(proc.subprocesses.map(s=>`\`${s}\``))}\n`:''}${proc.statusAuthority?`## Status authority\n\n${proc.statusAuthority}\n`:''}
Process guidance is advisory. \`process start\` does not create tracker state or approve transitions.

\`\`\`text
ah-engineering process start --id ${proc.id}
\`\`\`
`;
}

export function rolesIndexMarkdown() {
  const roles=baselineFiles('roles');
  const rows=roles.map(({id,value})=>`| \`${id}\` | ${value.title} | ${value.summary} |`).join('\n');
  return `# Roles

Discover and load role guidance. Role descriptions do not grant approval.

| Id | Title | Summary |
| --- | --- | --- |
${rows}

## Commands

\`\`\`text
ah-engineering roles list
ah-engineering roles show --id ROLE_ID
ah-engineering roles use --id ROLE_ID
ah-engineering help role ROLE_ID
\`\`\`

See also: \`help processes\`, \`help map\`.
`;
}

export function processesIndexMarkdown() {
  const processes=baselineFiles('processes');
  const rows=processes.map(({id,value})=>`| \`${id}\` | ${value.title} | ${value.summary} |`).join('\n');
  return `# Product processes

Process definitions orient work. They do not own external status or approvals.

| Id | Title | Summary |
| --- | --- | --- |
${rows}

## Commands

\`\`\`text
ah-engineering process list
ah-engineering process show --id PROCESS_ID
ah-engineering process start --id PROCESS_ID
ah-engineering process where --description "current evidence"
ah-engineering help process PROCESS_ID
\`\`\`

Each \`help process PROCESS_ID\` topic renders the process as Markdown.

See also: \`help roles\`, \`help map\`.
`;
}

function collectAffinity() {
  const byCommand=new Map();
  const touch=(command,role,processId,use)=>{
    if(!command)return;
    const key=commandFromSkill(command);
    if(!byCommand.has(key))byCommand.set(key,{command:key,roles:new Set(),processes:new Set(),use:''});
    const row=byCommand.get(key);
    if(role)row.roles.add(role);
    if(processId)row.processes.add(processId);
    if(use && !row.use)row.use=use;
  };
  for(const {id,value} of baselineFiles('roles')) {
    for(const skill of value.skills||[])touch(skill.id,id,null);
    for(const processId of value.processes||[]) {
      for(const skill of value.skills||[])touch(skill.id,id,processId);
    }
  }
  for(const {id,value} of baselineFiles('processes')) {
    for(const skill of value.skills||[]) {
      touch(skill,null,id);
      for(const role of value.roles||[])touch(skill,role,id);
    }
  }
  const discovery=read(path.join(PACKAGE,'baselines','skill-discovery.json'));
  for(const entry of discovery.skills||[]) {
    for(const role of entry.roles||[])for(const processId of entry.processes||[])touch(entry.id,role,processId,entry.use);
    for(const role of entry.roles||[])touch(entry.id,role,null,entry.use);
    for(const processId of entry.processes||[])touch(entry.id,null,processId,entry.use);
  }
  return [...byCommand.values()].sort((a,b)=>a.command.localeCompare(b.command));
}

export function mapMarkdown() {
  const rows=collectAffinity().map(row=>{
    const name=`ah-${row.command}`;
    const roles=[...row.roles].sort().map(r=>`\`${r}\``).join(', ') || '—';
    const processes=[...row.processes].sort().map(p=>`\`${p}\``).join(', ') || '—';
    const use=(row.use || `See \`help ${name}\``).replace(/\|/g,'/');
    return `| \`${name}\` | ${roles} | ${processes} | ${use} |`;
  }).join('\n');
  return `# Command support map

Which packaged skills commonly support which roles and processes. Derived from role baselines, process baselines, and skill discovery. Advisory only — a role does not unlock a command or grant approval.

| Command | Roles | Processes | Use |
| --- | --- | --- | --- |
${rows}

## Discover more

\`\`\`text
ah-engineering help
ah-engineering help roles
ah-engineering help processes
ah-engineering help role architect
ah-engineering help process feature-request
ah-engineering help agents
ah-engineering help cookbook
\`\`\`
`;
}

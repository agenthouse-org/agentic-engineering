import fs from 'node:fs';
import path from 'node:path';
import {agentSkills} from '../src/agent-commands.js';
import {PACKAGE,write,assert} from '../src/io.js';
const check=process.argv.includes('--check');
for(const [name,content] of Object.entries(agentSkills())) {
  const file=path.join(PACKAGE,'skills',name,'SKILL.md');
  if(check)assert(fs.existsSync(file) && fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')===content,`Regenerate agent skill: ${name}`);
  else write(file,content);
}
console.log(`${Object.keys(agentSkills()).length} agent command skills ${check?'verified':'generated'}.`);

import fs from 'node:fs';
import path from 'node:path';
import {PACKAGE,walk,read,assert} from '../src/io.js';
const roots=read(path.join(PACKAGE,'package.json')).files;
let count=0;
for(const root of roots) {
  const full=path.join(PACKAGE,root);assert(fs.existsSync(full),`Missing published path: ${root}`);
  const files=fs.statSync(full).isDirectory()?walk(full).map(f=>`${root}/${f}`):[root];
  for(const file of files) {
    assert(!file.startsWith('input/'),'Private reference material in package');
    const text=fs.readFileSync(path.join(PACKAGE,file),'utf8');
    assert(!/A&O|LCSI|lcsi\.center|ao-ai-engineering|ao-ai-skill-manager/.test(text),`Private identifier in ${file}`);
    count++;
  }
}
for(const file of walk(path.join(PACKAGE,'schemas')))JSON.parse(fs.readFileSync(path.join(PACKAGE,'schemas',file),'utf8'));
console.log(`Release allowlist checked: ${count} files; schemas parse; no private input identifiers.`);

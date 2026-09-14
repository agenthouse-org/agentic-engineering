import fs from 'node:fs';
import path from 'node:path';
import {PACKAGE,walk,read,assert} from '../src/io.js';
import {verifyDependency,SOURCES} from '../src/dependencies.js';
const roots=read(path.join(PACKAGE,'package.json')).files;
const privatePattern=process.env.AH_RELEASE_DENY_FILE?new RegExp(fs.readFileSync(process.env.AH_RELEASE_DENY_FILE,'utf8').trim()):null;
const secrets=/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}/;
function inspect(text,file){assert(!secrets.test(text),'Credential pattern in '+file);if(privatePattern)assert(!privatePattern.test(text),'Private release pattern in '+file);}
let count=0;
for(const root of roots) {
  const full=path.join(PACKAGE,root);assert(fs.existsSync(full),`Missing published path: ${root}`);
  const files=fs.statSync(full).isDirectory()?walk(full).map(f=>`${root}/${f}`):[root];
  for(const file of files) {
    assert(!file.startsWith('input/'),'Private reference material in package');
    const text=fs.readFileSync(path.join(PACKAGE,file),'utf8');
    inspect(text,file);
    count++;
  }
}
for(const file of walk(path.join(PACKAGE,'schemas')))JSON.parse(fs.readFileSync(path.join(PACKAGE,'schemas',file),'utf8'));
for(const id of Object.keys(SOURCES)) {
  const dependency=read(path.join(PACKAGE,'dependencies',id+'.json'));verifyDependency(dependency);
  for(const [file,bytes] of Object.entries(dependency.files))inspect(Buffer.from(bytes,'base64').toString('utf8'),id+'/'+file);
}
const version=read(path.join(PACKAGE,'package.json')).version;
for(const file of ['.codex-plugin/plugin.json','.claude-plugin/plugin.json'])assert(read(path.join(PACKAGE,file)).version===version,'Plugin version mismatch');
console.log('Release allowlist checked: '+count+' files; dependency integrity, plugin versions and schema parsing verified.');

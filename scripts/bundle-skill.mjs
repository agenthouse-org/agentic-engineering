// Maintainer tool: read immutable Git objects, never the working-tree copy.
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {write,hash,assert} from '../src/io.js';
import {verifyDependency,SOURCES} from '../src/dependencies.js';
const [repo,revision,output,id='frontend-acceptance']=process.argv.slice(2);
assert(repo && revision && output,'Usage: node scripts/bundle-skill.mjs REPO REVISION OUTPUT');
const git=(...args)=>execFileSync('git',['-C',path.resolve(repo),...args],{windowsHide:true});
const commit=git('rev-parse','--verify',`${revision}^{commit}`).toString().trim();
const sourcePath=SOURCES[id];assert(sourcePath,'Unknown bundled skill');
const entries=git('ls-tree','-r',commit,'--',sourcePath).toString().trim().split('\n');
const files={},hashes={};
for(const line of entries) {
  const match=line.match(/^100644 blob ([a-f0-9]+)\t(.+)$/);assert(match,'Only regular committed skill files are accepted');
  const file=match[2].slice(sourcePath.length+1),bytes=git('cat-file','blob',match[1]);
  files[file]=bytes.toString('base64');hashes[file]=hash(bytes);
}
const entry=Buffer.from(files['SKILL.md'],'base64').toString('utf8');
const data={schemaVersion:1,kind:'skill',id,version:entry.match(/^version:\s*(.+)$/m)?.[1].trim(),source:{repository:'https://github.com/agenthouse-org/skills.git',commit,path:sourcePath},license:'MIT',digest:hash(hashes),files};
verifyDependency(data);write(path.resolve(output),data);
console.log(JSON.stringify({version:data.version,commit,sha256:hash(Buffer.from(JSON.stringify(data,null,2)+'\n'))}));

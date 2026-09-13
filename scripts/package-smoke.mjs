import path from 'node:path';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {PACKAGE,read,write,assert} from '../src/io.js';
const root=path.join(PACKAGE,'work/package-consumer');
const configFile=path.join(root,'.agenthouse/config.json');
const config=read(configFile);
write(path.join(root,'team-process.mjs'),`console.log(JSON.stringify({schemaVersion:1,status:process.env.PILOT_FAIL==='yes'?'failed':'passed',reason:'Organization-owned process executed through packaged framework'}));\n`);
config.evaluators=[{id:'team-process',kind:'command',executable:'node',args:['team-process.mjs'],result:'json'}];
config.profiles={'pull-request':{checks:[{evaluator:'team-process',required:true}]}};write(configFile,config);
const launcher=path.join(root,'.agenthouse/run.mjs');
function run(args,env={}){return spawnSync(process.execPath,[launcher,...args,'--root',root],{encoding:'utf8',env:{...process.env,...env},windowsHide:true});}
const resolved=run(['resolve']);assert(resolved.status===0,resolved.stderr);
const pass=run(['evaluate','--ci','--frozen','--subject','package-pilot-pass']);assert(pass.status===0,pass.stdout+pass.stderr);
const fail=run(['evaluate','--ci','--frozen','--subject','package-pilot-failure'],{PILOT_FAIL:'yes'});assert(fail.status===1,fail.stdout+fail.stderr);
const latest=read(path.join(root,'artifacts/agenthouse/latest.json'));
const report=read(path.join(root,'artifacts/agenthouse',latest.path,'result.json'));assert(report.exitCode===1 && report.checks[0].status==='failed','Failure report was not preserved');
console.log('Offline tarball pilot passed: enrollment, doctor, organization-owned JSON process, passing exit 0, failing exit 1, and retained failure reports.');

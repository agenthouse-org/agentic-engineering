import {spawn, spawnSync} from 'node:child_process';
import {assert} from './io.js';

export function run(executable,args,{cwd,env={},timeoutSeconds=120,maxBytes=1048576}={}) {
  assert(typeof executable === 'string' && Array.isArray(args) && args.every(x=>typeof x==='string'), 'Invalid command arguments');
  return new Promise(resolve => {
    let out='',err='',problem=null,finished=false;
    const child = spawn(executable,args,{cwd,env:{...process.env,...env},shell:false,windowsHide:true,detached:process.platform !== 'win32'});
    function stop(reason) {
      if (problem) return;
      problem=reason;
      if (child.pid) {
        if (process.platform === 'win32') spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});
        else { try { process.kill(-child.pid,'SIGKILL'); } catch { child.kill('SIGKILL'); } }
      }
    }
    const timer=setTimeout(()=>stop('Evaluator timed out'),timeoutSeconds*1000);
    child.stdout.on('data',data=>{ if (Buffer.byteLength(out)+data.length>maxBytes) stop('Evaluator output limit exceeded'); else out+=data; });
    child.stderr.on('data',data=>{ if (Buffer.byteLength(err)+data.length>maxBytes) stop('Evaluator output limit exceeded'); else err+=data; });
    function done(code,signal) { if(finished)return; finished=true;clearTimeout(timer);resolve({code,signal,stdout:out,stderr:err,error:problem}); }
    child.on('error',e=>{problem=e.message;done(null,null);});
    child.on('close',done);
  });
}

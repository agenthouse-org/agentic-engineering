import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PACKAGE,write} from '../src/io.js';
import {normalizeRepository,publishRepositoryUrl,statusNpmProvenance,applyNpmProvenance} from '../src/npm-provenance.js';

function temp(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'ah-npm-prov-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
function git(root,...args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function cli(args){return spawnSync(process.execPath,[path.join(PACKAGE,'bin/ah-engineering.js'),...args],{encoding:'utf8',timeout:20000,windowsHide:true});}

test('repository URL normalization matches ssh and https origins',()=>{
  assert.equal(normalizeRepository('git+https://github.com/Org/App.git'),'https://github.com/Org/App');
  assert.equal(normalizeRepository('git@github.com:Org/App.git'),'https://github.com/Org/App');
  assert.equal(publishRepositoryUrl('git@github.com:Org/App.git'),'git+https://github.com/Org/App.git');
});
test('status is inapplicable without package.json and for private packages',t=>{
  const root=temp(t);
  const missing=statusNpmProvenance(root);
  assert.equal(missing.status,'inapplicable');assert.equal(missing.exitCode,0);
  write(path.join(root,'package.json'),{name:'@example/app',private:true});
  const priv=statusNpmProvenance(root);
  assert.equal(priv.status,'inapplicable');
  assert.throws(()=>applyNpmProvenance(root,{provider:'github'}),/private/);
});
test('status is incomplete for a public package with no publish job',t=>{
  const root=temp(t);
  write(path.join(root,'package.json'),{name:'@example/app',repository:{type:'git',url:'git+https://github.com/example/app.git'}});
  const result=statusNpmProvenance(root);
  assert.equal(result.status,'incomplete');assert.equal(result.exitCode,4);
  assert.ok(result.findings.some(item=>item.id==='workflow' && item.status==='incomplete'));
});
test('apply writes a trusted GitHub workflow and does not store a token',t=>{
  const root=temp(t);
  git(root,'init');git(root,'remote','add','origin','https://github.com/example/app.git');
  write(path.join(root,'package.json'),{name:'@example/app'});
  const result=applyNpmProvenance(root,{provider:'github'});
  assert.deepEqual(result.written,['.github/workflows/publish-npm.yml']);
  assert.equal(result.status,'ready');assert.equal(result.exitCode,0);
  const workflow=fs.readFileSync(path.join(root,'.github/workflows/publish-npm.yml'),'utf8');
  assert.match(workflow,/id-token:\s*write/);
  assert.match(workflow,/runs-on:\s*ubuntu-latest/);
  assert.match(workflow,/npm publish --access public/);
  assert.doesNotMatch(workflow,/NPM_TOKEN|--provenance/);
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.equal(pkg.repository.url,'git+https://github.com/example/app.git');
  assert.equal(pkg.publishConfig,undefined);
});
test('apply token template requests provenance and leaves existing workflows',t=>{
  const root=temp(t);
  write(path.join(root,'package.json'),{name:'app',repository:'https://gitlab.com/example/app.git'});
  write(path.join(root,'.github/workflows/evaluate.yml'),'name: evaluate\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps: [{run: echo hi}]\n');
  const result=applyNpmProvenance(root,{provider:'gitlab',publish:'token'});
  assert.deepEqual(result.written,['.gitlab-ci.yml']);
  assert.equal(fs.existsSync(path.join(root,'.github/workflows/evaluate.yml')),true);
  const body=fs.readFileSync(path.join(root,'.gitlab-ci.yml'),'utf8');
  assert.match(body,/--provenance/);
  assert.match(body,/id_tokens:/);
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.equal(pkg.publishConfig.provenance,true);
});
test('token publish without a provenance flag stays incomplete',t=>{
  const root=temp(t);
  write(path.join(root,'package.json'),{name:'app',repository:'https://github.com/example/app.git'});
  write(path.join(root,'.github/workflows/release.yml'),'name: r\non: push\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    permissions:\n      id-token: write\n      contents: read\n    steps:\n      - run: npm publish\n        env:\n          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}\n');
  const result=statusNpmProvenance(root);
  assert.equal(result.status,'incomplete');
  assert.ok(result.findings.some(item=>item.id.endsWith(':flag') && item.status==='incomplete'));
});
test('apply does not overwrite an existing publish job',t=>{
  const root=temp(t);
  write(path.join(root,'package.json'),{name:'app',repository:'https://github.com/example/app.git'});
  write(path.join(root,'.github/workflows/release.yml'),'name: release\non: push\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm publish\n');
  const result=applyNpmProvenance(root,{provider:'github'});
  assert.deepEqual(result.written,[]);
  assert.equal(result.status,'incomplete');
  assert.ok(result.requiredEdits.some(item=>item.path==='.github/workflows/release.yml' && /id-token/.test(item.need)));
  assert.equal(fs.existsSync(path.join(root,'.github/workflows/publish-npm.yml')),false);
  assert.match(fs.readFileSync(path.join(root,'.github/workflows/release.yml'),'utf8'),/npm publish/);
  assert.doesNotMatch(fs.readFileSync(path.join(root,'.github/workflows/release.yml'),'utf8'),/id-token/);
});
test('repository mismatch fails and provenance false is rejected',t=>{
  const root=temp(t);
  git(root,'init');git(root,'remote','add','origin','https://github.com/example/app.git');
  write(path.join(root,'package.json'),{name:'app',repository:'https://github.com/other/app.git',publishConfig:{provenance:false}});
  write(path.join(root,'.github/workflows/publish-npm.yml'),fs.readFileSync(path.join(PACKAGE,'templates/npm-provenance/github.yml')));
  const result=statusNpmProvenance(root);
  assert.equal(result.status,'failed');assert.equal(result.exitCode,1);
  assert.ok(result.findings.some(item=>item.id==='repository' && item.status==='failed'));
  assert.ok(result.findings.some(item=>item.id==='publishConfig' && item.status==='failed'));
  assert.throws(()=>applyNpmProvenance(root,{provider:'github',publish:'token'}),/provenance is false/);
});
test('trusted status treats this repository publish workflow as OIDC-ready',()=>{
  const result=statusNpmProvenance(PACKAGE);
  assert.ok(result.workflows.includes('.github/workflows/publish.yml'));
  assert.ok(result.findings.some(item=>item.id==='.github/workflows/publish.yml:oidc' && item.status==='passed'));
  assert.ok(result.findings.some(item=>item.id==='.github/workflows/publish.yml:runner' && item.status==='passed'));
  assert.doesNotMatch(fs.readFileSync(path.join(PACKAGE,'.github/workflows/publish.yml'),'utf8'),/--provenance/);
});
test('release workflow creates, attests, and uploads the GitHub update bundle',()=>{
  const workflow=fs.readFileSync(path.join(PACKAGE,'.github/workflows/publish.yml'),'utf8');
  assert.match(workflow,/attestations:\s*write/);assert.match(workflow,/actions\/attest-build-provenance@v3/);
  assert.match(workflow,/\.bundle\.json/);assert.match(workflow,/gh release upload/);
});
test('CLI status and apply share the same contract',t=>{
  const root=temp(t);
  write(path.join(root,'package.json'),{name:'app',repository:'https://github.com/example/app.git'});
  const status=cli(['npm-provenance','status','--root',root]);
  assert.equal(status.status,4,status.stderr);
  assert.equal(JSON.parse(status.stdout).status,'incomplete');
  const applied=cli(['npm-provenance','apply','--provider','github','--root',root]);
  assert.equal(applied.status,0,applied.stderr);
  assert.equal(JSON.parse(applied.stdout).status,'ready');
  const again=cli(['npm-provenance','apply','--provider','github','--workflow','.github/workflows/publish-npm.yml','--root',root]);
  assert.equal(again.status,0,again.stderr);
  assert.deepEqual(JSON.parse(again.stdout).written,[]);
  const help=cli(['help','npm-provenance']);
  assert.equal(help.status,0);assert.match(help.stdout,/Does not publish/);
  const bad=cli(['npm-provenance','publish','--root',root]);
  assert.equal(bad.status,2);
});

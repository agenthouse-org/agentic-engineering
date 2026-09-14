import fs from 'node:fs';
import path from 'node:path';
import {verify, sign} from 'node:crypto';
import {assert, read, write, hash, canonical, inside, VERSION, validated, safeId} from './io.js';

export const configPath = root => inside(root, '.agenthouse/config.json');
export const lockPath = root => inside(root, '.agenthouse/resolved.json');
export function loadConfig(root) {
  const config=validated('config', read(configPath(root)));
  assert(new Set(config.evaluators.map(e=>e.id)).size===config.evaluators.length,'Duplicate evaluator identifier');
  for(const e of config.evaluators) {
    if(e.kind==='command')assert(e.executable && e.result,'Command evaluator requires executable and result format');
    if(['evidence','approval','work-item'].includes(e.kind))assert(e.file,`${e.kind} evaluator requires file`);
    if(e.kind==='approval')assert(e.action,'Approval evaluator requires action');
    if(e.kind==='visual')assert(e.contract && e.assessment,'Visual evaluator requires contract and assessment');
  }
  for(const profile of Object.values(config.profiles))assert(new Set(profile.checks.map(c=>c.evaluator)).size===profile.checks.length,'Duplicate check in profile');
  return config;
}
export function resolve(root, {frozen = false, policyFile, frameworkVersion=VERSION, persist=true} = {}) {
  const config = loadConfig(root);
  // An externally supplied organization policy can be mounted read-only by CI.
  const sources = [...(policyFile ? [path.resolve(policyFile)] : []), ...(config.policySources || []).map(p => inside(root,p))];
  const layers = sources.map(file => ({file, data: validated('policy',read(file))}));
  const rules = new Map(), provenance = {}, requiredChecks = new Set();
  let owner = null;
  const authorities = {};
  for (const {file,data} of layers) {
    if (data.expiresAt) assert(Date.parse(data.expiresAt) > Date.now(), `Policy expired: ${data.id}`);
    if (data.owner) {
      assert(!owner || canonical(owner) === canonical(data.owner), 'Conflicting governance owner');
      owner = data.owner;
    }
    for (const [id,key] of Object.entries(data.authorities || {})) {
      assert(!authorities[id] || authorities[id] === key, `Conflicting authority key: ${id}`);
      authorities[id] = key;
    }
    for (const id of data.requiredChecks || []) requiredChecks.add(id);
    for (const rule of data.rules) {
      safeId(rule.id);
      const previous = rules.get(rule.id);
      assert(!previous || previous.mode !== 'mandatory' || canonical(previous.value) === canonical(rule.value), `Mandatory rule conflict: ${rule.id}`);
      rules.set(rule.id, {...rule, mode: previous?.mode === 'mandatory' ? 'mandatory' : rule.mode});
      provenance[rule.id] = {source: data.id, revision: data.revision, file: path.relative(root,file).replaceAll('\\','/')};
    }
  }
  for (const [id,value] of Object.entries(config.overrides || {})) {
    const rule = rules.get(id);
    assert(!rule || rule.mode !== 'mandatory' || canonical(rule.value) === canonical(value), `Cannot override mandatory rule: ${id}`);
    rules.set(id,{id,value,mode:rule?.mode || 'default'});
    provenance[id] = {source:'project',file:'.agenthouse/config.json'};
  }
  for(const [id,field] of [['autonomy','autonomy'],['documentation-authority','documentationAuthority'],['lifecycle','lifecycle'],['hooks','hooks']]) {
    const rule=rules.get(id);
    if(rule) {
      if(config[field]!==undefined)assert(rule.mode!=='mandatory' || canonical(config[field])===canonical(rule.value),`Project conflicts with mandatory ${id}`);
      else config[field]=rule.value;
    }
  }
  for(const evaluator of config.evaluators) {
    const rule=rules.get(`evaluator.${evaluator.id}`);
    if(rule?.mode==='mandatory')assert(canonical(evaluator)===canonical(rule.value),`Mandatory evaluator definition changed: ${evaluator.id}`);
  }
  const snapshot = {schemaVersion:1, frameworkVersion, configDigest:hash(config),
    sources:layers.map(({data}) => ({id:data.id, revision:data.revision, digest:hash(data)})),
    rules:[...rules.values()].sort((a,b)=>a.id.localeCompare(b.id)), provenance,
    requiredChecks:[...requiredChecks].sort(), owner, authorities};
  snapshot.digest = hash(snapshot);
  if (frozen) {
    assert(fs.existsSync(lockPath(root)), 'Missing resolved snapshot; run resolve before frozen evaluation');
    assert(canonical(read(lockPath(root))) === canonical(snapshot), 'Resolved snapshot is stale or modified; run resolve and review changes');
  } else if(persist) write(lockPath(root),snapshot);
  return {config, snapshot};
}
export function signed(payload, key) { return {payload, signature:sign(null,Buffer.from(canonical(payload)),key).toString('base64')}; }
export function verifyEnvelope(envelope, key) {
  assert(key && envelope?.payload && typeof envelope.signature === 'string', 'Missing signed record or trusted key');
  assert(verify(null,Buffer.from(canonical(envelope.payload)),key,Buffer.from(envelope.signature,'base64')), 'Invalid signature');
  return envelope.payload;
}
export function approval(envelope, snapshot, {subject, action, scope}, now = Date.now()) {
  const p = envelope?.payload;
  assert(p?.schemaVersion === 1 && p.kind === 'decision', 'Invalid decision record');
  verifyEnvelope(envelope,snapshot.authorities[p.issuer]);
  assert(p.scope === scope && p.action === action && p.subject === subject && p.policyDigest === snapshot.digest, 'Decision scope or revision mismatch');
  assert(Date.parse(p.expiresAt) > now && Date.parse(p.issuedAt) <= now, 'Decision expired or not yet valid');
  assert(p.verdict === 'allowed' || p.verdict === 'denied', 'Invalid decision verdict');
  if (p.issuer !== snapshot.owner) {
    const delegation = envelope.delegation;
    const d = verifyEnvelope(delegation,snapshot.authorities[snapshot.owner]);
    assert(d.kind === 'delegation' && d.issuer === snapshot.owner && d.delegate === p.issuer, 'Invalid delegation authority');
    assert(d.scope === scope && d.actions?.includes(action) && d.policyDigest === snapshot.digest, 'Delegation out of scope');
    assert(Date.parse(d.expiresAt) > now && Date.parse(d.issuedAt) <= now && !d.revoked, 'Delegation expired or revoked');
  }
  return p.verdict;
}

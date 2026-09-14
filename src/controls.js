import {resolve} from './policy.js';

export function controls(root,{policyFile}={}) {
  const {config,snapshot}=resolve(root,{frozen:true,policyFile});
  const locations={autonomy:'Signed lifecycle transitions','documentation-authority':'Authority metadata; remote synchronization is separate',lifecycle:'Ready/done gates and lifecycle path validation',hooks:'Hook command when invoked; native activation and server protections are separate'};
  return {schemaVersion:1,policyDigest:snapshot.digest,rules:snapshot.rules.map(rule=>({id:rule.id,mode:rule.mode,source:snapshot.provenance[rule.id],
    mechanism:locations[rule.id] || (rule.id.startsWith('evaluator.') && rule.mode==='mandatory'?'Mandatory evaluator definition validation':'Guidance only; no built-in enforcement'),
    automated:rule.id==='autonomy'||rule.id==='lifecycle'||rule.id==='hooks'||(rule.id.startsWith('evaluator.') && rule.mode==='mandatory')})),
    checks:config.evaluators.map(e=>({id:e.id,kind:e.kind,criteria:e.criteria || [],organizationRequired:snapshot.requiredChecks.includes(e.id),profiles:Object.entries(config.profiles).filter(([,p])=>p.checks.some(c=>c.evaluator===e.id)).map(([name])=>name)})),
    limitation:'Configured mechanisms do not prove that CI, host hooks or external branch protections are active. Validate intentional failures at each boundary.'};
}

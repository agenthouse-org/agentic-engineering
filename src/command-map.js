export const phases={
  understand:['survey','inspect','controls'],
  shape:['define-product-requirements','draft-user-story','assess-story-readiness','validate-scope','assess-tech-feasibility','architecture','engineering-guidelines','coding-standards','visual-plan','test-plan'],
  build:['work','write-tests','spec','check-commit'],
  verify:['evaluate','review','review-change','review-mr','frontend-acceptance','usability'],
  approve:['sign','gate'],
  product:['roles','process'],
  operate:['policy','pipeline','update','rollback','recover','housekeep','doctor','session']
};
export function commandMap(){return Object.entries(phases).map(([phase,names])=>`${phase}: ${names.map(n=>'ah-'+n).join(', ')}`).join('\n');}
export function goalHelp(goal) {
  const routes=[
    [/feasib|blast radius|migration|architecture decision|impact/i,'shape','assess-tech-feasibility','architecture','It does not run project checks or approve a decision.'],
    [/architecture guideline|ADR catalog|foundational ADR|architecture catalog/i,'shape','architecture','assess-tech-feasibility','It does not approve exceptions or invent governance authority.'],
    [/engineering guideline|engineering standard/i,'shape','engineering-guidelines','controls','Catalog validation does not assess compliance; read the guidance and run applicable checks.'],
    [/coding standard|style guide|lint rule|coding guideline/i,'shape','coding-standards','controls','Mechanism hints are not enforcement; use controls and evaluate for real checks.'],
    [/merge request|pull request|\bMR\b|\bPR\b|https?:\/\//i,'verify','review-mr','review','It does not post, push, merge or alter tracker state.'],
    [/what.*(?:run|check)|dry.run|evaluate|run.*check/i,'verify','evaluate','review','Use evaluate --list first; evaluation does not assess requirements or design.'],
    [/ready|readiness/i,'shape','assess-story-readiness','spec','It does not grant approval or advance a stage.'],
    [/scope|requirements.*cover/i,'shape','validate-scope','assess-story-readiness','It does not approve scope changes.'],
    [/PRD|product requirements|requirements.*multiple|story map|multiple stories/i,'shape','define-product-requirements','validate-scope','It does not invent customer evidence or choose architecture.'],
    [/test plan|acceptance.*test|write.*test|TDD/i,'shape','test-plan','write-tests','It does not implement product behavior or skip red for TDD items.'],
    [/pipeline|CI\/CD|github actions|gitlab ci|junit|publish.*test/i,'operate','pipeline','evaluate','It does not push remotes or invent product tests.'],
    [/plan|story|requirement/i,'shape','draft-user-story','visual-plan','It does not implement or approve the story.'],
    [/prove|test|bug|regression/i,'build','spec','check-commit','It does not replace independent review.'],
    [/approve|done|release/i,'approve','gate','sign','A technical result does not grant governance approval.'],
    [/understand|explore|survey/i,'understand','survey','inspect','It does not execute discovered scripts.'],
    [/install|enroll|setup/i,'operate','enroll-repository','doctor','It does not replace organization policy.'],
    [/role|persona|act as|test.manager|devops|architect/i,'product','roles','process','Role behavior and authority are advisory; a role does not grant approval.'],
    [/process|lifecycle|where.*(?:now|are we)/i,'product','process','roles','Orientation is advisory and does not change authoritative work status.'],
    [/broken|diagnos|health/i,'operate','doctor','recover','Diagnosis does not authorize unrelated repairs.']
  ];
  const route=routes.find(([pattern])=>pattern.test(goal));
  if(!route)return null;
  const [,phase,primary,next,limit]=route;
  return `Phase: ${phase}\nPrimary: ah-${primary}\nUsual next: ah-${next}\n${limit}`;
}

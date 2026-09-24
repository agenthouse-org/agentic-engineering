export const phases={
  understand:['survey','inspect','controls'],
  shape:['draft-user-story','assess-story-readiness','validate-scope','assess-tech-feasibility','visual-plan'],
  build:['work','spec','check-commit'],
  verify:['evaluate','review','review-change','review-mr','frontend-acceptance','usability'],
  approve:['sign','gate'],
  operate:['update','rollback','recover','housekeep','doctor','session']
};
export function commandMap(){return Object.entries(phases).map(([phase,names])=>`${phase}: ${names.map(n=>'ah-'+n).join(', ')}`).join('\n');}
export function goalHelp(goal) {
  const routes=[
    [/feasib|blast radius|migration|architecture decision|impact/i,'shape','assess-tech-feasibility','assess-story-readiness','It does not run project checks or approve a decision.'],
    [/merge request|pull request|\bMR\b|\bPR\b|https?:\/\//i,'verify','review-mr','review','It does not post, push, merge or alter tracker state.'],
    [/what.*(?:run|check)|dry.run|evaluate|run.*check/i,'verify','evaluate','review','Use evaluate --list first; evaluation does not assess requirements or design.'],
    [/ready|readiness/i,'shape','assess-story-readiness','spec','It does not grant approval or advance a stage.'],
    [/scope|requirements.*cover/i,'shape','validate-scope','assess-story-readiness','It does not approve scope changes.'],
    [/plan|story|requirement/i,'shape','draft-user-story','visual-plan','It does not implement or approve the story.'],
    [/prove|test|bug|regression/i,'build','spec','check-commit','It does not replace independent review.'],
    [/approve|done|release/i,'approve','gate','sign','A technical result does not grant governance approval.'],
    [/understand|explore|survey/i,'understand','survey','inspect','It does not execute discovered scripts.'],
    [/install|enroll|setup/i,'operate','enroll-repository','doctor','It does not replace organization policy.'],
    [/broken|diagnos|health/i,'operate','doctor','recover','Diagnosis does not authorize unrelated repairs.']
  ];
  const route=routes.find(([pattern])=>pattern.test(goal));
  if(!route)return null;
  const [,phase,primary,next,limit]=route;
  return `Phase: ${phase}\nPrimary: ah-${primary}\nUsual next: ah-${next}\n${limit}`;
}

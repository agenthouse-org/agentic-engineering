import {test,expect} from '@playwright/test';
import {capture} from '@agenthouse/engineering/playwright';

test('primary action works on mobile', async ({page},testInfo)=>{
  testInfo.annotations.push({type:'agenthouse-criterion',description:'mobile-action'},
    {type:'agenthouse-viewport',description:'360x800'}, {type:'agenthouse-state',description:'ready'});
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeInViewport();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await capture(page,testInfo);
});

// Add toHaveScreenshot() only after reviewing/approving the expected baseline.
// Concept review is recorded separately by a human or authorized visual evaluator.

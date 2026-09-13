import {test,expect} from '@playwright/test';
import {capture} from '../../adapters/playwright.mjs';
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><style>body{font:18px Arial;background:#f3f6f3;margin:0;padding:24px;color:#173d34}main{background:white;padding:24px;border-radius:16px}h1{font-size:28px}button{background:#176b52;color:white;border:0;border-radius:8px;padding:14px 26px;font-size:18px;${process.env.AH_BREAK_LAYOUT?'transform:translateX(400px)':''}}</style><main><p>agenthouse</p><h1>Review your request</h1><p>Everything is ready for the next step.</p><button onclick="this.textContent='Confirmed'">Continue</button></main></html>`;
function annotate(info,id){info.annotations.push({type:'agenthouse-criterion',description:id},{type:'agenthouse-viewport',description:'360x800'},{type:'agenthouse-state',description:'ready'});}
test('mobile behavior',async({page},info)=>{
  annotate(info,'behavior');await page.setContent(html);await capture(page,info);
  await expect(page.getByRole('button',{name:'Continue'})).toBeInViewport();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Continue'}).click();await expect(page.getByRole('button',{name:'Confirmed'})).toBeVisible();
});
test('approved screenshot',async({page},info)=>{
  annotate(info,'regression');await page.setContent(html);await capture(page,info);
  await expect(page).toHaveScreenshot('primary-action.png',{animations:'disabled'});
});

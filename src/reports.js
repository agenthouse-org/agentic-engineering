import path from 'node:path';
import {write} from './io.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function reports(folder,result) {
  write(path.join(folder,'result.json'),result);
  const cases=result.checks.map(c=>{
    let body='';
    if (c.required && c.status==='failed') body=`<failure message="${esc(c.reason)}"/>`;
    else if (c.required && c.status==='error') body=`<error message="${esc(c.reason)}"/>`;
    else if (c.status!=='passed') body=`<skipped message="${esc(c.status+': '+c.reason)}"/>`;
    return `<testcase name="${esc(c.id)}"><properties><property name="required" value="${c.required}"/><property name="status" value="${esc(c.status)}"/></properties>${body}</testcase>`;
  });
  write(path.join(folder,'junit.xml'),`<?xml version="1.0" encoding="UTF-8"?><testsuite name="agenthouse" tests="${cases.length}" failures="${result.checks.filter(c=>c.required&&c.status==='failed').length}" errors="${result.checks.filter(c=>c.required&&c.status==='error').length}">${cases.join('')}</testsuite>`);
  const cards=result.checks.map(c=>`<section><h2>${esc(c.id)} <small>${esc(c.status)}</small></h2><p>${esc(c.reason)}</p><p>${c.required?'Required':'Advisory'}</p>${(c.evidence||[]).map(e=>`<figure><a href="${esc(e.path)}">${esc(e.label || e.path)}</a>${/\.(png|jpe?g|webp)$/i.test(e.path)?`<img alt="${esc(e.label || 'Evidence')}" src="${esc(e.path)}">`:''}<figcaption>SHA-256: ${esc(e.sha256)}</figcaption></figure>`).join('')}<pre>${esc(JSON.stringify(c.findings||[],null,2))}</pre></section>`).join('');
  write(path.join(folder,'report.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'unsafe-inline'"><title>agenthouse evaluation</title><style>body{font:16px system-ui;margin:3rem auto;padding:0 1rem;max-width:1050px;color:#173033;background:#f5f7f5}section{background:white;padding:1.5rem;margin:1rem 0;border:1px solid #cdd8d2}small{font-size:1rem}img{max-width:100%;max-height:600px}pre{white-space:pre-wrap;overflow-wrap:anywhere}figcaption{font-size:.7rem;overflow-wrap:anywhere}</style><h1>agenthouse · ${esc(result.status)}</h1><p>Profile ${esc(result.profile)} · ${esc(result.subject)} · exit ${result.exitCode}</p><p>Run ${esc(result.runId)}</p>${cards}</html>`);
}

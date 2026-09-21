import {assert} from './io.js';

export function slugify(title) {
  const slug=String(title || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-');
  assert(slug,'Title produces an empty branch slug');
  return slug;
}

export function renderBranchName(pattern,{id,title,kind='feature'}={}) {
  assert(typeof pattern==='string' && pattern.trim(),'Configure git.branchNaming.pattern in .agenthouse/config.json (for example {id}-{slug})');
  const slug=slugify(title || id);
  const name=pattern.trim()
    .replaceAll('{id}',String(id || ''))
    .replaceAll('{slug}',slug)
    .replaceAll('{kind}',String(kind || 'feature'));
  assert(name && !name.includes('{'),`Branch pattern produced an incomplete name: ${name || '(empty)'}`);
  assert(!name.includes('..') && !name.startsWith('/') && !name.endsWith('/') && !name.split('/').some(part=>!part || part==='.' || part==='..'),`Unsafe branch name: ${name}`);
  assert(!/[\s\\~^:?*\[\]@{]/.test(name) && !name.includes('//'),`Unsafe branch name: ${name}`);
  return name;
}

export function branchNaming(config) {
  return config?.git?.branchNaming || null;
}

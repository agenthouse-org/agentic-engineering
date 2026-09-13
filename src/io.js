import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const PACKAGE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const VERSION = JSON.parse(fs.readFileSync(path.join(PACKAGE, 'package.json'), 'utf8')).version;
export const assert = (ok, message) => { if (!ok) throw new Error(message); };
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export const hash = value => createHash('sha256').update(Buffer.isBuffer(value) || typeof value === 'string' ? value : canonical(value)).digest('hex');
export function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
export function inside(root, relative) {
  assert(typeof relative === 'string' && relative.length > 0 && !path.isAbsolute(relative), 'Expected a relative path');
  assert(!relative.split(/[\\/]/).some(s => s === '..' || s.includes(':')), `Unsafe path: ${relative}`);
  const base = path.resolve(root), dest = path.resolve(base, relative);
  assert(dest.startsWith(base + path.sep), `Path escapes root: ${relative}`);
  let current = base;
  assert(!fs.existsSync(base) || !fs.lstatSync(base).isSymbolicLink(), 'Symlink root is not supported');
  for (const piece of path.relative(base, dest).split(path.sep)) {
    current = path.join(current, piece);
    assert(!fs.existsSync(current) || !fs.lstatSync(current).isSymbolicLink(), `Symlink path rejected: ${relative}`);
  }
  return dest;
}
export function write(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const temp = `${file}.${randomUUID()}.tmp`;
  fs.writeFileSync(temp, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2) + '\n', {flag: 'wx',mode:0o600});
  try { fs.renameSync(temp, file); } finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
export function create(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2) + '\n', {flag: 'wx'});
}
export function walk(root, prefix = '') {
  return fs.readdirSync(path.join(root, prefix), {withFileTypes: true}).sort((a,b) => a.name.localeCompare(b.name)).flatMap(e => {
    assert(!e.isSymbolicLink(), `Symlink in package: ${e.name}`);
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    return e.isDirectory() ? walk(root, rel) : [rel];
  });
}
export function exclusive(root, action) {
  const file = inside(root, '.agenthouse/mutation.lock');
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const fd = fs.openSync(file, 'wx');
  try { fs.writeSync(fd, JSON.stringify({pid: process.pid, at: new Date().toISOString()})); return action(); }
  finally { fs.closeSync(fd); fs.unlinkSync(file); }
}
export const safeId = id => { assert(typeof id === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,100}$/.test(id), `Invalid identifier: ${id}`); return id; };
export function validate(value, schema, at = '$') {
  if (schema.enum) assert(schema.enum.includes(value), `${at}: invalid value`);
  if (schema.type) {
    const type = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
    assert(type === schema.type || schema.type === 'integer' && Number.isInteger(value), `${at}: expected ${schema.type}`);
  }
  if (typeof value === 'string') {
    if (schema.minLength) assert(value.length >= schema.minLength, `${at}: empty string`);
    if (schema.pattern) assert(new RegExp(schema.pattern).test(value), `${at}: invalid format`);
  }
  if (typeof value === 'number') {
    assert(Number.isFinite(value), `${at}: invalid number`);
    if (schema.minimum !== undefined) assert(value >= schema.minimum, `${at}: too small`);
    if (schema.maximum !== undefined) assert(value <= schema.maximum, `${at}: too large`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems) assert(value.length >= schema.minItems, `${at}: empty list`);
    if (schema.items) value.forEach((v,i) => validate(v,schema.items,`${at}[${i}]`));
  } else if (value && typeof value === 'object') {
    for (const key of schema.required || []) assert(Object.hasOwn(value,key), `${at}: missing ${key}`);
    for (const [k,v] of Object.entries(value)) {
      assert(!['__proto__','constructor','prototype'].includes(k), `${at}: unsafe key`);
      const sub = schema.properties?.[k];
      if (sub) validate(v,sub,`${at}.${k}`);
      else if (schema.additionalProperties === false) throw new Error(`${at}: unknown field ${k}`);
      else if (typeof schema.additionalProperties === 'object') validate(v,schema.additionalProperties,`${at}.${k}`);
    }
  }
  return value;
}
export const validated = (name, value) => validate(value, read(path.join(PACKAGE, 'schemas', `${name}.json`)));

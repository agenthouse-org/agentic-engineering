// Supported subset: top-level `key: value` pairs whose values are scalars, inline lists of scalars,
// block lists of scalars, block lists of flat maps, or one flat map. Flat-map values are scalars or
// inline lists. Anchors, aliases, tags, flow maps, multiline scalars, tabs, and deeper nesting are
// rejected with the frontmatter line number so authors can fix the file instead of guessing.
const KEY=/^([A-Za-z][A-Za-z0-9_-]*):(?:\s+(.*))?$/;

function fail(line,message){throw new Error(`Frontmatter line ${line}: ${message}`);}

function splitInline(text,line) {
  const parts=[];let current='',quote=null;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(quote) {
      current+=c;
      if(c===quote && !(quote==='"' && text[i-1]==='\\'))quote=null;
    }else if(c==='"' || c==='\'') {quote=c;current+=c;}
    else if(c===',') {parts.push(current);current='';}
    else if(c==='[' || c===']' || c==='{' || c==='}')fail(line,'nested collections are not supported');
    else current+=c;
  }
  if(quote)fail(line,'unterminated quoted string');
  parts.push(current);
  const items=parts.map(p=>p.trim());
  if(items.length===1 && items[0]==='')return [];
  if(items.some(item=>item===''))fail(line,'empty list item');
  return items.map(item=>scalar(item,line,false));
}

function scalar(raw,line,allowList=true) {
  const text=raw.trim();
  if(text==='')fail(line,'expected a value; use "" for an empty string or [] for an empty list');
  if(text.startsWith('"')) {
    if(!(text.length>1 && text.endsWith('"')))fail(line,'unterminated double-quoted string');
    try {return JSON.parse(text);}catch {fail(line,'invalid double-quoted string');}
  }
  if(text.startsWith('\'')) {
    if(!(text.length>1 && text.endsWith('\'')))fail(line,'unterminated single-quoted string');
    const inner=text.slice(1,-1);
    if(/(^|[^'])'(?!')/.test(inner.replace(/''/g,'')))fail(line,'single quotes inside a single-quoted string must be doubled');
    return inner.replace(/''/g,'\'');
  }
  if(text.startsWith('[')) {
    if(!allowList)fail(line,'nested collections are not supported');
    if(!text.endsWith(']'))fail(line,'unterminated inline list');
    return splitInline(text.slice(1,-1),line);
  }
  if(text.startsWith('{'))fail(line,'flow maps are not supported; use indented key: value lines');
  if(text.startsWith('&') || text.startsWith('*'))fail(line,'anchors and aliases are not supported');
  if(text.startsWith('!'))fail(line,'tags are not supported');
  if(text.startsWith('|') || text.startsWith('>'))fail(line,'multiline scalars are not supported; write one line or use the Markdown body');
  const plain=text.replace(/\s+#.*$/,'');
  if(plain==='true')return true;
  if(plain==='false')return false;
  if(/^-?\d+(?:\.\d+)?$/.test(plain))return Number(plain);
  return plain;
}

function indentOf(text){return text.length-text.trimStart().length;}

export function parseYamlSubset(source,firstLine=1) {
  const lines=String(source).split(/\r?\n/).map((text,index)=>({text,line:firstLine+index}))
    .filter(({text,line})=>{
      if(text.includes('\t'))fail(line,'tabs are not supported; indent with spaces');
      return text.trim()!=='' && !text.trimStart().startsWith('#');
    });
  const data={};let i=0;
  const setKey=(target,key,value,line)=>{
    if(['__proto__','constructor','prototype'].includes(key))fail(line,`unsafe key ${key}`);
    if(Object.hasOwn(target,key))fail(line,`duplicate key ${key}`);
    target[key]=value;
  };
  const flatEntry=(target,content,line)=>{
    const match=content.match(KEY);
    if(!match)fail(line,'expected key: value');
    if(match[2]===undefined || match[2].trim()==='')fail(line,`nested structures are not supported under ${match[1]}; give it a scalar or inline list value`);
    setKey(target,match[1],scalar(match[2],line),line);
  };
  while(i<lines.length) {
    const {text,line}=lines[i];
    if(indentOf(text)!==0)fail(line,'unexpected indentation');
    const match=text.match(KEY);
    if(!match)fail(line,'expected key: value');
    const key=match[1];
    if(match[2]!==undefined && match[2].trim()!=='') {setKey(data,key,scalar(match[2],line),line);i++;continue;}
    i++;
    const next=lines[i];
    if(!next || (indentOf(next.text)===0 && !next.text.startsWith('- ') && next.text!=='-'))fail(line,`expected a value for ${key}; use "" for an empty string or [] for an empty list`);
    const blockIndent=indentOf(next.text);
    if(next.text.trimStart().startsWith('-')) {
      if(![0,2].includes(blockIndent))fail(next.line,'list items must be indented by 0 or 2 spaces');
      const list=[];let mode=null;
      while(i<lines.length && indentOf(lines[i].text)===blockIndent && lines[i].text.trimStart().startsWith('-')) {
        const current=lines[i],content=current.text.trimStart().replace(/^-\s?/,'');
        if(!/^-(\s|$)/.test(current.text.trimStart()))fail(current.line,'expected "- " list item');
        if(content.trim()==='')fail(current.line,'empty list item');
        const isMap=KEY.test(content);
        if(mode && mode!==(isMap?'map':'scalar'))fail(current.line,'a list cannot mix scalars and maps');
        mode=isMap?'map':'scalar';
        i++;
        if(!isMap){list.push(scalar(content,current.line));continue;}
        const item={};flatEntry(item,content,current.line);
        const fieldIndent=blockIndent+2;
        while(i<lines.length && indentOf(lines[i].text)>blockIndent) {
          const field=lines[i];
          if(indentOf(field.text)!==fieldIndent)fail(field.line,`map fields must be indented by ${fieldIndent} spaces`);
          if(field.text.trimStart().startsWith('-'))fail(field.line,'nested lists are not supported; use an inline list [a, b]');
          flatEntry(item,field.text.trimStart(),field.line);i++;
        }
        list.push(item);
      }
      if(i<lines.length && indentOf(lines[i].text)!==0)fail(lines[i].line,'unexpected indentation');
      setKey(data,key,list,line);
      continue;
    }
    if(blockIndent!==2)fail(next.line,'map fields must be indented by 2 spaces');
    const map={};
    while(i<lines.length && indentOf(lines[i].text)>0) {
      const field=lines[i];
      if(indentOf(field.text)!==2)fail(field.line,'map fields must be indented by 2 spaces');
      if(field.text.trimStart().startsWith('-'))fail(field.line,'nested lists are not supported; use an inline list [a, b]');
      flatEntry(map,field.text.trimStart(),field.line);i++;
    }
    setKey(data,key,map,line);
  }
  return data;
}

export function parseFrontmatter(markdown) {
  const text=String(markdown).replace(/^\uFEFF/,'');
  const match=text.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if(!match)throw new Error('Frontmatter line 1: file must start with a --- frontmatter block closed by ---');
  const data=parseYamlSubset(match[1],2);
  const bodyStartLine=match[0].split(/\r?\n/).length-(match[0].endsWith('\n')?1:0)+1;
  return {data,body:text.slice(match[0].length),bodyStartLine};
}

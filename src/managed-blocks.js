// Accept legacy HTML markers when reading; write comments native to the file.
export function blocks(content='') {
  return content.match(/<!-- agenthouse:start -->[\s\S]*?<!-- agenthouse:end -->|^# agenthouse:start\r?\n[\s\S]*?^# agenthouse:end(?=\r?$)/gm) || [];
}
export function block(body,file) {
  const ignore=file==='.gitignore' || file.endsWith('/exclude');
  return `${ignore?'# agenthouse:start':'<!-- agenthouse:start -->'}\n${body.trim()}\n${ignore?'# agenthouse:end':'<!-- agenthouse:end -->'}`;
}

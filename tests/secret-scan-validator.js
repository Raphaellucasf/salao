/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const safeDirectory = root.replace(/\\/g, '/');
const tracked = execFileSync(
  'git',
  ['-c', `safe.directory=${safeDirectory}`, 'ls-files', '-z'],
  { cwd: root, encoding: 'utf8' }
).split('\0').filter(Boolean);

const textExtensions = new Set([
  '.cjs', '.env', '.example', '.js', '.json', '.md', '.mjs', '.sql', '.toml', '.ts', '.tsx', '.txt', '.yml', '.yaml',
]);
const secretPatterns = [
  { name: 'JWT literal', regex: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g },
  { name: 'OpenAI-style key', regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: 'Google API key', regex: /\bAIza[0-9A-Za-z_-]{30,}\b/g },
];
const knownLeakedCredentials = [
  ['Dimas', '@2024'].join(''),
  ['Joao', '@2024'].join(''),
];

const findings = [];
for (const relativePath of tracked) {
  const extension = path.extname(relativePath).toLowerCase();
  if (!textExtensions.has(extension) && !path.basename(relativePath).startsWith('.env')) continue;

  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) continue;
  const content = fs.readFileSync(absolutePath, 'utf8');
  for (const { name, regex } of secretPatterns) {
    regex.lastIndex = 0;
    if (regex.test(content)) findings.push(`${relativePath}: ${name}`);
  }
  for (const credential of knownLeakedCredentials) {
    if (content.includes(credential)) findings.push(`${relativePath}: credencial E2E literal conhecida`);
  }
}

assert.deepEqual(findings, [], `Possíveis segredos versionados:\n${findings.join('\n')}`);
console.log(`OK: ${tracked.length} arquivos versionados verificados sem segredo literal conhecido.`);

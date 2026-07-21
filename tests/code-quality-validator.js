/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

for (const file of ['src/lib/api-response.ts', 'src/lib/observability.ts', 'src/lib/validation.ts']) {
  assert(fs.existsSync(path.join(root, file)), `${file} deve existir`);
}

const observability = read('src/lib/observability.ts');
for (const forbidden of ['authorization', 'cookie', 'password', 'secret', 'apikey', 'email', 'telefone', 'cpf', 'payload']) {
  assert(observability.includes(forbidden), `redator deve cobrir ${forbidden}`);
}
assert(observability.includes('SAFE_FIELDS'), 'logger deve usar allowlist de campos');

const apiFiles = walk(path.join(root, 'src', 'app', 'api')).filter((file) => file.endsWith('.ts'));
const rawConsole = apiFiles.filter((file) => /console\.(?:log|warn|error|info)\s*\(/.test(fs.readFileSync(file, 'utf8')));
assert.deepStrictEqual(rawConsole, [], `API routes ainda usam console.*:\n${rawConsole.map((file) => path.relative(root, file)).join('\n')}`);

for (const relative of [
  'src/app/api/transactions/route.ts',
  'src/app/api/admin/transacoes/route.ts',
  'src/app/api/sales/route.ts',
  'src/app/api/admin/venda-rapida/route.ts',
]) {
  const source = read(relative);
  assert(!/\.(?:from|rpc)\s*\(/.test(source), `${relative} deve delegar regra financeira ao service compartilhado`);
}

console.log('OK: contratos de qualidade, redaction, logs e serviços compartilhados validados.');

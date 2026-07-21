/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targets = ['.env.local', '.env.production.local'];
const errors = [];

function parseEnv(file) {
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.trimStart().startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
}

for (const relative of targets) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    errors.push(`${relative}: arquivo ausente`);
    continue;
  }
  const env = parseEnv(file);
  if (!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_')) {
    errors.push(`${relative}: publishable key moderna ausente`);
  }
  if (!env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_')) {
    errors.push(`${relative}: secret key moderna ausente`);
  }
  if ('NEXT_PUBLIC_SUPABASE_ANON_KEY' in env || 'SUPABASE_SERVICE_ROLE_KEY' in env) {
    errors.push(`${relative}: variáveis legadas ainda configuradas`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('OK: os dois ambientes usam somente chaves Supabase modernas.');

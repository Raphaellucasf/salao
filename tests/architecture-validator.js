/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true })
  .flatMap((entry) => {
    const relative = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(relative) : [relative.replaceAll('\\', '/')];
  });

const errors = [];
const sourceFiles = walk('src').filter((file) => /\.[cm]?[jt]sx?$/.test(file));
const clientFactories = new Set([
  'src/lib/supabase.ts',
  'src/lib/supabase-request.ts',
  'src/lib/supabase-server.ts',
]);

for (const file of sourceFiles) {
  const content = read(file);
  if (
    !clientFactories.has(file)
    && /import\s*\{[^}]*\bcreate(?:Client|ServerClient|BrowserClient)\b[^}]*\}\s*from ['"]@supabase\/(?:supabase-js|ssr)['"]/.test(content)
  ) {
    errors.push(`${file}: cria/importa cliente Supabase fora das fábricas canônicas`);
  }
  if (/supabase-admin/.test(content)) {
    errors.push(`${file}: usa a fábrica privilegiada legada supabase-admin`);
  }
}

const packageJson = JSON.parse(read('package.json'));
if (packageJson.dependencies?.['@supabase/auth-helpers-nextjs']) {
  errors.push('package.json: auth-helpers legado permanece instalado sem consumidor');
}

const envExample = read('.env.example');
for (const required of ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY']) {
  if (!envExample.includes(required)) errors.push(`.env.example: variável canônica ausente: ${required}`);
}
for (const legacy of ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (envExample.includes(legacy)) errors.push(`.env.example: variável legada ainda documentada: ${legacy}`);
}

if (!fs.existsSync(path.join(root, 'supabase', 'README.md'))) {
  errors.push('supabase/README.md: fonte canônica de migrações não documentada');
}
const canonicalMigrations = walk('supabase/migrations').filter((file) => file.endsWith('.sql'));
if (canonicalMigrations.length !== 45) {
  errors.push(`supabase/migrations: esperadas 45 migrações canônicas, encontradas ${canonicalMigrations.length}`);
}
const competingMigrations = fs.existsSync(path.join(root, 'database', 'migrations'))
  ? walk('database/migrations').filter((file) => file.endsWith('.sql'))
  : [];
if (competingMigrations.length) {
  errors.push('database/migrations: cadeia SQL concorrente ainda existe');
}
if (!read('database/README.md').includes('NÃO EXECUTE')) {
  errors.push('database/README.md: material histórico não está marcado como não executável');
}

const activeDocs = [
  'README.md',
  'PROJECT.md',
  'QUICK_START.md',
  'AUTH_README.md',
  'AUTENTICACAO_CONCLUIDA.md',
  'APRESENTACAO.md',
  'RESUMO_IMPLEMENTACAO.md',
  'plans/REVISAO_ARQUITETURAL.md',
  'plans/SUPABASE_TEST_SECURITY_PLAN.md',
];
for (const file of activeDocs) {
  const content = read(file);
  if (/21 (?:de 43 tabelas|tabelas).*sem RLS|43 tabelas públicas, 21/i.test(content)) {
    errors.push(`${file}: apresenta a linha de base antiga como estado atual`);
  }
  if (/Next\.js 15(?:\.1\.3)?/.test(content)) {
    errors.push(`${file}: versão obsoleta do Next.js`);
  }
  if (/database\/(?:schema|migration_auth|seed_users)\.sql/.test(content)) {
    errors.push(`${file}: instrui execução de SQL legado/inexistente`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('OK: clientes Supabase, migrações e documentação seguem fontes canônicas.');

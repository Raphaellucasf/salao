/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const cache = read('src/lib/financial-stats-cache.ts');
assert.match(cache, /unstable_cache\(/, 'financial stats must use the server data cache');
assert.match(cache, /revalidate:\s*30/, 'financial cache must have a short TTL safety net');
assert.match(cache, /revalidateTag\(FINANCIAL_STATS_TAG,\s*\{\s*expire:\s*0\s*\}\)/,
  'financial mutations must expire cached summaries immediately');

const reader = read('src/app/api/admin/financeiro-stats/route.ts');
assert.match(reader, /getCachedFinancialStats\(auth\.unitId,\s*monthStart,\s*today\)/,
  'cache key must include unit and date range');
assert.match(reader, /private, no-store/,
  'shared HTTP caches must not store authenticated financial responses');

const mutationRoutes = [
  'src/app/api/admin/fechar-comanda/route.ts',
  'src/app/api/admin/pacotes/venda/route.ts',
  'src/app/api/admin/contas-fixas/pagar/route.ts',
  'src/app/api/admin/estoque/route.ts',
  'src/app/api/appointments/close/route.ts',
];

for (const route of mutationRoutes) {
  assert.match(read(route), /invalidateFinancialStats\(\)/,
    `${route} must invalidate financial summaries after mutation`);
}

const delegatedMutations = {
  'src/app/api/admin/venda-rapida/route.ts': 'executeQuickSale(',
  'src/app/api/admin/transacoes/route.ts': 'createTransaction(',
  'src/app/api/sales/route.ts': 'executeProductSale(',
  'src/app/api/transactions/route.ts': 'createTransaction(',
};
const delegatedServices = `${read('src/services/sales.ts')}\n${read('src/services/transactions.ts')}`;
for (const [route, operation] of Object.entries(delegatedMutations)) {
  assert.ok(read(route).includes(operation), `${route} must delegate its mutation`);
}
assert.match(delegatedServices, /invalidateFinancialStats\(\)/,
  'delegated financial services must invalidate cached summaries');

console.log(`OK: cache financeiro curto e invalidação cobertos em ${mutationRoutes.length + Object.keys(delegatedMutations).length} rotas.`);

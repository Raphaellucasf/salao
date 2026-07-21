const assert = require('node:assert/strict');

async function main() {
  const { buildRecurrenceDates } = await import('../src/lib/appointment-recurrence.ts');

  assert.deepEqual(buildRecurrenceDates('2026-07-21'), ['2026-07-21']);
  assert.deepEqual(
    buildRecurrenceDates('2026-07-21', { frequencia: 'semanal', ocorrencias: 3 }),
    ['2026-07-21', '2026-07-28', '2026-08-04'],
  );
  assert.deepEqual(
    buildRecurrenceDates('2027-01-31', { frequencia: 'mensal', ocorrencias: 3 }),
    ['2027-01-31', '2027-02-28', '2027-03-31'],
  );
  assert.throws(
    () => buildRecurrenceDates('2026-07-21', { frequencia: 'semanal', ocorrencias: 53 }),
    /Recorrência inválida/,
  );
  console.log('PASS appointment recurrence');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

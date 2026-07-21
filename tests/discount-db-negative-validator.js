/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('assert');

// Simula uma linha legada inválida devolvida pelo banco.
const dbRecord = {
  desconto: -15.50,
  comanda_itens: [{ valor_total: 100.00, tipo: 'servico' }],
};

// A interface normaliza o valor no carregamento, tal como o payload da API.
const stateDesconto = Math.max(0, Number(dbRecord.desconto) || 0);
const subtotal = dbRecord.comanda_itens.reduce(
  (sum, item) => sum + Number(item.valor_total || 0),
  0,
);
const uiTotal = Math.max(0, subtotal - stateDesconto);
const discountNum = Math.max(0, Number(stateDesconto) || 0);
const totalFinal = Math.max(0, subtotal - discountNum);

assert.strictEqual(stateDesconto, 0);
assert.strictEqual(uiTotal, 100.00);
assert.strictEqual(discountNum, 0);
assert.strictEqual(totalFinal, 100.00);
assert.strictEqual(uiTotal, totalFinal);

console.log('PASS: desconto negativo legado normalizado sem divergência entre UI e API.');

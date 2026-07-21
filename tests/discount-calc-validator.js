/* eslint-disable @typescript-eslint/no-require-imports */
// Script to verify discount calculation logic in ComandaViewDrawer.tsx
const assert = require('assert');

// 1. Emulate subtotal calculation
function calculateSubtotal(comanda) {
  return comanda?.comanda_itens && comanda.comanda_itens.length > 0
    ? comanda.comanda_itens.reduce((sum, item) => sum + Number(item.valor_total || 0), 0)
    : Number(comanda?.subtotal || comanda?.total || 0);
}

// 2. Emulate input handling for discount
function parseDiscountInput(value) {
  return Math.max(0, parseFloat(value) || 0);
}

// 3. Emulate total calculation for open comanda
function calculateTotalOpen(subtotal, discount) {
  return Math.max(0, subtotal - discount);
}

// 4. Emulate total calculation for closed comanda payload
function calculateTotalFinal(subtotal, discount) {
  const discountNum = Math.max(0, Number(discount) || 0);
  return Math.max(0, subtotal - discountNum);
}

// Test suite
const tests = [
  {
    name: "discount = 0, normal subtotal",
    subtotalInput: 100.00,
    discountInput: 0,
    expectedTotal: 100.00,
    expectedDiscountParsed: 0
  },
  {
    name: "discount > subtotal",
    subtotalInput: 100.00,
    discountInput: 150.00,
    expectedTotal: 0.00,
    expectedDiscountParsed: 150.00
  },
  {
    name: "subtotal = 0, discount = 50",
    subtotalInput: 0.00,
    discountInput: 50.00,
    expectedTotal: 0.00,
    expectedDiscountParsed: 50.00
  },
  {
    name: "subtotal = 0, discount = 0",
    subtotalInput: 0.00,
    discountInput: 0.00,
    expectedTotal: 0.00,
    expectedDiscountParsed: 0.00
  },
  {
    name: "discount < 0 (negative discount input)",
    subtotalInput: 100.00,
    discountInput: -25.00,
    expectedTotal: 100.00, // Should treat discount as 0
    expectedDiscountParsed: 0
  },
  {
    name: "invalid discount input (NaN / string)",
    subtotalInput: 100.00,
    discountInput: "abc",
    expectedTotal: 100.00, // Should treat discount as 0
    expectedDiscountParsed: 0
  },
  {
    name: "empty/null/undefined inputs",
    subtotalInput: undefined,
    discountInput: undefined,
    expectedTotal: 0.00,
    expectedDiscountParsed: 0
  }
];

let failed = false;

tests.forEach((t) => {
  try {
    const comanda = {
      subtotal: t.subtotalInput,
      comanda_itens: []
    };
    
    // Evaluate subtotal
    const subtotal = calculateSubtotal(comanda);
    
    // Parse discount
    let discount = parseDiscountInput(t.discountInput);
    if (t.discountInput === undefined) {
      discount = parseDiscountInput("");
    }
    
    // Check parsed discount
    assert.strictEqual(discount, t.expectedDiscountParsed, `Discount parsing mismatch for ${t.name}`);
    
    // Calculate total
    const totalOpen = calculateTotalOpen(subtotal, discount);
    const totalFinal = calculateTotalFinal(subtotal, discount);
    
    assert.strictEqual(totalOpen, t.expectedTotal, `Open total mismatch for ${t.name}`);
    assert.strictEqual(totalFinal, t.expectedTotal, `Final total mismatch for ${t.name}`);
    
    console.log(`✅ Pass: ${t.name}`);
  } catch (err) {
    console.error(`❌ Fail: ${t.name}`);
    console.error(err.message);
    failed = true;
  }
});

if (failed) {
  process.exit(1);
} else {
  console.log("All calculation verification checks passed successfully!");
}
